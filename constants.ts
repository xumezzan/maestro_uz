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
    count: 221058,
    items: ["Английский язык", "Математика", "Русский язык", "Начальная школа", "Музыка", "Подготовка к школе"]
  },
  {
    title: "Мастера по ремонту",
    count: 186781,
    items: ["Сантехники", "Электрики", "Плиточники", "Штукатуры", "Ремонт под ключ", "Мелкий бытовой ремонт"]
  },
  {
    title: "Мастера красоты",
    count: 76158,
    items: ["Макияж", "Маникюр", "Причёски", "Эпиляция", "Стилисты", "Косметология"]
  },
  {
    title: "Фрилансеры",
    count: 116687,
    items: ["Дизайнеры", "Маркетинг", "Работа с текстами", "Системные администраторы", "IT-аутсорсинг", "Разработка сайтов"]
  },
  {
    title: "Бухгалтеры и юристы",
    count: 46669,
    items: ["Юристы", "Бухгалтеры", "Риелторы", "Бизнес-консультанты", "Кадровики"]
  },
  {
    title: "Спортивные тренеры",
    count: 25315,
    items: ["Фитнес", "Йога", "Пилатес", "Стретчинг", "Бокс", "Плавание"]
  },
  {
    title: "Домашний персонал",
    count: 44772,
    items: ["Домработницы", "Водители", "Няни", "Сиделки", "Повара"]
  },
  {
    title: "Артисты",
    count: 36820,
    items: ["Музыканты", "Танцоры", "Ведущие", "Фокусники", "Аниматоры"]
  }
];

export const MOCK_TASKS_DATA: Task[] = [
  {
    id: 'task-1',
    title: 'Протекает труба под раковиной',
    description: 'Нужен сантехник. Сильная течь на кухне под мойкой. Трубы пластиковые. Желательно приехать как можно скорее со своими инструментами. Фото могу прислать.',
    category: ServiceCategory.REPAIR,
    budget: '150 000 UZS',
    location: 'Ташкент, Чиланзар',
    date: 'Сегодня, срочно',
    status: TaskStatus.OPEN,
    createdAt: Date.now() - 3600000, // 1 hour ago
    responsesCount: 3
  },
  {
    id: 'task-2',
    title: 'Репетитор по математике для 5 класса',
    description: 'Ищем репетитора для девочки 11 лет. Нужно подтянуть школьную программу и помочь с домашними заданиями. Занятия 2-3 раза в неделю у нас дома или онлайн.',
    category: ServiceCategory.TUTORS,
    budget: '80 000 UZS / час',
    location: 'Ташкент, Мирзо-Улугбек',
    date: 'С следующей недели',
    status: TaskStatus.OPEN,
    createdAt: Date.now() - 86400000, // 1 day ago
    responsesCount: 12
  },
  {
    id: 'task-3',
    title: 'Генеральная уборка 2-комнатной квартиры',
    description: 'Нужно помыть окна, полы, протереть пыль, почистить сантехнику и кухонный гарнитур. Квартира 60 кв.м. Инвентарь предоставим, химия ваша.',
    category: ServiceCategory.CLEANING,
    budget: '400 000 UZS',
    location: 'Ташкент, Юнусабад',
    date: 'Суббота, 10:00',
    status: TaskStatus.OPEN,
    createdAt: Date.now() - 7200000, // 2 hours ago
    responsesCount: 5
  },
  {
    id: 'task-4',
    title: 'Разработать логотип для кофейни',
    description: 'Открываем новую кофейню. Нужен стильный, минималистичный логотип. Название "Coffee Point". Примеры работ обязательны. Векторный формат.',
    category: ServiceCategory.IT,
    budget: '500 000 UZS',
    location: 'Удаленно',
    date: 'Срок 3 дня',
    status: TaskStatus.OPEN,
    createdAt: Date.now() - 172800000, // 2 days ago
    responsesCount: 8
  },
  {
    id: 'task-5',
    title: 'Свадебный макияж и прическа',
    description: 'Нужен мастер с выездом на дом. Свадьба 25-го числа. Пробный образ обязателен. Присылайте портфолио с работами.',
    category: ServiceCategory.BEAUTY,
    budget: '600 000 UZS',
    location: 'Ташкент, Яккасарай',
    date: '25 августа',
    status: TaskStatus.OPEN,
    createdAt: Date.now() - 43200000, // 12 hours ago
    responsesCount: 15
  },
  {
    id: 'task-6',
    title: 'Собрать шкаф IKEA',
    description: 'Купили шкаф ПАКС, нужно собрать. Инструкция есть. Инструментов нет.',
    category: ServiceCategory.REPAIR,
    budget: '200 000 UZS',
    location: 'Ташкент, Сергели',
    date: 'Завтра вечером',
    status: TaskStatus.OPEN,
    createdAt: Date.now() - 10000000,
    responsesCount: 1
  }
];

