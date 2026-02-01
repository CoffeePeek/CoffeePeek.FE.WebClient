import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
const AIVideoModelsPage = lazy(() => import('../pages/AIVideoModelsPage'));
const ErrorPage = lazy(() => import('../pages/ErrorPage'));
const PrivacyPolicyPage = lazy(() => import('../pages/PrivacyPolicyPage'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#1A1412]">
    <div className="w-12 h-12 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/error" element={<ErrorPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <DashboardPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/shops"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <CoffeeShopListPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/shops/:shopId"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <CoffeeShopDetailPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
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
          path="/ai-video-models"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <AIVideoModelsPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        {/* Legacy redirects for backward compatibility */}
        <Route path="/coffeeshops" element={<Navigate to="/shops" replace />} />
        <Route path="/moderation" element={<Navigate to="/dashboard?page=moderation" replace />} />
        <Route path="/map" element={<Navigate to="/dashboard?page=map" replace />} />
        <Route path="/jobs" element={<Navigate to="/dashboard?page=jobs" replace />} />
        <Route path="/settings" element={<Navigate to="/dashboard?page=settings" replace />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/error" replace />} />
      </Routes>
    </Suspense>
  );
};

