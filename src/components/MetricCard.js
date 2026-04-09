import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CircularTracker from './CircularTracker';

const MetricCard = ({ data }) => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate(`/${data.letter.toLowerCase()}`);
  };

  return (
    <motion.div
      onClick={handleRedirect}
      whileHover={{ y: -5 }}
      className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col items-center cursor-pointer transition-shadow hover:shadow-xl"
    >
      <h2 className="text-[10px] font-bold text-slate-400 tracking-[0.2em] mb-4 uppercase">
        {data.label}
      </h2>

      <div className="mb-4">
        <CircularTracker letter={data.letter} daysData={data.daysData} size={180} />
      </div>

      <div className="flex gap-3 w-full justify-center mb-3">
        <span className="text-[9px] font-black text-red-400 uppercase bg-red-50 px-2 py-1 rounded-lg">
          {data.alerts} Alerts
        </span>
        <span className="text-[9px] font-black text-green-500 uppercase bg-green-50 px-2 py-1 rounded-lg">
          {data.success} OK
        </span>
      </div>

      <div className="text-center pt-3 border-t border-slate-50 w-full">
        <div className="text-2xl font-black text-slate-800">{data.value}</div>
        <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">{data.unit}</div>
      </div>
    </motion.div>
  );
};

export default MetricCard;