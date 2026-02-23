import { ServiceCategory, Specialist, Task, TaskStatus } from './types';

export const CITIES = [
  "Ташкент",
  "Самарканд",
  "Бухара",
  "Андижан",
  "Наманган",
  "Фергана",
  "Нукус"
];

export const POPULAR_REQUESTS = [
  "Уборка квартиры",
  "Репетитор по математике",
  "Сантехник",
  "Мастер на час",
  "Маникюр"
];

export const HERO_CARDS = [
  { id: '1', title: 'Сантехника', img: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=300', color: 'bg-[#ebdcd5]' },
  { id: '2', title: 'Психология', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300', color: 'bg-[#d8d6f0]' },
  { id: '3', title: 'Математика', img: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=300', color: 'bg-[#d6e6ce]' },
  { id: '4', title: 'Английский язык', img: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=300', color: 'bg-[#f4dcd6]' },
  { id: '5', title: 'Электрика', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=300', color: 'bg-[#f0e6d2]' },
  { id: '6', title: 'Плиточники', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=300', color: 'bg-[#d0e8e6]' },
  { id: '7', title: 'Двери', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=300', color: 'bg-[#e8dff5]' },
  { id: '8', title: 'Русский язык', img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=300', color: 'bg-[#dbe4f0]' },
];

export const DETAILED_DIRECTORY = [
  {
    title: "Репетиторы",
    items: ["Английский язык", "Математика", "Русский язык", "Начальная школа", "Музыка", "Подготовка к школе"]
  },
  {
    title: "Мастера по ремонту",
    items: ["Сантехники", "Электрики", "Плиточники", "Штукатуры", "Ремонт под ключ", "Мелкий бытовой ремонт"]
  },
  {
    title: "Мастера красоты",
    items: ["Макияж", "Маникюр", "Причёски", "Эпиляция", "Стилисты", "Косметология"]
  },
  {
    title: "Фрилансеры",
    items: ["Дизайнеры", "Маркетинг", "Работа с текстами", "Системные администраторы", "IT-аутсорсинг", "Разработка сайтов"]
  },
  {
    title: "Бухгалтеры и юристы",
    items: ["Юристы", "Бухгалтеры", "Риелторы", "Бизнес-консультанты", "Кадровики"]
  },
  {
    title: "Спортивные тренеры",
    items: ["Фитнес", "Йога", "Пилатес", "Стретчинг", "Бокс", "Плавание"]
  },
  {
    title: "Домашний персонал",
    items: ["Домработницы", "Водители", "Няни", "Сиделки", "Повара"]
  },
  {
    title: "Артисты",
    items: ["Музыканты", "Танцоры", "Ведущие", "Фокусники", "Аниматоры"]
  }
];

// Mock data removed for production
export const MOCK_TASKS_DATA: Task[] = [];
export const MOCK_SPECIALISTS: Specialist[] = [];