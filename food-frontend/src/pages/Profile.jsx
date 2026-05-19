import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// --- ADDED THIS IMPORT ---
import axios from 'axios'; 
import {
  ArrowLeft, Mail, ShieldCheck, Calendar, Weight, Ruler, Activity, Moon, Sun, Edit2, Save, X, Trash2
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { generateRandomAvatar } from '../utils/avatarGenerator';

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [darkMode, toggleDarkMode] = useDarkMode();

  const [user, setUser] = useState(() => {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Initialize editForm when user data loads
  useEffect(() => {
    if (user) {
      setEditForm({ ...user });
    } else {
      navigate('/');
    }
  }, [user, navigate]);

  const [prefs, setPrefs] = useState({
    notifications: true,
    publicProfile: false
  });

  const userImage = useMemo(() => {
    if (!user) return "";
    return user.profilePic || generateRandomAvatar(user.username || user.name || "U");
  }, [user]);

  const calculateBMI = (w, h) => {
    const weight = parseFloat(w);
    const height = parseFloat(h);
    if (!weight || !height) return "0.0";
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const handleImageClick = () => fileInputRef.current.click();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // When image changes, we save it immediately
        const updatedUser = { ...user, profilePic: reader.result };
        saveUserData(updatedUser);
      };
      reader.readAsDataURL(file);
    }
  };

 const saveUserData = async (newData) => {
    try {
      // 1. Determine which ID to use (backend usually prefers _id or id)
      const userId = user._id || user.id || user.uid;
      
      if (!userId) {
        console.error("No User ID found");
        return;
      }

      // 2. Clean the data (optional but recommended)
      // We remove things the backend might not want, like the password
      const { password, ...updateData } = newData;

      // 3. TRY THE UPDATE
      // Check your backend: Is it /api/auth/update/ or /api/users/update/?
      const response = await axios.put(`http://localhost:5000/api/auth/update/${userId}`, updateData);
      
      // 4. If successful, update everything
      const updatedUser = response.data.user || response.data; // Handle different API response structures
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditForm(updatedUser);
      setIsEditing(false);
      
      alert("Profile Synced with Server!");
    } catch (err) {
      console.error("Server Sync Error:", err.response?.data || err.message);
      
      // FALLBACK: Still save locally so the user doesn't lose progress
      localStorage.setItem('user', JSON.stringify(newData));
      setUser(newData);
      setIsEditing(false);
      alert("Saved locally, but the server didn't respond. Check your connection.");
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm("WARNING: This will permanently delete your profile. Proceed?")) {
      localStorage.clear();
      navigate('/');
    }
  };

  if (!user) return null;

  const panelBg = darkMode ? 'bg-[#2b1d4d]' : 'bg-[#fff7e8]';
  const cardBg = darkMode ? 'bg-[#3d2969]' : 'bg-white';
  const textMain = darkMode ? 'text-white' : 'text-[#2d1b4e]';
  const textSub = darkMode ? 'text-purple-200' : 'text-[#5c4b7f]';
  const borderStyle = 'border-[4px] border-black';
  const shadowStyle = 'shadow-[8px_8px_0px_#000]';

  return (
    <div className={`relative min-h-screen w-full flex flex-col p-6 md:p-10 transition-colors duration-500 overflow-x-hidden`}
      style={{ background: darkMode ? 'linear-gradient(135deg,#1d1436,#241744,#301c56)' : 'linear-gradient(135deg,#ffe9b3,#ffd86b,#ffb347)' }}>
      
      <div className="relative z-10 flex flex-col h-full max-w-6xl mx-auto w-full">
        <header className="flex items-center justify-between mb-10 flex-shrink-0">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-3 px-5 py-2.5 bg-black text-white border-[3px] border-black shadow-[4px_4px_0px_#ffcf5a] text-[10px] font-black uppercase hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            <ArrowLeft size={14} /> Back to Hub
          </button>
          <div className="text-right">
            <h2 className={`text-3xl font-black ${textMain}`}>NutriFind</h2>
            <p className="text-[10px] font-black uppercase text-[#ffcf5a] drop-shadow-[1px_1px_0px_#000]">Identity Card</p>
          </div>
          <button onClick={toggleDarkMode} className={`w-11 h-11 rounded-full border-[4px] border-black flex items-center justify-center transition-all shadow-[4px_4px_0px_#000] ${darkMode ? 'bg-[#ffcf5a] text-black' : 'bg-[#2b1d4d] text-[#ffcf5a]'}`}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <div className="flex-1 grid grid-cols-12 gap-8 overflow-y-auto pr-2 custom-scrollbar">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="col-span-12 lg:col-span-4 space-y-8">
            <div className={`${cardBg} ${borderStyle} ${shadowStyle} p-10 text-center rounded-[30px]`}>
              <div className="relative w-36 h-36 mx-auto mb-6">
                <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                
                <img 
                  src={userImage}
                  alt="Profile" 
                  className="relative w-full h-full object-cover rounded-full border-[5px] border-black shadow-[5px_5px_0px_#000]" 
                  onError={(e) => { e.target.src = generateRandomAvatar(user.username || "U"); }}
                />

                <button onClick={handleImageClick} className="absolute bottom-1 right-1 p-2.5 bg-[#ffcf5a] text-black rounded-full border-[3px] border-black hover:scale-110 shadow-[3px_3px_0px_#000] transition-transform">
                    <Edit2 size={14} />
                </button>
              </div>

              {isEditing ? (
                <input 
                  type="text" 
                  value={editForm.username || ''} 
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  className="w-full text-center bg-transparent text-2xl font-black border-b-4 border-black outline-none mb-2 text-black" 
                  placeholder="Username"
                />
              ) : (
                <h1 className={`text-3xl font-black mb-1 ${textMain}`}>{user.username || user.name}</h1>
              )}

              <p className="text-[10px] font-black text-[#ffcf5a] uppercase tracking-[0.25em] mb-8 drop-shadow-[1px_1px_0px_#000]">
                Premium Member
              </p>

              <div className={`flex flex-col gap-4 text-left border-t-[3px] border-black pt-8`}>
                <ProfileStat icon={<Mail size={14} />} text={user.email} />
                <ProfileStat icon={<ShieldCheck size={14} />} text="Verified Account" />
                <ProfileStat icon={<Calendar size={14} />} text={`Joined ${user.joinedDate || 'Jan 2024'}`} />
              </div>
            </div>

            <button 
              onClick={() => isEditing ? saveUserData(editForm) : setIsEditing(true)} 
              className={`w-full ${isEditing ? 'bg-green-400' : 'bg-[#ffcf5a]'} text-black border-[4px] border-black py-4 text-[11px] font-black uppercase shadow-[6px_6px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2`}
            >
              {isEditing ? <><Save size={16}/> Save Changes</> : <><Edit2 size={16}/> Edit Detailed Profile</>}
            </button>
            
            {isEditing && (
                <button 
                  onClick={() => { setIsEditing(false); setEditForm({...user}); }} 
                  className="w-full bg-white text-black border-[4px] border-black py-2 font-black uppercase text-[10px] mt-[-10px]"
                >
                  Cancel
                </button>
            )}
          </motion.div>

          {/* RIGHT: CONTENT (Bio, Stats, etc.) */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.1 }} 
            className="col-span-12 lg:col-span-8 space-y-8 pb-10"
          >
            {/* BIO SECTION */}
            <section className={`${cardBg} ${borderStyle} ${shadowStyle} p-8 rounded-[30px]`}>
              <h3 className={`text-xl font-black uppercase mb-4 ${textMain}`}>Bio / Narrative</h3>
              {isEditing ? (
                <textarea 
                  value={editForm.bio || ''} 
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  className="w-full h-24 p-4 border-[3px] border-black rounded-xl font-bold bg-white text-black outline-none focus:bg-[#ffcf5a]/10" 
                  placeholder="Tell us about your fitness journey..." 
                />
              ) : (
                <p className={`text-sm font-bold leading-relaxed ${textSub} italic`}>
                  "{user.bio || 'No Personal Narrative yet... Stay tuned for your story.'}"
                </p>
              )}
            </section>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <EditableInfoCard 
                darkMode={darkMode} 
                icon={<Weight size={20} />} 
                label="Weight" 
                value={isEditing ? editForm.weight : user.weight} 
                suffix="kg" 
                isEditing={isEditing} 
                onChange={(val) => setEditForm({ ...editForm, weight: val })} 
              />

              <EditableInfoCard 
                darkMode={darkMode} 
                icon={<Ruler size={20} />} 
                label="Height"
                value={isEditing ? editForm.height : user.height} 
                suffix="cm" 
                isEditing={isEditing}
                onChange={(val) => setEditForm({ ...editForm, height: val })} 
              />

              <InfoCard 
                darkMode={darkMode} 
                icon={<Activity size={20} />} 
                label="Live BMI"
                value={calculateBMI(isEditing ? editForm.weight : user.weight, isEditing ? editForm.height : user.height)} 
              />
            </div>

            {/* SECURITY & PREFERENCES */}
            <div className={`${cardBg} ${borderStyle} ${shadowStyle} overflow-hidden rounded-[30px]`}>
              <div className="px-8 py-5 border-b-[4px] border-black bg-black/5">
                <h4 className="text-[11px] font-black uppercase text-[#ffcf5a] drop-shadow-[1px_1px_0px_#000]">Security & Preferences</h4>
              </div>

              <div className="p-8 space-y-6">
                <ToggleRow 
                  label="Email Notifications" 
                  sub="Weekly reports and alerts"
                  active={prefs.notifications} 
                  onClick={() => setPrefs({ ...prefs, notifications: !prefs.notifications })} 
                />

                <ToggleRow 
                  label="Public Profile" 
                  sub="Allow others to see your badges"
                  active={prefs.publicProfile} 
                  onClick={() => setPrefs({ ...prefs, publicProfile: !prefs.publicProfile })} 
                />

                <div className={`pt-6 border-t-[4px] border-black flex justify-between items-center`}>
                  <span className={`text-sm font-black uppercase ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Danger Zone</span>
                  <button 
                    onClick={handleDeleteAccount} 
                    className="text-[10px] font-black uppercase px-6 py-2.5 border-[3px] border-black bg-red-500 text-white shadow-[4px_4px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Delete Account
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CUSTOM SCROLLBAR CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: black; border-radius: 20px; border: 3px solid ${darkMode ? '#2b1d4d' : '#fff7e8'}; }
        .custom-scrollbar { scrollbar-width: thin; scrollbar-color: black transparent; }
      ` }} />
    </div>
  );
};

