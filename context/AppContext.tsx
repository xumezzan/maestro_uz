import React, { createContext, useContext, useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Task, TaskStatus, UserRole, ServiceCategory, UserProfile, Specialist, Conversation, Message, TaskResponse } from '../types';
import { useToast } from './ToastContext';
import api from '../services/api';

interface AppContextType {
  role: UserRole;
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
  sendMessage: (conversationId: string, text: string, media?: { url: string, type: 'image' }) => void;
  startChat: (specialistId: string) => void;
  markAsRead: (conversationId: string) => void;
  specialists: Specialist[];
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string, passwordConfirm: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE_URL = '/api';
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskResponses, setTaskResponses] = useState<TaskResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);

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

  // ── WebSocket Setup ──────────────────────────────────────────────────
  const token = localStorage.getItem('accessToken');
  const wsUrl = currentUser && token ? `${WS_BASE_URL}/chat/?token=${token}` : null;

  const { sendJsonMessage, lastJsonMessage } = useWebSocket(wsUrl, {
    shouldReconnect: (closeEvent) => !!currentUser, // Reconnect automatically if user is logged in
    reconnectInterval: 3000,
  });

  // Handle incoming real-time messages
  useEffect(() => {
    if (lastJsonMessage !== null) {
      const data = lastJsonMessage as any;
      if (data.message) {
        const m = data.message;

        // Check if message is from myself (received via websocket echo)
        const isMe = currentUser?.id === m.sender_id.toString();
        const participantId = isMe ? m.receiver_id.toString() : m.sender_id.toString();

        const socketMessage: Message = {
          id: m.id.toString(),
          senderId: m.sender_id.toString(),
          text: m.text,
          timestamp: new Date(m.created_at).getTime(),
          isRead: isMe, // Mark as read if I sent it
        };

        setConversations(prev => {
          let exists = false;
          const updated = prev.map(c => {
            if (c.participantId === participantId) {
              exists = true;
              // Avoid duplicates (if we also fetched it via HTTP)
              if (!c.messages.some(existingMsg => existingMsg.id === socketMessage.id)) {
                return { ...c, messages: [...c.messages, socketMessage] };
              }
            }
            return c;
          });

          if (!exists) {
            // New conversation started dynamically via socket
            const newParticipantName = isMe ? "Пользователь" : "Новое сообщение"; // Ideally we'd fetch actual info
            return [{
              id: `conv_${participantId}`,
              participantId,
              participantName: isMe ? "Собеседник" : "Новое сообщение",
              participantAvatar: `https://ui-avatars.com/api/?name=User`,
              messages: [socketMessage]
            }, ...updated];
          }
          return updated;
        });
      }
    }
  }, [lastJsonMessage, currentUser]);

  // ── Init auth + fetch data on mount ──────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const currentToken = localStorage.getItem('accessToken');
      if (currentToken) {
        try {
          const meRes = await api.get('/auth/me/');
          const userProfile = mapUserProfile(meRes.data);
          setCurrentUser(userProfile);
          setRole(meRes.data.role as UserRole);
        } catch (e) {
          console.error("Auth check failed", e);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    };
    initAuth();

    const fetchData = async () => {
      try {
        // 1. Specialists
        const specRes = await api.get('/specialists/');
        if (specRes.data) {
          const specData = specRes.data;
          if (Array.isArray(specData) && specData.length > 0) {
            setSpecialists(specData.map((s: any) => {
              const coords = getRandomCoords();
              return {
                id: s.id.toString(),
                name: s.name || 'Без имени',
                category: s.category as ServiceCategory,
                rating: s.rating,
                reviewsCount: s.reviews_count,
                location: s.location,
                priceStart: Number(s.price_start),
                avatarUrl: s.avatarUrl || 'https://ui-avatars.com/api/?name=User',
                description: s.description,
                verified: s.is_verified,
                tags: s.tags || [],
                telegram: s.telegram,
                instagram: s.instagram,
                lat: s.lat || coords.lat,
                lng: s.lng || coords.lng
              };
            }));
          }
        }

        // 2. Tasks
        const taskRes = await api.get('/tasks/');
        if (taskRes.data) {
          const taskData = taskRes.data;
          if (Array.isArray(taskData) && taskData.length > 0) {
            const realTasks = taskData.map(mapTask);
            setTasks(realTasks); // Actually set the tasks!
          }
        }

        // 3. Responses
        const resRes = await api.get('/responses/');
        if (resRes.data) {
          const resData = resRes.data;
          if (Array.isArray(resData)) {
            setTaskResponses(resData.map((r: any) => ({
              id: r.id.toString(),
              taskId: r.task.toString(),
              specialistId: r.specialist.toString(),
              specialistName: r.specialistName,
              specialistAvatar: r.specialistAvatar,
              specialistRating: r.specialistRating,
              message: r.message,
              price: Number(r.price),
              createdAt: r.created_at
            })));
          }
        }

        // 4. Messages
        const msgRes = await api.get('/messages/');
        if (msgRes.data) {
          const msgData = msgRes.data;
          if (Array.isArray(msgData)) {
            const convMap = new Map<string, Conversation>();
            msgData.forEach((m: any) => {
              const isMe = m.is_me;
              const participantId = isMe ? m.receiver.toString() : m.sender.toString();
              if (!convMap.has(participantId)) {
                convMap.set(participantId, {
                  id: `conv_${participantId}`,
                  participantId: participantId,
                  participantName: isMe ? m.receiver_name : m.sender_name,
                  participantAvatar: isMe ? m.receiver_avatar : m.sender_avatar,
                  messages: []
                });
              }
              const conv = convMap.get(participantId)!;
              conv.messages.push({
                id: m.id.toString(),
                senderId: m.sender.toString(),
                text: m.text,
                timestamp: new Date(m.created_at).getTime(),
                isRead: m.is_read,
                mediaUrl: m.image,
                mediaType: m.image ? 'image' : undefined
              });
            });
            setConversations(Array.from(convMap.values()));
          }
        }
      } catch (error) {
        console.warn("Backend API not available, using mock data.");
      }
    };
    fetchData();
  }, []);

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

      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);

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

      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);

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
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout/', { refresh: refreshToken });
      } catch (e) {
        console.error("Logout API call failed", e);
      }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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
      name: data.name || 'Новый Специалист',
      category: data.category || ServiceCategory.OTHER,
      rating: 5.0,
      reviewsCount: 0,
      location: data.location || 'Ташкент',
      priceStart: data.priceStart || 0,
      avatarUrl: data.avatarUrl || 'https://ui-avatars.com/api/?name=' + (data.name || 'User'),
      description: data.description || '',
      verified: true,
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
      formData.append('is_verified', 'true');

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
        const realSpec = { ...newSpecialist, id: savedSpec.id.toString() };
        setSpecialists(prev => prev.map(s => s.id === tempId ? realSpec : s));
        setCurrentUser({ ...newUser, id: savedSpec.id.toString(), specialistProfile: realSpec });
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

      // Try WebSocket first
      if (sendJsonMessage) {
        sendJsonMessage({
          type: 'chat_message',
          receiver_id: receiverId,
          text: text
        });
        // Real-time echo will add message to UI
        return;
      }

      // Fallback to HTTP POST if WebSocket not available
      const res = await api.post('/messages/', { receiver: receiverId, text });

      if (res.data) {
        const m = res.data;
        const newMessage: Message = {
          id: m.id.toString(),
          senderId: currentUser.id,
          text: m.text,
          timestamp: new Date(m.created_at).getTime(),
          isRead: false,
          mediaUrl: m.image,
          mediaType: m.image ? 'image' : undefined
        };

        setConversations(prev => prev.map(c => {
          if (c.id === conversationId) {
            return { ...c, messages: [...c.messages, newMessage] };
          }
          return c;
        }));
      }
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  const markAsRead = (conversationId: string) => {
    setConversations(prev => prev.map(c =>
      c.id === conversationId ? { ...c, messages: c.messages.map(m => ({ ...m, isRead: true })) } : c
    ));
  };

  const startChat = (specialistId: string) => {
    if (!currentUser) return;
    const existing = conversations.find(c => c.participantId === specialistId);
    if (existing) return;

    const specialist = specialists.find(s => s.id === specialistId);
    const newConversation: Conversation = {
      id: `conv_${specialistId}`,
      participantId: specialistId,
      participantName: specialist ? specialist.name : 'Специалист',
      participantAvatar: specialist ? specialist.avatarUrl : '',
      messages: []
    };
    setConversations(prev => [newConversation, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      role, switchRole, tasks, taskResponses, addTask, addResponse, acceptResponse,
      deleteTask, currentUser, login, register, registerRequest, verifyEmail,
      registerSpecialist, logout, updateUser, toggleFavorite, conversations,
      sendMessage, startChat, markAsRead, specialists,
      forgotPassword, resetPassword, resendVerification, updateProfile,
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