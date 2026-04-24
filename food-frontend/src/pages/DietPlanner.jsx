import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DietPlanner({ onBack }) {
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    goal: 'maintain',
    condition: 'none'
  });

  // Dynamic BMI Calculation
  const bmi = useMemo(() => {
    if (formData.height && formData.weight) {
      const heightInMeters = formData.height / 100;
      return (formData.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  }, [formData.height, formData.weight]);

  const getBMICategory = (val) => {
    if (val < 18.5) return { label: "UNDERWEIGHT", color: "#A3B18A" };
    if (val < 25) return { label: "OPTIMAL", color: "#588157" };
    if (val < 30) return { label: "OVERWEIGHT", color: "#BC6C25" };
    return { label: "OBESE", color: "#606C38" };
  };

  const bmiInfo = bmi ? getBMICategory(parseFloat(bmi)) : null;

  const inputStyle = "w-full bg-white/50 border border-[#A3B18A]/20 rounded-2xl px-6 py-4 text-[#344E41] font-medium focus:outline-none focus:border-[#588157] focus:bg-white transition-all duration-300 placeholder:text-[#A3B18A]/40";
  const labelStyle = "text-[9px] font-black tracking-[0.3em] text-[#A3B18A] uppercase mb-2 block ml-1";

  return (
    <div className="min-h-screen bg-[#FDFEFC] p-8 md:p-12 font-sans text-[#344E41]">
      {/* Navigation Header */}
      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <button 
          onClick={onBack}
          className="group flex items-center gap-3 text-[10px] font-black tracking-[0.2em] uppercase"
        >
          <span className="w-10 h-10 rounded-full border border-[#A3B18A]/30 flex items-center justify-center group-hover:bg-[#344E41] group-hover:text-white transition-all">←</span>
          Return to Dashboard
        </button>
        <div className="text-right">
          <span className="text-[9px] font-black tracking-[0.3em] text-[#A3B18A] uppercase block">Section</span>
          <p className="text-sm font-bold">Biometric Analysis</p>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        
        {/* LEFT COLUMN: FORM */}
        <section className="lg:col-span-7 bg-white/40 backdrop-blur-md border border-[#A3B18A]/10 rounded-3xl p-8 md:p-12 shadow-sm">
          <header className="mb-10">
            <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">Tailor your <br/>nutritional path.</h1>
            <p className="text-[#A3B18A] text-lg max-w-md leading-relaxed">
              We use the Harris-Benedict equation and clinical guidelines to calculate a plan that respects your unique physiology.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={labelStyle}>Height (cm)</label>
              <input 
                type="number" 
                placeholder="e.g. 175"
                className={inputStyle}
                value={formData.height}
                onChange={(e) => setFormData({...formData, height: e.target.value})}
              />
            </div>

            <div>
              <label className={labelStyle}>Weight (kg)</label>
              <input 
                type="number" 
                placeholder="e.g. 70"
                className={inputStyle}
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
              />
            </div>

            <div>
              <label className={labelStyle}>Target Goal</label>
              <select 
                className={inputStyle}
                value={formData.goal}
                onChange={(e) => setFormData({...formData, goal: e.target.value})}
              >
                <option value="lose">Weight Loss</option>
                <option value="maintain">Maintenance</option>
                <option value="gain">Muscle Gain</option>
              </select>
            </div>

            <div>
              <label className={labelStyle}>Health Condition</label>
              <select 
                className={inputStyle}
                value={formData.condition}
                onChange={(e) => setFormData({...formData, condition: e.target.value})}
              >
                <option value="none">None (General Health)</option>
                <option value="diabetes">Diabetes Management</option>
                <option value="heart-disease">Heart Health</option>
                <option value="hypertension">Hypertension</option>
              </select>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-12 py-5 bg-[#344E41] text-white rounded-2xl text-[10px] font-black tracking-[0.3em] uppercase shadow-xl hover:bg-[#588157] transition-all"
          >
            Generate Curated Diet Plan
          </motion.button>
        </section>

        {/* RIGHT COLUMN: ANALYTICS PREVIEW */}
        <section className="lg:col-span-5 space-y-8">
          
          {/* BMI CARD */}
          <div className="bg-[#344E41] rounded-[2.5rem] p-12 text-white overflow-hidden relative shadow-2xl min-h-[320px] flex flex-col justify-center">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            
            <span className="text-[9px] font-black tracking-[0.4em] text-[#A3B18A] uppercase mb-2">Body Mass Index</span>
            
            <AnimatePresence mode="wait">
              {bmi ? (
                <motion.div 
                  key="bmi-active"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-baseline gap-4">
                    <h2 className="text-8xl font-bold tracking-tighter">{bmi}</h2>
                    <span className="text-sm font-medium opacity-60 uppercase tracking-widest">BMI</span>
                  </div>
                  
                  <div className="mt-8 flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-[10px] font-black tracking-widest">
                      {bmiInfo.label}
                    </div>
                    <div className="h-px flex-1 bg-white/10"></div>
                  </div>

                  <p className="mt-6 text-sm text-white/70 leading-relaxed italic">
                    "This metric helps us determine your baseline caloric needs for safe progress."
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  key="bmi-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12"
                >
                  <p className="text-white/40 text-sm font-medium leading-relaxed">
                    Enter your height and weight to visualize your metabolic baseline...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* GUIDELINE CARD */}
          <div className="bg-[#F1F3F0] border border-[#A3B18A]/20 rounded-3xl p-8">
            <h4 className="text-[10px] font-black tracking-[0.2em] uppercase mb-6 text-[#588157]">Plan focus</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#A3B18A]/10 pb-4">
                <span className="text-xs font-bold text-[#344E41]">Nutrition Strategy</span>
                <span className="text-[10px] font-medium text-[#A3B18A] uppercase">Macro-Balanced</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#A3B18A]/10 pb-4">
                <span className="text-xs font-bold text-[#344E41]">Health Priority</span>
                <span className="text-[10px] font-medium text-[#A3B18A] uppercase tracking-wider">
                   {formData.condition.replace('-', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#344E41]">Daily Intake</span>
                <span className="text-[10px] font-medium text-[#A3B18A] uppercase tracking-wider">Calculated Post-Submit</span>
              </div>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}