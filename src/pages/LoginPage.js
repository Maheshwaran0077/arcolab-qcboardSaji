import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const LoginPage = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const navigate                = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/users/login', {
        gmail: email,
        password,
      });

      // Store full user object for use across app
      localStorage.setItem('userInfo', JSON.stringify(data));

      // Route based on role
      if (data.role === 'hod' || data.role === 'superadmin') {
        navigate('/hod');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/40">
            <span className="text-white font-black text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">QDSHI Portal</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Arcolab · Production Dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">
            Sign in to continue
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl mb-5 uppercase tracking-wide">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="email"
                placeholder="Gmail Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-blue-400 focus:bg-white transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-medium outline-none focus:border-blue-400 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs mt-2 shadow-lg shadow-blue-100 active:scale-95"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing In...</> : 'Enter Dashboard'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-6">
          Arcolab Internal System · Authorised Access Only
        </p>
      </div>
    </div>
  );
};

export default LoginPage;