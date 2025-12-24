import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Edit2, Save, MapPin, Coffee, Users } from 'lucide-react';
import { moderationApi, internalApi } from '../api';
import type { ModerationShopDto, ModerationStatus, PriceRange, CityDto, EquipmentDto, RoasterDto, BrewMethodDto, BeansDto } from '../api/types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

type ModeratorPanelProps = {
  onBack: () => void;
};

export function ModeratorPanel({ onBack }: ModeratorPanelProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ModerationShopDto[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ModerationShopDto | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ModerationShopDto | null>(null);
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Approved'>('Pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Загружаем справочники для редактирования
  const { data: citiesResponse } = useQuery({
    queryKey: ['cities'],
    queryFn: () => internalApi.getCities(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: equipmentsResponse } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => internalApi.getEquipments(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: roastersResponse } = useQuery({
    queryKey: ['roasters'],
    queryFn: () => internalApi.getRoasters(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: brewMethodsResponse } = useQuery({
    queryKey: ['brewMethods'],
    queryFn: () => internalApi.getBrewMethods(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: beansResponse } = useQuery({
    queryKey: ['beans'],
    queryFn: () => internalApi.getBeans(),
    staleTime: 10 * 60 * 1000,
  });

  const cities: CityDto[] = citiesResponse?.data?.cities ?? [];
  const equipments: EquipmentDto[] = equipmentsResponse?.data?.equipments ?? [];
  const roasters: RoasterDto[] = roastersResponse?.data?.roasters ?? [];
  const brewMethods: BrewMethodDto[] = brewMethodsResponse?.data?.brewMethods ?? [];
  const beans = beansResponse?.data?.beans ?? [];

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Use getAllModerationShops for admins, getCoffeeShopsInModeration for regular moderators
        const response = await moderationApi.getAllModerationShops();
        
        if (response.isSuccess && response.data?.moderationShop) {
          setSubmissions(response.data.moderationShop);
        } else {
          setError(response.message || 'Не удалось загрузить заявки');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmissions();
  }, []);

  const handleSelectSubmission = (submission: ModerationShopDto) => {
    setSelectedSubmission(submission);
    setEditedData(submission);
    setIsEditing(false);
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    
    try {
      setIsSaving(true);
      await moderationApi.updateModerationStatus(selectedSubmission.id, 'Approved');
      
      const updated = submissions.map(s => 
        s.id === selectedSubmission.id ? { ...s, moderationStatus: 'Approved' as ModerationStatus } : s
      );
      setSubmissions(updated);
      setSelectedSubmission({ ...selectedSubmission, moderationStatus: 'Approved' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при одобрении');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!editedData) return;
    
    try {
      setIsSaving(true);
      await moderationApi.updateModerationCoffeeShop({
        id: editedData.id,
        name: editedData.name,
        notValidatedAddress: editedData.notValidatedAddress || undefined,
        description: editedData.description || undefined,
        priceRange: editedData.priceRange || undefined,
        cityId: editedData.cityId || undefined,
        shopContact: editedData.shopContact || undefined,
        shopPhotos: editedData.shopPhotos || undefined,
        schedules: editedData.schedules || undefined,
        equipmentIds: editedData.equipmentIds || undefined,
        coffeeBeanIds: editedData.coffeeBeanIds || undefined,
        roasterIds: editedData.roasterIds || undefined,
        brewMethodIds: editedData.brewMethodIds || undefined,
      });
      
      const updated = submissions.map(s => 
        s.id === editedData.id ? editedData : s
      );
      setSubmissions(updated);
      setSelectedSubmission(editedData);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleArrayItem = (id: string, array: string[] | undefined, setter: (ids: string[] | undefined) => void) => {
    const current = array || [];
    if (current.includes(id)) {
      setter(current.filter(i => i !== id).length > 0 ? current.filter(i => i !== id) : undefined);
    } else {
      setter([...current, id]);
    }
  };

  const filteredSubmissions = submissions.filter(s => 
    filter === 'all' ? true : s.moderationStatus === filter
  );

  const pendingCount = submissions.filter(s => s.moderationStatus === 'Pending').length;

  if (selectedSubmission) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSubmission(null)}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              Назад
            </Button>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit2 className="size-4" />
                Редактировать
              </Button>
            )}
            {isEditing && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveEdits}
                className="gap-2"
                disabled={isSaving}
              >
                <Save className="size-4" />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <Alert className="mb-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30">
              <AlertDescription className="text-sm text-red-700 dark:text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge 
              variant={
                selectedSubmission.moderationStatus === 'Approved' ? 'default' : 
                'secondary'
              }
            >
              {selectedSubmission.moderationStatus === 'Pending' && 'На рассмотрении'}
              {selectedSubmission.moderationStatus === 'Approved' && 'Одобрено'}
            </Badge>
          </div>

          {/* Main Image */}
          {!isEditing ? (
            <img
              src={selectedSubmission.shopPhotos && selectedSubmission.shopPhotos.length > 0 
                ? selectedSubmission.shopPhotos[0] 
                : 'https://via.placeholder.com/400'}
              alt={selectedSubmission.name}
              className="w-full h-48 object-cover rounded-xl"
            />
          ) : (
            <div>
              <Label htmlFor="photos">Фотографии (URL через запятую)</Label>
              <Textarea
                id="photos"
                value={editedData?.shopPhotos?.join(', ') || ''}
                onChange={(e) => setEditedData(editedData ? { 
                  ...editedData, 
                  shopPhotos: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                } : null)}
                className="mt-1"
                rows={3}
              />
            </div>
          )}

          {/* Editable Form */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Основное</TabsTrigger>
              <TabsTrigger value="coffee">Кофе</TabsTrigger>
              <TabsTrigger value="equipment">Оборудование</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="name">Название</Label>
                {!isEditing ? (
                  <p className="mt-1">{selectedSubmission.name}</p>
                ) : (
                  <Input
                    id="name"
                    value={editedData?.name || ''}
                    onChange={(e) => setEditedData(editedData ? { ...editedData, name: e.target.value } : null)}
                    className="mt-1"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="description">Описание</Label>
                {!isEditing ? (
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {selectedSubmission.description || 'Не указано'}
                  </p>
                ) : (
                  <Textarea
                    id="description"
                    value={editedData?.description || ''}
                    onChange={(e) => setEditedData(editedData ? { ...editedData, description: e.target.value } : null)}
                    className="mt-1"
                    rows={4}
                  />
                )}
              </div>

              <div>
                <Label htmlFor="address">Адрес</Label>
                {!isEditing ? (
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <MapPin className="size-4 text-neutral-500" />
                    {selectedSubmission.notValidatedAddress || 'Не указано'}
                  </div>
                ) : (
                  <Input
                    id="address"
                    value={editedData?.notValidatedAddress || ''}
                    onChange={(e) => setEditedData(editedData ? { 
                      ...editedData, 
                      notValidatedAddress: e.target.value
                    } : null)}
                    className="mt-1"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="city">Город</Label>
                {!isEditing ? (
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {cities.find(c => c.id === selectedSubmission.cityId)?.name || 'Не указано'}
                  </p>
                ) : (
                  <Select
                    value={editedData?.cityId || '__none__'}
                    onValueChange={(value) => setEditedData(editedData ? { 
                      ...editedData, 
                      cityId: value === '__none__' ? undefined : value
                    } : null)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Выберите город" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Не указано</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label htmlFor="priceRange">Ценовой диапазон</Label>
                {!isEditing ? (
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {selectedSubmission.priceRange ? '₽'.repeat(selectedSubmission.priceRange) : 'Не указано'}
                  </p>
                ) : (
                  <Select
                    value={editedData?.priceRange?.toString() || '__none__'}
                    onValueChange={(value) => setEditedData(editedData ? { 
                      ...editedData, 
                      priceRange: value === '__none__' ? undefined : (parseInt(value) as PriceRange)
                    } : null)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Выберите ценовой диапазон" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Не указано</SelectItem>
                      <SelectItem value="1">₽</SelectItem>
                      <SelectItem value="2">₽₽</SelectItem>
                      <SelectItem value="3">₽₽₽</SelectItem>
                      <SelectItem value="4">₽₽₽₽</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label>Контакты</Label>
                {!isEditing ? (
                  <div className="mt-1 text-sm space-y-1">
                    {selectedSubmission.shopContact?.phone ? (
                      <div>Телефон: {selectedSubmission.shopContact.phone}</div>
                    ) : null}
                    {selectedSubmission.shopContact?.website ? (
                      <div>Сайт: {selectedSubmission.shopContact.website}</div>
                    ) : null}
                    {selectedSubmission.shopContact?.instagram ? (
                      <div>Instagram: {selectedSubmission.shopContact.instagram}</div>
                    ) : null}
                    {!selectedSubmission.shopContact && <div className="text-neutral-500">Не указано</div>}
                  </div>
                ) : (
                  <div className="mt-1 space-y-2">
                    <Input
                      placeholder="Телефон"
                      value={editedData?.shopContact?.phone || ''}
                      onChange={(e) => setEditedData(editedData ? { 
                        ...editedData, 
                        shopContact: { 
                          ...(editedData.shopContact || {}), 
                          phone: e.target.value || undefined
                        }
                      } : null)}
                    />
                    <Input
                      placeholder="Сайт"
                      value={editedData?.shopContact?.website || ''}
                      onChange={(e) => setEditedData(editedData ? { 
                        ...editedData, 
                        shopContact: { 
                          ...(editedData.shopContact || {}), 
                          website: e.target.value || undefined
                        }
                      } : null)}
                    />
                    <Input
                      placeholder="Instagram"
                      value={editedData?.shopContact?.instagram || ''}
                      onChange={(e) => setEditedData(editedData ? { 
                        ...editedData, 
                        shopContact: { 
                          ...(editedData.shopContact || {}), 
                          instagram: e.target.value || undefined
                        }
                      } : null)}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="coffee" className="space-y-4">
              <div>
                <Label>Зерно</Label>
                {!isEditing ? (
                  <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {selectedSubmission.coffeeBeanIds && selectedSubmission.coffeeBeanIds.length > 0
                      ? beans.filter(b => selectedSubmission.coffeeBeanIds?.includes(b.id || '')).map(b => b.name).join(', ')
                      : 'Не указано'}
                  </div>
                ) : (
                  <div className="mt-1 space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                    {beans.map((bean) => {
                      const checked = editedData?.coffeeBeanIds?.includes(bean.id || '') || false;
                      return (
                        <div key={bean.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleArrayItem(
                              bean.id || '',
                              editedData?.coffeeBeanIds,
                              (ids) => setEditedData(editedData ? { ...editedData, coffeeBeanIds: ids } : null)
                            )}
                          />
                          <Label className="text-sm">{bean.name}</Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <Label>Обжарщики</Label>
                {!isEditing ? (
                  <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {selectedSubmission.roasterIds && selectedSubmission.roasterIds.length > 0
                      ? roasters.filter(r => selectedSubmission.roasterIds?.includes(r.id || '')).map(r => r.name).join(', ')
                      : 'Не указано'}
                  </div>
                ) : (
                  <div className="mt-1 space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                    {roasters.map((roaster) => {
                      const checked = editedData?.roasterIds?.includes(roaster.id || '') || false;
                      return (
                        <div key={roaster.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleArrayItem(
                              roaster.id || '',
                              editedData?.roasterIds,
                              (ids) => setEditedData(editedData ? { ...editedData, roasterIds: ids } : null)
                            )}
                          />
                          <Label className="text-sm">{roaster.name}</Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <Label>Способы приготовления</Label>
                {!isEditing ? (
                  <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {selectedSubmission.brewMethodIds && selectedSubmission.brewMethodIds.length > 0
                      ? brewMethods.filter(b => selectedSubmission.brewMethodIds?.includes(b.id || '')).map(b => b.name).join(', ')
                      : 'Не указано'}
                  </div>
                ) : (
                  <div className="mt-1 space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                    {brewMethods.map((method) => {
                      const checked = editedData?.brewMethodIds?.includes(method.id || '') || false;
                      return (
                        <div key={method.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleArrayItem(
                              method.id || '',
                              editedData?.brewMethodIds,
                              (ids) => setEditedData(editedData ? { ...editedData, brewMethodIds: ids } : null)
                            )}
                          />
                          <Label className="text-sm">{method.name}</Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="equipment" className="space-y-4">
              <div>
                <Label>Оборудование</Label>
                {!isEditing ? (
                  <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {selectedSubmission.equipmentIds && selectedSubmission.equipmentIds.length > 0
                      ? equipments.filter(e => selectedSubmission.equipmentIds?.includes(e.id || '')).map(e => e.name).join(', ')
                      : 'Не указано'}
                  </div>
                ) : (
                  <div className="mt-1 space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
                    {equipments.map((equipment) => {
                      const checked = editedData?.equipmentIds?.includes(equipment.id || '') || false;
                      return (
                        <div key={equipment.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleArrayItem(
                              equipment.id || '',
                              editedData?.equipmentIds,
                              (ids) => setEditedData(editedData ? { ...editedData, equipmentIds: ids } : null)
                            )}
                          />
                          <Label className="text-sm">{equipment.name}</Label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          {selectedSubmission.moderationStatus === 'Pending' && (
            <div className="pt-4">
              <Button
                className="w-full gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                onClick={handleApprove}
                disabled={isSaving}
              >
                <CheckCircle className="size-4" />
                {isSaving ? 'Сохранение...' : 'Одобрить'}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Назад
          </Button>
          <div className="flex items-center gap-2">
            <Users className="size-5 text-amber-700 dark:text-amber-500" />
            <h2 className="text-amber-900 dark:text-amber-500">Модерация</h2>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Stats */}
      <div className="p-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">На рассмотрении</p>
              <p className="text-2xl">{pendingCount}</p>
            </div>
            <div className="size-12 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
              <Coffee className="size-6 text-amber-700 dark:text-amber-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto">
          <Button
            variant={filter === 'Pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('Pending')}
          >
            На рассмотрении
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Все
          </Button>
          <Button
            variant={filter === 'Approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('Approved')}
          >
            Одобренные
          </Button>
        </div>
      </div>

      {/* Submissions List */}
      <div className="px-4 space-y-4 pb-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-neutral-500 dark:text-neutral-400">Загрузка...</p>
          </div>
        ) : error ? (
          <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30">
            <AlertDescription className="text-sm text-red-700 dark:text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <Coffee className="size-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">Нет заявок</p>
          </div>
        ) : (
          filteredSubmissions.map((submission) => (
            <Card
              key={submission.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleSelectSubmission(submission)}
            >
              <div className="flex gap-4">
                <img
                  src={submission.shopPhotos && submission.shopPhotos.length > 0 
                    ? submission.shopPhotos[0] 
                    : 'https://via.placeholder.com/400'}
                  alt={submission.name}
                  className="w-24 h-24 object-cover"
                />
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="truncate">{submission.name}</h3>
                    <Badge 
                      variant={
                        submission.moderationStatus === 'Approved' ? 'default' : 
                        'secondary'
                      }
                      className="shrink-0 text-xs"
                    >
                      {submission.moderationStatus === 'Pending' && 'Новое'}
                      {submission.moderationStatus === 'Approved' && 'Одобрено'}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2 mb-2">
                    {submission.notValidatedAddress}
                  </p>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    Статус: {submission.status}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
