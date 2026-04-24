import React from 'react';
import { motion } from 'framer-motion';

export default function Profile({ user, onBack }) {
  return (
    <div className="min-h-screen bg-[#FDFEFC] p-8 font-sans text-[#344E41]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto bg-white border border-[#A3B18A]/20 rounded-3xl p-10 shadow-xl"
      >
        <button 
          onClick={onBack}
          className="text-[10px] font-black tracking-widest uppercase text-[#588157] mb-8 hover:opacity-70 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        <div className="flex items-center gap-6 mb-10">
          <div className="w-24 h-24 rounded-full bg-[#588157] flex items-center justify-center text-white text-3xl font-bold">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{user?.username || 'User Profile'}</h1>
            <p className="text-[#A3B18A] font-medium">Premium Health Member</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-[#F1F3F0] rounded-2xl">
            <span className="text-[9px] font-black text-[#A3B18A] uppercase tracking-widest">Email Address</span>
            <p className="text-sm font-bold mt-1">{user?.email || 'Not provided'}</p>
          </div>
          <div className="p-4 bg-[#F1F3F0] rounded-2xl">
            <span className="text-[9px] font-black text-[#A3B18A] uppercase tracking-widest">Account Status</span>
            <p className="text-sm font-bold mt-1 text-emerald-600">Active • Verified</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}