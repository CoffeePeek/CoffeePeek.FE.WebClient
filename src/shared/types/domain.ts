export type CoffeeShop = {
  id: string;
  name: string;
  image: string;
  description: string;
  rating: number;
  reviewCount: number;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  isOpen: boolean;
  beans: string[];
  roasters: string[];
  brewMethods: string[];
  equipment: string[];
  priceRange: string;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  isPremium: boolean;
  postedDate: string;
};

export type LogEntry = {
  id: string;
  coffeeShopId: string;
  coffeeShopName: string;
  date: string;
  drink: string;
  rating: number;
  notes: string;
};

