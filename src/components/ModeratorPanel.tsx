import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Edit2, Save, MapPin, Coffee, Users } from 'lucide-react';
import { moderationApi } from '../api';
import type { ModerationShopDto, ModerationStatus } from '../api/types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../contexts/AuthContext';

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
        notValidatedAddress: editedData.notValidatedAddress,
        shopContact: editedData.shopContact || undefined,
        shopPhotos: editedData.shopPhotos,
        schedules: editedData.schedules,
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
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{selectedSubmission.description}</p>
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
                    {selectedSubmission.notValidatedAddress}
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

              {selectedSubmission.shopContact && (
                <div>
                  <Label>Контакты</Label>
                  {!isEditing ? (
                    <div className="mt-1 text-sm space-y-1">
                      {selectedSubmission.shopContact.phone && (
                        <div>Телефон: {selectedSubmission.shopContact.phone}</div>
                      )}
                      {selectedSubmission.shopContact.website && (
                        <div>Сайт: {selectedSubmission.shopContact.website}</div>
                      )}
                      {selectedSubmission.shopContact.instagram && (
                        <div>Instagram: {selectedSubmission.shopContact.instagram}</div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 space-y-2">
                      <Input
                        placeholder="Телефон"
                        value={editedData?.shopContact?.phone || ''}
                        onChange={(e) => setEditedData(editedData ? { 
                          ...editedData, 
                          shopContact: { ...editedData.shopContact, phone: e.target.value }
                        } : null)}
                      />
                      <Input
                        placeholder="Сайт"
                        value={editedData?.shopContact?.website || ''}
                        onChange={(e) => setEditedData(editedData ? { 
                          ...editedData, 
                          shopContact: { ...editedData.shopContact, website: e.target.value }
                        } : null)}
                      />
                      <Input
                        placeholder="Instagram"
                        value={editedData?.shopContact?.instagram || ''}
                        onChange={(e) => setEditedData(editedData ? { 
                          ...editedData, 
                          shopContact: { ...editedData.shopContact, instagram: e.target.value }
                        } : null)}
                      />
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="coffee" className="space-y-4">
              <div className="text-sm text-neutral-500">
                Информация о кофе будет доступна после одобрения кофейни
              </div>
            </TabsContent>

            <TabsContent value="equipment" className="space-y-4">
              <div className="text-sm text-neutral-500">
                Информация об оборудовании будет доступна после одобрения кофейни
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
