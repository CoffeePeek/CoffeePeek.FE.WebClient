import type { CoffeeShop, Job, LogEntry } from '../shared/types/domain';

export type Roaster = {
  id: string;
  name: string;
  description: string;
  location: string;
  coffeesCount: number;
  specialties: string[];
};

export type UserPost = {
  id: string;
  content: string;
  image?: string;
  location: string;
  date: string;
  likes: number;
  comments: number;
};

export type PendingCoffeeShop = CoffeeShop & {
  submittedBy: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  moderatorNotes?: string;
};

export const mockCoffeeShops: CoffeeShop[] = [
  {
    id: '1',
    name: 'Даблби',
    image: 'https://images.unsplash.com/photo-1716808681381-52cf8055b02d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGVjaWFsdHklMjBjb2ZmZWUlMjBzaG9wJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzY0Njk0ODczfDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Уютная кофейня в центре города с авторским подходом к каждому напитку. Специализируемся на альтернативном заваривании.',
    rating: 4.8,
    reviewCount: 342,
    location: {
      address: 'Невский проспект, 28',
      lat: 59.9343,
      lng: 30.3351,
    },
    isOpen: true,
    beans: ['Эфиопия Йиргачеф', 'Колумбия Супремо', 'Кения АА'],
    roasters: ['Tasty Coffee', 'Braziliya'],
    brewMethods: ['V60', 'Chemex', 'Aeropress', 'Espresso'],
    equipment: ['La Marzocco Linea PB', 'Mahlkonig EK43', 'Acaia Lunar'],
    priceRange: '₽₽₽',
  },
  {
    id: '2',
    name: 'Кооператив Чёрный',
    image: 'https://images.unsplash.com/photo-1638882267964-0d9764607947?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjb2ZmZWUlMjBjYWZlfGVufDF8fHx8MTc2NDY5NDg3M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Минималистичное пространство для настоящих ценителей кофе. Только спешелти и только свежая обжарка.',
    rating: 4.9,
    reviewCount: 567,
    location: {
      address: 'Рубинштейна, 15',
      lat: 59.9311,
      lng: 30.3450,
    },
    isOpen: true,
    beans: ['Бразилия Сантос', 'Гватемала Антигуа', 'Руанда Бурбон'],
    roasters: ['Кооператив Чёрный', 'Torrefacto'],
    brewMethods: ['Espresso', 'Flat White', 'Kalita Wave', 'Syphon'],
    equipment: ['Victoria Arduino Black Eagle', 'Nuova Simonelli Mythos', 'Hario Buono'],
    priceRange: '₽₽₽',
  },
  {
    id: '3',
    name: 'One More Cup',
    image: 'https://images.unsplash.com/photo-1601442509635-db4d4f7933ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpc2FuJTIwY29mZmVlJTIwYmFyfGVufDF8fHx8MTc2NDY5NDg3M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Дружелюбная атмосфера и отличный кофе на каждый день. Идеально для работы с ноутбуком.',
    rating: 4.6,
    reviewCount: 234,
    location: {
      address: 'Гороховая, 45',
      lat: 59.9296,
      lng: 30.3184,
    },
    isOpen: false,
    beans: ['Коста-Рика Тарразу', 'Эфиопия Сидамо'],
    roasters: ['Sorso Coffee', 'Local Roasters'],
    brewMethods: ['Espresso', 'Cappuccino', 'V60', 'French Press'],
    equipment: ['Faema E71', 'Mazzer Robur', 'Brewista Smart Pour'],
    priceRange: '₽₽',
  },
  {
    id: '4',
    name: 'Coffee Way',
    image: 'https://images.unsplash.com/photo-1712942851408-6deb69dc4185?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwY29mZmVlJTIwaG91c2V8ZW58MXx8fHwxNzY0Njk0ODczfDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Семейная кофейня с домашней атмосферой. Свежая выпечка и авторские десерты каждый день.',
    rating: 4.7,
    reviewCount: 189,
    location: {
      address: 'Ломоносова, 22',
      lat: 59.9272,
      lng: 30.3099,
    },
    isOpen: true,
    beans: ['Никарагуа Марагоджип', 'Танзания Пиберри'],
    roasters: ['Skuratov Coffee', 'Double B'],
    brewMethods: ['Espresso', 'Pour Over', 'Cold Brew'],
    equipment: ['Synesso MVP', 'Ditting KR804', 'Marco SP9'],
    priceRange: '₽₽',
  },
  {
    id: '5',
    name: 'Surf Coffee',
    image: 'https://images.unsplash.com/photo-1635236796520-68dd8df87895?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwY2FmZXxlbnwxfHx8fDE3NjQ2OTQ4NzN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Яркая кофейня с серферской эстетикой. Приходите за хорошим настроением и отличным кофе!',
    rating: 4.5,
    reviewCount: 412,
    location: {
      address: 'Марата, 5',
      lat: 59.9254,
      lng: 30.3572,
    },
    isOpen: true,
    beans: ['Индонезия Суматра', 'Перу Органик'],
    roasters: ['Surf Coffee Roasters'],
    brewMethods: ['Espresso', 'Latte', 'Nitro Cold Brew', 'Batch Brew'],
    equipment: ['Slayer Steam LP', 'Mahlkonig K30', 'Curtis G4'],
    priceRange: '₽₽',
  },
];

