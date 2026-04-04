import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard'; 
import { dashboardMetrics as initialData, getInitialStatusArray } from './dashboardData'; 
import QualityPage from './pages/Quality';
import SafetyPage from './pages/Safety';
import Health from './pages/Health';
import LoginPage from './pages/LoginPage';
import Delivery from "./pages/Delivery" 
import Idea from "./pages/Idea"
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import HodDashboard from './pages/HodDashboard';
 
const API_BASE_URL = 'http://localhost:5000/api/metrics';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const defaultMonthArray = getInitialStatusArray();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        const dbData = await response.json();
        if (dbData && dbData.length > 0) {
          const merged = initialData.map(blueprint => {
            const liveRecord = dbData.find(d => d.letter === blueprint.letter);
            return liveRecord ? { ...blueprint, ...liveRecord } : blueprint;
          });
          setMetrics(merged);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-emerald-600 animate-pulse uppercase tracking-widest">Syncing Arcolab Data...</div>;

  return (
    <main className="max-w-[1400px] mx-auto p-6 lg:p-10">
      
      {/* NEW: HOD Navigation Section */}
    

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {metrics.map((item) => (
          <MetricCard  
            key={item.id} 
            data={item} 
            monthData={item.daysData?.length > 0 ? item.daysData : defaultMonthArray} 
          />
        ))} 
      </div>
    </main>
  );
};

function App() {
const [user, setUser] = useState(JSON.parse(localStorage.getItem('userInfo')));
  useEffect(() => {
    const handleAuth = () => setUser(JSON.parse(localStorage.getItem('userInfo')));
    window.addEventListener('storage', handleAuth);
    window.addEventListener('loginStateChange', handleAuth); 
    return () => {
        window.removeEventListener('storage', handleAuth);
        window.removeEventListener('loginStateChange', handleAuth);
    };
  }, []);

  return (
   <Router>
      <div className="min-h-screen bg-emerald-50/20 font-sans">
        {user && <Navbar user={user} />}
        
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />

          {/* Home/Dashboard - Open to everyone logged in */}
          <Route path="/" element={!user ? <Navigate to="/login" /> : <Dashboard />} />

          {/* Admin & HOD Panels - Restricted by Role */}
          <Route path="/admin" element={user?.role === 'superadmin' ? <SuperAdminDashboard /> : <Navigate to="/" />} />
          <Route path="/hod-dashboard" element={user?.role === 'hod' ? <HodDashboard /> : <Navigate to="/" />} />

          {/* FIX: All QDSHI pages are now accessible to any logged-in user.
              The "Edit" restriction is handled INSIDE the components themselves.
          */}
          <Route path="/q" element={user ? <QualityPage /> : <Navigate to="/login" />} />
          <Route path="/d" element={user ? <Delivery /> : <Navigate to="/login" />} />
          <Route path="/s" element={user ? <SafetyPage /> : <Navigate to="/login" />} />
          <Route path="/h" element={user ? <Health /> : <Navigate to="/login" />} />
          <Route path="/i" element={user ? <Idea /> : <Navigate to="/login" />} />

          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

 