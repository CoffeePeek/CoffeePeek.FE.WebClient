import { httpClient } from './core/httpClient';

export type ReviewReportStatus = 0 | 1 | 2;
export function normalizeReviewReportStatus(status: unknown): ReviewReportStatus {
  if (status === 0 || status === '0' || status === 'Pending') return 0;
  if (status === 1 || status === '1' || status === 'Dismissed') return 1;
  if (status === 2 || status === '2' || status === 'ReviewDeleted') return 2;
  throw new Error('Неизвестный статус жалобы. Обновите данные.');
}
const normalizeReport = (report: ReviewReport): ReviewReport => ({ ...report, status: normalizeReviewReportStatus(report.status) });
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
export const getReviewReports = async (status: string, page: number) => {
  const response = await httpClient.get<{ items: ReviewReport[]; totalCount: number; page: number; pageSize: number }>(base, { params: { status, page, pageSize: 20 }, cache: 'no-store' });
  return { ...response, data: { ...response.data, items: response.data.items.map(normalizeReport) } };
};
export const getReviewReport = async (id: string) => {
  const response = await httpClient.get<{ report: ReviewReport; review: ReportedReview }>(`${base}/${encodeURIComponent(id)}`, { cache: 'no-store' });
  return { ...response, data: { ...response.data, report: normalizeReport(response.data.report) } };
};
export const resolveReviewReport = async (id: string, deleteReview: boolean) => {
  const response = await httpClient.put<ReviewReport>(`${base}/${encodeURIComponent(id)}/resolution`, { deleteReview });
  return { ...response, data: normalizeReport(response.data) };
};
