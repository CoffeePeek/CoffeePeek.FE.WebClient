import { mockRoasters } from '../data/mockData';
import { Factory, MapPin, Package, ExternalLink, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

type RoastersListProps = {
  onBack: () => void;
};

export function RoastersList({ onBack }: RoastersListProps) {
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
          <h1 className="text-neutral-900 dark:text-neutral-50">Обжарщики</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Познакомьтесь с лучшими обжарщиками спешелти кофе
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {mockRoasters.map((roaster) => (
          <Card key={roaster.id} className="overflow-hidden dark:bg-neutral-900 dark:border-neutral-800">
            <CardContent className="p-0">
              <div className="flex gap-4 p-4">
                <div className="size-16 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Factory className="size-8 text-amber-700 dark:text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-neutral-900 dark:text-neutral-50 mb-1">{roaster.name}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 line-clamp-2">
                    {roaster.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                    <MapPin className="size-3" />
                    <span>{roaster.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="size-3 text-neutral-500 dark:text-neutral-400" />
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                      {roaster.coffeesCount} сортов кофе
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {roaster.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs dark:bg-neutral-800 dark:text-neutral-300">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-lg transition-colors">
                  <span>Подробнее</span>
                  <ExternalLink className="size-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
