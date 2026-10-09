import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VerificationsPage from './pages/VerificationsPage';
import HelpersPage from './pages/HelpersPage';
import UsersPage from './pages/UsersPage';
import TasksPage from './pages/TasksPage';
import CategoriesPage from './pages/CategoriesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Admin Routes */}
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="verifications" element={<VerificationsPage />} />
        <Route path="helpers" element={<HelpersPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
