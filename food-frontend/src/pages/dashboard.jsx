import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('user');
    if (!data) return navigate('/');
    setUser(JSON.parse(data));
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FDFEFC] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] p-10 flex gap-10 font-sans text-[#344E41] selection:bg-[#588157]/20">
      
      {/* --- SIDEBAR SECTION --- */}
      <aside className="w-[340px] flex flex-col gap-10">
        
        {/* Profile Card - Editorial Style */}
        <div className="bg-white/40 backdrop-blur-xl border border-[#A3B18A]/20 rounded-[2.5rem] p-10 shadow-[0_30px_60px_rgba(52,78,65,0.04)] flex flex-col items-center group transition-all duration-700">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 bg-[#A3B18A]/20 rounded-full scale-110 group-hover:scale-125 transition-transform duration-700"></div>
            <img 
              src={user.profilePic || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=500`} 
              alt="Profile" 
              className="relative w-full h-full object-cover rounded-full border border-white shadow-sm"
            />
          </div>
          <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#A3B18A] mb-3">Verified Profile</span>
          <h2 className="text-xl font-bold tracking-tighter text-[#344E41]">{user.username}</h2>
          
          <div className="mt-8 pt-8 border-t border-[#A3B18A]/10 w-full flex justify-center gap-12">
            <Stat label="Goal" value="92%" />
            <Stat label="Streak" value="14d" />
          </div>
        </div>

        {/* Focus Card - Visual Focus */}
        <div className="relative bg-[#344E41] rounded-[2.5rem] p-10 shadow-2xl flex flex-col justify-between flex-1 overflow-hidden group">
          {/* Nature Overlay Background */}
          <img 
            src="https://images.unsplash.com/photo-1470058869958-2a77a67117a8?auto=format&fit=crop&q=80&w=1000" 
            className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale group-hover:scale-110 transition-transform duration-1000"
            alt="Nature"
          />
          
          <div className="relative z-10">
            <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#A3B18A] mb-4 block">Target Focus</span>
            <h3 className="text-2xl font-bold tracking-tighter text-[#FDFEFC] leading-tight mb-8">Nourishment & <br/> Cellular Repair</h3>
            
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between text-[9px] font-bold tracking-[0.2em] text-[#A3B18A] mb-3">
                <span>HYDRATION LEVEL</span>
                <span className="text-white">2.4 / 3L</span>
              </div>
              <div className="w-full bg-white/10 h-[1.5px] rounded-full overflow-hidden">
                <div className="bg-[#588157] w-4/5 h-full rounded-full"></div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => { localStorage.clear(); navigate('/'); }}
            className="relative z-10 w-full py-4 border border-white/10 rounded-2xl text-[9px] font-bold uppercase tracking-[0.3em] text-[#A3B18A] hover:text-[#FDFEFC] hover:bg-white/5 transition-all duration-500"
          >
            End Daily Session
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col gap-10">
        
        {/* Banner Section - High-End Editorial Photography */}
        <div className="h-[320px] relative rounded-[3rem] p-16 flex flex-col justify-center overflow-hidden shadow-[0_40px_80px_rgba(52,78,65,0.08)] group">
           <img 
             src="https://images.unsplash.com/photo-1543332164-6e82f3553c46?auto=format&fit=crop&q=80&w=2000" 
             className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
             alt="Vibrant Greens"
           />
           <div className="absolute inset-0 bg-gradient-to-r from-[#344E41]/80 to-transparent"></div>
           
           <div className="relative z-10">
             <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#A3B18A] mb-6 block">Curated Nutrition</span>
             <h1 className="text-[2.8rem] font-bold tracking-tighter text-[#FDFEFC] leading-[1] mb-10">
               Sophisticated <br/> organic wellness.
             </h1>
                <button 
                onClick={() => navigate('/generate-weekly')} // Add this
                className="bg-[#FDFEFC] text-[#344E41] px-10 py-5 rounded-2xl text-[9px] font-bold uppercase tracking-[0.3em] hover:bg-[#588157] hover:text-[#FDFEFC] transition-all duration-700 shadow-xl shadow-black/10"
                >
                Generate Weekly Diet Plan
                </button>
           </div>
        </div>

        {/* Tracking Grid */}
        <div className="flex-1 bg-white/50 backdrop-blur-xl border border-[#A3B18A]/10 rounded-[3rem] p-16 shadow-[0_30px_60px_rgba(52,78,65,0.03)] flex flex-col">
          <header className="flex justify-between items-center mb-12">
            <div>
              <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#A3B18A] mb-2 block">Progression Log</span>
              <h4 className="text-xl font-bold tracking-tighter text-[#344E41]">Active Protocols</h4>
            </div>
            <button className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#588157] hover:underline underline-offset-8 transition-all">See Full History</button>
          </header>
          
          <div className="grid grid-cols-2 gap-8 flex-1">
            <ProgressCard 
              week="Week 01" 
              title="Metabolic Priming" 
              img="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=500" 
              active={false}
            />
            <ProgressCard 
              week="Week 02" 
              title="Phytonutrient Integration" 
              img="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=500" 
              active={true}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const Stat = ({ label, value }) => (
  <div className="text-center">
    <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#A3B18A] mb-2">{label}</p>
    <p className="text-lg font-bold tracking-tighter text-[#344E41]">{value}</p>
  </div>
);

const ProgressCard = ({ week, title, img, active }) => (
  <div className={`relative h-full rounded-[2.5rem] p-8 border transition-all duration-700 overflow-hidden group cursor-pointer flex flex-col justify-end ${active ? 'border-[#344E41]/20 shadow-xl scale-[1.02]' : 'border-[#A3B18A]/10 opacity-70 hover:opacity-100'}`}>
    <img src={img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={title} />
    <div className={`absolute inset-0 bg-gradient-to-t ${active ? 'from-[#344E41]/90' : 'from-[#344E41]/70'} to-transparent`}></div>
    
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[9px] font-black tracking-[0.4em] uppercase text-[#A3B18A]">{week}</span>
        {active && <span className="w-1.5 h-1.5 bg-[#588157] rounded-full"></span>}
      </div>
      <h4 className="text-md font-bold tracking-tight text-white">{title}</h4>
    </div>
  </div>
);

export default Dashboard;