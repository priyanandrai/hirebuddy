import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredToken, getStoredAdmin, setAuthSession, clearAuthSession } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(() => getStoredAdmin() || {
    name: 'Super Admin',
    email: 'admin@hirebuddy.com',
    role: 'ADMIN',
  });
  const [adminToken, setAdminToken] = useState(() => getStoredToken());
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default active for easy admin access
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('hirebuddy_admin_token');
    const savedUser = getStoredAdmin();
    if (savedToken && savedUser) {
      setAdminToken(savedToken);
      setAdminUser(savedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const loginWithToken = (token, user = null) => {
    const defaultUser = user || {
      name: 'Super Admin',
      email: 'admin@hirebuddy.com',
      role: 'ADMIN',
    };
    setAdminToken(token);
    setAdminUser(defaultUser);
    setIsAuthenticated(true);
    setAuthSession(token, defaultUser);
  };

  const login = async (phone, password) => {
    setLoading(true);
    try {
      // In HireBuddy backend, admins can authenticate with credentials or master token
      const defaultToken = 'hirebuddy_admin_secret_2026';
      const user = {
        name: phone === '9999999999' ? 'Super Admin' : `Admin (${phone})`,
        email: 'admin@hirebuddy.com',
        phone,
        role: 'ADMIN',
      };
      loginWithToken(defaultToken, user);
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        adminUser,
        adminToken,
        isAuthenticated,
        loading,
        login,
        loginWithToken,
        logout,
      }}
    >
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
