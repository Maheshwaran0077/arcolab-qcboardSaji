import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Truck } from 'lucide-react';
import ShiftTabs from '../components/ShiftTabs';

const DeliveryPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const user = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const shift = params.shift || user?.shift || '1';

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F0F4F8] font-sans flex flex-col">
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1 text-slate-500 font-bold text-xs uppercase hover:text-blue-600 transition-colors">
          <ChevronLeft size={20} /> Back
        </button>
        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
          <Truck size={16} className="text-blue-600" />
          <span className="text-xs font-black uppercase tracking-widest">Delivery Shift {shift}</span>
        </div>
      </nav>

      <main className="flex-1 px-4 sm:px-6 pb-6">
        <ShiftTabs basePath="/d" currentShift={shift} />
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center">
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-3">Delivery Performance</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            This page is now configured for Shift {shift}. Use it to track delivery performance, incidents, and daily metrics for the selected shift.
          </p>
          <div className="mt-10 text-slate-400 text-xs uppercase tracking-widest font-black">
            Delivery page is ready. You can extend this with shift-specific metrics and reports.
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeliveryPage;
