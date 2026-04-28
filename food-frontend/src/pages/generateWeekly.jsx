import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';

const GenerateWeekly = () => {
  const navigate = useNavigate();

  // --- Logic States ---
  const [user] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(true); 
  const [isSyncing, setIsSyncing] = useState(false); 
  // isSubmitted starts as FALSE every time you log in
  const [isSubmitted, setIsSubmitted] = useState(false); 
  const [showToast, setShowToast] = useState(false);
  
  const [activeDayIdx, setActiveDayIdx] = useState(0); 
  const [bmiStatus, setBmiStatus] = useState("");
  const [suggestion, setSuggestion] = useState("");

  // formData starts EMPTY every time
  const [formData, setFormData] = useState({
    gender: 'male', height: '', weight: '', goal: 'maintain', condition: 'none'
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const bmi = useMemo(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const h = formData.height / 100;
      return (formData.weight / (h * h)).toFixed(1);
    }
    return 0;
  }, [formData.height, formData.weight]);

  // --- MODIFIED: REMOVED AUTO-FILL LOGIC ---
  useEffect(() => {
    if (!user) { navigate('/'); return; }
    
    // We only check if the component is ready, we DO NOT 
    // fetch old data to fill the form anymore.
    setLoading(false); 
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

    if (!formData.height || !formData.weight || !formData.gender || !formData.goal) {
        alert("Please complete all biometric fields.");
        return;
    }

    setIsSyncing(true);

    const payload = {
        userId: user.uid || user.id,
        ...formData,
        bmi
    };

    try {
      if (!isSubmitted) {
        // ACTION 1: FIRST TIME SAVING (INSERT)
        await axios.post('http://localhost:5000/api/health/save', payload);
      } else {
        // ACTION 2: UPDATING WITHIN THE SAME SESSION
        await axios.put(`http://localhost:5000/api/health/update/${user.uid || user.id}`, payload);
      }
      
      setTimeout(() => {
        setIsSyncing(false);
        setIsSubmitted(true); // Now the layout shifts and button becomes "Update"
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000); 
      }, 1200);

    } catch (err) {
      setIsSyncing(false);
      alert("Error connecting to database.");
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f5faf4]">
      <Loader2 className="w-8 h-8 animate-spin text-[#6a9966]" />
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#f5faf4] text-[#1c3a1c] font-sans antialiased p-10 overflow-hidden relative">
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-[#1c3a1c] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle className="text-[#8ecb84] w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
                {isSubmitted ? "Analysis Updated" : "Data Synced"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSyncing && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#f5faf4]/60 backdrop-blur-sm flex items-center justify-center"
          >
            <Loader2 className="w-12 h-12 animate-spin text-[#2d5a27]" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`grid h-full transition-all duration-1000 ease-in-out ${isSubmitted ? 'grid-cols-12 gap-10' : 'grid-cols-1'}`}>
        <motion.div layout transition={{ type: "spring", stiffness: 60, damping: 15 }}
          className={`${isSubmitted ? 'col-span-4' : 'max-w-xl mx-auto w-full'} flex flex-col h-full`}
        >
          <header className="flex items-center gap-6 mb-8 flex-shrink-0">
            <button onClick={() => navigate('/dashboard')} className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#5a7054] hover:text-[#2d5a27]">← Hub</button>
            <div className="text-left">
              <h2 className="font-serif text-2xl italic">NutriFind</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#6a9966]">Biometric Intelligence</p>
            </div>
          </header>

          <div className="flex flex-col gap-6 flex-grow overflow-hidden pb-4">
            <main className="bg-white rounded-xl p-10 border border-[#ddd8ce] shadow-sm">
              <h3 className="font-serif text-2xl mb-8 tracking-tight">Personal Biometrics</h3>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] outline-none font-medium text-sm transition-all" required>
                      <option value="male">Male</option><option value="female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Status</label>
                    <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] outline-none font-medium text-sm transition-all">
                      <option value="none">Healthy</option><option value="diabetes">Diabetes</option><option value="hypertension">Hypertension</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Height (cm)</label>
                    <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] outline-none text-base font-medium" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Weight (kg)</label>
                    <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full h-10 bg-transparent border-b-2 border-[#ddd8ce] outline-none text-base font-medium" required />
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5a7054]">Goal</label>
                  <select value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} className={`w-full h-12 px-5 rounded-lg border-2 font-bold text-sm outline-none transition-all ${suggestion ? 'border-[#8ecb84] bg-[#f5faf4]' : 'border-[#ddd8ce]'}`}>
                    <option value="lose">Weight Loss</option><option value="gain">Muscle Gain</option><option value="maintain">Maintenance</option>
                  </select>
                </div>
                <button type="submit" disabled={isSyncing} className="w-full h-12 bg-[#2d5a27] hover:bg-[#1c3a1c] text-white rounded-lg font-bold text-[10px] uppercase tracking-[0.4em] transition-all active:scale-[0.98] shadow-md disabled:opacity-50">
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (isSubmitted ? 'Update Analysis' : 'Save & Sync Data')}
                </button>
              </form>
            </main>

            <div className="grid grid-cols-2 gap-5 flex-shrink-0">
              <div className="bg-[#1c3a1c] rounded-xl p-6 text-center text-[#e8f4e5] shadow-lg flex flex-col justify-center h-32">
                 <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-[#6a9966] mb-2">BMI Index</p>
                 <h2 className="text-4xl font-serif leading-none mb-3 tracking-tighter">{bmi}</h2>
                 <div className="inline-block px-4 py-1 bg-[#2d5a27] rounded-full text-[8px] font-black uppercase tracking-widest mx-auto">{bmiStatus || "Pending"}</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-[#ddd8ce] shadow-sm flex flex-col justify-center h-32">
                <h4 className="text-[8px] font-bold uppercase tracking-widest text-[#5a7054] mb-2">Health Insights</h4>
                <p className="text-[10px] leading-relaxed italic opacity-80">{suggestion ? `We recommend prioritizing ${suggestion.toUpperCase()}.` : "Metrics required."}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {isSubmitted && (
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
              className="col-span-8 h-full pt-[104px]"
            >
              <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[calc(100%-140px)]">
                <motion.div layout key={days[activeDayIdx]} className="col-span-1 row-span-2 bg-white rounded-xl p-8 border-2 border-[#2d5a27] shadow-xl flex flex-col">
                  <span className="text-[9px] font-black text-[#2d5a27] uppercase tracking-[0.3em] mb-4">Focus: Day 0{activeDayIdx + 1}</span>
                  <h4 className="font-serif italic text-3xl mb-8 text-[#1c3a1c]">Dietary Plan</h4>
                  <div className="space-y-6 flex-1 border-t border-[#f5faf4] pt-8">
                    <div className="h-3 w-24 bg-[#f5faf4] rounded-full" />
                    <div className="h-2 w-full bg-[#f5faf4] rounded-full opacity-60" />
                    <div className="h-2 w-full bg-[#f5faf4] rounded-full opacity-60" />
                    <div className="h-2 w-2/3 bg-[#f5faf4] rounded-full opacity-60" />
                  </div>
                </motion.div>

                {days.map((day, idx) => {
                  if (idx === activeDayIdx) return null; 
                  return (
                    <motion.div 
                      key={day} 
                      onClick={() => setActiveDayIdx(idx)}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-xl p-6 border border-[#ddd8ce] shadow-sm flex flex-col justify-center cursor-pointer hover:border-[#2d5a27] transition-all group"
                    >
                      <span className="text-[8px] font-black text-[#6a9966] uppercase tracking-[0.2em] mb-2">Day 0{idx + 1}</span>
                      <h4 className="font-serif italic text-lg text-[#1c3a1c] mb-3">Dietary Plan</h4>
                      <div className="space-y-2 border-t border-[#f5faf4] pt-3 opacity-40">
                        <div className="h-1.5 w-full bg-[#f5faf4] rounded-full" />
                        <div className="h-1.5 w-2/3 bg-[#f5faf4] rounded-full" />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GenerateWeekly;