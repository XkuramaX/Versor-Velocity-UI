import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';

/**
 * RequireAuth — Redirects to /login if not authenticated.
 */
export function RequireAuth({ children }) {
  const user = authService.getUser();
  const token = authService.getToken();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * RequireRole — Redirects to /dashboard if user doesn't have the required role.
 */
export function RequireRole({ roles, children }) {
  const user = authService.getUser();

  if (!user || !roles.includes(user.platform_role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * Require2FASetup — If the platform requires 2FA and user hasn't set it up,
 * redirect to /profile to force setup. Only blocks if config says require_2fa=true.
 */
export function Require2FASetup({ children }) {
  const user = authService.getUser();
  const location = useLocation();

  // Allow access to profile page (where they set up 2FA) and login
  const exemptPaths = ['/profile', '/login', '/logout'];
  if (exemptPaths.some(p => location.pathname.startsWith(p))) {
    return children;
  }

  // If user has 2FA disabled but platform requires it, redirect to profile
  // The backend sets a flag in the user response when 2FA is required
  if (user && user._require_2fa_setup && !user.totp_enabled) {
    return <Navigate to="/profile" replace state={{ force2FA: true }} />;
  }

  return children;
}
