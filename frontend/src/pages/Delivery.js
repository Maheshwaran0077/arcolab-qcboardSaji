import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

function Delivery({ shift }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans">
      <nav className="flex justify-between items-center px-6 py-4">
        <button onClick={() => navigate(shift ? `/shift${shift}` : '/')} className="flex items-center gap-1 text-slate-500 font-bold text-xs uppercase hover:text-emerald-600 transition-colors">
          <ChevronLeft size={20} /> Back to Dashboard
        </button>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery</span>
      </nav>

      {/* Shift Header */}
      {shift && (
        <div className="px-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              Delivery — Shift {shift}
            </h1>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
              Arcolab Continuous Improvement System
            </p>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4">
            Delivery
          </h2>
          <p className="text-slate-500 text-sm">
            Delivery tracking and management system coming soon...
          </p>
        </div>
      </main>
    </div>
  );
}

export default Delivery;