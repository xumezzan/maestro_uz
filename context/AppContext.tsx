import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, TaskStatus, UserRole, ServiceCategory, UserProfile, Specialist, Conversation, Message, TaskResponse } from '../types';
import { useToast } from './ToastContext'; // Import Toast for notifications
import api from '../services/api';

interface AppContextType {
  role: UserRole;
  switchRole: () => void; // Legacy switch for demo
  tasks: Task[];
  taskResponses: TaskResponse[];
  addTask: (task: Task) => void;
  addResponse: (taskId: string, message: string, price: number) => Promise<void>;
  acceptResponse: (responseId: string) => Promise<void>;
  deleteTask: (taskId: string) => void;
  currentUser: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  registerSpecialist: (data: Partial<Specialist> & { email: string, phone: string, passportFile?: File, profileFile?: File }) => Promise<void>;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
  toggleFavorite: (specialistId: string) => void;
  conversations: Conversation[];
  sendMessage: (conversationId: string, text: string, media?: { url: string, type: 'image' }) => void;
  startChat: (specialistId: string) => void;
  markAsRead: (conversationId: string) => void;
  specialists: Specialist[]; // Exposed dynamic list
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Tashkent Center Coordinates
const TASHKENT_LAT = 41.2995;
const TASHKENT_LNG = 69.2401;

// Helper to generate random coordinates near Tashkent
const getRandomCoords = () => {
  const lat = TASHKENT_LAT + (Math.random() - 0.5) * 0.1; // +/- ~5km
  const lng = TASHKENT_LNG + (Math.random() - 0.5) * 0.15;
  return { lat, lng };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast(); // Use toast context
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskResponses, setTaskResponses] = useState<TaskResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);

  // Helper to map Django Task to Frontend Task
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

  // Fetch Data on Load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const meRes = await api.get('/auth/me/');
          const userData: any = meRes.data;
          // Map backend user to frontend UserProfile
          const userProfile: UserProfile = {
            id: userData.id.toString(),
            name: userData.first_name || userData.username,
            email: userData.email,
            role: userData.role as UserRole,
            location: userData.location || 'Ташкент', // Using location from User model now
            avatarUrl: userData.avatar_url || `https://ui-avatars.com/api/?name=${userData.username}`,
            favorites: [] // TODO: Load favorites
          };

          // If specialist, we might need to fetch profile separately or include it in MeView
          if (userData.role === UserRole.SPECIALIST) {
            // For now assume simple mapping, ideally MeView returns profile
          }

          setCurrentUser(userProfile);
          setRole(userData.role as UserRole);

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
        const specRes = await fetch(`${API_BASE_URL}/specialists/`);
        if (specRes.ok) {
          const specData = await specRes.json();
          if (Array.isArray(specData) && specData.length > 0) {
            setSpecialists(specData.map((s: any) => {
              // Add coords if missing in backend
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
        const taskRes = await fetch(`${API_BASE_URL}/tasks/`);
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          if (Array.isArray(taskData) && taskData.length > 0) {
            const realTasks = taskData.map(mapTask);
          }
        }

        // 3. Responses
        const resRes = await fetch(`${API_BASE_URL}/responses/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        if (resRes.ok) {
          const resData = await resRes.json();
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
        const msgRes = await fetch(`${API_BASE_URL}/messages/`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          if (Array.isArray(msgData)) {
            const convMap = new Map<string, Conversation>();

            msgData.forEach((m: any) => {
              const isMe = m.is_me;
              // If I sent it, the other person is the receiver.
              // If I received it, the other person is the sender.
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
              // Update participant details if missing (e.g. from previous messages where info might be incomplete if we had that, but here we process all)
              // Actually, just pushing the message is enough.

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
    // Optimistic UI update
    setTasks(prev => [task, ...prev]);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          category: task.category,
          budget: task.budget,
          location: task.location,
          date_info: task.date,
          status: task.status
        })
      });

      if (response.ok) {
        const savedTask = await response.json();
        // Replace the optimistic task with the real one (with real ID)
        setTasks(prev => prev.map(t => t.id === task.id ? mapTask(savedTask) : t));
      }
    } catch (e) {
      console.error("Failed to save task to backend (Demo mode active)", e);
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await fetch(`${API_BASE_URL}/tasks/${taskId}/`, { method: 'DELETE' });
    } catch (e) { console.error(e); }
  };

  const addResponse = async (taskId: string, message: string, price: number) => {
    if (!currentUser || currentUser.role !== UserRole.SPECIALIST || !currentUser.specialistProfile) return;

    try {
      const res = await fetch(`${API_BASE_URL}/responses/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          task: taskId,
          message,
          price
        })
      });

      if (res.ok) {
        const r = await res.json();
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
        addToast('Отклик отправлен!', 'success');
      }
    } catch (e) {
      console.error("Failed to send response", e);
      addToast('Ошибка отправки отклика', 'error');
    }
  };

  const acceptResponse = async (responseId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/responses/${responseId}/accept/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Update task status locally
        setTasks(prev => prev.map(t => t.id === data.task_id.toString() ? {
          ...t,
          status: TaskStatus.IN_PROGRESS,
          // We don't have the specialist ID easily here without looking up response, 
          // but we can find it in taskResponses
          assignedSpecialist: taskResponses.find(r => r.id === responseId)?.specialistId
        } : t));
        addToast('Исполнитель выбран!', 'success');
      }
    } catch (e) {
      console.error("Failed to accept", e);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/token/', { username: email, password }); // Using email as username for now or we need to adjust backend
      // Note: Backend default TokenObtainPairView expects 'username' and 'password'. 
      // If we want to use email, we need custom view or client to send email as username if username=email.
      // For this MVP, let's assume username=email in registration.

      const { access, refresh } = response.data;
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);

      // Decode token to get role or fetch me
      const meRes = await api.get('/auth/me/');
      const userData: any = meRes.data;

      const userProfile: UserProfile = {
        id: userData.id.toString(),
        name: userData.first_name || userData.username,
        email: userData.email,
        role: userData.role as UserRole,
        location: userData.location || 'Ташкент',
        avatarUrl: userData.avatar_url || `https://ui-avatars.com/api/?name=${userData.username}`,
        favorites: []
      };

      setCurrentUser(userProfile);
      setRole(userData.role as UserRole);
      addToast("Вы успешно вошли!", 'success');
    } catch (error) {
      console.error("Login failed", error);
      throw new Error("Неверный логин или пароль");
    }
  };

  const register = async (data: any) => {
    try {
      await api.post('/auth/register/', data);
      await login(data.username, data.password);
    } catch (error) {
      console.error("Registration failed", error);
      throw error;
    }
  };

  const registerSpecialist = async (data: Partial<Specialist> & { email: string, phone: string, passportFile?: File, profileFile?: File }) => {
    const tempId = Date.now().toString();
    const coords = getRandomCoords();

    // Frontend optimistic update
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

    // Backend Save
    try {
      const formData = new FormData();
      formData.append('category', data.category || '');
      formData.append('price_start', data.priceStart?.toString() || '0');
      formData.append('description', data.description || '');
      formData.append('location', data.location || '');
      if (data.tags) {
        // Send tags as individual items or JSON string depending on backend expectation
        // Django list field usually expects JSON if using simple implementation, or separate values if ManyToMany
        // Given models.py has JSONField, we should send it as a JSON string
        formData.append('tags', JSON.stringify(data.tags));
      }
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('is_verified', 'true'); // Demo auto-verify

      if (data.passportFile) {
        formData.append('passport_image', data.passportFile);
      }
      if (data.profileFile) {
        formData.append('profile_image', data.profileFile);
      }

      const response = await fetch(`${API_BASE_URL}/specialists/`, {
        method: 'POST',
        // Start header removal
        // headers: { 'Content-Type': 'multipart/form-data' }, // Do NOT set Content-Type manually with FormData, browser does it with boundary
        // End header removal
        body: formData
      });

      if (response.ok) {
        const savedSpec = await response.json();
        // Update the optimistic ID with real DB ID
        const realSpec = { ...newSpecialist, id: savedSpec.id.toString() };
        setSpecialists(prev => prev.map(s => s.id === tempId ? realSpec : s));
        setCurrentUser({ ...newUser, id: savedSpec.id.toString(), specialistProfile: realSpec });
      }
    } catch (e) {
      console.error("Failed to register specialist", e);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setRole(UserRole.CLIENT);
    setConversations([]);
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

    // Find conversation to get user ID?
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    try {
      // Send to API
      // MessageViewSet expects 'receiver' and 'text'. 
      // We need to know who is the receiver.
      // If I am sender, receiver is participantId.
      const receiverId = conversation.participantId;

      // If media, we need FormData, else JSON
      // Simplification for MVP: JSON text only, or separate media upload endpoint.
      // Let's use JSON for text.

      const res = await fetch(`${API_BASE_URL}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          receiver: receiverId,
          text,
          // task: ... // Optional if we want to link
        })
      });

      if (res.ok) {
        const m = await res.json();
        const newMessage: Message = {
          id: m.id.toString(),
          senderId: currentUser.id,
          text: m.text,
          timestamp: new Date(m.created_at).getTime(),
          isRead: false,
          mediaUrl: m.image, // If backend returns image url
          mediaType: m.image ? 'image' : undefined
        };

        setConversations(prev => prev.map(c => {
          if (c.id === conversationId) {
            return {
              ...c,
              messages: [...c.messages, newMessage]
            };
          }
          return c;
        }));
      }
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  const markAsRead = (conversationId: string) => {
    // Mock local logic
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
    <AppContext.Provider value={{ role, switchRole, tasks, taskResponses, addTask, addResponse, acceptResponse, deleteTask, currentUser, login, register, registerSpecialist, logout, updateUser, toggleFavorite, conversations, sendMessage, startChat, markAsRead, specialists }}>
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