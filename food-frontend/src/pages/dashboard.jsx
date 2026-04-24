import React from 'react';
import { motion } from 'framer-motion';

export default function Dashboard({ user, onLogout, onNavigate, onNavigateProfile }) { // ADDED onNavigateProfile prop
  const categories = ["BREAKFAST", "LUNCH", "DINNER", "PLANT-BASED"];

  // Professional, varied content for a premium feel
  const meals = [
    { 
      id: 1, 
      type: "Breakfast", 
      title: "Wild Berry & Hemp Seed Parfait", 
      cal: "280", 
      time: "5m", 
      img: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=800" 
    },
    { 
      id: 2, 
      type: "Lunch", 
      title: "Mediterranean Quinoa & Zesty Lemon Bowl", 
      cal: "410", 
      time: "12m", 
      img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800" 
    },
    { 
      id: 3, 
      type: "Dinner", 
      title: "Miso-Glazed Atlantic Salmon", 
      cal: "540", 
      time: "22m", 
      img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800" 
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFEFC] flex p-8 gap-8 font-sans text-[#344E41]">
      
      {/* SIDEBAR - Structured Left Column */}
      <aside className="w-72 flex flex-col gap-6 h-[calc(100vh-4rem)] sticky top-8">
        
        {/* Profile Section (The Circle in wireframe) */}
        <div className="bg-white border border-[#A3B18A]/20 rounded-3xl p-8 flex flex-col items-center text-center shadow-sm">
          <div className="w-32 h-32 rounded-full bg-[#588157] border-4 border-[#A3B18A]/10 overflow-hidden mb-6 shadow-md">
             <img 
               src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Health'}`} 
               alt="avatar" 
               className="w-full h-full object-cover"
             />
          </div>
          <span className="text-[9px] tracking-[0.3em] font-black text-[#A3B18A] uppercase mb-1">Authenticated User</span>
          <h2 className="text-xl font-bold tracking-tight">{user?.username || 'Member'}</h2>
          
          {/* NEW VIEW PROFILE BUTTON */}
          <button 
            onClick={onNavigateProfile}
            className="mt-4 text-[10px] font-black tracking-widest text-[#588157] underline uppercase hover:text-[#344E41] transition-colors"
          >
            View Profile
          </button>

          <div className="mt-4 flex gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-[#588157]">Health Sync Active</span>
          </div>
        </div>

        {/* Action/Info Section (The Bottom Box in wireframe) */}
        <div className="flex-1 bg-[#344E41] rounded-3xl p-8 flex flex-col justify-between shadow-xl">
          <div className="space-y-6">
            <div>
              <span className="text-[9px] tracking-[0.3em] font-black text-[#A3B18A] uppercase opacity-80">Today's Focus</span>
              <p className="text-white text-lg font-medium leading-tight mt-2">Anti-Inflammatory Nutrition</p>
            </div>
            <div className="space-y-3">
               <div className="flex justify-between text-[10px] font-bold text-white/60">
                 <span>PROTEIN GOAL</span>
                 <span>75%</span>
               </div>
               <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                 <div className="bg-[#A3B18A] h-full w-3/4"></div>
               </div>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-2xl text-white text-[10px] font-black tracking-[0.2em] uppercase transition-all"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col gap-8">
        
        {/* TOP BOX: Premium Hero Header */}
        <section className="h-72 relative rounded-3xl overflow-hidden shadow-lg border border-black/5">
          <img 
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1500" 
            className="absolute inset-0 w-full h-full object-cover" 
            alt="Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#344E41]/80 via-[#344E41]/40 to-transparent flex items-center p-12">
            <div className="max-w-md">
              <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-3 py-1 rounded-md text-[9px] font-black tracking-widest uppercase mb-4 inline-block">Curated Selection</span>
              <h1 className="text-4xl font-bold text-white leading-tight mb-6">Elevate your daily vitality.</h1>
              <button 
                onClick={onNavigate}
                className="bg-[#588157] hover:bg-[#344E41] text-white px-8 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
              >
                Generate your diet plan
              </button>
            </div>
          </div>
        </section>

        {/* BOTTOM BOX: Content Grid Container */}
        <section className="flex-1 bg-[#F1F3F0]/50 backdrop-blur-md border border-[#A3B18A]/10 rounded-3xl p-10 flex flex-col gap-8 shadow-sm">
          
          {/* Internal Navigation Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-[#A3B18A]/20">
            <div className="flex gap-8">
              {categories.map(cat => (
                <button key={cat} className="text-[10px] font-black tracking-[0.2em] text-[#588157]/50 hover:text-[#344E41] transition-all uppercase">
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative">
               <input 
                 type="text" 
                 placeholder="SEARCH RECIPES..." 
                 className="bg-white/80 border border-[#A3B18A]/20 rounded-xl px-4 py-2 text-[9px] font-bold tracking-widest text-[#344E41] placeholder-[#A3B18A] w-64 focus:outline-none focus:border-[#588157]" 
               />
            </div>
          </div>

          {/* DYNAMIC CARD GRID */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {meals.map((meal) => (
                <motion.div 
                  key={meal.id} 
                  whileHover={{ y: -6 }}
                  className="bg-white border border-[#A3B18A]/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="h-44 overflow-hidden">
                    <img src={meal.img} className="w-full h-full object-cover" alt={meal.title} />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black text-[#A3B18A] tracking-widest uppercase">{meal.type} • {meal.time}</span>
                        <span className="text-[9px] font-black text-[#588157] bg-[#588157]/10 px-2 py-0.5 rounded-sm">{meal.cal} CAL</span>
                    </div>
                    <h3 className="text-base font-bold text-[#344E41] mb-6 leading-tight min-h-[2.5rem]">{meal.title}</h3>
                    <button className="w-full py-3.5 bg-[#F8FAF7] hover:bg-[#344E41] text-[#344E41] hover:text-white rounded-xl text-[9px] font-black tracking-[0.2em] uppercase border border-[#A3B18A]/20 transition-all">
                        View Nutrition Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}