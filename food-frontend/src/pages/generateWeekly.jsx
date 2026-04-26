import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GenerateWeekly = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    goal: 'maintain',
    condition: 'none'
  });
  const [bmi, setBmi] = useState(0);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return navigate('/');
    setUser(storedUser);

    // --- TRACKING LOGIC: Fetch existing data ---
    const fetchExistingData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/health/profile/${storedUser.uid || storedUser.id}`);
        if (response.data) {
          setFormData({
            height: response.data.height || '',
            weight: response.data.weight || '',
            goal: response.data.goal || 'maintain',
            condition: response.data.condition || 'none'
          });
        }
      } catch (err) {
        console.log("No existing profile found, starting fresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchExistingData();
  }, [navigate]);

  // Auto BMI calculation
  useEffect(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const h = formData.height / 100;
      setBmi((formData.weight / (h * h)).toFixed(1));
    }
  }, [formData.height, formData.weight]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/health/save-profile', {
        userId: user.uid || user.id,
        ...formData,
        bmi: bmi
      });
      alert("Personalized Health Profile Updated!");
    } catch (err) {
      alert("Error saving data. Make sure backend is running.");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#FDFEFC] flex items-center justify-center font-bold text-[#A3B18A]">SYNCING DATA...</div>;

  return (
    <div className="min-h-screen bg-[#FDFEFC] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] p-10 font-sans text-[#344E41]">
      <nav className="flex justify-between items-center mb-12">
        <button onClick={() => navigate('/dashboard')} className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#A3B18A] hover:text-[#344E41]">← Back to Hub</button>
        <div className="text-center">
            <span className="text-[9px] font-bold tracking-[0.5em] uppercase text-[#A3B18A] block mb-1">User: {user?.email}</span>
            <h1 className="text-xl font-bold tracking-tighter uppercase">Health Tracking Profile</h1>
        </div>
        <div className="w-24"></div>
      </nav>

      <div className="max-w-4xl mx-auto flex gap-10">
        <main className="flex-1 bg-white/40 backdrop-blur-xl border border-[#A3B18A]/20 rounded-[2.5rem] p-10 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#A3B18A]">Height (cm)</label>
                <input type="number" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} className="bg-white border border-[#A3B18A]/30 rounded-xl p-4 outline-none focus:border-[#344E41] font-bold" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#A3B18A]">Weight (kg)</label>
                <input type="number" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className="bg-white border border-[#A3B18A]/30 rounded-xl p-4 outline-none focus:border-[#344E41] font-bold" required />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#A3B18A]">Your Goal</label>
              <select value={formData.goal} onChange={(e) => setFormData({...formData, goal: e.target.value})} className="bg-white border border-[#A3B18A]/30 rounded-xl p-4 outline-none focus:border-[#344E41] font-bold appearance-none">
                <option value="lose">Weight Loss</option>
                <option value="gain">Muscle Gain</option>
                <option value="maintain">Maintenance</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#A3B18A]">Medical Condition</label>
              <select value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})} className="bg-white border border-[#A3B18A]/30 rounded-xl p-4 outline-none focus:border-[#344E41] font-bold appearance-none">
                <option value="none">None</option>
                <option value="diabetes">Diabetes</option>
                <option value="hypertension">Hypertension</option>
                <option value="heart_disease">Heart Disease</option>
              </select>
            </div>

            <button type="submit" className="w-full py-5 bg-[#344E41] text-[#FDFEFC] rounded-2xl text-[9px] font-bold uppercase tracking-[0.3em] hover:bg-[#588157] transition-all shadow-xl">
              Update & Save Profile
            </button>
          </form>
        </main>

        <aside className="w-[320px] space-y-6">
          <div className="bg-[#344E41] rounded-[2.5rem] p-10 text-center text-[#FDFEFC]">
            <span className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#A3B18A] mb-4 block">Calculated BMI</span>
            <div className="text-6xl font-bold tracking-tighter mb-2">{bmi}</div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">
              {bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy" : "Overweight"}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default GenerateWeekly;