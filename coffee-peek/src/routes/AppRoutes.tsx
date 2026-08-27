import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import WobbleRing from '../components/WobbleRing';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthenticatedLayout } from '../components/layouts/AuthenticatedLayout';
import { ShopDetailSkeleton } from '../components/skeletons';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('../pages/LandingPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const CoffeeShopListPage = lazy(() => import('../pages/CoffeeShopListPage'));
const CoffeeShopDetailPage = lazy(() => import('../pages/CoffeeShopPage'));
const CreateReviewPage = lazy(() => import('../pages/CreateReviewPage'));
const UserProfilePage = lazy(() => import('../pages/UserProfilePage'));
const CreateCoffeeShopPage = lazy(() => import('../pages/CreateCoffeeShopPage'));
const CreateCheckInPage = lazy(() => import('../pages/CreateCheckInPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ErrorPage = lazy(() => import('../pages/ErrorPage'));
const PrivacyPolicyPage = lazy(() => import('../pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('../pages/TermsOfServicePage'));
const ConfirmEmailPage = lazy(() => import('../pages/ConfirmEmailPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/ResetPasswordPage'));
const CheckInsPage = lazy(() => import('../pages/CheckInsPage'));
const ReviewsPage = lazy(() => import('../pages/ReviewsPage'));

const LoadingFallback = () => {
  const { theme } = useTheme();
  return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#1A1412]' : 'bg-[#FAFAF9]'}`}>
      <WobbleRing size={48} />
    </div>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <AuthenticatedLayout>
              <DashboardPage />
            </AuthenticatedLayout>
          }
        />

        <Route
          path="/shops"
          element={
            <AuthenticatedLayout>
              <CoffeeShopListPage />
            </AuthenticatedLayout>
          }
        />

        <Route
          path="/shops/:shopId"
          element={
            <AuthenticatedLayout>
              <CoffeeShopDetailPage />
            </AuthenticatedLayout>
          }
        />

        <Route
          path="/shops/:shopId/reviews/new"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <CreateReviewPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/shops/:shopId/reviews/:reviewId/edit"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <CreateReviewPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />


        <Route
          path="/users/:userId"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <UserProfilePage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/coffee-shops/new"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <CreateCoffeeShopPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/shops/:shopId/checkin"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <CreateCheckInPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <SettingsPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/check-ins"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <CheckInsPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <ReviewsPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Legacy redirects */}
        <Route path="/coffeeshops" element={<Navigate to="/shops" replace />} />
        <Route path="/map" element={<Navigate to="/dashboard?page=map" replace />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/error" replace />} />
      </Routes>
    </Suspense>
  );
};

