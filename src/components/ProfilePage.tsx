import { useState } from 'react';
import { CoffeeLog } from './CoffeeLog';
import { RoastersList } from './RoastersList';
import { UserPosts } from './UserPosts';
import { UserReviews } from './UserReviews';
import { ReferralProgram } from './ReferralProgram';
import { 
  User, 
  Coffee, 
  Factory, 
  MessageSquare, 
  Gift, 
  Plus, 
  Star, 
  LogOut, 
  ChevronRight,
  Info
} from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

type ProfileSection = 'main' | 'log' | 'roasters' | 'posts' | 'reviews' | 'referral';

export function ProfilePage() {
  const [activeSection, setActiveSection] = useState<ProfileSection>('main');

  if (activeSection === 'log') {
    return (
      <div>
        <div className="sticky top-[57px] z-40 bg-white border-b border-neutral-200 px-4 py-3">
          <button 
            onClick={() => setActiveSection('main')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
          >
            <ChevronRight className="size-5 rotate-180" />
            Назад
          </button>
        </div>
        <CoffeeLog />
      </div>
    );
  }

  if (activeSection === 'roasters') {
    return (
      <div>
        <div className="sticky top-[57px] z-40 bg-white border-b border-neutral-200 px-4 py-3">
          <button 
            onClick={() => setActiveSection('main')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
          >
            <ChevronRight className="size-5 rotate-180" />
            Назад
          </button>
        </div>
        <RoastersList />
      </div>
    );
  }

  if (activeSection === 'posts') {
    return (
      <div>
        <div className="sticky top-[57px] z-40 bg-white border-b border-neutral-200 px-4 py-3">
          <button 
            onClick={() => setActiveSection('main')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
          >
            <ChevronRight className="size-5 rotate-180" />
            Назад
          </button>
        </div>
        <UserPosts />
      </div>
    );
  }

  if (activeSection === 'reviews') {
    return (
      <div>
        <div className="sticky top-[57px] z-40 bg-white border-b border-neutral-200 px-4 py-3">
          <button 
            onClick={() => setActiveSection('main')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
          >
            <ChevronRight className="size-5 rotate-180" />
            Назад
          </button>
        </div>
        <UserReviews />
      </div>
    );
  }

  if (activeSection === 'referral') {
    return (
      <div>
        <div className="sticky top-[57px] z-40 bg-white border-b border-neutral-200 px-4 py-3">
          <button 
            onClick={() => setActiveSection('main')}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
          >
            <ChevronRight className="size-5 rotate-180" />
            Назад
          </button>
        </div>
        <ReferralProgram />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 lg:pb-4">
      {/* User Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="size-16">
              <AvatarFallback className="bg-amber-100 text-amber-800 text-xl">
                АП
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-neutral-900 mb-1">Алексей Петров</h2>
              <p className="text-sm text-neutral-600">@alexcoffee</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-neutral-900 mb-1">24</div>
              <div className="text-xs text-neutral-600">Чекина</div>
            </div>
            <div>
              <div className="text-neutral-900 mb-1">12</div>
              <div className="text-xs text-neutral-600">Отзывов</div>
            </div>
            <div>
              <div className="text-neutral-900 mb-1">8</div>
              <div className="text-xs text-neutral-600">Постов</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Activity Section */}
      <div className="mb-6">
        <h3 className="text-neutral-900 mb-3">Моя активность</h3>
        <div className="space-y-2">
          <button
            onClick={() => setActiveSection('log')}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 bg-amber-50 rounded-full flex items-center justify-center">
                <Coffee className="size-5 text-amber-700" />
              </div>
              <span className="text-neutral-900">Мой кофейный журнал</span>
            </div>
            <ChevronRight className="size-5 text-neutral-400" />
          </button>

          <button
            onClick={() => setActiveSection('posts')}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 bg-blue-50 rounded-full flex items-center justify-center">
                <User className="size-5 text-blue-700" />
              </div>
              <span className="text-neutral-900">Мои посты</span>
            </div>
            <ChevronRight className="size-5 text-neutral-400" />
          </button>

          <button
            onClick={() => setActiveSection('reviews')}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 bg-purple-50 rounded-full flex items-center justify-center">
                <MessageSquare className="size-5 text-purple-700" />
              </div>
              <span className="text-neutral-900">Мои отзывы</span>
            </div>
            <ChevronRight className="size-5 text-neutral-400" />
          </button>
        </div>
      </div>

      {/* Discover Section */}
      <div className="mb-6">
        <h3 className="text-neutral-900 mb-3">Открыть</h3>
        <div className="space-y-2">
          <button
            onClick={() => setActiveSection('roasters')}
            className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 bg-orange-50 rounded-full flex items-center justify-center">
                <Factory className="size-5 text-orange-700" />
              </div>
              <span className="text-neutral-900">Все обжарщики</span>
            </div>
            <ChevronRight className="size-5 text-neutral-400" />
          </button>
        </div>
      </div>

      {/* Rewards Section */}
      <div className="mb-6">
        <h3 className="text-neutral-900 mb-3">Награды и бонусы</h3>
        <div className="space-y-2">
          <button
            onClick={() => setActiveSection('referral')}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:from-amber-100 hover:to-orange-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 bg-white rounded-full flex items-center justify-center">
                <Gift className="size-5 text-amber-700" />
              </div>
              <div className="text-left">
                <div className="text-neutral-900">Реферальная программа</div>
                <div className="text-xs text-neutral-600">Приглашайте друзей</div>
              </div>
            </div>
            <Badge className="bg-amber-700">Новое</Badge>
          </button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Actions Section */}
      <div className="mb-6">
        <h3 className="text-neutral-900 mb-3">Добавить</h3>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors">
            <div className="flex items-center gap-3">
              <Plus className="size-5 text-neutral-600" />
              <span className="text-neutral-900">Добавить кофейню</span>
            </div>
            <ChevronRight className="size-5 text-neutral-400" />
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors">
            <div className="flex items-center gap-3">
              <Plus className="size-5 text-neutral-600" />
              <span className="text-neutral-900">Добавить обжарщика</span>
            </div>
            <ChevronRight className="size-5 text-neutral-400" />
          </button>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Support Section */}
      <div className="space-y-2 mb-6">
        <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors">
          <div className="flex items-center gap-3">
            <Star className="size-5 text-neutral-600" />
            <span className="text-neutral-900">Оценить в Play Market</span>
          </div>
          <ChevronRight className="size-5 text-neutral-400" />
        </button>
      </div>

      <Separator className="my-6" />

      {/* Account Section */}
      <div className="space-y-2 mb-6">
        <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-neutral-200 hover:bg-red-50 hover:border-red-200 transition-colors group">
          <div className="flex items-center gap-3">
            <LogOut className="size-5 text-neutral-600 group-hover:text-red-600" />
            <span className="text-neutral-900 group-hover:text-red-600">Выход</span>
          </div>
        </button>
      </div>

      {/* Version */}
      <div className="text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
        <Info className="size-3" />
        <span>Версия 1.0.0 (beta)</span>
      </div>
    </div>
  );
}
