import { apiClient } from "./client";
import type {
  GetCoffeeShopsInModerationResponse,
  SendCoffeeShopToModerationRequest,
  SendCoffeeShopToModerationResponse,
  UpdateModerationCoffeeShopRequest,
  UpdateModerationCoffeeShopResponse,
  BaseResponse,
  ModerationStatus,
} from "./types";

export const moderationApi = {
  getCoffeeShopsInModeration:
    async (): Promise<GetCoffeeShopsInModerationResponse> => {
      return apiClient.get<GetCoffeeShopsInModerationResponse>(
        "/api/moderation"
      );
    },

  getAllModerationShops:
    async (): Promise<GetCoffeeShopsInModerationResponse> => {
      return apiClient.get<GetCoffeeShopsInModerationResponse>(
        "/api/moderation/all"
      );
    },

  sendCoffeeShopToModeration: async (
    data: any
  ): Promise<SendCoffeeShopToModerationResponse> => {
    const formData = new FormData();

    formData.append("Name", data.name);
    formData.append("fullAddress", data.FullAddress);
    if (data.description) formData.append("Description", data.description);

    data.beans?.forEach((id: string) => formData.append("CoffeeBeanIds", id));
    data.roasters?.forEach((id: string) => formData.append("RoasterIds", id));
    data.brewMethods?.forEach((id: string) =>
      formData.append("BrewMethodIds", id)
    );

    data.photos?.forEach((p: any) => {
      const blob = new Blob([p.data], { type: p.type });
      formData.append("ShopPhotos", blob, p.name);
    });

    return apiClient.postFormData<SendCoffeeShopToModerationResponse>(
      "/api/moderation",
      formData
    );
  },

  updateModerationCoffeeShop: async (
    data: UpdateModerationCoffeeShopRequest
  ): Promise<UpdateModerationCoffeeShopResponse> => {
    // According to the API spec, this endpoint uses multipart/form-data
    const formData = new FormData();

    if (data.id !== undefined) formData.append("id", String(data.id));
    if (data.name) formData.append("name", data.name);
    if (data.notValidatedAddress)
      formData.append("notValidatedAddress", data.notValidatedAddress);

    if (data.shopContact) {
      if (data.shopContact.phone)
        formData.append("shopContact.phone", data.shopContact.phone);
      if (data.shopContact.website)
        formData.append("shopContact.website", data.shopContact.website);
      if (data.shopContact.instagram)
        formData.append("shopContact.instagram", data.shopContact.instagram);
    }

    if (data.shopPhotos) {
      data.shopPhotos.forEach((photo, index) => {
        formData.append(`shopPhotos[${index}]`, photo);
      });
    }

    if (data.schedules) {
      formData.append("schedules", JSON.stringify(data.schedules));
    }

    return apiClient.postFormData<UpdateModerationCoffeeShopResponse>(
      "/api/moderation",
      formData
    );
  },

  updateModerationStatus: async (
    id: number,
    status: ModerationStatus
  ): Promise<BaseResponse> => {
    return apiClient.put<BaseResponse>(
      `/api/moderation/status?id=${encodeURIComponent(
        String(id)
      )}&status=${encodeURIComponent(status)}`
    );
  },
};
