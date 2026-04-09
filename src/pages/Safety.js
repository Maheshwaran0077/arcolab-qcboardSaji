import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Star, Maximize2, X, ShieldAlert
} from 'lucide-react';
import {
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import CircularTracker from '../components/CircularTracker';
import ShiftTabs from '../components/ShiftTabs';
import { dashboardMetrics as initialData } from '../dashboardData';

const API_BASE = 'http://localhost:5000/api/metrics';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const SafetyPage = () => {
  const navigate = useNavigate();
  const params   = useParams();
  const user     = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const shift    = params.shift || user?.shift || '1';

  const [loading, setLoading]         = useState(true);
  const [metrics, setMetrics]         = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [customDate, setCustomDate]       = useState(new Date().toISOString().split('T')[0]);
  const [incidentName, setIncidentName]   = useState('No Incident');
  const [peopleAffected, setPeopleAffected] = useState(0);
  const [severity, setSeverity]           = useState('Low');

  const [viewDate, setViewDate] = useState(new Date());
  const viewMonth     = viewDate.getMonth();
  const viewYear      = viewDate.getFullYear();
  const viewMonthName = MONTHS[viewMonth].toUpperCase();

  const handleMonthChange = (offset) => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + offset);
    setViewDate(d);
  };

  // ── Fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res    = await fetch(API_BASE);
        const dbData = await res.json();
        if (dbData?.length > 0) {
          setMetrics(initialData.map(b => dbData.find(d => d.letter === b.letter) || b));
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetch_();
  }, []);

  const sData = useMemo(() => {
    const found = metrics.find(m => m.letter === 'S') || metrics[0];
    return { ...found, issueLogs: Array.isArray(found.issueLogs) ? found.issueLogs : [] };
  }, [metrics]);

  // ── Filtered logs for current view month ──────────────────────
  const filteredLogs = useMemo(() =>
    sData.issueLogs
      .filter(l => {
        if (!l.rawDate) return false;
        const d = new Date(l.rawDate);
        return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
      })
      .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate)),
    [sData.issueLogs, viewDate]);

  // ── Days data for circular tracker ───────────────────────────
  const daysInViewMonth = useMemo(() =>
    new Date(viewYear, viewMonth + 1, 0).getDate(), [viewDate]);

  const dynamicDaysData = useMemo(() => {
    const days = Array(daysInViewMonth).fill('none');
    filteredLogs.forEach(log => {
      const idx = new Date(log.rawDate).getDate() - 1;
      if (idx >= 0 && idx < days.length)
        days[idx] = log.incident === 'No Incident' ? 'success' : 'fail';
    });
    return days;
  }, [filteredLogs, daysInViewMonth]);

  const stats = useMemo(() => ({
    incidents:     dynamicDaysData.filter(s => s === 'fail').length,
    success:       dynamicDaysData.filter(s => s === 'success').length,
    totalAffected: filteredLogs.reduce((sum, l) => sum + (Number(l.affected) || 0), 0),
  }), [dynamicDaysData, filteredLogs]);

  // ── Annual trend ──────────────────────────────────────────────
  const yearlyStats = useMemo(() =>
    MONTHS.map((m, i) => {
      const mLogs = sData.issueLogs.filter(l => {
        const d = new Date(l.rawDate);
        return d.getMonth() === i && d.getFullYear() === viewYear;
      });
      return {
        name:      m.slice(0, 3),
        incidents: mLogs.filter(l => l.incident !== 'No Incident').length,
        success:   mLogs.filter(l => l.incident === 'No Incident').length,
      };
    }), [sData.issueLogs, viewYear]);

  // ── Save to DB ────────────────────────────────────────────────
  const handleUpdateSafety = async () => {
    let updatedLogs = [...sData.issueLogs];
    const [y, m, d] = customDate.split('-');
    const newEntry  = {
      date:     `${d}/${m}/${y}`,
      rawDate:  customDate,
      incident: incidentName,
      affected: Number(peopleAffected),
      severity,
    };
    const idx = updatedLogs.findIndex(l => l.rawDate === customDate);
    if (idx !== -1) updatedLogs[idx] = newEntry; else updatedLogs.push(newEntry);

    try {
      const res = await fetch(`${API_BASE}/update`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ letter: 'S', issueLogs: updatedLogs }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMetrics(prev => prev.map(m => m.letter === 'S' ? saved : m));
        setIsModalOpen(false);
      }
    } catch (e) { alert('Sync failed. Check backend connection.'); }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#F0F4F8]">
      <div className="text-orange-500 font-black uppercase tracking-widest text-sm animate-pulse">Loading Safety Data...</div>
    </div>
  );

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F0F4F8] font-sans flex flex-col">

      {/* ── Nav ── */}
      <nav className="flex justify-between items-center px-4 sm:px-6 py-4">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1 text-slate-500 font-bold text-xs uppercase hover:text-orange-500 transition-colors">
          <ChevronLeft size={20} /> Back
        </button>
        <button onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95">
          Update {viewMonthName.slice(0, 3)}
        </button>
      </nav>
      <div className="px-4 sm:px-6">
        <ShiftTabs basePath="/s" currentShift={shift} />
      </div>

      {/* ── Grid ── */}
      <main className="flex-1 grid grid-cols-12 gap-4 sm:gap-5 px-4 sm:px-6 pb-6 lg:overflow-hidden">

        {/* ── LEFT: Sidebar ── */}
        <div className="col-span-12 lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col items-center">

          {/* Month nav */}
          <div className="flex items-center justify-between w-full mb-6 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <button onClick={() => handleMonthChange(-1)} className="text-blue-500 hover:scale-110 transition p-1"><ChevronLeft size={22}/></button>
            <span className="text-[12px] font-black text-blue-600 tracking-widest">{viewMonthName} {viewYear}</span>
            <button onClick={() => handleMonthChange(1)}  className="text-blue-500 hover:scale-110 transition p-1"><ChevronRight size={22}/></button>
          </div>

          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Department</span>
          <span className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-6">Safety</span>

          <div className="flex items-center justify-center w-full">
            <CircularTracker letter="S" daysData={dynamicDaysData} size={240} />
          </div>

          <div className="w-full space-y-2 mt-6">
            <StatRow label="Incidents" value={stats.incidents}     color="bg-red-50 text-red-500" />
            <StatRow label="Safe Days"  value={stats.success}       color="bg-green-50 text-green-600" />
            <StatRow label="Affected"   value={stats.totalAffected} color="bg-slate-100 text-slate-500" />
          </div>
        </div>

        {/* ── MIDDLE: Tables ── */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-5 lg:overflow-hidden">

          {/* Alert History */}
          <ChartCard title={`${viewMonthName} INCIDENT HISTORY`}>
            <div className="overflow-y-auto flex-1 custom-scrollbar" style={{ maxHeight: 280 }}>
              <table className="w-full text-[11px] border-separate border-spacing-0">
                <thead className="bg-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 text-left font-black text-slate-500">Date</th>
                    <th className="p-2.5 text-left font-black text-slate-500">Incident</th>
                    <th className="p-2.5 text-center font-black text-slate-500">Affected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLogs.length > 0 ? filteredLogs.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-bold text-slate-500">{log.date}</td>
                      <td className={`p-2.5 font-black uppercase flex items-center gap-2 ${log.incident === 'No Incident' ? 'text-green-500' : 'text-red-500'}`}>
                        <ShieldAlert size={12} />
                        {log.incident}
                        {log.severity && log.incident !== 'No Incident' && (
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-black
                            ${log.severity === 'High' ? 'bg-red-100 text-red-600' :
                              log.severity === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-slate-100 text-slate-500'}`}>
                            {log.severity}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-black text-slate-600">
                        {log.incident === 'No Incident' ? '--' : log.affected || 0}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" className="p-10 text-center text-slate-300 font-bold uppercase italic text-[10px] tracking-widest">No incidents recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* Annual Summary */}
          <ChartCard title={`${viewYear} PERFORMANCE SUMMARY`}>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-[520px] lg:min-w-full text-[10px] border-collapse">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase">
                  <tr>
                    <th className="p-2.5 text-left border-b border-slate-100">Category</th>
                    {yearlyStats.map(m => <th key={m.name} className="p-2.5 text-center border-b border-slate-100">{m.name}</th>)}
                  </tr>
                </thead>
                <tbody className="font-bold">
                  <tr className="border-b border-slate-50">
                    <td className="p-2.5 text-slate-500">Incidents</td>
                    {yearlyStats.map((m, i) => (
                      <td key={i} className={`p-2.5 text-center ${m.incidents > 0 ? 'text-red-500' : 'text-slate-200'}`}>{m.incidents || '--'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-500">Safe Days</td>
                    {yearlyStats.map((m, i) => (
                      <td key={i} className={`p-2.5 text-center ${m.success > 0 ? 'text-green-500' : 'text-slate-200'}`}>{m.success || '--'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>

        {/* ── RIGHT: Charts ── */}
        <div className="col-span-12 md:col-span-12 lg:col-span-4 flex flex-col gap-5 lg:overflow-hidden">

          {/* Donut distribution */}
          <ChartCard title={`${viewMonthName} DISTRIBUTION`}>
            <div className="h-[200px] sm:h-[220px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Safe Days', value: Math.max(stats.success, 0) },
                      { name: 'Affected',  value: Math.max(stats.totalAffected, 0) },
                      { name: 'Incidents', value: Math.max(stats.incidents, 0) },
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={75}
                    paddingAngle={6} dataKey="value"
                  >
                    <Cell fill="#22C55E" stroke="none" />
                    <Cell fill="#EAB308" stroke="none" />
                    <Cell fill="#EF4444" stroke="none" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                <span className="text-xl font-black text-slate-700">{stats.incidents + stats.success}</span>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {[['bg-green-500','Safe Days'],['bg-yellow-500','Affected'],['bg-red-500','Incidents']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${c}`} />
                  <span className="text-[9px] font-black text-slate-500 uppercase">{l}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Trend line */}
          <ChartCard title={`${viewYear} PERFORMANCE TREND`}>
            <div className="h-[200px] sm:h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={yearlyStats} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontWeight: 700 }} />
                  <YAxis fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontWeight: 700 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={3}
                    dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Incidents" />
                  <Line type="monotone" dataKey="success" stroke="#22C55E" strokeWidth={3}
                    dot={{ r: 4, fill: '#22C55E', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Safe Days" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </main>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-[11px] uppercase tracking-widest flex items-center gap-2 text-slate-700">
                <ShieldAlert size={16} className="text-blue-500" /> UPDATE SAFETY LOG
              </h2>
              <button onClick={() => setIsModalOpen(false)}
                className="bg-slate-100 p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
                <X size={18}/>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Date</label>
                <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-xl text-sm outline-none focus:border-blue-400" />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Incident Type</label>
                <select value={incidentName} onChange={e => setIncidentName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-xl text-sm outline-none focus:border-blue-400">
                  <option value="No Incident">✅ No Incident (Safe Day)</option>
                  <option value="Near Miss">⚠️ Near Miss</option>
                  <option value="Minor Injury">⚠️ Minor Injury</option>
                  <option value="Major Accident">🚨 Major Accident</option>
                  <option value="Fire Hazard">🔥 Fire Hazard</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">People Affected</label>
                  <input type="number" min="0" value={peopleAffected} onChange={e => setPeopleAffected(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-xl text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Severity</label>
                  <select value={severity} onChange={e => setSeverity(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-3.5 rounded-xl text-sm outline-none focus:border-blue-400">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <button onClick={handleUpdateSafety}
                className="w-full bg-blue-600 py-4 rounded-2xl font-black text-white shadow-lg hover:bg-blue-700 transition-all uppercase text-xs tracking-widest mt-2 active:scale-95">
                Save Daily Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatRow = ({ label, value, color }) => (
  <div className={`flex justify-between items-center p-3 rounded-xl font-black text-[10px] uppercase ${color}`}>
    <span className="tracking-widest">{label}</span>
    <span className="text-xl">{value}</span>
  </div>
);

const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center">
      <div className="flex items-center gap-2 text-slate-500 font-black uppercase text-[9px] sm:text-[10px] tracking-widest">
        <Star size={13} className="text-blue-500" /> {title}
      </div>
      <Maximize2 size={12} className="text-slate-300 hidden sm:block" />
    </div>
    <div className="p-4 flex-1 min-h-0">{children}</div>
  </div>
);

export default SafetyPage;