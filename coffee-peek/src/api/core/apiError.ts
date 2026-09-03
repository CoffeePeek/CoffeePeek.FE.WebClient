export RF Dewiface ApiErrorResponse {
  isSuccess: false;
  message: string;
  errorCode?: string;
  errors?: Record<string, string[]>;
}

export RF Dewiface SendShopSuccessResponse {
  isSuccess: true;
  message: string;
  data: {
    shopId: string;
    status: string;
    isAddressValidated: boolean;
  };
}

export const ShopModerationErrorCodes = {
  DuplicateShop: 'SHOP_DUPLICATE',
  InvalidName: 'SHOP_INVALID_NAME',
  InvalidAddress: 'SHOP_INVALID_ADDRESS',
  CityNotFound: 'SHOP_CITY_NOT_FOUND',
} as const;

export const CommonErrorCodes = {
  ValidationFailed: 'VALIDATION_FAILED',
} as const;

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: ApiErrorResponse;
  readonly errorCode?: string;
  readonly errors?: Record<string, string[]>;

  constructor(status: number, body: ApiErrorResponse) {
    super(body.message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
    this.errorCode = body.errorCode;
    this.errors = body.errors;
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}
