import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, LogOut } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <nav className="flex justify-between items-center px-8 py-3 bg-white shadow-sm border-b border-slate-100">
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => navigate('/')}
      >
        {/* Logo placeholder - replace src with actual logo import when available */}
        <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center text-white font-black text-lg">
          A
        </div>
        <div>
          <span className="text-base font-black text-slate-800 uppercase tracking-tight">
            QDSHI Tracker
          </span>
          <span className="hidden sm:inline text-slate-400 font-medium text-xs ml-2">
            Arcolab
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {userInfo ? (
          <>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[11px] font-black text-slate-700 uppercase">{userInfo.name}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {userInfo.department} · {userInfo.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all"
            >
              <LogOut size={14} /> Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition"
          >
            <UserCircle size={20} />
            <span className="font-bold text-sm">Login</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;