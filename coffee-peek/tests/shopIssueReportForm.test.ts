import { buildShopIssueReportRequest, type ShopIssueReportDraft } from '../src/utils/shopIssueReportForm';

const draft: ShopIssueReportDraft = {
  shopId: '11111111-1111-1111-1111-111111111111',
  category: 'IncorrectAddress',
  description: '',
};

test('builds a minimal request when no description is given for a non-Other category', () => {
  expect(buildShopIssueReportRequest(draft)).toEqual({
    shopId: draft.shopId,
    category: 'IncorrectAddress',
    description: null,
  });
});

test('trims description and includes it when present', () => {
  const request = buildShopIssueReportRequest({ ...draft, description: '  Wrong hours on weekends  ' });
  expect(request.description).toBe('Wrong hours on weekends');
});

test('requires a category', () => {
  expect(() => buildShopIssueReportRequest({ ...draft, category: null })).toThrow(/тип проблемы/);
});

test('requires a non-blank description when category is Other', () => {
  expect(() => buildShopIssueReportRequest({ ...draft, category: 'Other', description: '' })).toThrow(/Другое/);
  expect(() => buildShopIssueReportRequest({ ...draft, category: 'Other', description: '   ' })).toThrow(/Другое/);
  expect(buildShopIssueReportRequest({ ...draft, category: 'Other', description: 'Weird smell' }).description).toBe(
    'Weird smell'
  );
});

test.each(['x', 'x'.repeat(1001)])('rejects out-of-range description length %#', (description) => {
  expect(() => buildShopIssueReportRequest({ ...draft, description })).toThrow(/2 до 1000/);
});

test('rejects a missing shopId', () => {
  expect(() => buildShopIssueReportRequest({ ...draft, shopId: '' })).toThrow(/кофейню/);
});
