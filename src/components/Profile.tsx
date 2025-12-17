import { useState } from 'react';
import { 
  User, 
  BookMarked, 
  Star, 
  Gift, 
  Coffee, 
  Flame, 
  Store, 
  LogOut, 
  Info,
  ChevronRight,
  MessageSquare,
  Camera,
  Moon,
  Sun,
  Users
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { UserReviews } from './UserReviews';
import { UserPosts } from './UserPosts';
import { RoastersList } from './RoastersList';
import { ReferralProgram } from './ReferralProgram';
import { AddCoffeeShop } from './AddCoffeeShop';
import { ModeratorPanel } from './ModeratorPanel';

type ProfileSection = 'main' | 'reviews' | 'posts' | 'roasters' | 'referral' | 'add-shop' | 'moderator';

type ProfileProps = {
  onNavigateToLog: () => void;
};

export function Profile({ onNavigateToLog }: ProfileProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<ProfileSection>('main');

  // Show different sections
  if (activeSection === 'reviews') {
    return <UserReviews onBack={() => setActiveSection('main')} />;
  }

  if (activeSection === 'posts') {
    return <UserPosts onBack={() => setActiveSection('main')} />;
  }

  if (activeSection === 'roasters') {
    return <RoastersList onBack={() => setActiveSection('main')} />;
  }

  if (activeSection === 'referral') {
    return <ReferralProgram onBack={() => setActiveSection('main')} />;
  }

  if (activeSection === 'add-shop') {
    return <AddCoffeeShop onBack={() => setActiveSection('main')} />;
  }

  if (activeSection === 'moderator') {
    return <ModeratorPanel onBack={() => setActiveSection('main')} />;
  }

  const menuSections = [
    {
      title: 'Моя активность',
      items: [
        { id: 'log', icon: BookMarked, label: 'Кофейный журнал', badge: '12', action: onNavigateToLog },
        { id: 'reviews', icon: MessageSquare, label: 'Мои отзывы', badge: '5', action: () => setActiveSection('reviews') },
        { id: 'posts', icon: Camera, label: 'Мои посты', badge: '8', action: () => setActiveSection('posts') },
      ],
    },
    // Показываем раздел модератора только для модераторов
    ...(user?.isModerator ? [{
      title: 'Модерация',
      items: [
        { id: 'moderator', icon: Users, label: 'Панель модератора', badge: '4', action: () => setActiveSection('moderator') },
      ],
    }] : []),
    {
      title: 'Сообщество',
      items: [
        { id: 'roasters', icon: Flame, label: 'Все обжарщики', action: () => setActiveSection('roasters') },
        { id: 'referral', icon: Gift, label: 'Реферальная программа', action: () => setActiveSection('referral') },
      ],
    },
    {
      title: 'Добавить',
      items: [
        { id: 'add-shop', icon: Store, label: 'Добавить кофейню', action: () => setActiveSection('add-shop') },
        { id: 'add-roaster', icon: Flame, label: 'Добавить обжарщика' },
      ],
    },
    {
      title: 'Приложение',
      items: [
        { id: 'rate', icon: Star, label: 'Оценить в Play Market' },
        { id: 'version', icon: Info, label: 'Версия приложения', rightText: 'v1.0.0' },
      ],
    },
  ];

  return (
    <div className="p-4 pb-20">
      {/* User Profile Card */}
      <Card className="mb-6 dark:bg-neutral-900 dark:border-neutral-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="size-20">
              <AvatarFallback className="bg-amber-700 text-white text-xl">
                {user?.name.split(' ').map(n => n[0]).join('') || 'АП'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-neutral-900 dark:text-neutral-50">{user?.name || 'Алексей Петров'}</h2>
                {user?.isModerator && (
                  <Badge variant="default" className="bg-amber-600 dark:bg-amber-700 text-xs">
                    Модератор
                  </Badge>
                )}
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-2">{user?.email || 'alexey.petrov@mail.ru'}</p>
              <Button variant="outline" size="sm" className="dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800">
                Редактировать профиль
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="text-center">
              <div className="text-xl text-amber-700 dark:text-amber-500 mb-1">12</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Чекинов</div>
            </div>
            <div className="text-center">
              <div className="text-xl text-amber-700 dark:text-amber-500 mb-1">8</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Кофеен</div>
            </div>
            <div className="text-center">
              <div className="text-xl text-amber-700 dark:text-amber-500 mb-1">5</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Отзывов</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Toggle */}
      <Card className="mb-6 dark:bg-neutral-900 dark:border-neutral-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'light' ? (
                <Sun className="size-5 text-amber-700" />
              ) : (
                <Moon className="size-5 text-amber-500" />
              )}
              <span className="text-neutral-900 dark:text-neutral-50">Тёмная тема</span>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      {/* Menu Sections */}
      {menuSections.map((section, sectionIndex) => (
        <div key={section.title} className="mb-6">
          <h3 className="text-neutral-600 dark:text-neutral-400 text-sm mb-3 px-2">
            {section.title}
          </h3>
          <Card className="dark:bg-neutral-900 dark:border-neutral-800">
            <CardContent className="p-0">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <div key={item.id}>
                    <button
                      onClick={item.action}
                      className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="size-5 text-amber-700 dark:text-amber-500" />
                        <span className="text-neutral-900 dark:text-neutral-50">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400">
                            {item.badge}
                          </Badge>
                        )}
                        {item.rightText && (
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">{item.rightText}</span>
                        )}
                        <ChevronRight className="size-4 text-neutral-400" />
                      </div>
                    </button>
                    {itemIndex < section.items.length - 1 && (
                      <Separator className="dark:bg-neutral-800" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Logout Button */}
      <Button
        onClick={logout}
        variant="outline"
        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/30"
      >
        <LogOut className="size-4 mr-2" />
        Выйти из аккаунта
      </Button>
    </div>
  );
}