// --- SUB-COMPONENTS ---

const ProfileStat = ({ icon, text }) => (
  <div className="flex items-center gap-4">
    <div className="p-2 rounded-lg border-[2px] border-black bg-white shadow-[3px_3px_0px_#000] text-black">
      {icon}
    </div>
    <span className="text-xs font-black tracking-wide truncate opacity-80">{text || 'Not Set'}</span>
  </div>
);

const ToggleRow = ({ label, sub, active, onClick }) => (
  <div className="flex justify-between items-center">
    <div>
      <p className="text-sm font-black text-black">{label}</p>
      <p className="text-[10px] font-bold text-gray-400">{sub}</p>
    </div>
    <div 
      onClick={onClick} 
      className={`w-12 h-7 border-[2px] border-black rounded-full relative cursor-pointer p-1 transition-colors ${active ? 'bg-black' : 'bg-gray-200'}`}
    >
      <motion.div 
        animate={{ x: active ? 20 : 0 }} 
        className={`w-4 h-4 rounded-full border-2 border-black ${active ? 'bg-[#ffcf5a]' : 'bg-white'}`} 
      />
    </div>
  </div>
);

const EditableInfoCard = ({ icon, label, value, suffix, isEditing, onChange, darkMode }) => (
  <div className={`p-7 border-[4px] border-black shadow-[6px_6px_0px_#000] rounded-[25px] transition-all hover:-translate-y-1 ${darkMode ? 'bg-[#3d2969]' : 'bg-white'}`}>
    <div className="mb-4 w-10 h-10 border-[2px] border-black flex items-center justify-center rounded-lg bg-[#ffcf5a] text-black shadow-[3px_3px_0px_#000]">
      {icon}
    </div>
    <p className="text-[10px] font-black uppercase text-[#ffcf5a] drop-shadow-[1px_1px_0px_#000] mb-1">
      {label}
    </p>
    {isEditing ? (
      <div className="flex items-center gap-1">
        <input 
          type="number" 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/5 border-b-2 border-black font-black text-xl outline-none text-black" 
        />
        <span className="font-black text-xs text-black">{suffix}</span>
      </div>
    ) : (
      <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-black'}`}>
        {value || '0'} {suffix}
      </p>
    )}
  </div>
);

const InfoCard = ({ icon, label, value, darkMode }) => (
  <div className={`p-7 border-[4px] border-black shadow-[6px_6px_0px_#000] rounded-[25px] transition-all hover:-translate-y-1 ${darkMode ? 'bg-[#3d2969]' : 'bg-white'}`}>
    <div className="mb-4 w-10 h-10 border-[2px] border-black flex items-center justify-center rounded-lg bg-[#ffcf5a] text-black shadow-[3px_3px_0px_#000]">
      {icon}
    </div>
    <p className="text-[10px] font-black uppercase text-[#ffcf5a] drop-shadow-[1px_1px_0px_#000] mb-1">
      {label}
    </p>
    <p className={`text-xl font-black ${darkMode ? 'text-white' : 'text-black'}`}>
      {value}
    </p>
  </div>
);

export default Profile;