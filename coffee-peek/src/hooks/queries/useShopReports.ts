import { useMutation } from '@tanstack/react-query';
import { sendShopIssueReport } from '../../api/shopReports';

export function useCreateShopIssueReport() {
  return useMutation({
    mutationFn: sendShopIssueReport,
  });
}
