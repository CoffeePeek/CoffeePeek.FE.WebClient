import { useState } from 'react';
import { mockCoffeeShops } from '../data/mockData';
import { MapPin, Star, Filter } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

type CoffeeMapProps = {
  onShopSelect: (shopId: string) => void;
};

export function CoffeeMap({ onShopSelect }: CoffeeMapProps) {
  const [showOpenOnly, setShowOpenOnly] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

  const allMethods = Array.from(
    new Set(mockCoffeeShops.flatMap((shop) => shop.brewMethods))
  );

  const filteredShops = mockCoffeeShops.filter((shop) => {
    if (showOpenOnly && !shop.isOpen) return false;
    if (
      selectedMethods.length > 0 &&
      !selectedMethods.some((method) => shop.brewMethods.includes(method))
    ) {
      return false;
    }
    return true;
  });

  const toggleMethod = (method: string) => {
    setSelectedMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  };

  return (
    <div className="relative">
      {/* Map Placeholder */}
      <div className="h-[50vh] bg-gradient-to-br from-amber-50 to-orange-100 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="size-12 text-amber-700 mx-auto mb-2" />
            <p className="text-neutral-600">Интерактивная карта</p>
            <p className="text-sm text-neutral-500">Геолокация кофеен</p>
          </div>
        </div>

        {/* Filter Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              className="absolute top-4 right-4 bg-white text-neutral-900 shadow-lg hover:bg-neutral-50"
              size="sm"
            >
              <Filter className="size-4 mr-2" />
              Фильтры
              {(showOpenOnly || selectedMethods.length > 0) && (
                <Badge className="ml-2 bg-amber-700 text-white">
                  {(showOpenOnly ? 1 : 0) + selectedMethods.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh]">
            <SheetHeader>
              <SheetTitle>Фильтры</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="open-only">Только открытые сейчас</Label>
                <Switch
                  id="open-only"
                  checked={showOpenOnly}
                  onCheckedChange={setShowOpenOnly}
                />
              </div>

              <div>
                <Label className="mb-3 block">Методы заваривания</Label>
                <div className="flex flex-wrap gap-2">
                  {allMethods.map((method) => (
                    <Badge
                      key={method}
                      variant={selectedMethods.includes(method) ? 'default' : 'outline'}
                      className={`cursor-pointer ${
                        selectedMethods.includes(method)
                          ? 'bg-amber-700 hover:bg-amber-800'
                          : ''
                      }`}
                      onClick={() => toggleMethod(method)}
                    >
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Shop List */}
      <div className="p-4">
        <h2 className="text-neutral-900 mb-3">
          Найдено кофеен: {filteredShops.length}
        </h2>

        <div className="space-y-3">
          {filteredShops.map((shop) => (
            <div
              key={shop.id}
              onClick={() => onShopSelect(shop.id)}
              className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex gap-3">
                <img
                  src={shop.image}
                  alt={shop.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-neutral-900 truncate">{shop.name}</h3>
                    {shop.isOpen && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2 flex-shrink-0">
                        Открыто
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="size-3 fill-amber-500 text-amber-500" />
                      <span className="text-sm text-neutral-900">{shop.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      ({shop.reviewCount})
                    </span>
                  </div>
                  <div className="flex items-start gap-1">
                    <MapPin className="size-3 text-neutral-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-neutral-600 truncate">
                      {shop.location.address}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
