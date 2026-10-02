import { httpClient } from './core/httpClient';

export type ReviewReportStatus = 0 | 1 | 2;
export interface ReviewReport {
  id: string;
  reviewId: string;
  reportedByUserId: string;
  text: string;
  status: ReviewReportStatus;
  createdAtUtc: string;
  resolvedByAdminId: string | null;
  resolvedAtUtc: string | null;
}
export interface ReportedReview {
  id: string;
  coffeeShopId: string;
  userId: string;
  userName: string;
  header: string;
  comment: string;
  ratingPlace: number;
  ratingService: number;
  ratingCoffee: number;
  isSoftDelete: boolean;
  isRemovedByAdmin: boolean;
}
const base = '/api/admin/review-reports';
export const getReviewReports = (status: string, page: number) => httpClient.get<{ items: ReviewReport[]; totalCount: number; page: number; pageSize: number }>(base, { params: { status, page, pageSize: 20 }, cache: 'no-store' });
export const getReviewReport = (id: string) => httpClient.get<{ report: ReviewReport; review: ReportedReview }>(`${base}/${encodeURIComponent(id)}`, { cache: 'no-store' });
export const resolveReviewReport = (id: string, deleteReview: boolean) => httpClient.put<ReviewReport>(`${base}/${encodeURIComponent(id)}/resolution`, { deleteReview });
