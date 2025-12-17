import { useState } from 'react';
import { ArrowLeft, MapPin, Coffee, Clock, Upload, Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

type AddCoffeeShopProps = {
  onBack: () => void;
};

export function AddCoffeeShop({ onBack }: AddCoffeeShopProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBeans, setSelectedBeans] = useState<string[]>([]);
  const [selectedRoasters, setSelectedRoasters] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [customBean, setCustomBean] = useState('');
  const [customRoaster, setCustomRoaster] = useState('');

  const availableBeans = ['Эфиопия', 'Колумбия', 'Бразилия', 'Кения', 'Гватемала', 'Коста-Рика'];
  const availableRoasters = ['Tasty Coffee', 'Кооператив Чёрный', 'Torrefacto', 'Braziliya'];
  const brewMethods = ['Espresso', 'V60', 'Chemex', 'Aeropress', 'French Press', 'Kalita Wave', 'Syphon'];

  const toggleItem = (item: string, list: string[], setList: (items: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const addCustomBean = () => {
    if (customBean && !selectedBeans.includes(customBean)) {
      setSelectedBeans([...selectedBeans, customBean]);
      setCustomBean('');
    }
  };

  const addCustomRoaster = () => {
    if (customRoaster && !selectedRoasters.includes(customRoaster)) {
      setSelectedRoasters([...selectedRoasters, customRoaster]);
      setCustomRoaster('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // В реальном приложении здесь был бы API вызов
    console.log({
      name,
      address,
      description,
      beans: selectedBeans,
      roasters: selectedRoasters,
      methods: selectedMethods,
    });
    // Показать успешное сообщение и вернуться назад
    alert('Кофейня успешно добавлена! После модерации она появится в каталоге.');
    onBack();
  };

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
        >
          <ArrowLeft className="size-5 text-neutral-700 dark:text-neutral-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-neutral-900 dark:text-neutral-50">Добавить кофейню</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Поделитесь новым заведением с сообществом
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="dark:bg-neutral-900 dark:border-neutral-800">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label htmlFor="name" className="dark:text-neutral-200">
                Название кофейни *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название"
                className="dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50"
                required
              />
            </div>

            <div>
              <Label htmlFor="address" className="dark:text-neutral-200">
                Адрес *
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Улица, дом"
                  className="pl-10 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="dark:text-neutral-200">
                Описание *
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Расскажите о кофейне..."
                rows={4}
                className="dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Coffee Beans */}
        <Card className="dark:bg-neutral-900 dark:border-neutral-800">
          <CardContent className="p-4">
            <Label className="dark:text-neutral-200 mb-3 block">
              Используемое зерно
            </Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {availableBeans.map((bean) => (
                <Badge
                  key={bean}
                  variant={selectedBeans.includes(bean) ? 'default' : 'outline'}
                  className={`cursor-pointer ${
                    selectedBeans.includes(bean)
                      ? 'bg-amber-700 hover:bg-amber-800 dark:bg-amber-600'
                      : 'dark:border-neutral-700 dark:text-neutral-300'
                  }`}
                  onClick={() => toggleItem(bean, selectedBeans, setSelectedBeans)}
                >
                  {bean}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customBean}
                onChange={(e) => setCustomBean(e.target.value)}
                placeholder="Другое зерно..."
                className="flex-1 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addCustomBean}
                className="dark:border-neutral-700 dark:text-neutral-300"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            {selectedBeans.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedBeans.map((bean) => (
                  <Badge
                    key={bean}
                    variant="secondary"
                    className="dark:bg-neutral-800 dark:text-neutral-200"
                  >
                    {bean}
                    <button
                      type="button"
                      onClick={() => toggleItem(bean, selectedBeans, setSelectedBeans)}
                      className="ml-1"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roasters */}
        <Card className="dark:bg-neutral-900 dark:border-neutral-800">
          <CardContent className="p-4">
            <Label className="dark:text-neutral-200 mb-3 block">
              Обжарщики
            </Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {availableRoasters.map((roaster) => (
                <Badge
                  key={roaster}
                  variant={selectedRoasters.includes(roaster) ? 'default' : 'outline'}
                  className={`cursor-pointer ${
                    selectedRoasters.includes(roaster)
                      ? 'bg-amber-700 hover:bg-amber-800 dark:bg-amber-600'
                      : 'dark:border-neutral-700 dark:text-neutral-300'
                  }`}
                  onClick={() => toggleItem(roaster, selectedRoasters, setSelectedRoasters)}
                >
                  {roaster}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customRoaster}
                onChange={(e) => setCustomRoaster(e.target.value)}
                placeholder="Другой обжарщик..."
                className="flex-1 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-50"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addCustomRoaster}
                className="dark:border-neutral-700 dark:text-neutral-300"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            {selectedRoasters.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedRoasters.map((roaster) => (
                  <Badge
                    key={roaster}
                    variant="secondary"
                    className="dark:bg-neutral-800 dark:text-neutral-200"
                  >
                    {roaster}
                    <button
                      type="button"
                      onClick={() => toggleItem(roaster, selectedRoasters, setSelectedRoasters)}
                      className="ml-1"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brew Methods */}
        <Card className="dark:bg-neutral-900 dark:border-neutral-800">
          <CardContent className="p-4">
            <Label className="dark:text-neutral-200 mb-3 block">
              Методы заваривания
            </Label>
            <div className="flex flex-wrap gap-2">
              {brewMethods.map((method) => (
                <Badge
                  key={method}
                  variant={selectedMethods.includes(method) ? 'default' : 'outline'}
                  className={`cursor-pointer ${
                    selectedMethods.includes(method)
                      ? 'bg-amber-700 hover:bg-amber-800 dark:bg-amber-600'
                      : 'dark:border-neutral-700 dark:text-neutral-300'
                  }`}
                  onClick={() => toggleItem(method, selectedMethods, setSelectedMethods)}
                >
                  {method}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="dark:bg-neutral-900 dark:border-neutral-800">
          <CardContent className="p-4">
            <Label className="dark:text-neutral-200 mb-3 block">
              Фотографии (опционально)
            </Label>
            <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-6 text-center">
              <Upload className="size-8 text-neutral-400 mx-auto mb-2" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                Нажмите для загрузки фото
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                PNG, JPG до 10MB
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="space-y-3">
          <Button
            type="submit"
            className="w-full bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700"
          >
            Отправить на модерацию
          </Button>
          <p className="text-xs text-center text-neutral-500 dark:text-neutral-400">
            Ваша заявка будет проверена в течение 24 часов
          </p>
        </div>
      </form>
    </div>
  );
}
