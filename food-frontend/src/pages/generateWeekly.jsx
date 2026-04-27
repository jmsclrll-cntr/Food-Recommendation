import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GenerateWeekly = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bmi, setBmi] = useState(0);
  const [bmiStatus, setBmiStatus] = useState("");
  const [suggestion, setSuggestion] = useState("");

  const [formData, setFormData] = useState({
    gender: 'male', height: '', weight: '', goal: 'maintain', condition: 'none'
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return navigate('/');
    setUser(storedUser);

    const loadData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/health/${storedUser.uid || storedUser.id}`);
        if (res.data) setFormData(res.data);
      } catch (e) { console.log("New user"); }
      setLoading(false);
    };
    loadData();
  }, [navigate]);

  // DITO ANG MAGIC: Awtomatikong pinipili ang goal sa combo box
  useEffect(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const h = formData.height / 100;
      const val = (formData.weight / (h * h)).toFixed(1);
      setBmi(val);

      if (formData.gender) {
        axios.get(`http://localhost:5000/api/recommendations/suggest?gender=${formData.gender}&bmi=${val}`)
          .then(res => {
            setSuggestion(res.data.goal);
            setBmiStatus(res.data.category);

            // AUTO-SELECT: Inauupdate ang formData.goal base sa recommendation
            setFormData(prev => ({
                ...prev,
                goal: res.data.goal // Kusa itong magbabago sa dropdown
            }));
          })
          .catch(err => console.log("Suggestion error"));
      }
    }
  }, [formData.height, formData.weight, formData.gender]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/health/save', {
        userId: user.uid || user.id, ...formData, bmi
      });
      alert("New health log entry added successfully!");
    } catch (err) { 
      alert("Error saving data.");
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-[#A3B18A]">SYNCING DATA...</div>;

  return (
    <div className="min-h-screen bg-[#FDFEFC] p-10 font-sans text-[#344E41] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]">
      <nav className="flex justify-between items-center mb-10">
        <button onClick={() => navigate('/dashboard')} className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#A3B18A] hover:text-[#344E41]">← Back to Hub</button>
        <div className="text-center">
            <span className="text-[9px] font-bold tracking-[0.5em] uppercase text-[#A3B18A] block mb-1">Authenticated: {user?.email}</span>
            <h1 className="text-xl font-bold uppercase">Biometric Progress Tracking</h1>
        </div>
        <div className="w-24"></div>
      </nav>

      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-10">
        <main className="flex-1 bg-white/40 backdrop-blur-xl border border-[#A3B18A]/20 rounded-[2.5rem] p-10 space-y-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#A3B18A]">Gender Identity</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="bg-white border border-[#A3B18A]/30 rounded-xl p-4 font-bold outline-none">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#A3B18A]">Height (cm)</label>
                <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className="bg-white border border-[#A3B18A]/30 rounded-xl p-4 font-bold outline-none" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#A3B18A]">Weight (kg)</label>
                <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="bg-white border border-[#A3B18A]/30 rounded-xl p-4 font-bold outline-none" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#A3B18A]">Intended Goal</label>
                        {suggestion && <span className="text-[8px] font-bold text-[#588157] animate-pulse">✨ RECOMMENDED</span>}
                    </div>
                    {/* COMBO BOX: Ito ay naka-bind sa formData.goal kaya kusa siyang nag-aadjust */}
                    <select value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} className="bg-white border border-[#A3B18A]/30 rounded-xl p-4 font-bold outline-none ring-2 ring-[#588157]/20">
                        <option value="lose">Weight Loss</option>
                        <option value="gain">Muscle Gain</option>
                        <option value="maintain">Maintenance</option>
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#A3B18A]">Medical Condition</label>
                    <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="bg-white border border-[#A3B18A]/30 rounded-xl p-4 font-bold outline-none">
                        <option value="none">None</option>
                        <option value="diabetes">Diabetes</option>
                        <option value="hypertension">Hypertension</option>
                    </select>
                </div>
            </div>

            <button type="submit" className="w-full py-5 bg-[#344E41] text-[#FDFEFC] rounded-2xl text-[9px] font-bold uppercase tracking-[0.3em] hover:bg-[#588157] transition-all shadow-xl">Append New Progress Log</button>
          </form>
        </main>

        <aside className="w-full md:w-[320px] space-y-6">
          <div className="bg-[#344E41] rounded-[2.5rem] p-10 text-center text-[#FDFEFC] shadow-2xl">
            <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#A3B18A] mb-4 block">Current BMI Score</span>
            <div className="text-6xl font-bold tracking-tighter mb-2">{bmi}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest bg-[#A3B18A] text-[#344E41] px-4 py-1 rounded-full inline-block">
                {bmiStatus || "Wait for input"}
            </div>
          </div>

          {suggestion && (
            <div className="bg-white/50 backdrop-blur-md rounded-[2rem] p-8 border border-[#A3B18A]/20 shadow-sm">
                <p className="text-[9px] font-bold text-[#A3B18A] uppercase tracking-[0.2em] mb-3">Community Intelligence</p>
                <p className="text-xs leading-relaxed text-[#344E41]">
                    Based on our data, most <span className="font-bold">{formData.gender}</span> users with a <span className="font-bold">{bmiStatus}</span> BMI choose <span className="text-[#588157] font-bold italic">{suggestion.toUpperCase()}</span>. We've updated the selection for you.
                </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default GenerateWeekly;