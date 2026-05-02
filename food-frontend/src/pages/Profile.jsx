import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, ShieldCheck, Calendar, Weight, Ruler, Activity } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem('user');
    if (!data) return navigate('/');
    setUser(JSON.parse(data));
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="h-screen w-full bg-[#f5faf4] text-[#1c3a1c] font-sans antialiased p-10 overflow-hidden flex flex-col">
      {/* Header Navigation */}
      <header className="flex items-center justify-between mb-12 flex-shrink-0">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#5a7054] hover:text-[#2d5a27] transition-all"
        >
          <ArrowLeft size={14} /> Back to Hub
        </button>
        <div className="text-right">
          <h2 className="font-serif text-2xl italic">NutriFind</h2>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6a9966]">Member Identity</p>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full grid grid-cols-12 gap-10 overflow-y-auto pr-4 custom-scrollbar">
        {/* Left Column: Avatar & Basic Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-4 space-y-6"
        >
          <div className="bg-white rounded-xl p-10 border border-[#ddd8ce] shadow-sm text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-[#8ecb84]/20 rounded-full scale-110"></div>
              <img 
                src={user.profilePic || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=500`} 
                alt="Profile" 
                className="relative w-full h-full object-cover rounded-full border-4 border-white shadow-sm"
              />
            </div>
            <h1 className="font-serif text-2xl italic mb-1">{user.username}</h1>
            <p className="text-[10px] font-bold text-[#6a9966] uppercase tracking-widest mb-6">Premium Member</p>
            
            <div className="flex flex-col gap-3 text-left border-t border-[#f5faf4] pt-6">
              <div className="flex items-center gap-3 text-[#5a7054]">
                <Mail size={14} />
                <span className="text-xs font-medium">{user.email || 'user@nutrifind.com'}</span>
              </div>
              <div className="flex items-center gap-3 text-[#5a7054]">
                <ShieldCheck size={14} />
                <span className="text-xs font-medium">Verified Account</span>
              </div>
              <div className="flex items-center gap-3 text-[#5a7054]">
                <Calendar size={14} />
                <span className="text-xs font-medium">Joined Jan 2024</span>
              </div>
            </div>
          </div>

          <button className="w-full bg-[#1c3a1c] text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#2d5a27] transition-all shadow-lg">
            Edit Profile
          </button>
        </motion.div>

        {/* Right Column: Detailed Metrics */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-8 space-y-8"
        >
          {/* Bio Section */}
          <section className="bg-white rounded-xl p-8 border border-[#ddd8ce] shadow-sm">
            <h3 className="font-serif text-xl italic mb-4">Personal Narrative</h3>
            <p className="text-sm leading-relaxed text-[#5a7054] italic">
              "Dedicated to achieving a balanced lifestyle through biometric tracking and organic nutrition. 
              Currently focusing on metabolic health and long-term vitality."
            </p>
          </section>

          {/* Biometric Snapshot */}
          <div className="grid grid-cols-3 gap-6">
            <InfoCard icon={<Weight size={18}/>} label="Latest Weight" value="72.5 kg" color="#2d5a27" />
            <InfoCard icon={<Ruler size={18}/>} label="Last Height" value="178 cm" color="#2d5a27" />
            <InfoCard icon={<Activity size={18}/>} label="Avg. BMI" value="22.8" color="#1c3a1c" />
          </div>

          {/* Account Settings Placeholder */}
          <div className="bg-white rounded-xl overflow-hidden border border-[#ddd8ce] shadow-sm">
            <div className="bg-[#fcfdfb] px-8 py-4 border-b border-[#ddd8ce]">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6a9966]">Security & Preferences</h4>
            </div>
            <div className="p-8 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-[#f5faf4]">
                <span className="text-sm font-medium">Email Notifications</span>
                <div className="w-10 h-5 bg-[#8ecb84] rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-[#f5faf4]">
                <span className="text-sm font-medium">Public Profile</span>
                <div className="w-10 h-5 bg-[#ddd8ce] rounded-full relative">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-red-700">Delete Account</span>
                <button className="text-[9px] font-bold uppercase tracking-widest text-red-700 border border-red-100 px-3 py-1 rounded-lg hover:bg-red-50 transition-all">Action</button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const InfoCard = ({ icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-6 border border-[#ddd8ce] shadow-sm hover:border-[#8ecb84] transition-all group">
    <div className={`mb-4`} style={{ color: color }}>
      {icon}
    </div>
    <p className="text-[8px] font-black uppercase tracking-widest text-[#6a9966] mb-1">{label}</p>
    <p className="text-lg font-bold text-[#1c3a1c]">{value}</p>
  </div>
);

export default Profile;