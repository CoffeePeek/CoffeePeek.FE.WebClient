import { httpClient } from './core/httpClient';
import { ApiResponse } from './core/types';

export type CommunityFeedFilter =
  | 'All'
  | 'Reviews'
  | 'CheckIns'
  | 'Posts'
  | 'Following'
  | 'FollowedCities';

export type CommunityFeedItemType = 'Review' | 'CheckIn' | 'Post' | 1 | 2 | 3;
export type CommunityPostType = 'Discussion' | 'Question' | 'Tip' | 1 | 2 | 3;
export type CommunityReactionType = 'WantToTry' | 'GreatFind' | 'Helpful' | 1 | 2 | 3;

export interface CommunityReactionCounts {
  wantToTry?: number;
  greatFind?: number;
  helpful?: number;
}

export interface CommunityFeedItem {
  type: CommunityFeedItemType;
  id: string;
  userId: string;
  username: string;
  shopId: string;
  shopName: string;
  createdAtUtc: string;
  header?: string | null;
  comment?: string | null;
  note?: string | null;
  postType?: CommunityPostType | null;
  commentCount: number;
  reactions: CommunityReactionCounts;
  viewerReaction?: CommunityReactionType | null;
}

export interface CommunityFeedResponse {
  items: CommunityFeedItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  filter: CommunityFeedFilter;
  cityId?: string | null;
}

export interface CreateCommunityPostRequest {
  postType: CommunityPostType;
  title: string;
  body: string;
  linkedShopId?: string | null;
}

export interface CreateCommunityPostResponse {
  id: string;
}

export async function getCommunityFeed(params: {
  page?: number;
  pageSize?: number;
  filter?: CommunityFeedFilter;
  cityId?: string;
} = {}): Promise<ApiResponse<CommunityFeedResponse>> {
  return httpClient.get<CommunityFeedResponse>('/api/public/feed', {
    params,
    requiresAuth: false,
  });
}

export async function createCommunityPost(
  request: CreateCommunityPostRequest,
): Promise<ApiResponse<CreateCommunityPostResponse>> {
  return httpClient.post<CreateCommunityPostResponse>('/api/community/posts', request, {
    requiresAuth: true,
  });
}

export async function setCommunityReaction(request: {
  targetType: 'Review' | 'CheckIn' | 'Post';
  targetId: string;
  reactionType?: CommunityReactionType | null;
}): Promise<ApiResponse<void>> {
  return httpClient.put<void>('/api/community/reactions', request, {
    requiresAuth: true,
  });
}
