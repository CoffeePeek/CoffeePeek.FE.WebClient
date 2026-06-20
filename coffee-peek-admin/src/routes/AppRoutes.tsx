import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ShopsModerationPage = lazy(() => import('../pages/ShopsModerationPage').then((m) => ({ default: m.ShopsModerationPage })));
const ShopEditPage = lazy(() => import('../pages/ShopEditPage').then((m) => ({ default: m.ShopEditPage })));
const ReviewsModerationPage = lazy(() => import('../pages/ReviewsModerationPage').then((m) => ({ default: m.ReviewsModerationPage })));
const UsersPage = lazy(() => import('../pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const CachePage = lazy(() => import('../pages/CachePage').then((m) => ({ default: m.CachePage })));

const Loader = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
  </div>
);

export const AppRoutes: React.FC = () => (
  <Suspense fallback={<Loader />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route
          path="/shops"
          element={
            <ProtectedRoute requireModerator>
              <ShopsModerationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shops/:id"
          element={
            <ProtectedRoute requireModerator>
              <ShopEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reviews"
          element={
            <ProtectedRoute requireModerator>
              <ReviewsModerationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute requireAdmin>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cache"
          element={
            <ProtectedRoute requireAdmin>
              <CachePage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
);
