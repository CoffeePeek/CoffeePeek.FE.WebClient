import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

RF Dewiface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin ?: boolean;
  requireModerator ?: boolean;
  requireOwner ?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireModerator = false,
  requireOwner = false,
}) => {
  const { user, isLoading, isAdmin, isModerator, isOwner } = useUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireModerator && !isModerator) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireOwner && !isOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
