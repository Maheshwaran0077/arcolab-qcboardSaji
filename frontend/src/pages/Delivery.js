import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Truck, Calendar, Activity, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import CircularTracker from '../components/CircularTracker';
import { dashboardMetrics as initialData } from '../dashboardData';

const API_BASE = 'http://localhost:5000/api/metrics';
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DeliveryPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const user = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const activeShift = params.shift || user?.shift || '1';

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedCount, setPlannedCount] = useState('');
  const [dispatchedCount, setDispatchedCount] = useState('');
  const [viewDate, setViewDate] = useState(new Date());

  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`${API_BASE}?shift=${activeShift}`);
        const dbData = await res.json();
        if (dbData?.length > 0) {
          setMetrics(initialData.map(b => dbData.find(d => d.letter === b.letter) || b));
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetch_();
  }, [activeShift]);

  const dData = useMemo(() => {
    const found = metrics.find(m => m.letter === 'D') || metrics[1];
    return { ...found, issueLogs: Array.isArray(found.issueLogs) ? found.issueLogs : [] };
  }, [metrics]);

  const allYearLogs = useMemo(() => {
    return MONTHS.map((monthName, index) => {
      const logs = dData.issueLogs
        .filter(l => {
          const d = new Date(l.rawDate);
          return d.getMonth() === index && d.getFullYear() === viewYear;
        })
        .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
      return { monthName, monthIndex: index, logs };
    });
  }, [dData.issueLogs, viewYear]);

  const getDaysDataForMonth = (mIdx) => {
    const daysInMonth = new Date(viewYear, mIdx + 1, 0).getDate();
    const days = Array(daysInMonth).fill('none');
    dData.issueLogs.forEach(log => {
      const d = new Date(log.rawDate);
      if (d.getMonth() === mIdx && d.getFullYear() === viewYear) {
        const idx = d.getDate() - 1;
        const percentage = (Number(log.dispatched) / Number(log.planned)) * 100;
        if (idx >= 0 && idx < days.length) {
          days[idx] = percentage >= 90 ? 'success' : 'fail';
        }
      }
    });
    return days;
  };

  const dynamicDaysData = useMemo(() => getDaysDataForMonth(viewMonth), [dData.issueLogs, viewMonth]);

  const stats = useMemo(() => ({
    alerts: dynamicDaysData.filter(s => s === 'fail').length,
    success: dynamicDaysData.filter(s => s === 'success').length,
    open: dynamicDaysData.filter(s => s === 'none').length
  }), [dynamicDaysData]);

  const annualTrend = useMemo(() => 
    allYearLogs.map(m => ({
      name: m.monthName.slice(0, 3),
      pass: m.logs.filter(l => (l.dispatched / l.planned * 100) >= 90).length,
      fail: m.logs.filter(l => (l.dispatched / l.planned * 100) < 90).length
    })), [allYearLogs]);

  const handleUpdateStatus = async () => {
    if (!plannedCount || !dispatchedCount) return alert("Please enter counts");
    const [y, m, d] = customDate.split('-');
    const newEntry = { 
      date: `${d}/${m}/${y}`, 
      rawDate: customDate, 
      planned: Number(plannedCount), 
      dispatched: Number(dispatchedCount)
    };
    let updatedLogs = [...dData.issueLogs];
    const idx = updatedLogs.findIndex(l => l.rawDate === customDate);
    if (idx !== -1) updatedLogs[idx] = newEntry; else updatedLogs.push(newEntry);

    try {
      const res = await fetch(`${API_BASE}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dData, shift: activeShift, issueLogs: updatedLogs }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMetrics(prev => prev.map(m => m.letter === 'D' ? saved : m));
        setIsModalOpen(false);
        setPlannedCount(''); setDispatchedCount('');
      }
    } catch (e) { alert('Sync failed.'); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-emerald-500 animate-pulse">LOADING ANALYTICS...</div>;

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F1F5F9] font-sans flex flex-col">
      {/* NAVIGATION */}
      <nav className="flex justify-between items-center px-8 py-4 bg-white border-b border-emerald-100">
        <button onClick={() => navigate('/')} className="group flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-tighter hover:text-emerald-600 transition-all">
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>
        
        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
              <Activity size={14} className="text-emerald-600 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700 tracking-tight">LIVE SHIFT {activeShift} DATA</span>
           </div>
           <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all active:scale-95">
            Update Logs
          </button>
        </div>
      </nav>

      <main className="flex-1 grid grid-cols-12 gap-6 p-6 lg:overflow-hidden">
        
        {/* LEFT: CALENDAR CONTROL */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-white rounded-[2rem] p-6 flex flex-col items-center shadow-sm border border-slate-200 h-full">
               <div className="flex items-center justify-between w-full mb-8 bg-emerald-50 p-2 rounded-2xl border border-emerald-100">
                <button onClick={() => setViewDate(new Date(viewYear, viewMonth - 1, 1))} className="p-2 hover:text-emerald-600"><ChevronLeft size={18}/></button>
                <span className="text-[10px] font-black text-emerald-900 tracking-widest uppercase">{MONTHS[viewMonth]} {viewYear}</span>
                <button onClick={() => setViewDate(new Date(viewYear, viewMonth + 1, 1))} className="p-2 hover:text-emerald-600"><ChevronRight size={18}/></button>
              </div>
              
              <div className="flex-1 flex flex-col justify-center items-center">
                <CircularTracker letter="D" daysData={dynamicDaysData} size={210} />
                <div className="grid grid-cols-3 gap-2 w-full mt-8">
                  <StatBox val={stats.alerts} label="Fail" color="red" />
                  <StatBox val={stats.success} label="Pass" color="emerald" />
                  <StatBox val={stats.open} label="Open" color="slate" />
                </div>
              </div>
          </div>
        </div>

        {/* CENTER: LOGS & TRENDS */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-6 lg:overflow-hidden">
          {/* HISTORY TABLE */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[48%]">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-emerald-50/30">
              <h3 className="font-black text-[10px] text-emerald-800 tracking-widest uppercase flex items-center gap-2">
                <Star size={14} className="text-emerald-500 fill-emerald-500" /> Dispatch Archives
              </h3>
            </div>
            
            <div className="px-6 py-2 bg-slate-50 grid grid-cols-3 text-[9px] font-black text-slate-400 uppercase tracking-tight">
              <span>Date</span>
              <span className="text-center">Target</span>
              <span className="text-right">Dispatched</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar"> 
              {allYearLogs.map(({ monthName, logs }) => logs.length > 0 && (
                <div key={monthName}>
                  <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-6 py-1.5 border-b border-emerald-50">
                    <span className="text-[9px] font-black text-emerald-600 uppercase">{monthName}</span>
                  </div>
                  <div className="divide-y divide-slate-50 px-6">
                    {logs.map((log, i) => {
                      const eff = (Number(log.dispatched) / Number(log.planned)) * 100;
                      return (
                        <div key={i} className="grid grid-cols-3 py-2.5 items-center hover:bg-emerald-50/30 transition-colors">
                          <div className="text-[11px] font-bold text-slate-600">{log.date}</div>
                          <div className="text-center text-[10px] font-medium text-slate-400">{log.planned}</div>
                          <div className={`text-right text-[11px] font-black ${eff >= 90 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {log.dispatched} <span className="text-[7px] ml-1 opacity-60">({eff.toFixed(0)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TRENDS ROW */}
          <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
            <ChartCard title="Monthly Breakdown">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{n:'Fail',v:stats.alerts},{n:'Pass',v:stats.success},{n:'Open',v:stats.open}]}>
                  <XAxis dataKey="n" fontSize={9} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="v" radius={[10, 10, 0, 0]} barSize={30}>
                    <Cell fill="#FDA4AF" /><Cell fill="#6EE7B7" /><Cell fill="#E2E8F0" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Performance Area Trend">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={annualTrend}>
                  <defs>
                    <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="pass" stroke="#10B981" fillOpacity={1} fill="url(#colorPass)" strokeWidth={3} />
                  <Area type="monotone" dataKey="fail" stroke="#F43F5E" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        {/* RIGHT: GREEN PERFORMANCE SYNC */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-emerald-600 rounded-[2.5rem] p-8 flex flex-col items-center shadow-xl h-full text-white relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
            <div className="flex items-center gap-2 mb-8 bg-white/20 px-6 py-2 rounded-full border border-white/10 relative z-10">
               <TrendingUp size={14} className="text-emerald-200" />
               <span className="text-[10px] font-black tracking-widest uppercase">Minor Matrics</span>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10">
                <div className="bg-white/10 p-4 rounded-full backdrop-blur-md mb-4">
                  <CircularTracker letter="M M" daysData={dynamicDaysData} size={200} color="#FFFFFF" />
                </div>
                
                <div className="mt-8 w-full">
                    <div className="bg-white/20 p-6 rounded-3xl border border-white/10 text-center shadow-inner">
                        <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-2 opacity-80">Current Month Avg</p>
                        <h4 className="text-4xl font-black text-white">
                           {stats.success + stats.alerts > 0 ? ((stats.success / (stats.success + stats.alerts)) * 100).toFixed(1) : 0}%
                        </h4>
                        <div className="mt-4 h-1.5 w-full bg-emerald-900/30 rounded-full overflow-hidden">
                           <div 
                            className="h-full bg-white transition-all duration-1000" 
                            style={{ width: `${stats.success + stats.alerts > 0 ? (stats.success / (stats.success + stats.alerts)) * 100 : 0}%` }}
                           ></div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL - EMERALD THEMED */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-[380px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-3 text-emerald-600">
                <Truck size={28} />
              </div>
              <h2 className="font-black text-lg text-slate-800 uppercase">Daily Sync</h2>
            </div>

            <div className="space-y-4">
              <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl p-4 outline-none transition-all font-bold text-slate-600" />
              <div className="grid grid-cols-2 gap-3">
                 <input type="number" placeholder="Target" value={plannedCount} onChange={e => setPlannedCount(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl p-4 outline-none transition-all font-bold text-slate-600" />
                 <input type="number" placeholder="Sent" value={dispatchedCount} onChange={e => setDispatchedCount(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 focus:bg-white rounded-xl p-4 outline-none transition-all font-bold text-slate-600" />
              </div>
              
              <button onClick={handleUpdateStatus} className="w-full bg-emerald-600 py-4 rounded-xl font-black text-white text-[11px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all mt-2">
                Save & Synchronize
              </button>
              <button onClick={() => setIsModalOpen(false)} className="w-full text-[10px] font-bold text-slate-400 uppercase text-center mt-2">Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatBox = ({ val, label, color }) => (
  <div className={`text-center p-3 rounded-2xl bg-white border border-slate-100 shadow-sm`}>
    <div className={`text-lg font-black ${color === 'emerald' ? 'text-emerald-500' : color === 'red' ? 'text-rose-500' : 'text-slate-400'}`}>{val}</div>
    <div className={`text-[8px] font-black uppercase text-slate-400 tracking-tighter`}>{label}</div>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
    <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
      <h4 className="font-black text-[9px] text-slate-400 tracking-widest uppercase">{title}</h4>
    </div>
    <div className="p-4 flex-1 min-h-0">{children}</div>
  </div>
);

export default DeliveryPage;