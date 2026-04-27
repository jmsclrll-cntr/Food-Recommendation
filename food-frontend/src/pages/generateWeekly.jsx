import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GenerateWeekly = () => {
  const navigate = useNavigate();

  // --- Logic remains strictly untouched ---
  const [user] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(true);
  const [bmiStatus, setBmiStatus] = useState("");
  const [suggestion, setSuggestion] = useState("");

  const [formData, setFormData] = useState({
    gender: 'male', height: '', weight: '', goal: 'maintain', condition: 'none'
  });

  const bmi = useMemo(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const h = formData.height / 100;
      return (formData.weight / (h * h)).toFixed(1);
    }
    return 0;
  }, [formData.height, formData.weight]);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    const loadData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/health/${user.uid || user.id}`);
        if (res.data) setFormData(res.data);
      } catch { console.log("New log."); } finally { setLoading(false); }
    };
    loadData();
  }, [navigate, user]);

  useEffect(() => {
    if (bmi > 0 && formData.gender) {
      axios.get(`http://localhost:5000/api/recommendations/suggest?gender=${formData.gender}&bmi=${bmi}`)
        .then(res => {
          setSuggestion(res.data.goal);
          setBmiStatus(res.data.category);
          setFormData(prev => ({ ...prev, goal: res.data.goal }));
        }).catch(() => console.log("Sync error."));
    }
  }, [bmi, formData.gender]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/health/save', {
        userId: user.uid || user.id, ...formData, bmi
      });
      alert("Progress saved.");
    } catch { alert("Save error."); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f5faf4] text-[#6a9966] font-bold text-[10px] tracking-[0.4em] uppercase">Syncing...</div>;

  return (
    <div className="min-h-screen bg-[#f5faf4] text-[#1c3a1c] font-sans antialiased p-6 md:p-10">
      {/* Container slightly narrower (3xl) and aligned to the left (ml-0) */}
      <div className="max-w-3xl ml-0">
        
        {/* Left Aligned Header */}
        <header className="flex items-center gap-6 mb-8">
          <button onClick={() => navigate('/dashboard')} className="text-[9px] font-bold uppercase tracking-widest text-[#5a7054] hover:text-[#2d5a27] transition-all">
            ← Hub
          </button>
          <div className="text-left">
            <h2 className="font-serif text-2xl mb-0.5 italic text-[#1c3a1c]">NutriFind</h2>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#6a9966]">Biometric Log</p>
          </div>
          <div className="w-8 h-8 bg-white border border-[#ddd8ce] rounded-full flex items-center justify-center text-[10px]">🐼</div>
        </header>

        {/* --- LAYOUT STRUCTURE --- */}
        <div className="flex flex-col gap-5">
          
          {/* 1. TOP PANEL: Personal Biometrics (Reduced padding from p-12 to p-10) */}
          <main className="bg-white rounded-[32px] p-8 md:p-10 border border-[#ddd8ce] shadow-sm">
            <h3 className="font-serif text-xl mb-6">Personal Biometrics</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#5a7054]">Gender Identity</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full h-10 bg-transparent border-b border-[#ddd8ce] focus:border-[#2d5a27] outline-none font-medium text-sm transition-all cursor-pointer">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#5a7054]">Medical Status</label>
                  <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full h-10 bg-transparent border-b border-[#ddd8ce] focus:border-[#2d5a27] outline-none font-medium text-sm transition-all cursor-pointer">
                    <option value="none">Healthy</option>
                    <option value="diabetes">Diabetes</option>
                    <option value="hypertension">Hypertension</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#5a7054]">Height (cm)</label>
                  <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full h-10 bg-transparent border-b border-[#ddd8ce] focus:border-[#2d5a27] outline-none text-sm font-medium" placeholder="170" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#5a7054]">Weight (kg)</label>
                  <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full h-10 bg-transparent border-b border-[#ddd8ce] focus:border-[#2d5a27] outline-none text-sm font-medium" placeholder="70" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#5a7054]">Target Goal</label>
                <select value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} className={`w-full h-11 px-4 rounded-xl border-2 font-bold text-sm outline-none transition-all ${suggestion ? 'border-[#8ecb84] bg-[#f5faf4]' : 'border-[#ddd8ce]'}`}>
                  <option value="lose">Weight Loss</option>
                  <option value="gain">Muscle Gain</option>
                  <option value="maintain">Maintain</option>
                </select>
              </div>

              <button type="submit" className="w-full h-11 bg-[#2d5a27] hover:bg-[#1c3a1c] text-white rounded-xl font-bold text-[9px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-sm">
                Save Biometric Data
              </button>
            </form>
          </main>

          {/* 2. BOTTOM ROW: Reduced padding for more compact boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Bottom Left: Body Mass Index Panel */}
            <div className="bg-[#1c3a1c] rounded-[32px] p-6 text-center text-[#e8f4e5] shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px]">
               <div className="absolute top-[-5px] right-[-5px] w-16 h-16 bg-white/5 rounded-full" />
               <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#6a9966] mb-2">BMI Index</p>
               <h2 className="text-5xl font-serif leading-none mb-2">{bmi}</h2>
               <div className="inline-block px-4 py-1 bg-[#2d5a27] rounded-full text-[8px] font-black uppercase tracking-widest mx-auto">
                 {bmiStatus || "Pending"}
               </div>
            </div>

            {/* Bottom Right: Intelligence Panel */}
            <div className="bg-white rounded-[32px] p-6 border border-[#ddd8ce] shadow-sm flex flex-col justify-center min-h-[160px]">
              <h4 className="text-[8px] font-bold uppercase tracking-widest text-[#5a7054] mb-2">Health Insights</h4>
              <p className="text-[11px] leading-relaxed text-[#1c3a1c] italic opacity-90">
                {suggestion 
                  ? `Based on your profile, we recommend prioritizing ${suggestion.toUpperCase()}. Field updated.` 
                  : "Input metrics to reveal community-based goal recommendations and AI insights."
                }
              </p>
              <div className="mt-3 pt-3 border-t border-[#f5faf4] text-[8px] text-[#6a9966] uppercase tracking-tighter">
                Sync: {user?.email}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default GenerateWeekly;