import { SendCoffeeShopToModerationRequest } from '../api/moderation';
import { getDefaultSchedules } from './shopUtils';
import { ShopFormField } from './shopModerationFormErrors';
import { PRICE_RANGE_TO_API } from './priceRange';

export type ShopFormData = Omit<SendCoffeeShopToModerationRequest, 'priceRange'> & {
  priceRange?: string;
};

export const INITIAL_SHOP_FORM_DATA: ShopFormData = {
  name: '',
  notValidatedAddress: '',
  description: '',
  priceRange: undefined,
  cityId: '',
  shopContact: {
    phone: '',
    email: '',
    website: '',
    instagram: '',
  },
  schedules: getDefaultSchedules(),
  equipmentIds: [],
  coffeeBeanIds: [],
  roasterIds: [],
  brewMethodIds: [],
  shopPhotos: [],
};

export function buildShopSubmissionPayload(formData: ShopFormData): SendCoffeeShopToModerationRequest {
  const hasContact = formData.shopContact && (
    formData.shopContact.phone ||
    formData.shopContact.email ||
    formData.shopContact.website ||
    formData.shopContact.instagram
  );

  return {
    ...formData,
    priceRange: formData.priceRange ? PRICE_RANGE_TO_API[formData.priceRange] : undefined,
    schedules: formData.schedules?.length ? formData.schedules : undefined,
    equipmentIds: formData.equipmentIds?.length ? formData.equipmentIds : undefined,
    coffeeBeanIds: formData.coffeeBeanIds?.length ? formData.coffeeBeanIds : undefined,
    roasterIds: formData.roasterIds?.length ? formData.roasterIds : undefined,
    brewMethodIds: formData.brewMethodIds?.length ? formData.brewMethodIds : undefined,
    shopContact: hasContact ? formData.shopContact : undefined,
  };
}

export function validateShopFormClient(formData: ShopFormData): Partial<Record<ShopFormField, string>> {
  const errors: Partial<Record<ShopFormField, string>> = {};

  if (!formData.name?.trim()) {
    errors.name = 'Укажите название кофейни';
  } else if (formData.name.trim().length > 55) {
    errors.name = 'Название не должно превышать 55 символов';
  }

  if (!formData.notValidatedAddress?.trim()) {
    errors.notValidatedAddress = 'Укажите адрес';
  }

  if (!formData.cityId?.trim()) {
    errors.cityId = 'Выберите город';
  }

  return errors;
}
