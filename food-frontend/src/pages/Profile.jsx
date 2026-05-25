import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Mail, ShieldCheck, Calendar, Weight, Ruler, Activity, Moon, Sun, Edit2, LogOut, CheckCircle2
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { getThemeStyles } from '../theme/styles';
import axios from 'axios';

const Profile = () => {
  const navigate = useNavigate();
  const [user] = useState(() => {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  });

  const [darkMode, toggleDarkMode] = useDarkMode();
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [confirmCooldown, setConfirmCooldown] = useState(0);
  const [signOutCooldown, setSignOutCooldown] = useState(0);
  const styles = getThemeStyles(darkMode);
  const { cardBg, border, textMain, textSub } = styles;

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    let timer;
    if (showConfirmModal && confirmCooldown > 0) {
      timer = setTimeout(() => setConfirmCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showConfirmModal, confirmCooldown]);

  useEffect(() => {
    let timer;
    if (showSignOutModal && signOutCooldown > 0) {
      timer = setTimeout(() => setSignOutCooldown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showSignOutModal, signOutCooldown]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    setShowConfirmModal(false);
    try {
      await axios.post('http://localhost:5000/api/auth/delete', { uid: user.uid });
      showNotification("Account successfully deleted.", "success");
      setTimeout(() => {
          localStorage.clear();
          navigate('/');
      }, 2000);
    } catch (error) {
      console.error("Failed to delete account", error);
      showNotification("Failed to delete account: " + (error.response?.data?.error || error.message), "error");
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    setConfirmCooldown(3);
    setShowConfirmModal(true);
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col p-6 md:p-10 bg-cover bg-center transition-colors duration-500 ${
        darkMode ? 'text-white' : 'text-[#1c3a1c]'
      }`}
      style={{ backgroundImage: "url('/bg3.png')" }}
    >
      {/* Dynamic Overlay */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-500 ${
          darkMode ? 'bg-black/75' : 'bg-black/20'
        }`}
      />

      <div className="relative z-10 flex flex-col h-full max-w-6xl mx-auto w-full">

        {/* HEADER */}
        <header className="flex items-center justify-between mb-10 flex-shrink-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/80 hover:text-white transition-all group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Hub
          </button>

          <div className="text-right text-white">
            <h2 className="font-serif text-2xl italic leading-none">NutriFind</h2>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8ecb84] mt-1">
              Member Identity
            </p>
          </div>

          <button
            onClick={toggleDarkMode}
            className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
              darkMode ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-black/10 text-white hover:bg-black/20'
            }`}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <div className="flex-1 grid grid-cols-12 gap-8 overflow-y-auto pr-2 custom-scrollbar">

          {/* LEFT: PROFILE CARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-12 lg:col-span-4 space-y-6"
          >
            <div className={`${cardBg} backdrop-blur-xl p-10 text-center transition-colors duration-500 clay-card`}>
              
              <div className="relative w-36 h-36 mx-auto mb-6">
                <div className={`absolute inset-0 rounded-full scale-110 blur-md transition-opacity ${darkMode ? 'bg-[#8ecb84]/20 opacity-100' : 'bg-[#8ecb84]/40 opacity-0'}`}></div>
                <img
                  src={user.profilePic || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=500`}
                  alt="Profile"
                  className="relative w-full h-full object-cover rounded-full border-4 border-white shadow-lg"
                />
                <button className="absolute bottom-1 right-1 p-2 bg-[#2d5a27] text-white rounded-full border-2 border-white hover:scale-110 transition-transform">
                    <Edit2 size={12} />
                </button>
              </div>

              <h1 className={`font-serif text-3xl italic mb-1 ${textMain} transition-colors`}>
                {user.username || user.name}
              </h1>

              <p className="text-xs font-bold text-[#6a9966] uppercase tracking-[0.2em] mb-8">
                Premium Member
              </p>

              <div className={`flex flex-col gap-4 text-left border-t ${border} pt-8 transition-colors`}>
                <div className={`flex items-center gap-4 ${textSub}`}>
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <Mail size={14} className="text-[#8ecb84]" />
                  </div>
                  <span className="text-xs font-medium tracking-wide">
                    {user.email || 'user@nutrifind.com'}
                  </span>
                </div>

                <div className={`flex items-center gap-4 ${textSub}`}>
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <ShieldCheck size={14} className="text-[#8ecb84]" />
                  </div>
                  <span className="text-xs font-medium tracking-wide">Verified Account</span>
                </div>

                <div className={`flex items-center gap-4 ${textSub}`}>
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
                    <Calendar size={14} className="text-[#8ecb84]" />
                  </div>
                  <span className="text-xs font-medium tracking-wide">Joined Jan 2024</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-[#1c3a1c] text-white py-4 text-xs font-bold uppercase tracking-[0.15em] hover:bg-[#2d5a27] transition-all active:scale-[0.98] clay-btn mb-4">
              Edit Detailed Profile
            </button>
            <button 
              onClick={() => { setSignOutCooldown(3); setShowSignOutModal(true); }}
              className={`w-full py-4 text-xs font-bold uppercase tracking-[0.15em] transition-all active:scale-[0.98] clay-btn flex justify-center items-center gap-2 ${
                darkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </motion.div>

          {/* RIGHT: CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-12 lg:col-span-8 space-y-8"
          >
            <section className={`${cardBg} backdrop-blur-xl p-8 transition-colors duration-500 clay-card`}>
              <h3 className={`font-serif text-xl italic mb-4 ${textMain}`}>
                Personal Narrative
              </h3>
              <p className={`text-sm leading-relaxed italic ${textSub} opacity-80`}>
                "No Personal Narative yet... "
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InfoCard darkMode={darkMode} icon={<Weight size={20} />} label="Latest Weight" value="72.5 kg" />
              <InfoCard darkMode={darkMode} icon={<Ruler size={20} />} label="Last Height" value="178 cm" />
              <InfoCard darkMode={darkMode} icon={<Activity size={20} />} label="Avg. BMI" value="22.8" />
            </div>

            <div className={`${cardBg} backdrop-blur-xl overflow-hidden transition-colors duration-500 clay-card`}>
              <div className={`px-8 py-5 border-b ${border} bg-black/5`}>
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#6a9966]">
                  Security & Preferences
                </h4>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-sm font-bold ${textMain}`}>Email Notifications</p>
                    <p className={`text-xs ${textSub}`}>Weekly reports and alerts</p>
                  </div>
                  <div className={`w-11 h-6 ${darkMode ? 'bg-white/10' : 'bg-gray-200'} rounded-full relative cursor-pointer p-1`}>
                    <div className="absolute right-1 top-1 w-4 h-4 bg-[#8ecb84] rounded-full shadow-sm"></div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-sm font-bold ${textMain}`}>Public Profile</p>
                    <p className={`text-xs ${textSub}`}>Allow others to see your badges</p>
                  </div>
                  <div className={`w-11 h-6 ${darkMode ? 'bg-white/10' : 'bg-gray-200'} rounded-full relative cursor-pointer p-1`}>
                    <div className={`absolute left-1 top-1 w-4 h-4 ${darkMode ? 'bg-white/20' : 'bg-white'} rounded-full shadow-sm`}></div>
                  </div>
                </div>

                <div className={`pt-6 border-t ${border} flex justify-between items-center`}>
                  <span className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                    Danger Zone
                  </span>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className={`text-xs font-bold uppercase tracking-wider px-4 py-2 transition-all clay-btn ${
                      darkMode ? 'text-red-400 bg-red-400/10 hover:bg-red-500/20' : 'text-red-700 hover:bg-red-50'
                    } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showSignOutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full p-8 rounded-3xl shadow-2xl border ${
                darkMode ? 'bg-[#121212] border-white/10' : 'bg-white border-black/10'
              }`}
            >
              <h3 className={`font-serif text-2xl italic mb-3 ${darkMode ? 'text-white' : 'text-[#1c3a1c]'}`}>
                Sign Out?
              </h3>
              <p className={`text-sm mb-8 ${darkMode ? 'text-white/70' : 'text-black/70'}`}>
                Are you sure you want to sign out of your account? You will need to log back in to access your dashboard.
              </p>
              
               <div className="flex gap-4">
                <button
                  onClick={() => setShowSignOutModal(false)}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-[0.15em] rounded-xl transition-all ${
                    darkMode ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-black/5 text-black hover:bg-black/10'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSignOutModal(false);
                    localStorage.clear();
                    navigate('/');
                  }}
                  disabled={signOutCooldown > 0}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-[0.15em] rounded-xl transition-all ${
                    signOutCooldown > 0 
                      ? 'bg-gray-500/10 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-[#2d5a27] text-white shadow-lg hover:bg-[#1c3a1c] dark:bg-[#8ecb84] dark:text-[#1c3a1c] dark:hover:bg-[#a6db9e]'
                  }`}
                >
                  {signOutCooldown > 0 ? `Wait (${signOutCooldown}s)` : 'Confirm Sign Out'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`max-w-md w-full p-8 rounded-3xl shadow-2xl border ${
                darkMode ? 'bg-[#121212] border-white/10' : 'bg-white border-black/10'
              }`}
            >
              <h3 className={`font-serif text-2xl italic mb-3 ${darkMode ? 'text-white' : 'text-[#1c3a1c]'}`}>
                Delete Account?
              </h3>
              <p className={`text-sm mb-8 ${darkMode ? 'text-white/70' : 'text-black/70'}`}>
                Are you sure you want to permanently delete your account? This action cannot be undone and you will lose all your data.
              </p>
              
               <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-[0.15em] rounded-xl transition-all ${
                    darkMode ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-black/5 text-black hover:bg-black/10'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  disabled={confirmCooldown > 0}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-[0.15em] rounded-xl transition-all ${
                    confirmCooldown > 0
                      ? 'bg-gray-500/10 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 text-white shadow-lg hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                  }`}
                >
                  {confirmCooldown > 0 ? `Wait (${confirmCooldown}s)` : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm"
          >
            <div className={`mx-4 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 transition-colors duration-300 ${
              notification.type === 'success' 
                ? 'bg-[#1c3a1c]/90 border-[#8ecb84]/30 text-white' 
                : notification.type === 'error'
                ? 'bg-red-950/90 border-red-500/30 text-white'
                : 'bg-zinc-900/90 border-white/10 text-white'
            }`}>
              <div className={`p-2 rounded-xl flex-shrink-0 ${
                notification.type === 'success' 
                  ? 'bg-[#8ecb84]/20 text-[#8ecb84]' 
                  : notification.type === 'error'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-white/10 text-white'
              }`}>
                {notification.type === 'success' ? (
                  <CheckCircle2 size={18} />
                ) : notification.type === 'error' ? (
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 text-xs font-bold tracking-wide">
                {notification.message}
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="text-white/40 hover:text-white transition-colors p-1 flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InfoCard = ({ icon, label, value, darkMode }) => (
  <div
    className={`backdrop-blur-xl p-7 transition-all duration-500 hover:translate-y-[-4px] clay-card ${
      darkMode
        ? 'bg-[#121212]/90'
        : 'bg-white/90'
    }`}
  >
    <div className={`mb-5 transition-colors ${darkMode ? 'text-[#8ecb84]' : 'text-[#2d5a27]'}`}>
      {icon}
    </div>
    <p className="text-xs font-black uppercase tracking-[0.15em] text-[#6a9966] mb-1">
      {label}
    </p>
    <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#1c3a1c]'}`}>
      {value}
    </p>
  </div>
);

export default Profile;