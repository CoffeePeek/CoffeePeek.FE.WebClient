import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';
import type { CreateShopIssueReportRequest } from '../utils/shopIssueReportForm';

export type { CreateShopIssueReportRequest };

export interface CreateShopIssueReportResult {
  entityId: string;
}

/**
 * Отправляет жалобу на неточность в данных кофейни.
 * Успех: data == null, id созданной жалобы приходит в entityId.
 */
export async function sendShopIssueReport(
  request: CreateShopIssueReportRequest
): Promise<ApiResponse<CreateShopIssueReportResult>> {
  return httpClient.post<CreateShopIssueReportResult>(
    API_ENDPOINTS.SHOP_ISSUE_REPORTS.BASE,
    request,
    { requiresAuth: true }
  );
}
