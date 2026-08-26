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
const AuditModerationPage = lazy(() => import('../pages/AuditModerationPage').then((m) => ({ default: m.AuditModerationPage })));
const ShopTagsPage = lazy(() => import('../pages/ShopTagsPage').then((m) => ({ default: m.ShopTagsPage })));
const PublishedShopsPage = lazy(() => import('../pages/PublishedShopsPage').then((m) => ({ default: m.PublishedShopsPage })));
const PublishedShopEditPage = lazy(() => import('../pages/PublishedShopEditPage').then((m) => ({ default: m.PublishedShopEditPage })));
const OwnerShopsPage = lazy(() => import('../pages/OwnerShopsPage').then((m) => ({ default: m.OwnerShopsPage })));
const OwnerShopEditPage = lazy(() => import('../pages/OwnerShopEditPage').then((m) => ({ default: m.OwnerShopEditPage })));
const BrowseShopsPage = lazy(() => import('../pages/BrowseShopsPage').then((m) => ({ default: m.BrowseShopsPage })));
const BrowseShopPage = lazy(() => import('../pages/BrowseShopPage').then((m) => ({ default: m.BrowseShopPage })));
const BrowseMapPage = lazy(() => import('../pages/BrowseMapPage').then((m) => ({ default: m.BrowseMapPage })));
const ImportQueuePage = lazy(() => import('../pages/ImportQueuePage').then((m) => ({ default: m.ImportQueuePage })));
const ImportInboxPage = lazy(() => import('../pages/ImportInboxPage').then((m) => ({ default: m.ImportInboxPage })));
const ImportDuplicatesPage = lazy(() =>
  import('../pages/ImportDuplicatesPage').then((m) => ({ default: m.ImportDuplicatesPage }))
);
const ImportStatsPage = lazy(() => import('../pages/ImportStatsPage').then((m) => ({ default: m.ImportStatsPage })));

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
  </div>
);

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <Suspense fallback={<Loader />}>
          <LoginPage />
        </Suspense>
      }
    />

    <Route
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/coffee-shops" element={<BrowseShopsPage />} />
        <Route path="/coffee-shops/:id" element={<BrowseShopPage />} />
        <Route path="/map" element={<BrowseMapPage />} />

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
          path="/import/inbox"
          element={<Navigate to="/import" replace />}
        />
        <Route
          path="/import/stats"
          element={
            <ProtectedRoute requireModerator>
              <ImportStatsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/import/duplicates"
          element={
            <ProtectedRoute requireModerator>
              <ImportDuplicatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/import"
          element={
            <ProtectedRoute requireModerator>
              <ImportInboxPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/import/:id"
          element={
            <ProtectedRoute requireModerator>
              <ImportQueuePage />
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
          path="/published-shops"
          element={
            <ProtectedRoute requireAdmin>
              <PublishedShopsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/published-shops/:id"
          element={
            <ProtectedRoute requireAdmin>
              <PublishedShopEditPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shop-tags"
          element={
            <ProtectedRoute requireAdmin>
              <ShopTagsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit"
          element={
            <ProtectedRoute requireAdmin>
              <AuditModerationPage />
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

        <Route
          path="/my-shops"
          element={
            <ProtectedRoute requireOwner>
              <OwnerShopsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-shops/:id"
          element={
            <ProtectedRoute requireOwner>
              <OwnerShopEditPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
);
