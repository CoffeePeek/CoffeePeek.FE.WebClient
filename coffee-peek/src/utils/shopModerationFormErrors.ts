import {
  ApiRequestError,
  CommonErrorCodes,
  isApiRequestError,
  ShopModerationErrorCodes,
} from '../api/core/apiError';

export type ShopFormField = 'name' | 'notValidatedAddress' | 'cityId' | 'description';

const API_FIELD_TO_FORM: Record<string, ShopFormField> = {
  Name: 'name',
  Address: 'notValidatedAddress',
  CityId: 'cityId',
  Description: 'description',
};

const FIELD_ERROR_MESSAGES: Record<ShopFormField, string> = {
  name: 'Укажите название кофейни (до 55 символов)',
  notValidatedAddress: 'Укажите адрес',
  cityId: 'Выберите город',
  description: 'Проверьте описание',
};

const ERROR_CODE_MESSAGES: Record<string, string> = {
  [ShopModerationErrorCodes.DuplicateShop]: 'Такая кофейня уже добавлена',
  [ShopModerationErrorCodes.InvalidName]: 'Проверьте название кофейни',
  [ShopModerationErrorCodes.InvalidAddress]: 'Проверьте адрес',
  [ShopModerationErrorCodes.CityNotFound]: 'Выберите существующий город',
  [CommonErrorCodes.ValidationFailed]: 'Проверьте заполнение формы',
};

const FALLBACK_MESSAGE = 'Что-то пошло не так. Попробуйте ещё раз.';
const NETWORK_MESSAGE = 'Сеть недоступна. Проверьте подключение.';

export interface ShopModerationFormErrors {
  globalError: string | null;
  fieldErrors: Partial<Record<ShopFormField, string>>;
}

function mapApiFieldToForm(apiField: string): ShopFormField | null {
  if (apiField in API_FIELD_TO_FORM) {
    return API_FIELD_TO_FORM[apiField];
  }

  const normalized = apiField.charAt(0).toLowerCase() + apiField.slice(1);
  if (normalized in FIELD_ERROR_MESSAGES) {
    return normalized as ShopFormField;
  }

  return null;
}

function localizeFieldError(formField: ShopFormField, apiMessage: string): string {
  if (import.meta.env.DEV) {
    return apiMessage;
  }
  return FIELD_ERROR_MESSAGES[formField];
}

function resolveGlobalMessage(error: ApiRequestError): string {
  const { body } = error;

  if (body.errorCode && ERROR_CODE_MESSAGES[body.errorCode]) {
    return ERROR_CODE_MESSAGES[body.errorCode];
  }

  if (import.meta.env.DEV && body.message) {
    return body.message;
  }

  return FALLBACK_MESSAGE;
}

export function parseShopModerationError(error: unknown): ShopModerationFormErrors {
  if (!isApiRequestError(error)) {
    return { globalError: NETWORK_MESSAGE, fieldErrors: {} };
  }

  const { body } = error;

  if (body.errors && Object.keys(body.errors).length > 0) {
    const fieldErrors: Partial<Record<ShopFormField, string>> = {};

    for (const [apiField, messages] of Object.entries(body.errors)) {
      const formField = mapApiFieldToForm(apiField);
      if (formField && messages[0]) {
        fieldErrors[formField] = localizeFieldError(formField, messages[0]);
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { globalError: null, fieldErrors };
    }
  }

  switch (body.errorCode) {
    case ShopModerationErrorCodes.DuplicateShop:
      return {
        globalError: ERROR_CODE_MESSAGES[ShopModerationErrorCodes.DuplicateShop],
        fieldErrors: {},
      };

    case ShopModerationErrorCodes.CityNotFound:
      return {
        globalError: null,
        fieldErrors: { cityId: ERROR_CODE_MESSAGES[ShopModerationErrorCodes.CityNotFound] },
      };

    case ShopModerationErrorCodes.InvalidName:
      return {
        globalError: null,
        fieldErrors: { name: ERROR_CODE_MESSAGES[ShopModerationErrorCodes.InvalidName] },
      };

    case ShopModerationErrorCodes.InvalidAddress:
      return {
        globalError: null,
        fieldErrors: { notValidatedAddress: ERROR_CODE_MESSAGES[ShopModerationErrorCodes.InvalidAddress] },
      };

    case CommonErrorCodes.ValidationFailed:
      return {
        globalError: ERROR_CODE_MESSAGES[CommonErrorCodes.ValidationFailed],
        fieldErrors: {},
      };

    default:
      return { globalError: resolveGlobalMessage(error), fieldErrors: {} };
  }
}

export function getShopFieldErrorClass(hasError: boolean): string {
  return hasError ? 'border-red-500 focus:border-red-500' : '';
}
