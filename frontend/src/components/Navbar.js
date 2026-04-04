import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserCircle, LogOut, LayoutDashboard, Settings2 } from 'lucide-react';
import logo from '../assest/arcolabLogo.jpg';

const Navbar = () => {
  const navigate = useNavigate();
  
  // 1. Get the user data from localStorage
  const user = JSON.parse(localStorage.getItem('userInfo'));

  const handleLogout = () => {
    // 2. Clear local storage and redirect to login
    localStorage.removeItem('userInfo');
    // Trigger a storage event so App.js knows we logged out
    window.dispatchEvent(new Event("storage"));
    navigate('/login');
  };

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-sm border-b">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
        <img src={logo} alt="Arcolab Logo" className="h-12 w-auto" />
        <span className="text-xl font-bold text-slate-800">QDSHI Tracker (Arcolab)</span>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            {/* 3. Show Admin Panel ONLY for Super Admin */}
            {user.role === 'superadmin' && (
              <Link 
                to="/admin" 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition uppercase tracking-tighter"
              >
                <LayoutDashboard size={18} />
                Admin Panel
              </Link>
            )}

            {/* NEW: Show Manage Supervisors ONLY for HOD */}
            {user.role === 'hod' && (
              <Link 
                to="/hod-dashboard" 
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-bold text-sm transition uppercase tracking-tighter"
              >
                <Settings2 size={18} />
                Manage Supervisors
              </Link>
            )}

            {/* 4. Show User Name and Logout button */}
            <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
                <p className="text-sm font-black text-slate-800">{user.name}</p>
              </div>
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-full transition font-bold text-sm"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </>
        ) : (
          /* 5. Show Login if no user is found */
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition"
          >
            <UserCircle size={20} />
            <span className="font-medium">Login</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;