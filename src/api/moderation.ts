import { apiClient } from "./client";
import type {
  GetCoffeeShopsInModerationResponse,
  SendCoffeeShopToModerationRequest,
  SendCoffeeShopToModerationResponse,
  UpdateModerationCoffeeShopResponse,
  BaseResponse,
  ModerationStatus,
  BaseApiResponse,
  UploadUrlResponse,
  UploadUrlRequest,
} from "./types";

export const moderationApi = {
  // GET /api/Moderation - получить все кофейни для модерации (требует роль Admin)
  getAllModerationShops:
    async (): Promise<GetCoffeeShopsInModerationResponse> => {
      return apiClient.get<GetCoffeeShopsInModerationResponse>(
        "/api/Moderation"
      );
    },

  // POST /api/Moderation - отправить кофейню на модерацию
  sendCoffeeShopToModeration: async (
    data: SendCoffeeShopToModerationRequest
  ): Promise<SendCoffeeShopToModerationResponse> => {
    return await apiClient.post<SendCoffeeShopToModerationResponse>(
      "/api/Moderation",
      data
    );
  },

  // PUT /api/Moderation - обновить кофейню в модерации (использует [FromForm])
  updateModerationCoffeeShop: async (
    data: any
  ): Promise<UpdateModerationCoffeeShopResponse> => {
    // According to the API spec, this endpoint uses multipart/form-data
    const formData = new FormData();

    if (data.id !== undefined) formData.append("id", String(data.id));
    if (data.name) formData.append("name", data.name);
    if (data.notValidatedAddress !== undefined && data.notValidatedAddress !== null)
      formData.append("notValidatedAddress", data.notValidatedAddress);
    if (data.description !== undefined && data.description !== null)
      formData.append("description", data.description);
    if (data.priceRange !== undefined && data.priceRange !== null)
      formData.append("priceRange", String(data.priceRange));
    if (data.cityId !== undefined && data.cityId !== null)
      formData.append("cityId", data.cityId);

    if (data.shopContact) {
      if (data.shopContact.phone !== undefined)
        formData.append("shopContact.phone", data.shopContact.phone || '');
      if (data.shopContact.website !== undefined)
        formData.append("shopContact.website", data.shopContact.website || '');
      if (data.shopContact.instagram !== undefined)
        formData.append("shopContact.instagram", data.shopContact.instagram || '');
    }

    if (data.shopPhotos && Array.isArray(data.shopPhotos)) {
      data.shopPhotos.forEach((photo: string, index: number) => {
        formData.append(`shopPhotos[${index}]`, photo);
      });
    }

    if (data.schedules && Array.isArray(data.schedules)) {
      formData.append("schedules", JSON.stringify(data.schedules));
    }

    // Массивы Guid отправляем как отдельные параметры с одинаковым именем
    if (data.equipmentIds && Array.isArray(data.equipmentIds)) {
      data.equipmentIds.forEach((id: string) => {
        formData.append("equipmentIds", id);
      });
    }

    if (data.coffeeBeanIds && Array.isArray(data.coffeeBeanIds)) {
      data.coffeeBeanIds.forEach((id: string) => {
        formData.append("coffeeBeanIds", id);
      });
    }

    if (data.roasterIds && Array.isArray(data.roasterIds)) {
      data.roasterIds.forEach((id: string) => {
        formData.append("roasterIds", id);
      });
    }

    if (data.brewMethodIds && Array.isArray(data.brewMethodIds)) {
      data.brewMethodIds.forEach((id: string) => {
        formData.append("brewMethodIds", id);
      });
    }

    // Используем PUT с FormData, так как бэкенд ожидает PUT [FromForm]
    const apiClientWithPutFormData = apiClient as typeof apiClient & {
      putFormData: <T>(endpoint: string, formData: FormData) => Promise<T & { headers?: any }>;
    };
    return apiClientWithPutFormData.putFormData<UpdateModerationCoffeeShopResponse>(
      "/api/Moderation",
      formData
    );
  },

  // PUT /api/Moderation/status - обновить статус модерации (требует роль Admin)
  updateModerationStatus: async (
    id: string | number,
    status: ModerationStatus
  ): Promise<BaseResponse> => {
    return apiClient.put<BaseResponse>(
      `/api/Moderation/status?id=${encodeURIComponent(
        String(id)
      )}&status=${encodeURIComponent(status)}`
    );
  },

  // POST /api/Moderation/upload-urls - получить URL для загрузки фото
  generateUploadUrls: async (
    requests: UploadUrlRequest[]
  ): Promise<UploadUrlResponse[]> => {
    const response = await apiClient.post<BaseApiResponse<UploadUrlResponse[]>>(
      `/api/Moderation/upload-urls`,
      requests
    );
    return response.data;
  },
};
