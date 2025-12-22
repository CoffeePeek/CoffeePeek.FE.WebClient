// Base Response Types
export interface BaseResponse {
  isSuccess: boolean;
  message: string;
  errorCode?: string | null;
  traceId?: string | null;
  errors?: Record<string, string[]> | null;
}

export interface BooleanResponse extends BaseResponse {
  data: boolean;
}

export interface CreateEntityResponse extends BaseResponse {
  data: string | null;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
}

export interface LoginResponse extends BaseResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface GoogleLoginUserDto {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface GoogleLoginResponse extends BaseResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: GoogleLoginUserDto;
  };
}

export interface RefreshTokenResponse extends BaseResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

// User Types
export interface UserDto {
  id?: string | null;
  userName?: string;
  username?: string;
  email: string;
  password?: string;
  token?: string | null;
  roles?: string[] | null;
  about?: string | null;
  createdAt: string;
  photoUrl?: string | null;
  reviewCount: number;
}

export interface UserResponse extends BaseResponse {
  data: UserDto;
}

export interface UsersListResponse extends BaseResponse {
  data: UserDto[];
}

export interface UpdateProfileRequest {
  userName?: string;
  username?: string;
  about?: string | null;
}

export interface UpdateProfileResponse extends BaseResponse {
  data: Record<string, unknown>;
}

// CoffeeShop Types
export interface LocationDto {
  address: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface EquipmentDto {
  id?: string;
  name: string;
}

export interface BeansDto {
  id?: string;
  name: string;
}

export interface RoasterDto {
  id?: string;
  name: string;
}

export interface ShopContactDto {
  phone?: string | null;
  website?: string | null;
  instagram?: string | null;
}

export interface ShopScheduleIntervalDto {
  startTime: string;
  endTime: string;
}

export interface ScheduleDto {
  dayOfWeek: number; // 0-6
  intervals: ShopScheduleIntervalDto[];
}

export type PriceRange = 1 | 2 | 3 | 4; // 1=$, 2=$$, 3=$$$, 4=$$$$

export interface ShortShopDto {
  id: string;
  name: string;
  imageUrls?: string[] | null;
  rating: number;
  reviewCount: number;
  location: LocationDto;
  isOpen: boolean;
  equipments?: EquipmentDto[] | null;
  priceRange: PriceRange;
}

export interface ShopDto extends ShortShopDto {
  cityId?: string;
  brewMethods?: unknown[] | null;
  beans?: BeansDto[] | null;
  roasters?: RoasterDto[] | null;
  description?: string | null;
  shopContact?: ShopContactDto | null;
  schedules?: ScheduleDto[] | null;
}

export interface GetCoffeeShopsResponse extends BaseResponse {
  data: {
    content: ShortShopDto[];
  };
}

export interface GetCoffeeShopResponse extends BaseResponse {
  data: {
    shop: ShopDto;
  };
}

// Review Types
export interface CoffeeShopReviewDto {
  id: number;
  shopId: number;
  userId: number;
  header: string;
  comment: string;
  ratingCoffee: number;
  ratingService: number;
  ratingPlace: number;
  createdAt: string;
  shopName: string;
}

export interface AddCoffeeShopReviewRequest {
  shopId: string;
  header: string;
  comment: string;
  ratingCoffee: number; // 1-5
  ratingService: number; // 1-5
  ratingPlace: number; // 1-5
}

export interface UpdateCoffeeShopReviewRequest {
  reviewId: string;
  header?: string;
  comment?: string;
  ratingCoffee?: number; // 1-5
  ratingService?: number; // 1-5
  ratingPlace?: number; // 1-5
}

export interface AddCoffeeShopReviewResponse extends BaseResponse {
  data: {
    reviewId: string;
  };
}

export interface UpdateCoffeeShopReviewResponse extends BaseResponse {
  data: {
    reviewId: string;
  };
}

export interface GetAllReviewsResponse extends BaseResponse {
  data: {
    reviews: CoffeeShopReviewDto[];
  };
}

export interface GetReviewByIdResponse extends BaseResponse {
  data: {
    review: CoffeeShopReviewDto;
  };
}

export interface GetReviewsByUserIdResponse extends BaseResponse {
  data: {
    reviewDtos: CoffeeShopReviewDto[];
  };
}

// Moderation Types
export type ModerationStatus = 'Pending' | 'Approved';

export interface ModerationShopDto {
  id: number;
  name: string;
  notValidatedAddress: string;
  address?: number | null;
  moderationStatus: ModerationStatus;
  status: string;
  shopContact?: ShopContactDto | null;
  shopPhotos: string[];
  schedules: ScheduleDto[];
}

export interface SendCoffeeShopToModerationRequest {
  name: string;
  notValidatedAddress: string;
  shopContact?: ShopContactDto;
  shopPhotos?: string[];
  schedules?: ScheduleDto[];
}

export interface SendCoffeeShopToModerationRequest {
  name: string;
  notValidatedAddress: string;
  description: string;
  beans: string[];
  roasters: string[];
  brewMethods: string[];
  shopPhotos?: {
    fileName: string;
    contentType: string;
    data: number[]; // Массив байтов
  }[];
}

export interface SendCoffeeShopToModerationResponse extends BaseResponse {
  data: Record<string, unknown>;
}

export interface UpdateModerationCoffeeShopResponse extends BaseResponse {
  data: Record<string, unknown>;
}

export interface GetCoffeeShopsInModerationResponse extends BaseResponse {
  data: {
    moderationShop: ModerationShopDto[];
  };
}

// Internal Types
export interface CityDto {
  id: string;
  name: string;
}

export interface GetCitiesResponse extends BaseResponse {
  data: {
    cities: CityDto[];
  };
}

export interface BrewMethodDto {
  id?: string;
  name: string;
}

export interface GetBeansResponse extends BaseResponse {
  data: {
    beans: BeansDto[];
  };
}

export interface GetEquipmentsResponse extends BaseResponse {
  data: {
    equipments: EquipmentDto[];
  };
}

export interface GetRoastersResponse extends BaseResponse {
  data: {
    roasters: RoasterDto[];
  };
}

export interface GetBrewMethodsResponse extends BaseResponse {
  data: {
    brewMethods: BrewMethodDto[];
  };
}

export interface GetUserStatisticsResponse extends BaseResponse {
  data: Record<string, unknown>;
}

export interface CreateCheckInRequest {
  coffeeShopId: string;
}

export interface CreateCheckInResponse extends BaseResponse {
  data: Record<string, unknown>;
}

export interface GetCheckInsResponse extends BaseResponse {
  data: Record<string, unknown>;
}

export interface GetCheckInsByUserIdResponse extends BaseResponse {
  data: Record<string, unknown>;
}

export type VacancyJobType = 'All' | 'Barista' | 'Manager' | 'Cook';

export interface VacancyDto {
  id?: string;
  title?: string;
  company?: string;
  location?: string;
  type?: string;
  salary?: string;
}

export interface GetVacanciesResponse extends BaseResponse {
  data: Record<string, unknown> | VacancyDto[];
}

// Pagination Headers
export interface PaginationHeaders {
  'X-Total-Count'?: string;
  'X-Total-Pages'?: string;
  'X-Current-Page'?: string;
  'X-Page-Size'?: string;
}


