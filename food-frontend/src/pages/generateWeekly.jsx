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
      
      {/* Sidebar-style container: Aligned left */}
      <div className="max-w-xl ml-0">
        
        {/* Navigation Header */}
        <header className="flex items-center gap-6 mb-8">
          <button onClick={() => navigate('/dashboard')} className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5a7054] hover:text-[#2d5a27] transition-all">
            ← Hub
          </button>
          <div className="text-left">
            <h2 className="font-serif text-2xl italic text-[#1c3a1c]">NutriFind</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6a9966]">Biometric Intelligence</p>
          </div>
        </header>

        {/* --- MAIN LAYOUT STRUCTURE --- */}
        <div className="flex flex-col gap-6">
          
          {/* 1. TOP PANEL: Personal Biometrics (Compact but professional) */}
          <main className="bg-white rounded-[40px] px-10 py-12 border border-[#ddd8ce] shadow-sm">
            <h3 className="font-serif text-2xl mb-8 tracking-tight">Personal Biometrics</h3>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Gender Identity</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] focus:border-[#2d5a27] outline-none font-medium text-sm transition-all cursor-pointer">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Medical Status</label>
                  <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] focus:border-[#2d5a27] outline-none font-medium text-sm transition-all cursor-pointer">
                    <option value="none">Healthy</option>
                    <option value="diabetes">Diabetes</option>
                    <option value="hypertension">Hypertension</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Height (cm)</label>
                  <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] focus:border-[#2d5a27] outline-none text-base font-medium" placeholder="170" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Weight (kg)</label>
                  <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] focus:border-[#2d5a27] outline-none text-base font-medium" placeholder="70" required />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Nutritional Goal</label>
                <select value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} className={`w-full h-12 px-5 rounded-xl border-2 font-bold text-sm outline-none transition-all cursor-pointer ${suggestion ? 'border-[#8ecb84] bg-[#f5faf4]' : 'border-[#ddd8ce]'}`}>
                  <option value="lose">Weight Loss</option>
                  <option value="gain">Muscle Gain</option>
                  <option value="maintain">Maintenance</option>
                </select>
                {suggestion && <p className="text-[9px] font-bold text-[#2d5a27] uppercase tracking-widest mt-2 animate-pulse italic text-right">✨Suggestion: {suggestion}</p>}
              </div>

              <button type="submit" className="w-full h-12 bg-[#2d5a27] hover:bg-[#1c3a1c] text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.4em] transition-all active:scale-[0.98] shadow-md">
                Save & Sync Data
              </button>
            </form>
          </main>

          {/* 2. BOTTOM ROW: BMI and Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Body Mass Index Panel */}
            <div className="bg-[#1c3a1c] rounded-[32px] p-6 text-center text-[#e8f4e5] shadow-lg relative overflow-hidden flex flex-col justify-center min-h-[160px]">
               <div className="absolute top-[-5px] right-[-5px] w-20 h-20 bg-white/5 rounded-full" />
               <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-[#6a9966] mb-2">BMI Index</p>
               <h2 className="text-5xl font-serif leading-none mb-3 tracking-tighter">{bmi}</h2>
               <div className="inline-block px-4 py-1 bg-[#2d5a27] rounded-full text-[8px] font-black uppercase tracking-widest mx-auto border border-white/5">
                 {bmiStatus || "Wait..."}
               </div>
            </div>

            {/* Description Panel */}
            <div className="bg-white rounded-[32px] p-6 border border-[#ddd8ce] shadow-sm flex flex-col justify-center min-h-[160px]">
              <h4 className="text-[8px] font-bold uppercase tracking-widest text-[#5a7054] mb-2">Insights</h4>
              <p className="text-[11px] leading-relaxed text-[#1c3a1c] italic opacity-80">
                {suggestion 
                  ? `Community patterns suggest prioritizing ${suggestion.toUpperCase()} based on your current biometric profile.` 
                  : "Input your height and weight to receive personalized AI recommendations."
                }
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default GenerateWeekly;