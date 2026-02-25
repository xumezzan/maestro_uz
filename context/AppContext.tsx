import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Task, TaskStatus, UserRole, ServiceCategory, UserProfile, Specialist, Conversation, Message, TaskResponse } from '../types';
import { useToast } from './ToastContext';
import api from '../services/api';
import { getAccessToken, getRefreshToken, setAuthTokens, clearAuthTokens } from '../services/authStorage';

type ChatConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

interface AppContextType {
  role: UserRole;
  isAuthLoading: boolean;
  switchRole: () => void;
  tasks: Task[];
  taskResponses: TaskResponse[];
  addTask: (task: Task) => void;
  addResponse: (taskId: string, message: string, price: number) => Promise<void>;
  acceptResponse: (responseId: string) => Promise<void>;
  deleteTask: (taskId: string) => void;
  currentUser: UserProfile | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (data: any) => Promise<void>;
  registerRequest: (data: any) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<UserProfile>;
  registerSpecialist: (data: Partial<Specialist> & { email: string, phone: string, passportFile?: File, profileFile?: File }) => Promise<void>;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
  toggleFavorite: (specialistId: string) => void;
  conversations: Conversation[];
  chatConnectionStatus: ChatConnectionStatus;
  sendMessage: (conversationId: string, text: string, media?: { url: string, type: 'image' }) => Promise<void>;
  startChat: (participantId: string) => void;
  markAsRead: (conversationId: string) => void;
  specialists: Specialist[];
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, passwordConfirm: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const WS_BASE_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

// Tashkent Center Coordinates
const TASHKENT_LAT = 41.2995;
const TASHKENT_LNG = 69.2401;

const getRandomCoords = () => {
  const lat = TASHKENT_LAT + (Math.random() - 0.5) * 0.1;
  const lng = TASHKENT_LNG + (Math.random() - 0.5) * 0.15;
  return { lat, lng };
};

// Helper to map backend user to frontend UserProfile
const mapUserProfile = (userData: any): UserProfile => ({
  id: userData.id.toString(),
  name: userData.first_name || userData.username,
  email: userData.email,
  role: userData.role as UserRole,
  location: userData.location || 'Ташкент',
  avatarUrl: userData.avatar_url || `https://ui-avatars.com/api/?name=${userData.username}`,
  favorites: [],
  isAdmin: userData.is_staff || false,
});

const conversationLastTimestamp = (conversation: Conversation): number => {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  return lastMessage ? lastMessage.timestamp : 0;
};

const sortConversations = (conversationList: Conversation[]): Conversation[] =>
  [...conversationList].sort((a, b) => conversationLastTimestamp(b) - conversationLastTimestamp(a));

const sortMessages = (messages: Message[]): Message[] =>
  [...messages].sort((a, b) => a.timestamp - b.timestamp);

const getFallbackAvatar = (name: string): string =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}`;

const dataUrlToFile = (dataUrl: string, filename = 'attachment.jpg'): File | null => {
  try {
    const [meta, content] = dataUrl.split(',');
    if (!meta || !content) return null;

    const mimeMatch = meta.match(/data:(.*?);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const binary = atob(content);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    return new File([bytes], filename, { type: mimeType });
  } catch (error) {
    console.error('Failed to decode file attachment', error);
    return null;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskResponses, setTaskResponses] = useState<TaskResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [hasSocketOpened, setHasSocketOpened] = useState(false);

  const mapTask = (t: any): Task => ({
    id: t.id.toString(),
    title: t.title,
    description: t.description,
    category: t.category as ServiceCategory,
    budget: t.budget,
    location: t.location,
    date: t.date_info,
    status: t.status as TaskStatus,
    createdAt: new Date(t.created_at).getTime(),
    responsesCount: t.responses_count || 0,
    assignedSpecialist: t.assigned_specialist ? t.assigned_specialist.toString() : undefined
  });

  const findSpecialistByUserId = useCallback((participantId: string) => {
    return specialists.find((s) => s.userId === participantId || s.id === participantId);
  }, [specialists]);

  const upsertConversationMessage = useCallback((
    previousConversations: Conversation[],
    participantId: string,
    message: Message,
    fallbackParticipant?: { name?: string; avatar?: string }
  ): Conversation[] => {
    let conversationExists = false;

    const updatedConversations = previousConversations.map((conversation) => {
      if (conversation.participantId !== participantId) return conversation;
      conversationExists = true;

      if (conversation.messages.some((existingMessage) => existingMessage.id === message.id)) {
        return conversation;
      }

      const mergedMessages = sortMessages([...conversation.messages, message]);
      return { ...conversation, messages: mergedMessages };
    });

    if (!conversationExists) {
      const participantName = fallbackParticipant?.name || 'Собеседник';
      const participantAvatar = fallbackParticipant?.avatar || getFallbackAvatar(participantName);

      updatedConversations.push({
        id: `conv_${participantId}`,
        participantId,
        participantName,
        participantAvatar,
        messages: [message],
      });
    }

    return sortConversations(updatedConversations);
  }, []);

  const buildConversationsFromMessages = useCallback((messageList: any[]): Conversation[] => {
    const conversationsMap = new Map<string, Conversation>();

    messageList.forEach((message) => {
      const isMe = Boolean(message.is_me);
      const senderId = message.sender?.toString();
      const receiverId = message.receiver?.toString();
      if (!senderId || !receiverId) return;

      const participantId = isMe ? receiverId : senderId;
      if (!conversationsMap.has(participantId)) {
        const participantName = (isMe ? message.receiver_name : message.sender_name) || 'Собеседник';
        const participantAvatar = (isMe ? message.receiver_avatar : message.sender_avatar) || getFallbackAvatar(participantName);

        conversationsMap.set(participantId, {
          id: `conv_${participantId}`,
          participantId,
          participantName,
          participantAvatar,
          messages: [],
        });
      }

      const conversation = conversationsMap.get(participantId)!;
      conversation.messages.push({
        id: message.id.toString(),
        senderId,
        text: message.text || '',
        timestamp: new Date(message.created_at).getTime(),
        isRead: Boolean(message.is_read),
        mediaUrl: message.image || undefined,
        mediaType: message.image ? 'image' : undefined,
      });
    });

    const preparedConversations = Array.from(conversationsMap.values()).map((conversation) => ({
      ...conversation,
      messages: sortMessages(conversation.messages),
    }));

    return sortConversations(preparedConversations);
  }, []);

  // ── WebSocket Setup ──────────────────────────────────────────────────
  const token = getAccessToken();
  const wsUrl = currentUser && token ? `${WS_BASE_URL}/chat/?token=${token}` : null;

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(wsUrl, {
    shouldReconnect: (closeEvent) => !!currentUser, // Reconnect automatically if user is logged in
    reconnectInterval: 3000,
  });

  useEffect(() => {
    if (!currentUser) {
      setHasSocketOpened(false);
      return;
    }

    if (readyState === ReadyState.OPEN) {
      setHasSocketOpened(true);
    }
  }, [currentUser, readyState]);

  const chatConnectionStatus: ChatConnectionStatus = (() => {
    if (!currentUser) return 'disconnected';
    if (readyState === ReadyState.OPEN) return 'connected';
    if (readyState === ReadyState.CONNECTING) return hasSocketOpened ? 'reconnecting' : 'connecting';
    if (readyState === ReadyState.CLOSING) return 'reconnecting';
    return 'disconnected';
  })();

  // Handle incoming real-time messages
  useEffect(() => {
    if (!lastJsonMessage || !currentUser) return;

    const data = lastJsonMessage as any;
    if (!data?.message) return;

    const incoming = data.message;
    const senderId = incoming.sender_id?.toString();
    const receiverId = incoming.receiver_id?.toString();
    if (!senderId || !receiverId) return;

    const isMe = currentUser.id === senderId;
    const participantId = isMe ? receiverId : senderId;
    const matchedSpecialist = findSpecialistByUserId(participantId);

    const socketMessage: Message = {
      id: incoming.id.toString(),
      senderId,
      text: incoming.text || '',
      timestamp: new Date(incoming.created_at).getTime(),
      isRead: isMe,
      mediaUrl: incoming.image || undefined,
      mediaType: incoming.image ? 'image' : undefined,
    };

    setConversations((previousConversations) =>
      upsertConversationMessage(previousConversations, participantId, socketMessage, {
        name: matchedSpecialist?.name || (isMe ? 'Собеседник' : 'Новое сообщение'),
        avatar: matchedSpecialist?.avatarUrl,
      })
    );
  }, [lastJsonMessage, currentUser, findSpecialistByUserId, upsertConversationMessage]);

  // ── Init auth on mount ────────────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const currentToken = getAccessToken();
      if (currentToken) {
        try {
          const meRes = await api.get('/auth/me/');
          const userProfile = mapUserProfile(meRes.data);
          setCurrentUser(userProfile);
          setRole(meRes.data.role as UserRole);
        } catch (e) {
          console.error("Auth check failed", e);
          clearAuthTokens();
        } finally {
          setIsAuthLoading(false);
        }
      } else {
        setIsAuthLoading(false);
      }
    };

    initAuth();
  }, []);

  // ── Fetch marketplace data + private chat data ───────────────────────
  useEffect(() => {
    if (isAuthLoading) return;

    const fetchData = async () => {
      try {
        const specRes = await api.get('/specialists/');
        const specData = Array.isArray(specRes.data) ? specRes.data : [];
        setSpecialists(specData.map((s: any) => {
          const coords = getRandomCoords();
          return {
            id: s.id.toString(),
            userId: s.user.toString(),
            name: s.name || 'Без имени',
            category: s.category as ServiceCategory,
            rating: s.rating,
            reviewsCount: s.reviews_count,
            location: s.location,
            priceStart: Number(s.price_start),
            avatarUrl: s.avatarUrl || getFallbackAvatar(s.name || 'User'),
            description: s.description,
            verified: s.is_verified,
            tags: s.tags || [],
            telegram: s.telegram,
            instagram: s.instagram,
            lat: s.lat || coords.lat,
            lng: s.lng || coords.lng,
          };
        }));

        const taskRes = await api.get('/tasks/');
        const taskData = Array.isArray(taskRes.data) ? taskRes.data : [];
        setTasks(taskData.map(mapTask));
      } catch (error) {
        console.warn("Public data fetch failed", error);
      }

      if (!currentUser) {
        setTaskResponses([]);
        setConversations([]);
        return;
      }

      try {
        const [responseRes, messageRes] = await Promise.all([
          api.get('/responses/'),
          api.get('/messages/'),
        ]);

        const responseData = Array.isArray(responseRes.data) ? responseRes.data : [];
        setTaskResponses(responseData.map((r: any) => ({
          id: r.id.toString(),
          taskId: r.task.toString(),
          specialistId: r.specialist.toString(),
          specialistUserId: r.specialist_user_id.toString(),
          specialistName: r.specialistName,
          specialistAvatar: r.specialistAvatar,
          specialistRating: r.specialistRating,
          message: r.message,
          price: Number(r.price),
          createdAt: r.created_at,
        })));

        const messageData = Array.isArray(messageRes.data) ? messageRes.data : [];
        setConversations(buildConversationsFromMessages(messageData));
      } catch (error) {
        console.warn("Private data fetch failed", error);
      }
    };

    fetchData();
  }, [isAuthLoading, currentUser?.id, buildConversationsFromMessages]);

  const switchRole = () => {
    setRole(prev => prev === UserRole.CLIENT ? UserRole.SPECIALIST : UserRole.CLIENT);
  };

  const addTask = async (task: Task) => {
    setTasks(prev => [task, ...prev]);
    try {
      const response = await api.post('/tasks/', {
        title: task.title,
        description: task.description,
        category: task.category,
        budget: task.budget,
        location: task.location,
        date_info: task.date,
        status: task.status
      });
      if (response.data) {
        const savedTask = response.data;
        setTasks(prev => prev.map(t => t.id === task.id ? mapTask(savedTask) : t));
      }
    } catch (e) {
      console.error("Failed to save task to backend", e);
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await api.delete(`/tasks/${taskId}/`);
    } catch (e) {
      console.error(e);
    }
  };

  const addResponse = async (taskId: string, message: string, price: number) => {
    if (!currentUser || currentUser.role !== UserRole.SPECIALIST || !currentUser.specialistProfile) return;
    try {
      const res = await api.post('/responses/', { task: taskId, message, price });
      if (res.data) {
        const r = res.data;
        const newResponse: TaskResponse = {
          id: r.id.toString(),
          taskId: r.task.toString(),
          specialistId: r.specialist.toString(),
          specialistUserId: r.specialist_user_id.toString(),
          specialistName: currentUser.specialistProfile.name,
          specialistAvatar: currentUser.specialistProfile.avatarUrl,
          specialistRating: currentUser.specialistProfile.rating,
          message: r.message,
          price: Number(r.price),
          createdAt: r.created_at
        };
        setTaskResponses(prev => [newResponse, ...prev]);
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, responsesCount: t.responsesCount + 1 } : t));

        // Optimistically deduct 5000 UZS locally so we don't have to refetch
        if (currentUser.specialistProfile) {
          const updatedProfile = {
            ...currentUser.specialistProfile,
            balance: (currentUser.specialistProfile.balance || 0) - 5000
          };
          updateUser({ ...currentUser, specialistProfile: updatedProfile });
        }

        addToast('Отклик отправлен!', 'success');
      } else {
        const errorData = res.data;
        if (errorData.error === 'INSUFFICIENT_FUNDS') {
          throw new Error("Недостаточно средств. Пожалуйста, пополните баланс.");
        }
        throw new Error("Ошибка сервера");
      }
    } catch (e: any) {
      console.error("Failed to send response", e);
      addToast(e.message || 'Ошибка отправки отклика', 'error');
      throw e; // rethrow so component knows it failed
    }
  };

  const acceptResponse = async (responseId: string) => {
    try {
      const res = await api.post(`/responses/${responseId}/accept/`);
      if (res.data) {
        const data = res.data;
        setTasks(prev => prev.map(t => t.id === data.task_id.toString() ? {
          ...t,
          status: TaskStatus.IN_PROGRESS,
          assignedSpecialist: taskResponses.find(r => r.id === responseId)?.specialistId
        } : t));
        addToast('Исполнитель выбран!', 'success');
      }
    } catch (e) {
      console.error("Failed to accept", e);
    }
  };

  // ── AUTH FUNCTIONS ───────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      const { access, refresh, user: userData } = response.data;

      setAuthTokens(access, refresh);

      const userProfile = mapUserProfile(userData);
      setCurrentUser(userProfile);
      setRole(userData.role as UserRole);
      addToast("Вы успешно вошли!", 'success');
      return userProfile;
    } catch (error: any) {
      const msg = error.response?.data?.error || "Неверный логин или пароль";
      throw new Error(msg);
    }
  };

  const register = async (data: any) => {
    try {
      await api.post('/auth/register/', data);
      await login(data.email, data.password);
    } catch (error) {
      console.error("Registration failed", error);
      throw error;
    }
  };

  const registerRequest = async (data: any) => {
    try {
      await api.post('/auth/register/', data);
    } catch (error: any) {
      console.error("Registration request failed", error);
      throw error;
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      const response = await api.post('/auth/verify-email/', { email, code });
      const { access, refresh, user: userData } = response.data;

      setAuthTokens(access, refresh);

      const userProfile = mapUserProfile(userData);
      setCurrentUser(userProfile);
      setRole(userData.role as UserRole);
      addToast("Email успешно подтверждён!", 'success');
      return userProfile;
    } catch (error: any) {
      console.error("Verification failed", error);
      throw error;
    }
  };

  const resendVerification = async (email: string) => {
    try {
      await api.post('/auth/resend-verification/', { email });
      addToast("Код повторно отправлен на почту", 'success');
    } catch (error) {
      console.error("Resend verification failed", error);
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await api.post('/auth/forgot-password/', { email });
      // Always success (anti-enumeration)
    } catch (error) {
      console.error("Forgot password failed", error);
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string, passwordConfirm: string) => {
    try {
      await api.post('/auth/reset-password/', {
        token,
        password,
        password_confirm: passwordConfirm,
      });
      addToast("Пароль успешно изменён!", 'success');
    } catch (error: any) {
      console.error("Reset password failed", error);
      throw error;
    }
  };

  const updateProfile = async (data: any) => {
    try {
      const response = await api.put('/auth/me/', data);
      const userProfile = mapUserProfile(response.data);
      setCurrentUser(userProfile);
      addToast("Профиль обновлён", 'success');
    } catch (error) {
      console.error("Update profile failed", error);
      throw error;
    }
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await api.post('/auth/logout/', { refresh: refreshToken });
      } catch (e) {
        console.error("Logout API call failed", e);
      }
    }
    clearAuthTokens();
    setCurrentUser(null);
    setRole(UserRole.CLIENT);
    setConversations([]);
    addToast("Вы вышли из аккаунта", 'info');
  };

  const registerSpecialist = async (data: Partial<Specialist> & { email: string, phone: string, passportFile?: File, profileFile?: File }) => {
    const tempId = Date.now().toString();
    const coords = getRandomCoords();

    const newSpecialist: Specialist = {
      id: tempId,
      userId: currentUser?.id || tempId, // Fallback if no user yet (though usually they are logged in)
      name: data.name || 'Новый Специалист',
      category: data.category || ServiceCategory.OTHER,
      rating: 5.0,
      reviewsCount: 0,
      location: data.location || 'Ташкент',
      priceStart: data.priceStart || 0,
      avatarUrl: data.avatarUrl || 'https://ui-avatars.com/api/?name=' + (data.name || 'User'),
      description: data.description || '',
      verified: false,
      tags: data.tags || [],
      lat: coords.lat,
      lng: coords.lng
    };

    setSpecialists(prev => [newSpecialist, ...prev]);

    const newUser: UserProfile = {
      id: tempId,
      name: data.name || 'User',
      email: data.email,
      role: UserRole.SPECIALIST,
      location: newSpecialist.location,
      avatarUrl: newSpecialist.avatarUrl,
      specialistProfile: newSpecialist,
      favorites: []
    };

    setCurrentUser(newUser);
    setRole(UserRole.SPECIALIST);

    try {
      const formData = new FormData();
      formData.append('category', data.category || '');
      formData.append('price_start', data.priceStart?.toString() || '0');
      formData.append('description', data.description || '');
      formData.append('location', data.location || '');
      if (data.tags) {
        formData.append('tags', JSON.stringify(data.tags));
      }
      formData.append('email', data.email);
      formData.append('phone', data.phone);

      if (data.passportFile) {
        formData.append('passport_image', data.passportFile);
      }
      if (data.profileFile) {
        formData.append('profile_image', data.profileFile);
      }

      const response = await api.post('/specialists/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data) {
        const savedSpec = response.data;
        const realSpec = { ...newSpecialist, id: savedSpec.id.toString(), userId: savedSpec.user.toString() };
        setSpecialists(prev => prev.map(s => s.id === tempId ? realSpec : s));
        setCurrentUser({ ...newUser, id: savedSpec.user.toString(), specialistProfile: realSpec });
      }
    } catch (e) {
      console.error("Failed to register specialist", e);
    }
  };

  const updateUser = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === UserRole.SPECIALIST && user.specialistProfile) {
      setSpecialists(prev => prev.map(s =>
        s.id === user.specialistProfile!.id ? user.specialistProfile! : s
      ));
    }
  };

  const toggleFavorite = (specialistId: string) => {
    if (!currentUser) return;
    const currentFavorites = currentUser.favorites || [];
    let newFavorites;
    if (currentFavorites.includes(specialistId)) {
      newFavorites = currentFavorites.filter(id => id !== specialistId);
    } else {
      newFavorites = [...currentFavorites, specialistId];
    }
    setCurrentUser({ ...currentUser, favorites: newFavorites });
  };

  const sendMessage = async (conversationId: string, text: string, media?: { url: string, type: 'image' }) => {
    if (!currentUser) return;
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    try {
      const receiverId = conversation.participantId;
      const trimmedText = text.trim();
      const hasImage = Boolean(media?.url && media.type === 'image');

      if (!trimmedText && !hasImage) return;

      // Use WebSocket for lightweight text-only messages.
      if (!hasImage && sendJsonMessage && readyState === ReadyState.OPEN) {
        sendJsonMessage({
          type: 'chat_message',
          receiver_id: receiverId,
          text: trimmedText
        });
        return;
      }

      let res;
      if (hasImage) {
        const formData = new FormData();
        formData.append('receiver', receiverId);
        if (trimmedText) {
          formData.append('text', trimmedText);
        }

        if (media?.url.startsWith('data:')) {
          const imageFile = dataUrlToFile(media.url, `chat-${Date.now()}.jpg`);
          if (imageFile) {
            formData.append('image', imageFile);
          }
        } else if (media) {
          formData.append('image', media.url);
        }

        res = await api.post('/messages/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/messages/', { receiver: receiverId, text: trimmedText });
      }

      if (res.data) {
        const m = res.data;
        const newMessage: Message = {
          id: m.id.toString(),
          senderId: m.sender?.toString() || currentUser.id,
          text: m.text || '',
          timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
          isRead: true,
          mediaUrl: m.image || undefined,
          mediaType: m.image ? 'image' : undefined
        };

        setConversations((previousConversations) =>
          upsertConversationMessage(previousConversations, receiverId, newMessage, {
            name: conversation.participantName,
            avatar: conversation.participantAvatar,
          })
        );
      }
    } catch (e) {
      console.error("Failed to send message", e);
      addToast('Не удалось отправить сообщение', 'error');
    }
  };

  const markAsRead = useCallback((conversationId: string) => {
    if (!currentUser) return;

    const activeConversation = conversations.find((conversation) => conversation.id === conversationId);
    if (!activeConversation) return;

    const unreadIncoming = activeConversation.messages.filter(
      (message) => !message.isRead && message.senderId !== currentUser.id
    );
    if (unreadIncoming.length === 0) return;

    setConversations((previousConversations) => previousConversations.map((conversation) => {
      if (conversation.id !== conversationId) return conversation;
      return {
        ...conversation,
        messages: conversation.messages.map((message) =>
          unreadIncoming.some((unreadMessage) => unreadMessage.id === message.id)
            ? { ...message, isRead: true }
            : message
        ),
      };
    }));

    Promise.all(unreadIncoming.map((message) =>
      api.patch(`/messages/${message.id}/`, { is_read: true }).catch(() => null)
    )).catch(() => null);
  }, [currentUser, conversations]);

  const startChat = useCallback((participantId: string) => {
    if (!currentUser) return;
    setConversations((previousConversations) => {
      const existing = previousConversations.find((conversation) => conversation.participantId === participantId);
      if (existing) return previousConversations;

      const specialist = findSpecialistByUserId(participantId);
      const participantName = specialist?.name || 'Собеседник';
      const participantAvatar = specialist?.avatarUrl || getFallbackAvatar(participantName);

      return sortConversations([{
        id: `conv_${participantId}`,
        participantId,
        participantName,
        participantAvatar,
        messages: [],
      }, ...previousConversations]);
    });
  }, [currentUser, findSpecialistByUserId]);

  return (
    <AppContext.Provider value={{
      role, switchRole, tasks, taskResponses, addTask, addResponse, acceptResponse,
      deleteTask, currentUser, login, register, registerRequest, verifyEmail,
      registerSpecialist, logout, updateUser, toggleFavorite, conversations,
      chatConnectionStatus,
      sendMessage, startChat, markAsRead, specialists,
      forgotPassword, resetPassword, resendVerification, updateProfile, isAuthLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
