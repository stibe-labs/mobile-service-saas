'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [featureToggles, setFeatureToggles] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load user from localStorage on mount
  useEffect(() => {
    const token = api.getToken();
    const savedUser = api.getUser();

    if (token && savedUser) {
      setUser(savedUser);
      // Verify token is still valid
      api.getProfile()
        .then((data) => {
          setUser(data.user);
          setFeatureToggles(data.featureToggles);
          api.setUser(data.user);
        })
        .catch(() => {
          // Token invalid
          api.removeToken();
          setUser(null);
          if (!pathname.includes('/login') && pathname !== '/' && !pathname.includes('/signup')) {
            router.push('/login');
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      if (!pathname.includes('/login') && pathname !== '/' && !pathname.includes('/signup')) {
        router.push('/login');
      }
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);

    // Fetch feature toggles for tenant admins and branch users
    if (data.user.role !== 'super_admin') {
      try {
        const profile = await api.getProfile();
        setFeatureToggles(profile.featureToggles);
      } catch (e) { /* ignore */ }
    }

    // Redirect based on role
    if (data.user.role === 'super_admin') {
      router.push('/admin');
    } else if (data.user.role === 'technician') {
      router.push('/technician-dashboard');
    } else {
      router.push('/dashboard');
    }

    return data;
  }, [router]);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    setFeatureToggles(null);
    router.push('/login');
  }, [router]);

  // Check if a feature is enabled
  const isFeatureEnabled = useCallback((featureName) => {
    if (!featureToggles) return true; // default to enabled
    return featureToggles[featureName] !== false;
  }, [featureToggles]);

  const value = {
    user,
    featureToggles,
    loading,
    login,
    logout,
    isFeatureEnabled,
    isSuperAdmin: user?.role === 'super_admin',
    isTenantAdmin: user?.role === 'tenant_admin',
    isBranchUser: user?.role === 'branch_user',
    isTechnician: user?.role === 'technician',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
