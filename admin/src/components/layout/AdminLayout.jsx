import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/api';

export default function AdminLayout() {
  const { isAuthenticated, adminToken } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Poll or fetch pending ID verification counts for badge
  useEffect(() => {
    let isMounted = true;
    const fetchPendingCount = async () => {
      try {
        const res = await adminApi.getPendingIdSubmissions(adminToken);
        if (isMounted && res.data) {
          setPendingCount(res.data.length);
        }
      } catch (err) {
        // Silently keep 0 if offline
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [adminToken, refreshTrigger]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleGlobalRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar pendingCount={pendingCount} />

      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <Navbar onRefresh={handleGlobalRefresh} />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet context={{ refreshTrigger, onRefresh: handleGlobalRefresh }} />
        </main>
      </div>
    </div>
  );
}
