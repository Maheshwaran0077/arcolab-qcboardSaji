import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard';
import { dashboardMetrics as initialData, getInitialStatusArray } from './dashboardData';
import QualityPage from './pages/Quality';
import SafetyPage from './pages/Safety';
import Health from './pages/Health';
import DeliveryPage from './pages/Delivery';
import LoginPage from './pages/LoginPage';
import HodDashboard from './pages/HodDashboard';
import IdeaPage from './pages/Idea';

const API_BASE_URL = 'http://localhost:5000/api/metrics';

// ─── Protected Route ────────────────────────────────────────────
const Protected = ({ children, roles }) => {
  const user = JSON.parse(localStorage.getItem('userInfo') || 'null');
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

// ─── Main Dashboard ─────────────────────────────────────────────
const Dashboard = () => {
  const [metrics, setMetrics] = useState(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        const dbData = await response.json();
        if (dbData && dbData.length > 0) {
          const merged = initialData.map(blueprint => {
            const live = dbData.find(d => d.letter === blueprint.letter);
            if (!live) return blueprint;
            // Rebuild daysData from issueLogs for current month
            const now = new Date();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const days = Array(daysInMonth).fill('none');
            const logs = Array.isArray(live.issueLogs) ? live.issueLogs : [];
            logs.forEach(log => {
              if (!log.rawDate) return;
              const d = new Date(log.rawDate);
              if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
                const idx = d.getDate() - 1;
                const isSuccess = log.reason === 'Target Met' || log.incident === 'No Incident';
                if (idx >= 0 && idx < days.length) days[idx] = isSuccess ? 'success' : 'fail';
              }
            });
            return {
              ...blueprint,
              ...live,
              daysData: days,
              alerts: days.filter(d => d === 'fail').length,
              success: days.filter(d => d === 'success').length,
            };
          });
          setMetrics(merged);
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-sm">
          Syncing with Database...
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-[1400px] mx-auto p-6 lg:p-10">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {metrics.map(item => (
          <MetricCard key={item.id} data={item} />
        ))}
      </div>
    </main>
  );
};

// ─── Placeholder pages ──────────────────────────────────────────
const DeliveryPage = () => (
  <div className="p-10 text-2xl font-bold text-slate-800">Delivery Performance Tracking — Coming Soon</div>
);

// ─── App ────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Common dashboard — visible to all logged in users */}
          <Route path="/" element={<Dashboard />} />

          {/* Department pages */}
          <Route path="/q" element={<QualityPage />} />
          <Route path="/q/:shift" element={<QualityPage />} />
          <Route path="/s" element={<SafetyPage />} />
          <Route path="/s/:shift" element={<SafetyPage />} />
          <Route path="/h" element={<Health />} />
          <Route path="/h/:shift" element={<Health />} />
          <Route path="/d" element={<DeliveryPage />} />
          <Route path="/d/:shift" element={<DeliveryPage />} />
          <Route path="/i" element={<IdeaPage />} />

          {/* HOD-only portal */}
          <Route
            path="/hod"
            element={
              <Protected roles={['hod', 'superadmin']}>
                <HodDashboard />
              </Protected>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;