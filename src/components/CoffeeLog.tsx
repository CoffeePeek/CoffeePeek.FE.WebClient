import { useState } from 'react';
import { mockLogEntries } from '../data/mockData';
import { Plus, Star, Calendar, Coffee, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

type CoffeeLogProps = {
  onBack: () => void;
};

export function CoffeeLog({ onBack }: CoffeeLogProps) {
  const [entries] = useState(mockLogEntries);

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
          <h1 className="text-neutral-900 dark:text-neutral-50">Мой кофейный журнал</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Отслеживайте ваши посещения и любимые напитки
          </p>
        </div>
        <Button size="sm" className="bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700">
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="dark:bg-neutral-900 dark:border-neutral-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-amber-700 dark:text-amber-500 mb-1">{entries.length}</div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">Чекинов</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-neutral-900 dark:border-neutral-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-amber-700 dark:text-amber-500 mb-1">
              {new Set(entries.map((e) => e.coffeeShopId)).size}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">Кофеен</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-neutral-900 dark:border-neutral-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl text-amber-700 dark:text-amber-500 mb-1">
              {(entries.reduce((sum, e) => sum + e.rating, 0) / entries.length).toFixed(1)}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">Ср. оценка</div>
          </CardContent>
        </Card>
      </div>

      {/* Log Entries */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <Card key={entry.id} className="overflow-hidden dark:bg-neutral-900 dark:border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-neutral-900 dark:text-neutral-50 mb-1">
                    {entry.coffeeShopName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    <Calendar className="size-3" />
                    <span>{entry.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-4 ${
                        i < entry.rating
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Coffee className="size-4 text-amber-700 dark:text-amber-500" />
                <Badge variant="secondary" className="dark:bg-neutral-800 dark:text-neutral-200">{entry.drink}</Badge>
              </div>

              {entry.notes && (
                <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">
                  {entry.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12">
          <Coffee className="size-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            У вас пока нет записей в журнале
          </p>
          <Button className="bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700">
            <Plus className="size-4 mr-2" />
            Добавить первый чекин
          </Button>
        </div>
      )}
    </div>
  );
}