export const mockReviews = [
  {
    id: '1',
    coffeeShopId: '1',
    userName: 'Алексей Петров',
    rating: 5,
    date: '2 дня назад',
    comment: 'Невероятный V60 на эфиопском зерне! Бариста очень профессиональные, с удовольствием рассказывают о кофе. Обязательно вернусь.',
  },
  {
    id: '2',
    coffeeShopId: '1',
    userName: 'Мария Соколова',
    rating: 5,
    date: '5 дней назад',
    comment: 'Лучший флэт уайт в городе. Атмосфера уютная, много света. Идеально для работы с ноутбуком.',
  },
  {
    id: '3',
    coffeeShopId: '1',
    userName: 'Дмитрий К.',
    rating: 4,
    date: '1 неделю назад',
    comment: 'Хороший кофе, приятный интерьер. Единственный минус - иногда бывает многолюдно в выходные.',
  },
  {
    id: '4',
    coffeeShopId: '2',
    userName: 'Анна Волкова',
    rating: 5,
    date: '3 дня назад',
    comment: 'Обожаю это место! Кофе на высшем уровне, персонал дружелюбный. Сайфон - просто космос!',
  },
  {
    id: '5',
    coffeeShopId: '2',
    userName: 'Игорь Смирнов',
    rating: 5,
    date: '1 неделю назад',
    comment: 'Профессиональный подход к каждой чашке. Рекомендую попробовать Kalita Wave.',
  },
];

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Старший бариста',
    company: 'Даблби',
    location: 'Санкт-Петербург, центр',
    type: 'Полная занятость',
    salary: '80 000 - 100 000 ₽',
    isPremium: true,
    postedDate: '2 дня назад',
  },
  {
    id: '2',
    title: 'Обжарщик кофе',
    company: 'Кооператив Чёрный',
    location: 'Санкт-Петербург',
    type: 'Полная занятость',
    salary: '100 000 - 120 000 ₽',
    isPremium: true,
    postedDate: '3 дня назад',
  },
  {
    id: '3',
    title: 'Бариста',
    company: 'Coffee Way',
    location: 'Санкт-Петербург, Петроградский район',
    type: 'Полная/частичная занятость',
    salary: '50 000 - 70 000 ₽',
    isPremium: false,
    postedDate: '5 дней назад',
  },
  {
    id: '4',
    title: 'Менеджер кофейни',
    company: 'One More Cup',
    location: 'Санкт-Петербург',
    type: 'Полная занятость',
    salary: '90 000 - 110 000 ₽',
    isPremium: false,
    postedDate: '1 неделю назад',
  },
  {
    id: '5',
    title: 'Бариста-стажер',
    company: 'Surf Coffee',
    location: 'Санкт-Петербург, Васлеостровский район',
    type: 'Стажировка',
    isPremium: false,
    postedDate: '1 неделю назад',
  },
  {
    id: '6',
    title: 'Q-грейдер / Контроль качества',
    company: 'Tasty Coffee',
    location: 'Санкт-Петербург',
    type: 'Полная занятость',
    salary: '120 000 - 150 000 ₽',
    isPremium: true,
    postedDate: '4 дня назад',
  },
];

