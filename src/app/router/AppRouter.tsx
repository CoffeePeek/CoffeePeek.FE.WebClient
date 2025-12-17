import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { RequireAuth } from '../guards/RequireAuth';
import { LoaderScreen } from '../components/LoaderScreen';

const FeedPage = React.lazy(() => import('../../pages/FeedPage').then((m) => ({ default: m.FeedPage })));
const MapPage = React.lazy(() => import('../../pages/MapPage').then((m) => ({ default: m.MapPage })));
const JobsPage = React.lazy(() => import('../../pages/JobsPage').then((m) => ({ default: m.JobsPage })));
const ProfilePage = React.lazy(() => import('../../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const CoffeeLogPage = React.lazy(() => import('../../pages/CoffeeLogPage').then((m) => ({ default: m.CoffeeLogPage })));
const ShopPage = React.lazy(() => import('../../pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const LoginPage = React.lazy(() => import('../../pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('../../pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));

export function AppRouter() {
  return (
    <Suspense fallback={<LoaderScreen />}>
      <Routes>
        <Route path="/auth">
          <Route index element={<Navigate to="/auth/login" replace />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/log" element={<CoffeeLogPage />} />
          <Route path="/shops/:shopId" element={<ShopPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </Suspense>
  );
}

