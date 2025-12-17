import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { RequireAuth } from '../guards/RequireAuth';
import { LoaderScreen } from '../components/LoaderScreen';
import { FeedPage } from '../../pages/FeedPage';
import { MapPage } from '../../pages/MapPage';
import { JobsPage } from '../../pages/JobsPage';
import { ProfilePage } from '../../pages/ProfilePage';
import { CoffeeLogPage } from '../../pages/CoffeeLogPage';
import { ShopPage } from '../../pages/ShopPage';
import { LoginPage } from '../../pages/auth/LoginPage';
import { RegisterPage } from '../../pages/auth/RegisterPage';

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