export const mockRoasters: Roaster[] = [
  {
    id: '1',
    name: 'Tasty Coffee',
    description: 'Один из крупнейших российских обжарщиков спешелти кофе. Прямые поставки с плантаций, собственная лаборатория качества.',
    location: 'Санкт-Петербург',
    coffeesCount: 45,
    specialties: ['Светлая обжарка', 'Single Origin', 'Микролоты'],
  },
  {
    id: '2',
    name: 'Кооператив Чёрный',
    description: 'Независимая обжарочная с фокусом на прямые закупки и поддержку фермеров. Экспериментальные обработки.',
    location: 'Санкт-Петербург',
    coffeesCount: 28,
    specialties: ['Анаэробная обработка', 'Экспериментальная обжарка', 'Эфиопия'],
  },
  {
    id: '3',
    name: 'Braziliya Coffee Roasters',
    description: 'Специализация на бразильском кофе. Работают напрямую с фермами в Минас-Жерайс и Сул-де-Минас.',
    location: 'Москва',
    coffeesCount: 18,
    specialties: ['Бразилия', 'Naturals', 'Средняя обжарка'],
  },
  {
    id: '4',
    name: 'Torrefacto',
    description: 'Премиальная обжарка с итальянскими традициями. Идеальны для эспрессо-смесей и молочных напитков.',
    location: 'Москва',
    coffeesCount: 32,
    specialties: ['Espresso Blends', 'Итальянская обжарка', 'Традиционные методы'],
  },
];

export const mockUserPosts: UserPost[] = [
  {
    id: '1',
    content: 'Невероятный опыт в Даблби! V60 на эфиопском зерне просто космос 🌟 Цветочные ноты, легкая кислинка, идеальный баланс.',
    image: 'https://images.unsplash.com/photo-1716808681381-52cf8055b02d?w=400',
    location: 'Даблби',
    date: '1 день назад',
    likes: 24,
    comments: 5,
  },
  {
    id: '2',
    content: 'Обжарка от Кооператив Чёрный - это что-то особенное. Каждый глоток раскрывает новые грани вкуса.',
    location: 'Кооператив Чёрный',
    date: '3 дня назад',
    likes: 18,
    comments: 3,
  },
];

export const mockLogEntries: LogEntry[] = [
  {
    id: '1',
    coffeeShopId: '1',
    coffeeShopName: 'Даблби',
    date: '1 декабря 2025',
    drink: 'V60 - Эфиопия Йиргачеф',
    rating: 5,
    notes: 'Потрясающие цветочные ноты и легкая кислинка. Один из лучших V60, что я пробовал!',
  },
  {
    id: '2',
    coffeeShopId: '2',
    coffeeShopName: 'Кооператив Чёрный',
    date: '28 ноября 2025',
    drink: 'Flat White',
    rating: 5,
    notes: 'Идеальная текстура молока, насыщенный вкус эспрессо. Бариста - настоящий профессионал.',
  },
  {
    id: '3',
    coffeeShopId: '4',
    coffeeShopName: 'Coffee Way',
    date: '25 ноября 2025',
    drink: 'Cappuccino',
    rating: 4,
    notes: 'Хороший классический капучино. Уютная атмосфера, буду возвращаться.',
  },
  {
    id: '4',
    coffeeShopId: '5',
    coffeeShopName: 'Surf Coffee',
    date: '22 ноября 2025',
    drink: 'Nitro Cold Brew',
    rating: 5,
    notes: 'Освежающий и бодрящий! Идеально для жаркого дня.',
  },
  {
    id: '5',
    coffeeShopId: '1',
    coffeeShopName: 'Даблби',
    date: '20 ноября 2025',
    drink: 'Aeropress - Колумбия',
    rating: 4,
    notes: 'Сладкий и сбалансированный. Отличный выбор для утра.',
  },
];