export const MOCK_SPECIALISTS: Specialist[] = [
  // --- РЕПЕТИТОРЫ (TUTORS) ---
  {
    id: 'tutor-1',
    name: 'Елена Ким',
    category: ServiceCategory.TUTORS,
    rating: 5.0,
    reviewsCount: 89,
    location: 'Ташкент, Мирзо-Улугбек',
    priceStart: 80000,
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?fit=crop&w=200&h=200',
    description: 'Репетитор по английскому языку (IELTS 8.5). Готовлю к поступлению в Вестминстер и ИНХА.',
    verified: true,
    tags: ['Английский', 'IELTS', 'Математика']
  },
  {
    id: 'tutor-2',
    name: 'Азиза Юлдашева',
    category: ServiceCategory.TUTORS,
    rating: 4.9,
    reviewsCount: 41,
    location: 'Ташкент, Чиланзар',
    priceStart: 70000,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?fit=crop&w=200&h=200',
    description: 'Математика для школьников 5-11 классов. Подготовка к ЕГЭ и ДТМ. Индивидуальный подход.',
    verified: true,
    tags: ['Математика', 'Физика']
  },
  {
    id: 'tutor-3',
    name: 'Джасур Рахимов',
    category: ServiceCategory.TUTORS,
    rating: 4.8,
    reviewsCount: 15,
    location: 'Ташкент, Юнусабад',
    priceStart: 100000,
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?fit=crop&w=200&h=200',
    description: 'Преподаватель фортепиано и сольфеджио. Опыт работы в консерватории 10 лет.',
    verified: true,
    tags: ['Музыка', 'Фортепиано']
  },

  // --- МАСТЕРА ПО РЕМОНТУ (REPAIR) ---
  {
    id: 'repair-firuz',
    name: 'Фируз Чулибоев',
    category: ServiceCategory.REPAIR,
    rating: 5.0,
    reviewsCount: 18,
    location: 'Ташкент, Юнусабад',
    priceStart: 75000,
    // Чтобы поставить ваше фото, загрузите его на imgur.com и вставьте ссылку ниже вместо этой:
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fit=crop&w=200&h=200',
    description: 'Опытный сантехник. Монтаж полипропиленовых труб, установка душевых кабин, ремонт смесителей. Работаю 24/7.',
    verified: true,
    tags: ['Сантехник', 'Трубы', 'Ремонт']
  },
  {
    id: 'repair-1',
    name: 'Алишер Усманов',
    category: ServiceCategory.REPAIR,
    rating: 4.9,
    reviewsCount: 124,
    location: 'Ташкент, Чиланзар',
    priceStart: 100000,
    avatarUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?fit=crop&w=200&h=200',
    description: 'Мастер универсал. Сантехника, электрика, сборка мебели. Опыт 10 лет. Даю гарантию.',
    verified: true,
    tags: ['Сантехник', 'Электрик', 'Сборка мебели']
  },
  {
    id: 'repair-2',
    name: 'Сергей Петров',
    category: ServiceCategory.REPAIR,
    rating: 4.8,
    reviewsCount: 56,
    location: 'Ташкент, Сергели',
    priceStart: 150000,
    avatarUrl: 'https://images.unsplash.com/photo-1581578731117-10d52143b0e8?fit=crop&w=200&h=200',
    description: 'Профессиональный электрик с допуском. Монтаж проводки, установка люстр, щитков.',
    verified: true,
    tags: ['Электрик', 'Монтаж', 'Люстры']
  },
  {
    id: 'repair-3',
    name: 'Виктор Цой',
    category: ServiceCategory.REPAIR,
    rating: 4.7,
    reviewsCount: 33,
    location: 'Ташкент, Мирабад',
    priceStart: 50000,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=200&h=200',
    description: 'Сантехник. Устранение засоров, установка смесителей, унитазов, ванн. Быстро и чисто.',
    verified: false,
    tags: ['Сантехник', 'Водопровод']
  },

  // --- МАСТЕРА КРАСОТЫ (BEAUTY) ---
  {
    id: 'beauty-1',
    name: 'Мадина Садыкова',
    category: ServiceCategory.BEAUTY,
    rating: 4.9,
    reviewsCount: 312,
    location: 'Самарканд',
    priceStart: 120000,
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?fit=crop&w=200&h=200',
    description: 'Визажист, стилист по прическам. Свадебный образ, вечерний макияж.',
    verified: true,
    tags: ['Макияж', 'Прически', 'Свадьба']
  },
  {
    id: 'beauty-2',
    name: 'Севара Nails',
    category: ServiceCategory.BEAUTY,
    rating: 4.6,
    reviewsCount: 45,
    location: 'Ташкент, Ойбек',
    priceStart: 80000,
    avatarUrl: 'https://images.unsplash.com/photo-1595959183082-7bce708486d9?fit=crop&w=200&h=200',
    description: 'Маникюр, педикюр, наращивание ногтей. Стерильные инструменты.',
    verified: true,
    tags: ['Маникюр', 'Гель-лак']
  },
  {
    id: 'beauty-3',
    name: 'Barber Shop "Style"',
    category: ServiceCategory.BEAUTY,
    rating: 4.8,
    reviewsCount: 110,
    location: 'Ташкент, Центр',
    priceStart: 100000,
    avatarUrl: 'https://images.unsplash.com/photo-1503951914875-452162b7f300?fit=crop&w=200&h=200',
    description: 'Мужские стрижки, оформление бороды. Выезд на дом.',
    verified: true,
    tags: ['Барбер', 'Стрижки', 'Борода']
  },

  // --- ФРИЛАНСЕРЫ (IT) ---
  {
    id: 'it-1',
    name: 'Джамшид Алиев',
    category: ServiceCategory.IT,
    rating: 4.8,
    reviewsCount: 45,
    location: 'Удаленно / Ташкент',
    priceStart: 150000,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?fit=crop&w=200&h=200',
    description: 'Разработка сайтов, настройка рекламы в Instagram и Telegram. Создание лендингов.',
    verified: false,
    tags: ['Сайты', 'SMM', 'Таргет']
  },
  {
    id: 'it-2',
    name: 'Кирилл Дизайн',
    category: ServiceCategory.IT,
    rating: 5.0,
    reviewsCount: 20,
    location: 'Удаленно',
    priceStart: 200000,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?fit=crop&w=200&h=200',
    description: 'Графический дизайнер. Логотипы, фирменный стиль, баннеры, презентации.',
    verified: true,
    tags: ['Дизайн', 'Логотипы', 'Figma']
  },
  {
    id: 'it-3',
    name: 'Анна Копирайтер',
    category: ServiceCategory.IT,
    rating: 4.7,
    reviewsCount: 12,
    location: 'Удаленно',
    priceStart: 50000,
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?fit=crop&w=200&h=200',
    description: 'Написание продающих текстов для Instagram, статьи для сайтов, переводы RU/UZ/EN.',
    verified: true,
    tags: ['Тексты', 'Копирайтинг', 'Переводы']
  },

  // --- БУХГАЛТЕРЫ И ЮРИСТЫ (FINANCE) ---
  {
    id: 'fin-1',
    name: 'ООО "Audit Pro"',
    category: ServiceCategory.FINANCE,
    rating: 4.9,
    reviewsCount: 67,
    location: 'Ташкент, Шайхантахур',
    priceStart: 500000,
    avatarUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?fit=crop&w=200&h=200',
    description: 'Бухгалтерское сопровождение бизнеса, сдача отчетов, открытие ООО и ИП.',
    verified: true,
    tags: ['Бухгалтер', 'Отчетность', 'Аутсорсинг']
  },
  {
    id: 'fin-2',
    name: 'Адвокат Азиз',
    category: ServiceCategory.FINANCE,
    rating: 4.8,
    reviewsCount: 34,
    location: 'Ташкент, Мирзо-Улугбек',
    priceStart: 300000,
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?fit=crop&w=200&h=200',
    description: 'Юридические консультации. Семейное право, наследство, споры с застройщиками.',
    verified: true,
    tags: ['Юрист', 'Консультация', 'Суд']
  },

  // --- СПОРТИВНЫЕ ТРЕНЕРЫ (SPORT) ---
  {
    id: 'sport-1',
    name: 'Руслан Фитнес',
    category: ServiceCategory.SPORT,
    rating: 5.0,
    reviewsCount: 42,
    location: 'Ташкент, Экопарк',
    priceStart: 150000,
    avatarUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?fit=crop&w=200&h=200',
    description: 'Персональный тренер по бодибилдингу и фитнесу. Составление программ питания.',
    verified: true,
    tags: ['Фитнес', 'Похудение', 'Бодибилдинг']
  },
  {
    id: 'sport-2',
    name: 'Сабина Йога',
    category: ServiceCategory.SPORT,
    rating: 4.9,
    reviewsCount: 28,
    location: 'Ташкент, Мирабад',
    priceStart: 100000,
    avatarUrl: 'https://images.unsplash.com/photo-1544367563-121910aa6e39?fit=crop&w=200&h=200',
    description: 'Инструктор по Хатха-йоге и стретчингу. Групповые и индивидуальные занятия.',
    verified: true,
    tags: ['Йога', 'Стретчинг', 'Здоровье']
  },

  // --- ДОМАШНИЙ ПЕРСОНАЛ (DOMESTIC) ---
  {
    id: 'dom-1',
    name: 'Гульнара Опа',
    category: ServiceCategory.DOMESTIC,
    rating: 4.9,
    reviewsCount: 15,
    location: 'Ташкент, Чиланзар',
    priceStart: 50000,
    avatarUrl: 'https://images.unsplash.com/photo-1569913486515-b74bf7751574?fit=crop&w=200&h=200',
    description: 'Няня для детей от 1 года. Добрая, ответственная, есть педагогическое образование.',
    verified: true,
    tags: ['Няня', 'Дети', 'Помощница']
  },
  {
    id: 'dom-2',
    name: 'Clean Pro Uz',
    category: ServiceCategory.DOMESTIC,
    rating: 4.7,
    reviewsCount: 215,
    location: 'Ташкент, Юнусабад',
    priceStart: 250000,
    avatarUrl: 'https://images.unsplash.com/photo-1581578731117-10d52143b0e8?fit=crop&w=200&h=200',
    description: 'Профессиональная уборка квартир и офисов. Химчистка мягкой мебели.',
    verified: true,
    tags: ['Уборка', 'Химчистка', 'Мойка окон']
  },
  {
    id: 'dom-3',
    name: 'Бекзод Водитель',
    category: ServiceCategory.DOMESTIC,
    rating: 5.0,
    reviewsCount: 10,
    location: 'Ташкент',
    priceStart: 100000,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?fit=crop&w=200&h=200',
    description: 'Личный водитель на своем авто (Malibu 2). Стаж вождения 15 лет. Пунктуальный.',
    verified: true,
    tags: ['Водитель', 'Перевозки']
  },

  // --- АРТИСТЫ (EVENTS) ---
  {
    id: 'event-1',
    name: 'DJ Rustam',
    category: ServiceCategory.EVENTS,
    rating: 4.8,
    reviewsCount: 55,
    location: 'Ташкент',
    priceStart: 1000000,
    avatarUrl: 'https://images.unsplash.com/photo-1571266028243-371695039980?fit=crop&w=200&h=200',
    description: 'Музыкальное сопровождение свадеб, корпоративов, дней рождения. Своя аппаратура.',
    verified: true,
    tags: ['DJ', 'Музыка', 'Свадьба']
  },
  {
    id: 'event-2',
    name: 'Фокусник Алекс',
    category: ServiceCategory.EVENTS,
    rating: 5.0,
    reviewsCount: 22,
    location: 'Ташкент',
    priceStart: 800000,
    avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?fit=crop&w=200&h=200',
    description: 'Иллюзионист на детские праздники и взрослые мероприятия. Интерактивная программа.',
    verified: false,
    tags: ['Фокусы', 'Праздник', 'Аниматор']
  }
];