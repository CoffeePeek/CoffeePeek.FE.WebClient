jest.mock('../src/contexts/ThemeContext', () => ({ useTheme: () => ({ theme: 'light' }) }));
jest.mock('../src/api/coffeeshop', () => ({ getPhotoUrl: () => '/review-photo.jpg' }));
jest.mock('../src/components/ReportReviewButton', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/components/PhotoLightbox', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/components/skeletons', () => ({ ReviewCardSkeleton: () => null }));
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReviewsSection } from '../src/components/coffeeshop/ReviewsSection';
import type { Review } from '../src/api/coffeeshop';

const review: Review = { id: 'review', coffeeShopId: 'shop', userId: 'author', userName: 'Arsen', header: 'Бомбовый кофе', comment: 'Хороший кофе', ratingCoffee: 5, ratingService: 4, ratingPlace: 3, createdAt: '2026-09-08T12:00:00Z' };
const props = { reviews: [review], usersCache: new Map(), isLoading: false, myReviewId: null, isCheckingMyReview: false, onWriteOrEditReview: () => {}, user: null, textMain: '', textMuted: '', cardBg: '', borderColor: '', coffeeShopName: 'Coffee', averageRating: 4.3, totalCount: 2 };

test('summary uses shop totals and category averages from the displayed reviews', () => {
  const html = renderToStaticMarkup(createElement(ReviewsSection, props));
  expect(html).toContain('4.3 · Отзывы: 2');
  expect(html).toContain('aria-label="Кофе" aria-valuemin="0" aria-valuemax="5" aria-valuenow="5"');
  expect(html).toContain('aria-label="Сервис" aria-valuemin="0" aria-valuemax="5" aria-valuenow="4"');
  expect(html).toContain('aria-label="Аура" aria-valuemin="0" aria-valuemax="5" aria-valuenow="3"');
  expect(html).toContain('Оценки категорий — по показанным отзывам');
});

test('empty reviews show the empty state without invalid category ratings', () => {
  const html = renderToStaticMarkup(createElement(ReviewsSection, { ...props, reviews: [], totalCount: 0 }));
  expect(html).toContain('Станьте первым');
  expect(html).not.toContain('role="meter"');
  expect(html).not.toContain('NaN');
});
