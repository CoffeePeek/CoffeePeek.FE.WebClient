import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Coffee,
  Clock,
  Upload,
  Plus,
  X,
} from "lucide-react";
import type {
  SendCoffeeShopToModerationRequest,
  ScheduleDto,
} from "../api/types";
import axios from 'axios';

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { internalApi, moderationApi } from "../api";
import type { PriceRange } from "../api/types";

type AddCoffeeShopProps = {
  onBack: () => void;
};

type DictionaryItem = { id: string; name: string };

export function AddCoffeeShop({ onBack }: AddCoffeeShopProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [priceRange, setPriceRange] = useState<PriceRange | undefined>(undefined);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [siteLink, setSiteLink] = useState("");
  const [instagramLink, setInstagramLink] = useState("");
  const [schedules, setSchedules] = useState<ScheduleDto[]>([]);

  // Справочники хранят объекты целиком
  const [availableBeans, setAvailableBeans] = useState<DictionaryItem[]>([]);
  const [availableRoasters, setAvailableRoasters] = useState<DictionaryItem[]>(
    []
  );
  const [brewMethods, setBrewMethods] = useState<DictionaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Выбранные элементы хранят только ID (Guid)
  const [selectedBeanIds, setSelectedBeanIds] = useState<string[]>([]);
  const [selectedRoasterIds, setSelectedRoasterIds] = useState<string[]>([]);
  const [selectedMethodIds, setSelectedMethodIds] = useState<string[]>([]);

  type PhotoFile = { file: File; preview: string };
  const [photos, setPhotos] = useState<PhotoFile[]>([]);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setIsLoading(true);
        const [beansRes, roastersRes, methodsRes] = await Promise.all([
          internalApi.getBeans(),
          internalApi.getRoasters(),
          internalApi.getBrewMethods(),
        ]);
        // Сохраняем массивы объектов [{id, name}, ...]
        setAvailableBeans(beansRes.data.beans || []);
        setAvailableRoasters(roastersRes.data.roasters || []);
        setBrewMethods(methodsRes.data.brewMethods || []);
      } catch (error) {
        console.error("Failed to load form data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFormData();
  }, []);

  const toggleItem = (
    id: string,
    currentIds: string[],
    setIds: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      const newArr = [...prev];
      URL.revokeObjectURL(newArr[index].preview);
      newArr.splice(index, 1);
      return newArr;
    });
  };

  const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const dayNamesShort = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  // Применить общее время ко всем дням
  const applyToAllDays = (openingTime: string, closingTime: string) => {
    const allDays = Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      openingTime,
      closingTime,
    }));
    setSchedules(allDays);
  };

  const updateSchedule = (dayOfWeek: number, field: 'openingTime' | 'closingTime', value: string | null) => {
    setSchedules((prev) => {
      const existingIndex = prev.findIndex((s) => s.dayOfWeek === dayOfWeek);
      if (existingIndex >= 0) {
        const newSchedules = [...prev];
        newSchedules[existingIndex] = { ...newSchedules[existingIndex], [field]: value };
        return newSchedules;
      } else {
        return [...prev, { 
          dayOfWeek, 
          openingTime: field === 'openingTime' ? value : null, 
          closingTime: field === 'closingTime' ? value : null 
        }];
      }
    });
  };

  const toggleDayClosed = (dayOfWeek: number) => {
    setSchedules((prev) => {
      const existingIndex = prev.findIndex((s) => s.dayOfWeek === dayOfWeek);
      if (existingIndex >= 0) {
        const newSchedules = [...prev];
        newSchedules[existingIndex] = {
          ...newSchedules[existingIndex],
          openingTime: null,
          closingTime: null,
        };
        return newSchedules;
      }
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const requests = photos.map(p => ({
        fileName: p.file.name,
        contentType: p.file.type
      }));
      const uploadConfigs = await moderationApi.generateUploadUrls(requests);

      // --- ШАГ 2: Загружаем файлы напрямую в S3/MinIO ---
      const uploadTasks = photos.map((p, index) => {
        const config = uploadConfigs[index];

        return axios.put(config.uploadUrl, p.file, {
          headers: {
            "Content-Type": p.file.type,
            "x-amz-tagging": "is_permanent=false" // Наше правило для жизненного цикла
          }
        });
      });

      await Promise.all(uploadTasks);

      // --- ШАГ 3: Отправляем финальную команду на бэкенд ---
      const shopContact = (phoneNumber || email || siteLink || instagramLink) ? {
        phoneNumber: phoneNumber || undefined,
        email: email || undefined,
        siteLink: siteLink || undefined,
        instagramLink: instagramLink || undefined,
      } : undefined;

      const requestData: SendCoffeeShopToModerationRequest = {
        name: name,
        notValidatedAddress: address,
        description: description,
        priceRange: priceRange || undefined,
        cityId: "39f0b293-ac83-491a-9ef1-8ba060c935d9",
        coffeeBeanIds: selectedBeanIds,
        roasterIds: selectedRoasterIds,
        brewMethodIds: selectedMethodIds,
        shopContact: shopContact || undefined,
        schedules: schedules.length > 0 ? schedules
          .filter(s => s.openingTime && s.closingTime && s.dayOfWeek !== null && s.dayOfWeek !== undefined) // Только дни с указанным временем
          .map(s => ({
            dayOfWeek: s.dayOfWeek!,
            openingTime: `${s.openingTime}:00`,
            closingTime: `${s.closingTime}:00`,
            intervals: [], // Пустой массив вместо null, так как бэкенд ожидает IEnumerable
          })) : null,
        shopPhotos: photos.map((p, index) => ({
          fileName: p.file.name,
          contentType: p.file.type,
          storageKey: uploadConfigs[index].storageKey,
          size: p.file.size
        }))
      };

      await moderationApi.sendCoffeeShopToModeration(requestData);

      alert("Кофейня успешно отправлена на модерацию!");
      onBack();
    } catch (error: any) {
      console.error("Submission failed:", error);
      alert("Ошибка при сохранении. Проверьте консоль.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-8 text-center animate-pulse">Загрузка данных...</div>
    );

  return (
    <div className="p-4 pb-20 lg:pb-4 max-w-md lg:max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-neutral-100 rounded-full"
        >
          <ArrowLeft />
        </button>
        <h1 className="text-xl font-bold">Добавить кофейню</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Адрес *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
                <Input
                  className="pl-10"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Описание *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ценовой диапазон</Label>
              <Select
                value={priceRange?.toString() || '__none__'}
                onValueChange={(value) => setPriceRange(value === '__none__' ? undefined : (parseInt(value) as PriceRange))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите ценовой диапазон">
                    {priceRange ? (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: priceRange }).map((_, i) => (
                          <Coffee key={i} className="size-4 text-amber-700 dark:text-amber-500" />
                        ))}
                      </div>
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Не указано</SelectItem>
                  <SelectItem value="1">
                    <div className="flex items-center gap-1">
                      <Coffee className="size-4 text-amber-700 dark:text-amber-500" />
                    </div>
                  </SelectItem>
                  <SelectItem value="2">
                    <div className="flex items-center gap-1">
                      <Coffee className="size-4 text-amber-700 dark:text-amber-500" />
                      <Coffee className="size-4 text-amber-700 dark:text-amber-500" />
                    </div>
                  </SelectItem>
                  <SelectItem value="3">
                    <div className="flex items-center gap-1">
                      <Coffee className="size-4 text-amber-700 dark:text-amber-500" />
                      <Coffee className="size-4 text-amber-700 dark:text-amber-500" />
                      <Coffee className="size-4 text-amber-700 dark:text-amber-500" />
                    </div>
                  </SelectItem>
                  <SelectItem value="4">
                    <div className="flex items-center gap-1">
                      <Coffee className="size-4 text-amber-700 dark:text-amber-500" />
                      <Coffee className="size-4 text-amber-700 dark:text-amber-500" />
                      <Coffee className="size-4 text-amber-700 dark:text-amber-500" />
                      <Coffee className="size-4 text-amber-700 dark:text-amber-500" />
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Контакты</Label>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="phone" className="text-sm text-neutral-600 dark:text-neutral-400">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+375 (29) 123-45-67"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm text-neutral-600 dark:text-neutral-400">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="coffee@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="site" className="text-sm text-neutral-600 dark:text-neutral-400">Сайт</Label>
                  <Input
                    id="site"
                    type="url"
                    value={siteLink}
                    onChange={(e) => setSiteLink(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram" className="text-sm text-neutral-600 dark:text-neutral-400">Instagram</Label>
                  <Input
                    id="instagram"
                    type="text"
                    value={instagramLink}
                    onChange={(e) => setInstagramLink(e.target.value)}
                    placeholder="@coffeeshop"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Секция Расписание */}
        <Card>
          <CardContent className="p-4">
            <Label className="font-semibold mb-4 block">Расписание</Label>
            
            {/* Быстрое применение ко всем дням */}
            <div className="mb-6 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <Label className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 block">
                Применить ко всем дням
              </Label>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs text-neutral-500 dark:text-neutral-400">Открытие</Label>
                  <Input
                    type="time"
                    id="common-opening"
                    className="mt-1"
                    defaultValue="09:00"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-neutral-500 dark:text-neutral-400">Закрытие</Label>
                  <Input
                    type="time"
                    id="common-closing"
                    className="mt-1"
                    defaultValue="18:00"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const openingInput = document.getElementById('common-opening') as HTMLInputElement;
                    const closingInput = document.getElementById('common-closing') as HTMLInputElement;
                    if (openingInput?.value && closingInput?.value) {
                      applyToAllDays(openingInput.value, closingInput.value);
                    }
                  }}
                >
                  Применить
                </Button>
              </div>
            </div>

            {/* Индивидуальное расписание по дням */}
            <div className="space-y-2">
              <Label className="text-sm text-neutral-600 dark:text-neutral-400 mb-2 block">
                Индивидуальное расписание
              </Label>
              {dayNames.map((dayName, dayIndex) => {
                const schedule = schedules.find((s) => s.dayOfWeek === dayIndex);
                const isOpen = schedule?.openingTime && schedule?.closingTime;
                return (
                  <div key={dayIndex} className="flex items-center gap-3 p-2 border rounded-lg">
                    <div className="w-24 text-sm font-medium">{dayNamesShort[dayIndex]}</div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        type="time"
                        placeholder="Открытие"
                        value={schedule?.openingTime || ''}
                        onChange={(e) => updateSchedule(dayIndex, 'openingTime', e.target.value || null)}
                        className="text-sm"
                      />
                      <Input
                        type="time"
                        placeholder="Закрытие"
                        value={schedule?.closingTime || ''}
                        onChange={(e) => updateSchedule(dayIndex, 'closingTime', e.target.value || null)}
                        className="text-sm"
                      />
                    </div>
                    {isOpen && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDayClosed(dayIndex)}
                        className="text-red-600 hover:text-red-700 text-xs"
                      >
                        Закрыть
                      </Button>
                    )}
                    {!isOpen && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 min-w-[60px] text-right">Закрыто</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Секция Зерна */}
        <Card>
          <CardContent className="p-4">
            <Label className="mb-3 block font-semibold">
              Используемое зерно
            </Label>
            <div className="flex flex-wrap gap-2 mb-4">
              {availableBeans.map((bean) => (
                <Badge
                  key={bean.id}
                  variant={
                    selectedBeanIds.includes(bean.id) ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() =>
                    toggleItem(bean.id, selectedBeanIds, setSelectedBeanIds)
                  }
                >
                  {bean.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Секция Обжарщиков */}
        <Card>
          <CardContent className="p-4">
            <Label className="mb-3 block font-semibold">Обжарщики</Label>
            <div className="flex flex-wrap gap-2 mb-4">
              {availableRoasters.map((r) => (
                <Badge
                  key={r.id}
                  variant={
                    selectedRoasterIds.includes(r.id) ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() =>
                    toggleItem(r.id, selectedRoasterIds, setSelectedRoasterIds)
                  }
                >
                  {r.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Секция Методов */}
        <Card>
          <CardContent className="p-4">
            <Label className="mb-3 block font-semibold">
              Методы заваривания
            </Label>
            <div className="flex flex-wrap gap-2">
              {brewMethods.map((m) => (
                <Badge
                  key={m.id}
                  variant={
                    selectedMethodIds.includes(m.id) ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() =>
                    toggleItem(m.id, selectedMethodIds, setSelectedMethodIds)
                  }
                >
                  {m.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Label className="mb-3 block font-semibold">Фотографии</Label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {photos.map((p, i) => (
                <div
                  key={i}
                  className="relative aspect-square border rounded-lg overflow-hidden"
                >
                  <img
                    src={p.preview}
                    className="object-cover w-full h-full"
                    alt=""
                  />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
            <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors min-h-[120px] w-full">
              <Upload className="text-neutral-400 mb-2" />
              <span className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                {photos.length > 0 ? (
                  <div className="flex flex-col items-center gap-1">
                    <span>Загружено файлов: {photos.length}</span>
                    <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-full">
                      {photos.map((p, i) => (
                        <span
                          key={i}
                          className="text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded truncate max-w-[200px]"
                          title={p.file.name}
                        >
                          {p.file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  'Загрузить фото'
                )}
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full bg-amber-700 hover:bg-amber-800 text-white py-6"
          disabled={isLoading}
        >
          {isLoading ? "Отправка..." : "Отправить на модерацию"}
        </Button>
      </form>
    </div>
  );
}
