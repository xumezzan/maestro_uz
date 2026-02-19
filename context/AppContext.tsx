import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, TaskStatus, UserRole, ServiceCategory, UserProfile, Specialist, Conversation, Message, TaskResponse } from '../types';
import { MOCK_SPECIALISTS, MOCK_TASKS_DATA } from '../constants';
import { useToast } from './ToastContext'; // Import Toast for notifications

interface AppContextType {
  role: UserRole;
  switchRole: () => void; // Legacy switch for demo
  tasks: Task[];
  taskResponses: TaskResponse[];
  addTask: (task: Task) => void;
  addResponse: (taskId: string, message: string, price: number) => void;
  deleteTask: (taskId: string) => void;
  currentUser: UserProfile | null;
  login: (email: string, role: UserRole) => void;
  registerSpecialist: (data: Partial<Specialist> & { email: string, phone: string }) => void;
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

// USE MOCK DATA AS INITIAL STATE FOR MVP PRESENTATION
const INITIAL_TASKS: Task[] = MOCK_TASKS_DATA; 
const MOCK_RESPONSES: TaskResponse[] = [];
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

// Enhance mock specialists with coordinates if missing
const ENHANCED_MOCK_SPECIALISTS = MOCK_SPECIALISTS.map(s => ({
  ...s,
  ...getRandomCoords()
}));

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast(); // Use toast context
  const [role, setRole] = useState<UserRole>(UserRole.CLIENT);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [taskResponses, setTaskResponses] = useState<TaskResponse[]>(MOCK_RESPONSES);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>(ENHANCED_MOCK_SPECIALISTS);

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
      responsesCount: t.responses_count || 0
  });

  // Fetch Data on Load
  useEffect(() => {
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

        // 2. Tasks - Attempt to fetch real tasks, but append to mocks or replace
        const taskRes = await fetch(`${API_BASE_URL}/tasks/`);
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          if (Array.isArray(taskData) && taskData.length > 0) {
            // Merge mock and real tasks for demo
            const realTasks = taskData.map(mapTask);
            setTasks([...realTasks, ...INITIAL_TASKS]); 
          }
        }
      } catch (error) {
        console.warn("Backend API not available, using mock data.");
        // We already set ENHANCED_MOCK_SPECIALISTS and INITIAL_TASKS as default state
      }
    };
    fetchData();
  }, []);

  const switchRole = () => {
    setRole(prev => prev === UserRole.CLIENT ? UserRole.SPECIALIST : UserRole.CLIENT);
  };

  // *** DEMO FEATURE: Simulate bots responding to new tasks ***
  const simulateBotResponses = (taskId: string, category: ServiceCategory) => {
      // Find relevant mock specialists
      const potentialPros = specialists.filter(s => s.category === category || category === ServiceCategory.OTHER).slice(0, 2);
      
      if (potentialPros.length === 0) return;

      potentialPros.forEach((pro, index) => {
          setTimeout(() => {
              const fakeResponse: TaskResponse = {
                  id: `auto_res_${Date.now()}_${index}`,
                  taskId: taskId,
                  specialistId: pro.id,
                  specialistName: pro.name,
                  specialistAvatar: pro.avatarUrl,
                  specialistRating: pro.rating,
                  message: `Здравствуйте! Заинтересовал ваш заказ. Готов выполнить качественно. У меня есть опыт в категории ${category}.`,
                  price: pro.priceStart + (Math.floor(Math.random() * 50000)),
                  createdAt: Date.now()
              };

              setTaskResponses(prev => [fakeResponse, ...prev]);
              setTasks(prev => prev.map(t => t.id === taskId ? { ...t, responsesCount: t.responsesCount + 1 } : t));
              
              // Only notify if current user is the owner (CLIENT)
              addToast(`Новый отклик от мастера ${pro.name}!`, 'success');
              
          }, 4000 + (index * 3000)); // Delay: 4s and 7s
      });
  };

  const addTask = async (task: Task) => {
    // Optimistic UI update
    setTasks(prev => [task, ...prev]);

    // Trigger simulation for demo
    simulateBotResponses(task.id, task.category);

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
      } catch(e) { console.error(e); }
  };

  const addResponse = (taskId: string, message: string, price: number) => {
      if (!currentUser || currentUser.role !== UserRole.SPECIALIST || !currentUser.specialistProfile) return;

      const newResponse: TaskResponse = {
          id: `res_${Date.now()}`,
          taskId,
          specialistId: currentUser.specialistProfile.id,
          specialistName: currentUser.specialistProfile.name,
          specialistAvatar: currentUser.specialistProfile.avatarUrl,
          specialistRating: currentUser.specialistProfile.rating,
          message,
          price,
          createdAt: Date.now()
      };

      setTaskResponses(prev => [newResponse, ...prev]);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, responsesCount: t.responsesCount + 1 } : t));
  };

  const login = (email: string, role: UserRole) => {
    // Demo login logic (matches email to existing specialists or creates dummy user)
    let userId = 'u1';
    let userSpecialistProfile: Specialist | undefined;

    if (role === UserRole.SPECIALIST) {
        const found = specialists.find(s => s.name.toLowerCase().includes(email.split('@')[0].toLowerCase())) || specialists[0];
        if (found) {
            userId = found.id;
            userSpecialistProfile = found;
        } else {
             userSpecialistProfile = {
                id: 'new_spec',
                name: email.split('@')[0],
                category: ServiceCategory.REPAIR,
                rating: 5.0,
                reviewsCount: 0,
                location: 'Ташкент',
                priceStart: 100000,
                avatarUrl: 'https://ui-avatars.com/api/?name=' + email.split('@')[0],
                description: 'Мастер',
                verified: false,
                tags: []
             };
        }
    }

    const mockUser: UserProfile = {
      id: userId,
      name: userSpecialistProfile ? userSpecialistProfile.name : email.split('@')[0],
      email: email,
      role: role,
      location: userSpecialistProfile ? userSpecialistProfile.location : 'Ташкент',
      avatarUrl: userSpecialistProfile ? userSpecialistProfile.avatarUrl : `https://ui-avatars.com/api/?name=${email.split('@')[0]}`,
      favorites: []
    };

    if (role === UserRole.SPECIALIST && userSpecialistProfile) {
        mockUser.specialistProfile = userSpecialistProfile;
    }

    setCurrentUser(mockUser);
    setRole(role);
  };

  const registerSpecialist = async (data: Partial<Specialist> & { email: string, phone: string }) => {
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
        const payload = {
            category: data.category,
            price_start: data.priceStart,
            description: data.description,
            location: data.location,
            tags: data.tags,
            email: data.email, // Passed to create/find user in backend
            phone: data.phone,
            is_verified: true
        };

        const response = await fetch(`${API_BASE_URL}/specialists/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
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

  const sendMessage = (conversationId: string, text: string, media?: { url: string, type: 'image' }) => {
      // Mock chat logic same as before (Chat is usually complex to implement fully with backend in one step)
      if (!currentUser) return;
      
      const conversation = conversations.find(c => c.id === conversationId);
      const participantId = conversation?.participantId;

      const newMessage: Message = {
          id: Date.now().toString(),
          senderId: currentUser.id,
          text,
          timestamp: Date.now(),
          isRead: false,
          mediaUrl: media?.url,
          mediaType: media?.type
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
  };

  const markAsRead = (conversationId: string) => {
     // Mock local logic
     setConversations(prev => prev.map(c => 
         c.id === conversationId ? { ...c, messages: c.messages.map(m => ({...m, isRead: true})) } : c
     ));
  };

  const startChat = (specialistId: string) => {
      if (!currentUser) return;
      const existing = conversations.find(c => c.participantId === specialistId);
      if (existing) return;

      const specialist = specialists.find(s => s.id === specialistId);
      const newConversation: Conversation = {
          id: `c_${Date.now()}`,
          participantId: specialistId,
          participantName: specialist ? specialist.name : 'Специалист',
          participantAvatar: specialist ? specialist.avatarUrl : '',
          messages: []
      };
      setConversations(prev => [newConversation, ...prev]);
  };

  return (
    <AppContext.Provider value={{ role, switchRole, tasks, taskResponses, addTask, addResponse, deleteTask, currentUser, login, registerSpecialist, logout, updateUser, toggleFavorite, conversations, sendMessage, startChat, markAsRead, specialists }}>
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