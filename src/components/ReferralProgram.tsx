import { Gift, Users, Coffee, Copy, Share2, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

type ReferralProgramProps = {
  onBack: () => void;
};

export function ReferralProgram({ onBack }: ReferralProgramProps) {
  const referralCode = 'COFFEE2025';
  const referralsCount = 3;
  const bonusPoints = 150;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
  };

  return (
    <div className="p-4">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
        >
          <ArrowLeft className="size-5 text-neutral-700 dark:text-neutral-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-neutral-900 dark:text-neutral-50">Реферальная программа</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Приглашайте друзей и получайте бонусы
          </p>
        </div>
      </div>

      {/* Hero Card */}
      <Card className="mb-6 overflow-hidden dark:bg-neutral-900 dark:border-neutral-800">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-12 bg-white/20 rounded-full flex items-center justify-center">
              <Gift className="size-6" />
            </div>
            <div>
              <h2 className="mb-1">Пригласите друзей</h2>
              <p className="text-sm text-white/90">
                Получите 50 баллов за каждого друга
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="dark:bg-neutral-900 dark:border-neutral-800">
          <CardContent className="p-4 text-center">
            <Users className="size-8 text-amber-700 dark:text-amber-500 mx-auto mb-2" />
            <div className="text-2xl text-neutral-900 dark:text-neutral-50 mb-1">{referralsCount}</div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">Друзей приглашено</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-neutral-900 dark:border-neutral-800">
          <CardContent className="p-4 text-center">
            <Coffee className="size-8 text-amber-700 dark:text-amber-500 mx-auto mb-2" />
            <div className="text-2xl text-neutral-900 dark:text-neutral-50 mb-1">{bonusPoints}</div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">Бонусных баллов</div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code */}
      <Card className="mb-6 dark:bg-neutral-900 dark:border-neutral-800">
        <CardContent className="p-4">
          <h3 className="text-neutral-900 dark:text-neutral-50 mb-3">Ваш реферальный код</h3>
          <div className="flex gap-2">
            <div className="flex-1 px-4 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-center">
              <span className="text-lg tracking-wider text-neutral-900 dark:text-neutral-50">{referralCode}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyCode}
              className="flex-shrink-0 dark:border-neutral-700 dark:text-neutral-300"
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Share Button */}
      <Button className="w-full bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 mb-6">
        <Share2 className="size-4 mr-2" />
        Поделиться с друзьями
      </Button>

      {/* How it works */}
      <Card className="dark:bg-neutral-900 dark:border-neutral-800">
        <CardContent className="p-4">
          <h3 className="text-neutral-900 dark:text-neutral-50 mb-4">Как это работает?</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="size-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-amber-700 dark:text-amber-400">1</span>
              </div>
              <div>
                <p className="text-sm text-neutral-900 dark:text-neutral-50 mb-1">Поделитесь кодом</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Отправьте свой реферальный код друзьям
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="size-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-amber-700 dark:text-amber-400">2</span>
              </div>
              <div>
                <p className="text-sm text-neutral-900 dark:text-neutral-50 mb-1">Друг регистрируется</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Ваш друг использует код при регистрации
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="size-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-amber-700 dark:text-amber-400">3</span>
              </div>
              <div>
                <p className="text-sm text-neutral-900 dark:text-neutral-50 mb-1">Получите бонусы</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Вы и ваш друг получаете по 50 баллов
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
