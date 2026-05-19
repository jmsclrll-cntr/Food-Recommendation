import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, Loader2, Save, ArrowLeft, Info, X, Eye, Trash2, Sun, Moon,
  Plus, RefreshCw, Search
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { getThemeStyles } from '../theme/styles';
import { DAYS } from '../utils/constants';

const GenerateWeekly = () => {
  const navigate = useNavigate();
  const [darkMode, toggleDarkMode] = useDarkMode();
  const styles = getThemeStyles(darkMode);
  const { bgMain, cardBg, border, textMain, textSub, optionStyles } = styles;

  const DYNAMIC_DAYS = useMemo(() => {
    const todayIndex = new Date().getDay();
    const jsDay = todayIndex === 0 ? 6 : todayIndex - 1;
    return [...DAYS.slice(jsDay), ...DAYS.slice(0, jsDay)];
  }, []);

  // --- ORIGINAL LOGIC & STATE ---
  const [user] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(true); 
  const [isSyncing, setIsSyncing] = useState(false); 
  const [isSubmitted, setIsSubmitted] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeDayIdx, setActiveDayIdx] = useState(0); 
  const [bmiStatus, setBmiStatus] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [dailyTarget, setDailyTarget] = useState(0);
  const [swappingMeal, setSwappingMeal] = useState(null); 
  const [dbAlternatives, setDbAlternatives] = useState([]);
  const [viewingDetails, setViewingDetails] = useState(null);
  const [isAddingTo, setIsAddingTo] = useState(null); // { day, type }
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [allergySearch, setAllergySearch] = useState("");
  const [matchingIngredients, setMatchingIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const allergyContainerRef = useRef(null);

  const [formData, setFormData] = useState({
    gender: '', height: '', weight: '', age: '', goal: '', conditions: [], activity: ''
  });

  // Logic: BMI Calculation
  const bmi = useMemo(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const h = formData.height / 100;
      return (formData.weight / (h * h)).toFixed(1);
    }
    return 0;
  }, [formData.height, formData.weight]);

  // BMR & TDEE Calculations using Mifflin-St Jeor Equation
  const calculatedBmr = useMemo(() => {
    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height);
    const a = parseFloat(formData.age);
    if (isNaN(w) || isNaN(h) || isNaN(a) || w <= 0 || h <= 0 || a <= 0) return 0;

    let val = (10 * w) + (6.25 * h) - (5 * a);
    if (formData.gender?.toLowerCase() === 'male') {
      val += 5;
    } else {
      val -= 161;
    }
    return Math.round(val);
  }, [formData.weight, formData.height, formData.age, formData.gender]);

  const calculatedTdee = useMemo(() => {
    if (calculatedBmr <= 0) return 0;
    const ACTIVITY_FACTORS = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    const factor = ACTIVITY_FACTORS[formData.activity?.toLowerCase()] || 1.3;
    return Math.round(calculatedBmr * factor);
  }, [calculatedBmr, formData.activity]);

  const recommendedCalories = useMemo(() => {
    if (calculatedTdee <= 0) return 0;
    let target = calculatedTdee;
    if (formData.goal?.toLowerCase() === 'lose') {
      target = calculatedTdee - 500;
    } else if (formData.goal?.toLowerCase() === 'gain') {
      target = calculatedTdee + 500;
    }
    return Math.round(target);
  }, [calculatedTdee, formData.goal]);

  // Click-outside listener to hide ingredients dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (allergyContainerRef.current && !allergyContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Preload unique ingredients on mount
  useEffect(() => {
    axios.get('http://localhost:5000/api/recommendations/ingredients')
      .then(res => {
        setAllIngredients(res.data);
        setMatchingIngredients(res.data.slice(0, 15));
      }).catch(err => console.error("Error preloading ingredients:", err));
  }, []);
 
  // Live allergy search via backend sequential search algorithm
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      axios.get(`http://localhost:5000/api/recommendations/search-ingredients?q=${allergySearch}`)
        .then(res => {
          setMatchingIngredients(res.data);
        }).catch(err => console.error("Allergy search error:", err));
    }, 150);
 
    return () => clearTimeout(delayDebounce);
  }, [allergySearch]);
 
  // Logic: Redirect if no user
  useEffect(() => {
    if (!user) { navigate('/'); return; }
    setLoading(false); 
  }, [navigate, user]);



  // Logic: AI Suggestion Sync
  useEffect(() => {
    if (bmi > 0 && formData.gender) {
      axios.get(`http://localhost:5000/api/recommendations/suggest?gender=${formData.gender}&bmi=${bmi}`)
        .then(res => {
          let recGoal = res.data.goal?.toLowerCase() || 'maintain';
          if (recGoal.includes('lose')) recGoal = 'lose';
          if (recGoal.includes('gain')) recGoal = 'gain';
          if (recGoal.includes('maintain')) recGoal = 'maintain';

          setSuggestion(recGoal);
          setBmiStatus(res.data.category);
          setFormData(prev => ({ ...prev, goal: prev.goal || recGoal }));
        }).catch(() => console.log("Prediction sync error."));
    }
  }, [bmi, formData.gender]);

  // Logic: Fetch Plan
  const toggleCondition = (cond) => {
    setFormData(prev => {
      const isSelected = prev.conditions.includes(cond);
      if (isSelected) {
        return { ...prev, conditions: prev.conditions.filter(c => c !== cond) };
      } else {
        return { ...prev, conditions: [...prev.conditions, cond] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.height || !formData.weight) return;
    setIsSyncing(true);
    try {
      const planRes = await axios.post('http://localhost:5000/api/recommendations/generate-plan', { ...formData, allergies: selectedAllergies });
      if (planRes.data && planRes.data.plan) {
        setWeeklyPlan(planRes.data.plan);
        setDailyTarget(planRes.data.dailyTarget);
        setIsSyncing(false);
        setIsSubmitted(true);
      }
    } catch (err) {
      setIsSyncing(false);
      alert("Error generating plan.");
    }
  };

  const handleSave = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        alert("You must be logged in to save plans.");
        return;
      }
      const userObj = JSON.parse(storedUser);
      const userId = userObj.uid || userObj.id || userObj._id;
      
      if (!userId) {
        alert("User ID not found.");
        return;
      }

      setIsSaving(true);
      await axios.post('http://localhost:5000/api/diets/save-weekly', {
        userId,
        plan: weeklyPlan
      });
      alert("Plan saved successfully!");
    } catch (err) {
      alert("Error saving plan: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  // --- NEW INTERACTIVE LOGIC ---
  const handleDeleteItem = (day, mealType, idx) => {
    const updatedPlan = { ...weeklyPlan };
    const removedItem = updatedPlan[day][mealType][idx];
    updatedPlan[day][mealType].splice(idx, 1);
    updatedPlan[day].dailyTotal -= (removedItem.calories || 0);
    setWeeklyPlan(updatedPlan);
  };

  const handleOpenSwap = async (item, day, mealType, idx) => {
    setSwappingMeal({ day, mealType, idx, original: item });
    setIsSyncing(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/recommendations/alternatives?type=${mealType}&condition=${formData.condition}&allergies=${encodeURIComponent(JSON.stringify(selectedAllergies))}`);
      setDbAlternatives(res.data);
    } catch (err) { alert("Failed to fetch alternatives."); }
    finally { setIsSyncing(false); }
  };

  const handleOpenAdd = async (day, mealType) => {
    setIsAddingTo({ day, mealType });
    setIsSyncing(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/recommendations/alternatives?type=${mealType}&condition=${formData.condition}&allergies=${encodeURIComponent(JSON.stringify(selectedAllergies))}`);
      setDbAlternatives(res.data);
    } catch (err) { alert("Failed to fetch options."); }
    finally { setIsSyncing(false); }
  };

  const handleSelectFood = (food) => {
    const updatedPlan = { ...weeklyPlan };
    if (swappingMeal) {
      const { day, mealType, idx, original } = swappingMeal;
      updatedPlan[day][mealType][idx] = food;
      updatedPlan[day].dailyTotal = updatedPlan[day].dailyTotal - (original.calories || 0) + (food.calories || 0);
      setSwappingMeal(null);
    } else if (isAddingTo) {
      const { day, mealType } = isAddingTo;
      updatedPlan[day][mealType].push(food);
      updatedPlan[day].dailyTotal += (food.calories || 0);
      setIsAddingTo(null);
    }
    setWeeklyPlan(updatedPlan);
    setDbAlternatives([]);
    setSearchQuery("");
  };

  const filteredAlternatives = useMemo(() => {
    if (!searchQuery) return dbAlternatives;
    return dbAlternatives.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [dbAlternatives, searchQuery]);

  const getImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000';
    try {
      // Decode if it's a search engine redirect or viewer link
      if (url.includes('imgurl=') || url.includes('url=') || url.includes('q=')) {
        const urlObj = new URL(url);
        const imgUrl = urlObj.searchParams.get('imgurl') || urlObj.searchParams.get('url') || urlObj.searchParams.get('q');
        if (imgUrl) {
          let decoded = decodeURIComponent(imgUrl);
          if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) {
            decoded = 'https://' + decoded;
          }
          return decoded;
        }
      }
    } catch (e) {
      console.error("Error parsing search image URL:", e);
    }
    return url;
  };

  const renderIngredients = () => {
    const ing = viewingDetails?.ingredients;
    if (!ing) return null;

    let list = [];
    if (Array.isArray(ing)) {
      list = ing;
    } else if (typeof ing === 'string') {
      if (ing.trim().startsWith('[') && ing.trim().endsWith(']')) {
        try {
          list = JSON.parse(ing);
        } catch (e) {
          list = ing.split(',').map(x => x.trim());
        }
      } else {
        list = ing.split(',').map(x => x.trim());
      }
    }

    // Filter empty items
    list = list.filter(item =>  item && item.trim().length > 0);
    if (list.length === 0) return null;

    return (
      <div className="mt-6 border-t border-white/5 pt-6">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#2d5a27] dark:text-[#5cb351] mb-3">Ingredients</p>
        <div className="flex flex-wrap gap-2">
          {list.map((item, idx) => (
            <span 
              key={idx} 
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border ${
                darkMode 
                  ? 'bg-white/5 border-white/10 text-white/80' 
                  : 'bg-[#f5faf4] border-[#2d5a27]/10 text-[#2d5a27]'
              } transition-colors`}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const generateInsight = () => {
    if (!formData.gender || !formData.age || !formData.height || !formData.weight) {
      return "Input metrics to sync dynamic biometrics calculation and target goals.";
    }
    
    const actMap = {
      sedentary: "sedentary",
      light: "lightly active",
      moderate: "moderately active",
      active: "very active",
      very_active: "super active"
    };
    
    const act = actMap[formData.activity?.toLowerCase()] || "moderately active";
    let conditionText = '';
    if (formData.conditions && formData.conditions.length > 0) {
      let restrictions = [];
      if (formData.conditions.includes('diabetes')) restrictions.push('high sugar');
      if (formData.conditions.includes('hypertension')) restrictions.push('high sodium');
      if (formData.conditions.includes('heart disease')) restrictions.push('high fat and sodium');
      
      const uniqueRestrictions = [...new Set(restrictions.flatMap(r => r.split(' and ')))].join(' and ');
      conditionText = ` Given your ${formData.conditions.join(' and ')} condition(s), we strictly filtered out ${uniqueRestrictions} foods from your plan.`;
    }
    const allergyText = selectedAllergies.length > 0 
      ? ` We are strictly omitting ${selectedAllergies.length} allergen(s) from this profile.` 
      : ' No dietary restrictions applied.';

    const goalLabel = formData.goal || suggestion || 'maintain';
    return `Based on your biometrics (Age: ${formData.age}, ${formData.gender}, ${formData.height}cm, ${formData.weight}kg), your body's baseline energy requirement (BMR) is ${calculatedBmr} kcal. Factoring in a ${act} lifestyle, your daily burn (TDEE) is approx ${calculatedTdee} kcal. To successfully ${goalLabel.toUpperCase()} weight, we recommend a target intake of ${recommendedCalories || dailyTarget || calculatedTdee} kcal.${conditionText}${allergyText} Your BMI of ${bmi} (${bmiStatus || 'Normal'}) is factored into these nutritional optimizations.`;
  };

  if (loading) return <div className={`h-screen flex items-center justify-center ${bgMain}`}><Loader2 className="animate-spin text-[#4a8a43] dark:text-[#6bcf5f]" /></div>;

  return (
    <div className={`h-screen w-full ${bgMain} ${textMain} p-10 overflow-hidden relative flex flex-col transition-all duration-500 ease-in-out`}>
      
      {/* HEADER */}
      <header className="flex items-center justify-between mb-8 relative z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className={`text-[10px] font-bold uppercase tracking-[0.3em] ${textSub} hover:text-[#2d5a27] dark:hover:text-[#5cb351] flex items-center gap-2 transition-all`}>
              <ArrowLeft size={14} /> Hub
          </button>
          <div className="text-left">
            <h2 className="font-serif text-2xl italic">NutriFind</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#2d5a27] dark:text-[#5cb351]">Biometric Intelligence</p>
          </div>
        </div>
        <button onClick={toggleDarkMode} className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-black/10 text-[#2d5a27] dark:text-[#5cb351] hover:bg-black/5'}`}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>
 
      <div className={`grid flex-1 min-h-0 transition-all duration-500 ease-in-out ${isSubmitted ? 'grid-cols-12 gap-6 lg:gap-10' : 'grid-cols-1'}`}>
        
        {/* LEFT COLUMN (SIDEBAR) */}
        <motion.div 
          layout 
          transition={{ type: "spring", stiffness: 400, damping: 38, mass: 0.8 }}
          className={`${isSubmitted ? 'col-span-4 lg:col-span-3 overflow-y-auto custom-scrollbar pr-2' : 'max-w-2xl mx-auto w-full'} flex flex-col h-full gap-6 min-h-0`}
        >
            {/* Input Card */}
            {!isSubmitted ? (
              <main className={`${cardBg} p-6 clay-card overflow-y-auto transition-colors custom-scrollbar flex-1`}>
                <h3 className="font-serif text-3xl mb-6 italic">Biometrics</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className={`w-full h-10 ${darkMode ? 'bg-[#1a1c1a]' : 'bg-transparent'} border-b ${border} outline-none text-sm`} required>
                      <option className={optionStyles} value="" disabled>Select</option>
                      <option className={optionStyles} value="male">Male</option>
                      <option className={optionStyles} value="female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Age (yrs)</label>
                    <input type="number" placeholder="Age" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className={`w-full h-10 bg-transparent border-b ${border} outline-none text-sm`} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Height (cm)</label>
                    <input type="number" placeholder="Height" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} className={`w-full h-10 bg-transparent border-b ${border} outline-none text-sm`} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Weight (kg)</label>
                    <input type="number" placeholder="Weight" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className={`w-full h-10 bg-transparent border-b ${border} outline-none text-sm`} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Activity Level</label>
                    <select value={formData.activity} onChange={e => setFormData({...formData, activity: e.target.value})} className={`w-full h-12 px-4 border ${border} ${darkMode ? 'bg-[#1a1c1a]' : 'bg-white'} text-xs font-bold clay-input`} required>
                      <option className={optionStyles} value="" disabled>Select</option>
                      <option className={optionStyles} value="sedentary">Sedentary (No Exercise)</option>
                      <option className={optionStyles} value="light">Lightly Active (1-3 days/wk)</option>
                      <option className={optionStyles} value="moderate">Moderately Active (3-5 days/wk)</option>
                      <option className={optionStyles} value="active">Very Active (6-7 days/wk)</option>
                      <option className={optionStyles} value="very_active">Super Active (Extreme)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Goal</label>
                    <select value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value})} className={`w-full h-12 px-4 border ${suggestion ? 'border-[#2d5a27] dark:border-[#5cb351]' : border} ${darkMode ? 'bg-[#1a1c1a]' : 'bg-white'} text-xs font-bold clay-input`} required>
                      <option className={optionStyles} value="" disabled>Select</option>
                      <option className={optionStyles} value="lose">Weight Loss {suggestion === 'lose' && '(most pick)'}</option>
                      <option className={optionStyles} value="gain">Weight Gain {suggestion === 'gain' && '(most pick)'}</option>
                      <option className={optionStyles} value="maintain">Maintenance {suggestion === 'maintain' && '(most pick)'}</option>
                    </select>
                  </div>
                </div>

                {/* Health Conditions Section */}
                <div className="space-y-3 pt-2">
                   <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Health Conditions</label>
                   <div className="flex flex-wrap gap-2">
                       {['Diabetes', 'Hypertension', 'Heart Disease'].map(cond => {
                          const val = cond.toLowerCase();
                          const isSelected = formData.conditions.includes(val);
                          return (
                             <div 
                               key={val}
                               onClick={() => toggleCondition(val)}
                               className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase cursor-pointer select-none transition-colors ${isSelected ? 'bg-[#2d5a27] dark:bg-[#5cb351] text-white border-transparent' : `border-${border} ${textSub} hover:border-[#2d5a27]/50 dark:hover:border-[#5cb351]/50`}`}
                             >
                               {cond}
                             </div>
                          )
                       })}
                   </div>
                </div>
 
                {/* Allergy Filter Section */}
                <div ref={allergyContainerRef} className="space-y-4 pt-4 border-t border-white/5 relative">
                  <div className="flex items-center justify-between">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${textSub}`}>Allergies & Excluded Ingredients</label>
                    <span className="text-[8px] font-bold uppercase px-2 py-0.5 bg-[#2d5a27]/10 dark:bg-[#5cb351]/10 text-[#2d5a27] dark:text-[#5cb351] rounded-full">KNN Filter</span>
                  </div>
                  
                  {/* Allergy Search Input & Dropdown container */}
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search ingredients..." 
                      value={allergySearch} 
                      onChange={e => {
                        setAllergySearch(e.target.value);
                        setShowDropdown(true);
                      }} 
                      onFocus={() => setShowDropdown(true)}
                      onClick={() => setShowDropdown(prev => !prev)}
                      className={`w-full h-11 pl-10 pr-4 rounded-xl border ${border} ${darkMode ? 'bg-[#1a1c1a] text-white' : 'bg-white text-black'} text-xs font-semibold outline-none transition-all duration-300 focus:border-[#2d5a27] dark:focus:border-[#5cb351] clay-input`}
                    />
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-45" />

                    {/* Matching Ingredients list with checkboxes as real floating absolute dropdown overlay */}
                    {showDropdown && matchingIngredients.length > 0 && (
                      <div className={`absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto space-y-2.5 p-3.5 border ${border} rounded-xl shadow-2xl z-[99] custom-scrollbar ${
                        darkMode ? 'bg-[#1a1c1a] text-white' : 'bg-white text-black'
                      }`}>
                        {matchingIngredients.map(ing => {
                          const isChecked = selectedAllergies.includes(ing);
                          return (
                            <label key={ing} className="flex items-center gap-3 cursor-pointer select-none group">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedAllergies(prev => prev.filter(x => x !== ing));
                                  } else {
                                    setSelectedAllergies(prev => [...prev, ing]);
                                  }
                                }}
                                className="hidden"
                              />
                              <div className={`w-[18px] h-[18px] rounded-md flex items-center justify-center border transition-all duration-300 ${
                                isChecked 
                                  ? 'bg-[#2d5a27] dark:bg-[#5cb351] border-transparent scale-105' 
                                  : `border-black/20 dark:border-white/20 hover:border-[#2d5a27] dark:hover:border-[#5cb351]`
                              }`}>
                                {isChecked && <CheckCircle size={10} className="text-white" />}
                              </div>
                              <span className="text-[11px] font-semibold opacity-75 group-hover:opacity-100 transition-opacity">{ing}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
 
                  {/* Selected Allergies wrap */}
                  {selectedAllergies.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className={`text-[8px] font-black uppercase tracking-widest ${textSub} opacity-40`}>Active Exclusions ({selectedAllergies.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAllergies.map(ing => (
                          <div 
                            key={ing} 
                            onClick={() => setSelectedAllergies(prev => prev.filter(x => x !== ing))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border border-[#2d5a27]/20 dark:border-[#5cb351]/20 hover:bg-[#2d5a27]/10 dark:hover:bg-[#5cb351]/10 hover:border-red-500/50 hover:text-red-500 transition-all duration-300 ${
                              darkMode ? 'bg-[#5cb351]/10 text-[#5cb351]' : 'bg-[#2d5a27]/10 text-[#2d5a27]'
                            }`}
                          >
                            {ing} <X size={10} className="opacity-60" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-center mt-2">
                  <button type="submit" className={`w-full max-w-[200px] h-11 bg-[#2d5a27] dark:bg-[#5cb351] text-white font-bold text-[9px] uppercase tracking-[0.3em] transition-all hover:scale-[1.05] active:scale-[0.95] clay-btn rounded-xl flex items-center justify-center`}>
                    {isSyncing ? <Loader2 className="animate-spin mx-auto" /> : "Generate Plan"}
                  </button>
                </div>
              </form>
            </main>
            ) : (
              <div className={`${cardBg} p-6 clay-card flex flex-col transition-colors flex-shrink-0 mb-4`}>
                <h3 className="font-serif text-2xl mb-6 italic text-center">Your Biometrics</h3>
                
                <div className="flex flex-col gap-y-5 mb-8 px-2 w-full">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textSub} opacity-60`}>Gender</p>
                    <p className="text-sm font-bold capitalize">{formData.gender}</p>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textSub} opacity-60`}>Age</p>
                    <p className="text-sm font-bold">{formData.age} yrs</p>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textSub} opacity-60`}>Height</p>
                    <p className="text-sm font-bold">{formData.height} cm</p>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textSub} opacity-60`}>Weight</p>
                    <p className="text-sm font-bold">{formData.weight} kg</p>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textSub} opacity-60`}>Activity</p>
                    <p className="text-sm font-bold capitalize text-right ml-4 leading-tight">{formData.activity.replace('_', ' ')}</p>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textSub} opacity-60`}>Goal</p>
                    <p className="text-sm font-bold capitalize text-right ml-4 leading-tight">{formData.goal}</p>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textSub} opacity-60`}>Conditions</p>
                    <p className="text-sm font-bold capitalize text-right ml-4 leading-tight">{formData.conditions.length > 0 ? formData.conditions.join(', ') : 'None'}</p>
                  </div>
                  {bmi > 0 && (
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${textSub} opacity-60`}>BMI</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${darkMode ? 'text-[#5cb351]' : 'text-[#2d5a27]'}`}>{bmi}</p>
                        {bmiStatus && (
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${darkMode ? 'bg-[#5cb351]/15 text-[#5cb351]' : 'bg-[#2d5a27]/10 text-[#2d5a27]'}`}>
                            {bmiStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedAllergies.length > 0 && (
                    <div className="flex flex-col gap-3 pt-2">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${textSub} opacity-60`}>Exclusions</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedAllergies.map(a => (
                          <span key={a} className="px-3 py-1.5 text-[11px] font-bold bg-[#4a8a43]/10 dark:bg-[#6bcf5f]/10 text-[#4a8a43] dark:text-[#6bcf5f] rounded-md">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className={`flex-1 py-4 border border-[#4a8a43] dark:border-[#6bcf5f] text-[#4a8a43] dark:text-[#6bcf5f] font-bold text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-[#4a8a43]/10 dark:hover:bg-[#6bcf5f]/10 clay-btn`}
                  >
                    Edit Inputs
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex-1 py-4 bg-[#4a8a43] dark:bg-[#6bcf5f] text-white font-bold text-[10px] uppercase tracking-[0.3em] transition-all hover:bg-[#3d7a35] dark:hover:bg-[#5cb351] flex items-center justify-center gap-2 clay-btn disabled:opacity-50`}
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                    {isSaving ? 'Saving...' : 'Save Plan'}
                  </button>
                </div>
              </div>
            )}
            {/* AI INSIGHT CARD */}
            <div className="mt-6 pb-2 flex-shrink-0">
              <div className="bg-[#4a8a43] dark:bg-[#6bcf5f] p-5 text-white flex flex-col justify-center transition-colors clay-card">
                <div className="flex items-center gap-2 mb-2">
                    <Info size={12} className="text-white/80" />
                    <h4 className="text-[8px] font-black uppercase tracking-widest text-white/70">AI Insight</h4>
                </div>
                <p className="text-[10px] leading-relaxed italic opacity-90">
                    {generateInsight()}
                </p>
              </div>
            </div>

            {/* Removed RELOCATED SAVE BUTTON */}
        </motion.div>

        {/* RIGHT COLUMN (WEEKLY PLAN POP-UP) */}
        {isSubmitted && weeklyPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-9 flex flex-col gap-6 min-h-0">

            {/* Day Selector Icons */}
            <div className="flex items-center gap-3">
              {DYNAMIC_DAYS.map((day, idx) => (
                <button
                  key={day}
                  onClick={() => setActiveDayIdx(idx)}
                  className={`flex-1 py-3 transition-all duration-300 flex flex-col items-center gap-1 clay-btn
                    ${activeDayIdx === idx 
                      ? 'bg-[#2d5a27] dark:bg-[#5cb351] text-white scale-105' 
                      : `${cardBg} ${textSub} hover:border-[#2d5a27] dark:hover:border-[#5cb351]`
                    }`}
                >
                  <span className="text-[8px] font-black uppercase opacity-60">Day 0{idx+1}</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter">{day.substring(0, 3)}</span>
                </button>
              ))}
            </div>
 
            {/* Content Stage */}
            <div className="flex-1 min-h-0 flex flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDayIdx}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                    className={`${cardBg} p-8 flex-1 flex flex-col min-h-0 transition-colors clay-card`}
                  >
                    <div className="flex justify-between items-center mb-8 border-b pb-6 border-white/5">
                      <h2 className="font-serif text-3xl italic">{DYNAMIC_DAYS[activeDayIdx]} Narrative</h2>
                      <div className="flex gap-8 text-right items-center">
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${textSub}`}>Intake Total</p>
                          <p className={`text-xl font-serif italic ${darkMode ? 'text-[#5cb351]' : 'text-[#2d5a27]'}`}>{weeklyPlan[DYNAMIC_DAYS[activeDayIdx]].dailyTotal} <span className="text-[10px] not-italic font-bold opacity-40">kcal</span></p>
                        </div>
                        {calculatedBmr > 0 && (
                          <div className="pl-8 border-l border-white/5">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${textSub}`}>Computed BMR</p>
                            <p className={`text-xl font-serif italic ${darkMode ? 'text-[#5cb351]' : 'text-[#2d5a27]'}`}>{calculatedBmr} <span className="text-[10px] not-italic font-bold opacity-40">kcal</span></p>
                          </div>
                        )}

                        {(dailyTarget > 0 || recommendedCalories > 0) && (
                          <div className="pl-8 border-l border-white/5">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${textSub}`}>Target Goal</p>
                            <p className={`text-xl font-serif italic ${darkMode ? 'text-[#5cb351]' : 'text-[#2d5a27]'}`}>{dailyTarget || recommendedCalories} <span className="text-[10px] not-italic font-bold opacity-40">kcal</span></p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
                      {['breakfast', 'lunch', 'dinner'].map((m) => (
                        <div key={m} className={`flex flex-col bg-black/5 border ${darkMode ? 'border-white/10' : 'border-[#2d5a27]/10'} rounded-xl p-5 h-full min-h-0`}>
                          <p className={`text-xs font-black uppercase mb-4 tracking-widest ${darkMode ? 'text-[#5cb351]' : 'text-[#2d5a27]'}`}>{m}</p>
                          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {weeklyPlan[DYNAMIC_DAYS[activeDayIdx]][m].map((item, idx) => (
                              <div key={idx} className={`${darkMode ? 'bg-white/5 border-white/20' : 'bg-white border-[#2d5a27]/30'} border p-5 flex flex-col gap-4 group/item transition-all clay-card`}>
                                <div className="flex-1">
                                  <span className="text-sm font-black block mb-1 leading-tight">{item.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold ${textSub} opacity-50 uppercase tracking-widest`}>{item.calories} kcal</span>
                                    <span className={`w-1 h-1 rounded-full ${darkMode ? 'bg-[#5cb351]/30' : 'bg-[#2d5a27]/30'}`}></span>
                                    <span className={`text-[10px] font-bold ${textSub} opacity-50 uppercase tracking-widest`}>{item.grams}g</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                  <button 
                                    onClick={() => setViewingDetails(item)} 
                                    className={`flex-1 py-2 flex items-center justify-center gap-2 transition-all bg-[#2d5a27] dark:bg-[#5cb351] text-white hover:scale-105 clay-btn`}
                                  >
                                    <Eye size={14}/> 
                                    <span className="text-[8px] font-black uppercase tracking-widest">Details</span>
                                  </button>
                                  <button 
                                    onClick={() => handleOpenSwap(item, DYNAMIC_DAYS[activeDayIdx], m, idx)} 
                                    className={`flex-1 py-2 flex items-center justify-center gap-2 transition-all bg-[#2d5a27] dark:bg-[#5cb351] text-white hover:scale-105 clay-btn`}
                                  >
                                    <RefreshCw size={14}/> 
                                    <span className="text-[8px] font-black uppercase tracking-widest">Swap</span>
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteItem(DYNAMIC_DAYS[activeDayIdx], m, idx)} 
                                    className={`flex-1 py-2 flex items-center justify-center gap-2 transition-all bg-[#2d5a27] dark:bg-[#5cb351] text-white hover:scale-105 clay-btn`}
                                  >
                                    <Trash2 size={14}/> 
                                    <span className="text-[8px] font-black uppercase tracking-widest">Drop</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button 
                            onClick={() => handleOpenAdd(DYNAMIC_DAYS[activeDayIdx], m)}
                            className={`w-full py-3 mt-4 text-[9px] font-black uppercase tracking-widest ${textSub} hover:border-[#2d5a27] dark:hover:border-[#5cb351] hover:text-[#2d5a27] dark:hover:text-[#5cb351] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] clay-btn`}
                          >
                            <Plus size={12} /> Add Meal
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>


      {/* ITEM DETAILS MODAL */}
      <AnimatePresence>
        {viewingDetails && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center p-6"
            onClick={() => setViewingDetails(null)}
          >
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={`${cardBg} w-full max-w-4xl overflow-hidden relative clay-card`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col md:flex-row h-full">
                <div className="md:w-[55%] h-80 md:h-auto bg-gray-100 overflow-hidden relative">
                   <img 
                      src={getImageUrl(viewingDetails.imageUrl || viewingDetails.imageURL || viewingDetails.image || viewingDetails.imagePath)} 
                      alt={viewingDetails.name}
                      className="w-full h-full object-cover"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                      <h2 className="font-serif text-3xl italic text-white">{viewingDetails.name}</h2>
                   </div>
                </div>
                <div className="md:w-[45%] p-8 overflow-y-auto max-h-[85vh]">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#2d5a27] dark:text-[#5cb351] mb-1">Nutritional Analysis</p>
                      <p className={`text-xs ${textSub} italic`}>Organic Recommendation</p>
                    </div>
                    <button onClick={() => setViewingDetails(null)} className={`p-2 rounded-xl ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} clay-btn`}><X size={18}/></button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'} border ${border}`}>
                      <p className="text-[8px] font-black uppercase text-[#2d5a27] dark:text-[#5cb351] mb-1">Energy</p>
                      <p className="text-xl font-serif italic text-[#2d5a27] dark:text-[#5cb351]">{viewingDetails.calories} <span className="text-[10px] not-italic font-bold opacity-40">kcal</span></p>
                    </div>
                    <div className={`p-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'} border ${border}`}>
                      <p className="text-[8px] font-black uppercase text-[#2d5a27] dark:text-[#5cb351] mb-1">Portion</p>
                      <p className="text-xl font-serif italic text-[#2d5a27] dark:text-[#5cb351]">{viewingDetails.grams} <span className="text-[10px] not-italic font-bold opacity-40">g</span></p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: 'Protein', value: viewingDetails.protein, unit: 'g' },
                      { label: 'Carbs', value: viewingDetails.carbs || viewingDetails.carbohydrates, unit: 'g' },
                      { label: 'Fats', value: viewingDetails.fat || viewingDetails.saturatedFat, unit: 'g' },
                      { label: 'Sugar', value: viewingDetails.sugar, unit: 'g' },
                      { label: 'Sodium', value: viewingDetails.sodium, unit: 'mg' },
                      { label: 'Fiber', value: viewingDetails.fiber, unit: 'g' },
                    ]
                    .filter(n => n.value !== undefined && n.value !== null)
                    .map((n, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>{n.label}</span>
                        <span className="text-xs font-bold">{n.value}{n.unit}</span>
                      </div>
                    ))}
                  </div>

                  {/* INGREDIENTS */}
                  {renderIngredients()}

                  <button 
                    onClick={() => setViewingDetails(null)}
                    className="w-full py-4 bg-[#2d5a27] dark:bg-[#5cb351] text-white font-bold text-[9px] uppercase tracking-[0.3em] hover:bg-[#1c3a1c] dark:hover:bg-[#3d8a35] transition-all mt-8 clay-btn"
                  >
                    Close Protocol
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SELECTION MODAL (For Swap/Add) */}
      <AnimatePresence>
        {(swappingMeal || isAddingTo) && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center p-6"
            onClick={() => { setSwappingMeal(null); setIsAddingTo(null); setDbAlternatives([]); setSearchQuery(""); }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={`${cardBg} w-full max-w-4xl h-[80vh] overflow-hidden relative flex flex-col clay-card`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-10 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h2 className="font-serif text-3xl italic">
                    {swappingMeal ? `Swap ${swappingMeal.original.name}` : `Add to ${isAddingTo.type} Schedule`}
                  </h2>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${textSub} mt-2`}>
                    Browse biological alternatives for {swappingMeal?.mealType || isAddingTo?.type}
                  </p>
                </div>
                <button onClick={() => { setSwappingMeal(null); setIsAddingTo(null); setDbAlternatives([]); }} className={`p-3 rounded-xl ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'} clay-btn`}><X size={20}/></button>
              </div>

              <div className="p-10 flex-1 overflow-hidden flex flex-col gap-8">
                <div className="relative">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${textSub}`} size={18} />
                  <input 
                    type="text" 
                    placeholder="Search database..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full h-14 pl-12 pr-6 ${darkMode ? 'bg-white/5' : 'bg-[#f5faf4]'} border ${border} outline-none focus:border-[#2d5a27] dark:focus:border-[#5cb351] transition-all clay-input`}
                  />
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-4 custom-scrollbar pr-2">
                  {filteredAlternatives.map((alt) => (
                    <motion.div 
                      key={alt.id}
                      whileHover={{ y: -5 }}
                      onClick={() => handleSelectFood(alt)}
                      className={`${darkMode ? 'bg-white/5' : 'bg-white'} border ${border} p-4 cursor-pointer group transition-all clay-card`}
                    >
                      <div className="h-32 rounded-xl overflow-hidden mb-4">
                        <img src={getImageUrl(alt.imageUrl || alt.imageURL || alt.image || alt.imagePath)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h4 className="text-sm font-bold truncate mb-1">{alt.name}</h4>
                      <p className={`text-[10px] ${textSub}`}>{alt.calories} kcal • {alt.grams}g</p>
                      <button className="w-full mt-4 py-2 bg-[#2d5a27]/10 dark:bg-[#5cb351]/10 text-[#2d5a27] dark:text-[#5cb351] rounded-lg text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Select</button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {showToast && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <div className={`${cardBg} p-12 rounded-[20px] text-center border-4 border-[#2d5a27] dark:border-[#5cb351]`}>
                    <CheckCircle size={48} className="text-[#2d5a27] dark:text-[#5cb351] mx-auto mb-4" />
                    <h2 className="font-serif text-3xl">Plan Saved!</h2>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `.custom-scrollbar::-webkit-scrollbar { width: 3px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #6a9966; border-radius: 10px; }` }} />
    </div>
  );
};

export default GenerateWeekly;