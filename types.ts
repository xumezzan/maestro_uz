export enum ServiceCategory {
  REPAIR = 'Ремонт',
  TUTORS = 'Репетиторы',
  CLEANING = 'Уборка',
  IT = 'IT и фриланс',
  BEAUTY = 'Красота',
  TRANSPORT = 'Перевозки',
  FINANCE = 'Бухгалтеры и юристы',
  SPORT = 'Спорт',
  DOMESTIC = 'Домашний персонал',
  EVENTS = 'Артисты',
  OTHER = 'Другое'
}

export enum UserRole {
  CLIENT = 'CLIENT',
  SPECIALIST = 'SPECIALIST'
}

export enum TaskStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED'
}

export interface Specialist {
  id: string;
  name: string;
  category: ServiceCategory;
  rating: number;
  reviewsCount: number;
  location: string;
  priceStart: number;
  avatarUrl: string;
  description: string;
  verified: boolean;
  tags: string[];
  telegram?: string;
  instagram?: string;
  lat?: number;
  lng?: number;
  balance?: number;
  passportUrl?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  location?: string;
  specialistProfile?: Specialist; // Данные специалиста, если роль SPECIALIST
  favorites?: string[]; // IDs of favorite specialists
  isAdmin?: boolean; // Флаг администратора/модератора
}

export interface TaskResponse {
  id: string;
  taskId: string;
  specialistId: string;
  specialistName: string;
  specialistAvatar: string;
  specialistRating: number;
  message: string;
  price: number;
  createdAt: string | number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: ServiceCategory;
  budget: string;
  location: string;
  date: string;
  status: TaskStatus;
  createdAt: number;
  responsesCount: number; // Количество откликов
  assignedSpecialist?: string; // ID of the accepted specialist
}

export interface AIAnalysisResult {
  category: ServiceCategory;
  suggestedTitle: string;
  suggestedDescription: string;
  estimatedPriceRange: string;
  relevantTags: string[];
  location?: string;
}

export interface UserRequest {
  query: string;
  analysis: AIAnalysisResult | null;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isRead: boolean;
  mediaUrl?: string;
  mediaType?: 'image';
}

export interface Conversation {
  id: string;
  participantId: string; // The ID of the other person (Specialist or Client)
  participantName: string;
  participantAvatar: string;
  messages: Message[];
}