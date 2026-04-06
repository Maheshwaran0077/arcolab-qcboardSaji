import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Star, Maximize2,
  Edit3, X, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import ShiftTabs from '../components/ShiftTabs';

const API_BASE = 'http://localhost:5000/api/health';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const Health = () => {
  const navigate  = useNavigate();
  const params    = useParams();
  const user      = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const dept      = user?.department || 'COMMON';
  const shift     = params.shift || user?.shift || '1';

  const [viewDate, setViewDate]     = useState(new Date());
  const [days, setDays]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [form, setForm]             = useState({ status: '', attendance: '', keypoints: '' });

  const monthName   = MONTHS[viewDate.getMonth()];
  const year        = viewDate.getFullYear();
  const daysInMonth = new Date(year, viewDate.getMonth() + 1, 0).getDate();

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE}?month=${monthName}&year=${year}&dept=${dept}&shift=${shift}`;
      const res  = await fetch(url);
      const data = await res.json();
      if (data.days && data.days.length > 0) {
        setDays(data.days);
      } else {
        // Build empty days array for this month
        setDays(Array.from({ length: daysInMonth }, (_, i) => ({
          date: i + 1, status: null, attendance: '', keypoints: ''
        })));
      }
    } catch (e) {
      console.error(e);
      setDays(Array.from({ length: daysInMonth }, (_, i) => ({
        date: i + 1, status: null, attendance: '', keypoints: ''
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [viewDate, dept, shift]);

  const handleMonthChange = (offset) => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + offset);
    setViewDate(d);
  };

  // ── Open modal ─────────────────────────────────────────────────
  const openModal = (day) => {
    setSelectedDay(day);
    setForm({
      status:     day.status || '',
      attendance: day.attendance || '',
      keypoints:  day.keypoints  || '',
    });
    setIsModalOpen(true);
  };

  // ── Save ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.status) return alert('Please select a meeting status.');
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/update`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month:      monthName,
          year:       year,
          dept:       dept,
          shift:      shift,
          date:       selectedDay.date,
          status:     form.status,
          attendance: form.attendance,
          keypoints:  form.keypoints,
        }),
      });
      if (res.ok) {
        setDays(prev =>
          prev.map(d =>
            d.date === selectedDay.date
              ? { ...d, status: form.status, attendance: form.attendance, keypoints: form.keypoints }
              : d
          )
        );
        setIsModalOpen(false);
      } else {
        alert('Save failed.');
      }
    } catch (e) {
      alert('Network error.');
    } finally {
      setSaving(false);
    }
  };

  // ── Stats ──────────────────────────────────────────────────────
  const meetingCount   = days.filter(d => d.status === 'meeting').length;
  const noMeetingCount = days.filter(d => d.status === 'no-meeting').length;
  const holidayCount   = days.filter(d => d.status === 'holiday').length;

  const colorMap = {
    meeting:    'bg-green-100 border-green-200 text-green-700',
    'no-meeting': 'bg-red-50 border-red-200 text-red-600',
    holiday:    'bg-slate-100 border-slate-200 text-slate-400',
  };
  const labelMap = {
    meeting:    '✅ Meeting Held',
    'no-meeting': '❌ No Meeting',
    holiday:    '🏖 Holiday',
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#F0F4F8]">
      <Loader2 size={32} className="animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans flex flex-col">

      {/* Nav */}
      <nav className="flex justify-between items-center px-6 py-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-slate-500 font-bold text-xs uppercase hover:text-blue-600 transition-colors"
        >
          <ChevronLeft size={20} /> Back
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
        >
          Update {monthName}
        </button>
      </nav>

      <div className="px-6">
        <ShiftTabs basePath="/h" currentShift={shift} />
      </div>

      <main className="flex-1 grid grid-cols-12 gap-5 px-6 pb-6">

        {/* ── Sidebar ── */}
        <div className="col-span-12 lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Department</span>
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-6">Health</h1>

          {/* Month nav */}
          <div className="flex items-center justify-between w-full mb-8 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <button onClick={() => handleMonthChange(-1)} className="text-blue-500"><ChevronLeft size={20}/></button>
            <span className="text-[11px] font-black text-blue-600 tracking-widest">
              {monthName.toUpperCase()} {year}
            </span>
            <button onClick={() => handleMonthChange(1)} className="text-blue-500"><ChevronRight size={20}/></button>
          </div>

          {/* Stat boxes */}
          <div className="w-full space-y-3">
            <StatRow label="Meetings Held"   value={meetingCount}   color="bg-green-50 text-green-600" />
            <StatRow label="No Meeting Days"  value={noMeetingCount} color="bg-red-50 text-red-500" />
            <StatRow label="Holidays"         value={holidayCount}   color="bg-slate-100 text-slate-500" />
          </div>

          {/* Shift info */}
          {user && (
            <div className="mt-6 w-full bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Viewing</p>
              <p className="text-sm font-black text-blue-700">{dept} · Shift {shift}</p>
            </div>
          )}
        </div>

        {/* ── Calendar Grid ── */}
        <div className="col-span-12 lg:col-span-9 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 text-slate-500 font-black uppercase text-[10px] tracking-widest mb-6">
            <Star size={14} className="text-blue-500" /> {monthName.toUpperCase()} {year} — Meeting Tracker
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {days.map(day => (
              <div
                key={day.date}
                onClick={() => openModal(day)}
                className={`cursor-pointer rounded-xl border-2 overflow-hidden hover:shadow-md transition-all active:scale-95
                  ${day.status ? colorMap[day.status] : 'bg-white border-slate-100 text-slate-300'}`}
              >
                {/* Date header */}
                <div className="bg-black/5 text-center py-1.5 text-[10px] font-black border-b border-black/5">
                  {day.date} {monthName.slice(0,3).toUpperCase()}
                </div>
                {/* Content */}
                <div className="p-2 min-h-[60px] flex flex-col items-center justify-center text-center">
                  {day.status ? (
                    <>
                      <p className="text-[9px] font-black uppercase leading-tight">{labelMap[day.status]}</p>
                      {day.attendance && (
                        <p className="text-[8px] font-bold opacity-70 mt-1">
                          Att: {day.attendance}%
                        </p>
                      )}
                    </>
                  ) : (
                    <Edit3 size={14} className="text-slate-200" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black text-[11px] uppercase tracking-widest text-slate-700 flex items-center gap-2">
                <Edit3 size={16} className="text-blue-500" />
                {selectedDay ? `Day ${selectedDay.date} — ${monthName}` : 'Update Meeting'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-100 p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Date picker if no specific day selected */}
              {!selectedDay && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Day</label>
                  <select
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 text-sm outline-none focus:border-blue-400"
                    onChange={e => {
                      const d = days.find(dd => dd.date === Number(e.target.value));
                      if (d) { setSelectedDay(d); setForm({ status: d.status||'', attendance: d.attendance||'', keypoints: d.keypoints||'' }); }
                    }}
                  >
                    <option value="">Select day...</option>
                    {days.map(d => <option key={d.date} value={d.date}>{d.date} {monthName}</option>)}
                  </select>
                </div>
              )}

              {/* Meeting Status */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Meeting Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'meeting',    label: 'Meeting Held',  icon: <CheckCircle size={14}/>,  cls: 'border-green-400 bg-green-50 text-green-700' },
                    { val: 'no-meeting', label: 'No Meeting',    icon: <XCircle size={14}/>,      cls: 'border-red-400 bg-red-50 text-red-600' },
                    { val: 'holiday',    label: 'Holiday',       icon: null,                       cls: 'border-slate-300 bg-slate-50 text-slate-500' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, status: opt.val }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-[9px] font-black uppercase transition-all
                        ${form.status === opt.val ? opt.cls : 'border-slate-100 text-slate-300 hover:border-slate-200'}`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attendance */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">
                  CFT Attendance (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.attendance}
                  onChange={e => setForm(f => ({ ...f, attendance: e.target.value }))}
                  placeholder="e.g. 95"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 text-sm outline-none focus:border-blue-400"
                />
              </div>

              {/* Keypoints */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">
                  Key Points / Notes
                </label>
                <textarea
                  rows={3}
                  value={form.keypoints}
                  onChange={e => setForm(f => ({ ...f, keypoints: e.target.value }))}
                  placeholder="Brief summary of meeting..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-3.5 text-sm outline-none focus:border-blue-400 resize-none"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {saving ? <><Loader2 size={16} className="animate-spin"/> Saving...</> : 'Save Record'}
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

export default Health;