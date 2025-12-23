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
} from "../api/types";
import axios from 'axios';

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { internalApi, moderationApi } from "../api";

type AddCoffeeShopProps = {
  onBack: () => void;
};

type DictionaryItem = { id: string; name: string };

export function AddCoffeeShop({ onBack }: AddCoffeeShopProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

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
      const requestData: SendCoffeeShopToModerationRequest = {
        name: name,
        notValidatedAddress: address,
        description: description,
        priceRange: 1,
        cityId: "39f0b293-ac83-491a-9ef1-8ba060c935d9",
        coffeeBeanIds: selectedBeanIds,
        roasterIds: selectedRoasterIds,
        brewMethodIds: selectedMethodIds,
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
    <div className="p-4 pb-20 max-w-2xl mx-auto">
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
                <MapPin className="absolute left-3 top-3 size-4 text-neutral-400" />
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
            <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center cursor-pointer hover:bg-neutral-50">
              <Upload className="text-neutral-400 mb-2" />
              <span className="text-sm text-neutral-500">Загрузить фото</span>
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