export const mockPendingSubmissions: PendingCoffeeShop[] = [
  {
    id: 'pending-1',
    name: 'Кофе и Точка',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
    description: 'Новая кофейня в Московском районе. Специализируемся на альтернативе и легких обжарках.',
    rating: 0,
    reviewCount: 0,
    location: {
      address: 'Московский проспект, 150',
      lat: 59.8519,
      lng: 30.3199,
    },
    isOpen: true,
    beans: ['Эфиопия Гуджи', 'Колумбия Уила', 'Кения Киамбу'],
    roasters: ['Tasty Coffee', 'Skuratov Coffee'],
    brewMethods: ['V60', 'Kalita Wave', 'Aeropress', 'Espresso'],
    equipment: ['La Marzocco Linea Mini', 'Comandante C40', 'Acaia Pearl'],
    priceRange: '₽₽',
    submittedBy: 'Мария Иванова',
    submittedDate: '3 часа назад',
    status: 'pending',
  },
  {
    id: 'pending-2',
    name: 'Бодрый день',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
    description: 'Семейная кофейня на Васильевском острове. Уютная атмосфера и домашняя выпечка.',
    rating: 0,
    reviewCount: 0,
    location: {
      address: 'Средний проспект В.О., 36',
      lat: 59.9406,
      lng: 30.2750,
    },
    isOpen: true,
    beans: ['Бразилия Сантос', 'Гватемала Антигуа'],
    roasters: ['Local Roasters', 'Double B'],
    brewMethods: ['Espresso', 'Cappuccino', 'Filter Coffee'],
    equipment: ['Nuova Simonelli Appia II', 'Mazzer Super Jolly'],
    priceRange: '₽',
    submittedBy: 'Андрей Смирнов',
    submittedDate: '1 день назад',
    status: 'pending',
  },
  {
    id: 'pending-3',
    name: 'Roastery Lab',
    image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400',
    description: 'Экспериментальная обжарочная с баром. Проводим каппинги и мастер-классы по завариванию.',
    rating: 0,
    reviewCount: 0,
    location: {
      address: 'Лиговский проспект, 74',
      lat: 59.9242,
      lng: 30.3565,
    },
    isOpen: true,
    beans: ['Эфиопия Йиргачеф', 'Кения Ньери', 'Панама Гейша', 'Руанда Бурбон'],
    roasters: ['Roastery Lab (собственная обжарка)'],
    brewMethods: ['V60', 'Chemex', 'Syphon', 'Cold Drip', 'Espresso'],
    equipment: ['Victoria Arduino Eagle One', 'Mahlkonig EK43', 'Hario Buono Kettle'],
    priceRange: '₽₽₽',
    submittedBy: 'Елена Кузнецова',
    submittedDate: '2 дня назад',
    status: 'pending',
  },
  {
    id: 'pending-4',
    name: 'Кофемания',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    description: 'Небольшая кофейня с большим сердцем. Отличное место для работы удаленно.',
    rating: 0,
    reviewCount: 0,
    location: {
      address: 'Садовая улица, 12',
      lat: 59.9289,
      lng: 30.3142,
    },
    isOpen: false,
    beans: ['Коста-Рика', 'Индонезия Суматра'],
    roasters: ['Surf Coffee Roasters'],
    brewMethods: ['Espresso', 'Americano', 'French Press'],
    equipment: ['Faema E61', 'Eureka Mignon'],
    priceRange: '₽₽',
    submittedBy: 'Дмитрий Волков',
    submittedDate: '5 дней назад',
    status: 'pending',
  },
];