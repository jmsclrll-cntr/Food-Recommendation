import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GenerateWeekly = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('user');
    if (!data) return navigate('/');
    setUser(JSON.parse(data));
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FDFEFC] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] p-10 font-sans text-[#344E41] selection:bg-[#588157]/20">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="flex justify-between items-center mb-12 px-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#A3B18A] hover:text-[#344E41] flex items-center gap-3 transition-all group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Hub
        </button>
        <div className="text-center">
          <span className="text-[9px] font-bold tracking-[0.5em] uppercase text-[#A3B18A] block mb-1">Protocol 04</span>
          <h1 className="text-xl font-bold tracking-tighter uppercase">Weekly Nourishment Plan</h1>
        </div>
        <div className="w-24"></div> {/* Spacer for symmetry */}
      </nav>

      <div className="flex gap-10 h-[calc(100vh-200px)]">
        
        {/* --- LEFT: WEEKLY TIMELINE --- */}
        <main className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-6">
          <DayCard day="Monday" type="Metabolic Focus" calories="2,100" />
          <DayCard day="Tuesday" type="Cellular Recovery" calories="1,950" />
          <DayCard day="Wednesday" type="Anti-Inflammatory" calories="2,050" active={true} />
          <DayCard day="Thursday" type="Cognitive Support" calories="2,000" />
          <DayCard day="Friday" type="Strength Priming" calories="2,200" />
        </main>

        {/* --- RIGHT: PROTOCOL DETAILS --- */}
        <aside className="w-[400px] flex flex-col gap-8">
          
          {/* Summary Card */}
          <div className="bg-white/40 backdrop-blur-xl border border-[#A3B18A]/20 rounded-[2.5rem] p-10 shadow-[0_30px_60px_rgba(52,78,65,0.04)]">
            <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#588157] mb-6 block">Nutrient Breakdown</span>
            
            <div className="space-y-8">
              <MacroItem label="Proteins" value="140g" color="#344E41" width="70%" />
              <MacroItem label="Complex Carbs" value="210g" color="#588157" width="55%" />
              <MacroItem label="Healthy Fats" value="65g" color="#A3B18A" width="40%" />
            </div>

            <button className="w-full mt-12 py-5 bg-[#344E41] text-[#FDFEFC] rounded-2xl text-[9px] font-bold uppercase tracking-[0.3em] hover:bg-[#588157] transition-all duration-700 shadow-xl shadow-black/10">
              Download PDF Protocol
            </button>
          </div>

          {/* Tips Card */}
          <div className="bg-[#344E41] rounded-[2.5rem] p-10 flex-1 relative overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=1000" 
              className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:scale-110 transition-transform duration-1000"
              alt="Food"
            />
            <div className="relative z-10">
              <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#A3B18A] mb-4 block">Chef's Insight</span>
              <p className="text-sm font-bold tracking-tight text-[#FDFEFC] leading-relaxed italic opacity-80">
                "Ensure greens are sourced organically to maximize the phytonutrient absorption during the metabolic priming phase."
              </p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const DayCard = ({ day, type, calories, active }) => (
  <div className={`p-10 rounded-[2.5rem] border transition-all duration-700 flex justify-between items-center group cursor-pointer ${active ? 'bg-[#344E41] border-[#344E41] shadow-2xl scale-[1.01]' : 'bg-white/40 border-[#A3B18A]/10 hover:border-[#588157]/30 hover:bg-white'}`}>
    <div>
      <span className={`text-[9px] font-bold tracking-[0.4em] uppercase mb-2 block ${active ? 'text-[#A3B18A]' : 'text-[#A3B18A]'}`}>{day}</span>
      <h3 className={`text-xl font-bold tracking-tighter ${active ? 'text-[#FDFEFC]' : 'text-[#344E41]'}`}>{type}</h3>
    </div>
    <div className="text-right">
      <span className={`text-[9px] font-bold tracking-[0.2em] uppercase block mb-1 ${active ? 'text-[#588157]' : 'text-[#A3B18A]'}`}>Target</span>
      <p className={`text-md font-bold tracking-tight ${active ? 'text-[#FDFEFC]' : 'text-[#344E41]'}`}>{calories} kcal</p>
    </div>
  </div>
);

const MacroItem = ({ label, value, color, width }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-end">
      <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#A3B18A]">{label}</p>
      <p className="text-xs font-bold tracking-tight text-[#344E41]">{value}</p>
    </div>
    <div className="w-full bg-black/5 h-[1.5px] rounded-full overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-1000 ease-out" 
        style={{ backgroundColor: color, width: width }}
      ></div>
    </div>
  </div>
);

export default GenerateWeekly;