import React, { useState, useEffect } from 'react';
import { getModerationShops, updateModerationStatus, ModerationShop, UpdateModerationShopRequest, updateModerationShop } from '../api/moderation';
import Button from './Button';
import { useUser } from '../contexts/UserContext';

const ModeratorPanel: React.FC = () => {
  const { user } = useUser();
  const [shops, setShops] = useState<ModerationShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<ModerationShop | null>(null);
  const [editingShop, setEditingShop] = useState<ModerationShop | null>(null);
  const [editForm, setEditForm] = useState<Partial<ModerationShop>>({});

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Не авторизован');
      }

      const response = await getModerationShops(token);
      // API может возвращать данные в разных форматах
      let shopsData: any = response.data;
      
      // Проверяем, есть ли вложенный объект moderationShop
      if (shopsData && typeof shopsData === 'object' && shopsData.moderationShop) {
        shopsData = shopsData.moderationShop;
      }
      
      if (Array.isArray(shopsData)) {
        setShops(shopsData as ModerationShop[]);
      } else {
        setShops([]);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке кофеен');
      console.error('Error loading moderation shops:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (shopId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Не авторизован');
      }

      await updateModerationStatus(token, shopId, 'Approved');
      await loadShops();
    } catch (err: any) {
      setError(err.message || 'Ошибка при одобрении');
      console.error('Error approving shop:', err);
    }
  };

  const handleReject = async (shopId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Не авторизован');
      }

      await updateModerationStatus(token, shopId, 'Rejected');
      await loadShops();
    } catch (err: any) {
      setError(err.message || 'Ошибка при отклонении');
      console.error('Error rejecting shop:', err);
    }
  };

  const startEditing = (shop: ModerationShop) => {
    setEditingShop(shop);
    setEditForm({
      id: shop.id,
      name: shop.name,
      notValidatedAddress: shop.notValidatedAddress,
      description: shop.description,
      priceRange: shop.priceRange,
      cityId: shop.cityId,
      shopContact: shop.shopContact,
    });
  };

  const cancelEditing = () => {
    setEditingShop(null);
    setEditForm({});
  };

  const saveEditedShop = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Не авторизован');
      }

      // Prepare the update request object
      const updateRequest: UpdateModerationShopRequest = {
        id: editForm.id!,
        name: editForm.name,
        notValidatedAddress: editForm.notValidatedAddress,
        description: editForm.description,
        priceRange: editForm.priceRange,
        cityId: editForm.cityId,
        shopContact: editForm.shopContact,
      };

      await updateModerationShop(token, updateRequest);
      setEditingShop(null);
      setEditForm({});
      await loadShops(); // Reload the shops to get updated data
      setSelectedShop(null); // Reset selection to show updated data
    } catch (err: any) {
      setError(err.message || 'Ошибка при сохранении изменений');
      console.error('Error saving edited shop:', err);
    }
  };

  const handleEditFormChange = (field: keyof ModerationShop, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1412]">
        <div className="text-[#EAB308] text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1412] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Панель модератора</h1>
          <p className="text-[#A39E93]">Управление кофейнями на модерации</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Список кофеен */}
          <div className="lg:col-span-2 space-y-4">
            {!Array.isArray(shops) || shops.length === 0 ? (
              <div className="bg-[#2D241F] border border-[#3D2F28] rounded-2xl p-8 text-center">
                <p className="text-[#A39E93]">Нет кофеен на модерации</p>
              </div>
            ) : (
              shops.map((shop) => (
                <div
                  key={shop.id}
                  className={`bg-[#2D241F] border rounded-2xl p-6 cursor-pointer transition-all ${
                    selectedShop?.id === shop.id
                      ? 'border-[#EAB308] shadow-lg shadow-[#EAB308]/10'
                      : 'border-[#3D2F28] hover:border-[#EAB308]/50'
                  }`}
                  onClick={() => setSelectedShop(shop)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{shop.name}</h3>
                      {shop.notValidatedAddress && (
                        <p className="text-[#A39E93] text-sm mb-2">{shop.notValidatedAddress}</p>
                      )}
                      <div className="flex gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            shop.moderationStatus === 'Pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : shop.moderationStatus === 'Approved'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {shop.moderationStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {shop.description && (
                    <p className="text-[#A39E93] text-sm mb-4 line-clamp-2">{shop.description}</p>
                  )}

                  <div className="flex gap-2">
                    {shop.moderationStatus === 'Pending' && (
                      <>
                        <Button
                          variant="primary"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(shop);
                          }}
                        >
                          Редактировать
                        </Button>
                        <Button
                          variant="primary"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(shop.id);
                          }}
                        >
                          Одобрить
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(shop.id);
                          }}
                        >
                          Отклонить
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Детали выбранной кофейни */}
          {selectedShop && (
            <div className="lg:col-span-1">
              <div className="bg-[#2D241F] border border-[#3D2F28] rounded-2xl p-6 sticky top-6">
                <h2 className="text-2xl font-bold text-white mb-4">Детали</h2>
                
                <div className="space-y-4">
                  {/* Фотографии кофейни */}
                  {selectedShop.shopPhotos && selectedShop.shopPhotos.length > 0 && (
                    <div className="mb-4">
                      <label className="text-[#A39E93] text-sm">Фотографии</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {selectedShop.shopPhotos.map((photo, index) => (
                          <div key={index} className="aspect-square bg-[#1A1412] rounded-xl overflow-hidden">
                            <img
                              src={photo}
                              alt={`Фото кофейни ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[#A39E93] text-sm">Название</label>
                    <p className="text-white">{selectedShop.name}</p>
                  </div>

                  {selectedShop.notValidatedAddress && (
                    <div>
                      <label className="text-[#A39E93] text-sm">Адрес</label>
                      <p className="text-white">{selectedShop.notValidatedAddress}</p>
                    </div>
                  )}

                  {selectedShop.description && (
                    <div>
                      <label className="text-[#A39E93] text-sm">Описание</label>
                      <p className="text-white">{selectedShop.description}</p>
                    </div>
                  )}

                  {selectedShop.priceRange && (
                    <div>
                      <label className="text-[#A39E93] text-sm">Ценовой диапазон</label>
                      <p className="text-white">{selectedShop.priceRange}</p>
                    </div>
                  )}

                  {selectedShop.cityId && (
                    <div>
                      <label className="text-[#A39E93] text-sm">ID Города</label>
                      <p className="text-white">{selectedShop.cityId}</p>
                    </div>
                  )}

                  {selectedShop.userId && (
                    <div>
                      <label className="text-[#A39E93] text-sm">ID Пользователя</label>
                      <p className="text-white">{selectedShop.userId}</p>
                    </div>
                  )}

                  {selectedShop.moderationStatus && (
                    <div>
                      <label className="text-[#A39E93] text-sm">Статус модерации</label>
                      <p className="text-white">{selectedShop.moderationStatus}</p>
                    </div>
                  )}

                  {selectedShop.status && (
                    <div>
                      <label className="text-[#A39E93] text-sm">Статус</label>
                      <p className="text-white">{selectedShop.status}</p>
                    </div>
                  )}

                  {selectedShop.shopContact && (
                    <div>
                      <label className="text-[#A39E93] text-sm">Контакты</label>
                      <div className="text-white text-sm space-y-1">
                        {selectedShop.shopContact.phone && <p>📞 {selectedShop.shopContact.phone}</p>}
                        {selectedShop.shopContact.email && <p>✉️ {selectedShop.shopContact.email}</p>}
                        {selectedShop.shopContact.website && <p>🌐 {selectedShop.shopContact.website}</p>}
                        {selectedShop.shopContact.instagram && <p>📷 {selectedShop.shopContact.instagram}</p>}
                      </div>
                    </div>
                  )}

                  {selectedShop.schedules && selectedShop.schedules.length > 0 && (
                    <div>
                      <label className="text-[#A39E93] text-sm">График работы</label>
                      <div className="text-white text-sm space-y-1">
                        {selectedShop.schedules.map((schedule, index) => (
                          <p key={index}>
                            День {schedule.dayOfWeek}: {schedule.openTime} - {schedule.closeTime}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedShop.equipmentIds && selectedShop.equipmentIds.length > 0 && (
                    <div>
                      <label className="text-[#A39E93] text-sm">ID Оборудования</label>
                      <p className="text-white">{selectedShop.equipmentIds.join(', ')}</p>
                    </div>
                  )}

                  {selectedShop.coffeeBeanIds && selectedShop.coffeeBeanIds.length > 0 && (
                    <div>
                      <label className="text-[#A39E93] text-sm">ID Кофейных зёрен</label>
                      <p className="text-white">{selectedShop.coffeeBeanIds.join(', ')}</p>
                    </div>
                  )}

                  {selectedShop.roasterIds && selectedShop.roasterIds.length > 0 && (
                    <div>
                      <label className="text-[#A39E93] text-sm">ID Обжарщиков</label>
                      <p className="text-white">{selectedShop.roasterIds.join(', ')}</p>
                    </div>
                  )}

                  {selectedShop.brewMethodIds && selectedShop.brewMethodIds.length > 0 && (
                    <div>
                      <label className="text-[#A39E93] text-sm">ID Методов заваривания</label>
                      <p className="text-white">{selectedShop.brewMethodIds.join(', ')}</p>
                    </div>
                  )}

                  {editingShop && editingShop.id === selectedShop.id ? (
                    // Edit form
                    <div className="pt-4 border-t border-[#3D2F28] space-y-4">
                      <div>
                        <label className="text-[#A39E93] text-sm">Название</label>
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => handleEditFormChange('name', e.target.value)}
                          className="w-full bg-[#1A1412] border border-[#3D2F28] rounded-xl py-2 px-4 text-white mt-1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[#A39E93] text-sm">Адрес</label>
                        <input
                          type="text"
                          value={editForm.notValidatedAddress || ''}
                          onChange={(e) => handleEditFormChange('notValidatedAddress', e.target.value)}
                          className="w-full bg-[#1A1412] border border-[#3D2F28] rounded-xl py-2 px-4 text-white mt-1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[#A39E93] text-sm">Описание</label>
                        <textarea
                          value={editForm.description || ''}
                          onChange={(e) => handleEditFormChange('description', e.target.value)}
                          className="w-full bg-[#1A1412] border border-[#3D2F28] rounded-xl py-2 px-4 text-white mt-1"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="text-[#A39E93] text-sm">Ценовой диапазон</label>
                        <select
                          value={editForm.priceRange || ''}
                          onChange={(e) => handleEditFormChange('priceRange', e.target.value)}
                          className="w-full bg-[#1A1412] border border-[#3D2F28] rounded-xl py-2 px-4 text-white mt-1"
                        >
                          <option value="">Выберите диапазон</option>
                          <option value="Budget">Бюджетный</option>
                          <option value="Moderate">Средний</option>
                          <option value="Premium">Премиум</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="text-[#A39E93] text-sm">ID Города</label>
                        <input
                          type="text"
                          value={editForm.cityId || ''}
                          onChange={(e) => handleEditFormChange('cityId', e.target.value)}
                          className="w-full bg-[#1A1412] border border-[#3D2F28] rounded-xl py-2 px-4 text-white mt-1"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[#A39E93] text-sm">Контакты</label>
                        <div className="space-y-2 mt-1">
                          <input
                            type="text"
                            placeholder="Телефон"
                            value={editForm.shopContact?.phone || ''}
                            onChange={(e) => handleEditFormChange('shopContact', { ...editForm.shopContact, phone: e.target.value })}
                            className="w-full bg-[#1A1412] border border-[#3D2F28] rounded-xl py-2 px-4 text-white"
                          />
                          <input
                            type="text"
                            placeholder="Email"
                            value={editForm.shopContact?.email || ''}
                            onChange={(e) => handleEditFormChange('shopContact', { ...editForm.shopContact, email: e.target.value })}
                            className="w-full bg-[#1A1412] border border-[#3D2F28] rounded-xl py-2 px-4 text-white"
                          />
                          <input
                            type="text"
                            placeholder="Сайт"
                            value={editForm.shopContact?.website || ''}
                            onChange={(e) => handleEditFormChange('shopContact', { ...editForm.shopContact, website: e.target.value })}
                            className="w-full bg-[#1A1412] border border-[#3D2F28] rounded-xl py-2 px-4 text-white"
                          />
                          <input
                            type="text"
                            placeholder="Instagram"
                            value={editForm.shopContact?.instagram || ''}
                            onChange={(e) => handleEditFormChange('shopContact', { ...editForm.shopContact, instagram: e.target.value })}
                            className="w-full bg-[#1A1412] border border-[#3D2F28] rounded-xl py-2 px-4 text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="primary"
                          className="flex-1"
                          onClick={saveEditedShop}
                        >
                          Сохранить
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex-1"
                          onClick={cancelEditing}
                        >
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Action buttons for non-editing mode
                    selectedShop.moderationStatus === 'Pending' && (
                      <div className="pt-4 border-t border-[#3D2F28]">
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            className="flex-1"
                            onClick={() => startEditing(selectedShop)}
                          >
                            Редактировать
                          </Button>
                          <Button
                            variant="primary"
                            className="flex-1"
                            onClick={() => handleApprove(selectedShop.id)}
                          >
                            Одобрить
                          </Button>
                          <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => handleReject(selectedShop.id)}
                          >
                            Отклонить
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModeratorPanel;

