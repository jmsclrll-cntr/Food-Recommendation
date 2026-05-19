import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Moon, Sun, Loader2 } from 'lucide-react';
import axios from 'axios';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';
import { generateRandomAvatar } from '../utils/avatarGenerator';


const EMOJIS = [
  { char: '🥗', size: '24px', top: '7%', left: '8%', delay: 0 },
  { char: '🍎', size: '28px', top: '15%', left: '25%', delay: 1.5 },
  { char: '🥦', size: '22px', top: '18%', right: '10%', delay: 1.1 },
  { char: '🥑', size: '28px', top: '34%', left: '5%', delay: 2.2 },
  { char: '🥕', size: '24px', top: '45%', right: '20%', delay: 0.8 },
  { char: '🍋', size: '22px', top: '50%', right: '10%', delay: 0.6 },
  { char: '🍇', size: '24px', top: '64%', left: '12%', delay: 1.8 },
  { char: '🍓', size: '20px', top: '76%', right: '12%', delay: 3 },
  { char: '🍉', size: '20px', top: '88%', left: '6%', delay: 0.3 },
  { char: '🍍', size: '22px', top: '42%', left: '52%', delay: 2.5 },
];

const SLOGANS = [
  { prefix: "Start your ", accent: "healthy", suffix: "journey." },
  { prefix: "Tailored ", accent: "nutrition", suffix: "just for you." },
  { prefix: "Join the ", accent: "premium", suffix: "movement." },
];

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [sloganIndex, setSloganIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [darkMode, toggleDarkMode] = useDarkMode();

  useEffect(() => {
    const timer = setInterval(() => {
      setSloganIndex((prev) => (prev + 1) % SLOGANS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    // Generate the avatar based on the name provided in the form
    const profilePic = generateRandomAvatar(fullName || "User"); 

    try {
      await axios.post('http://localhost:5000/api/auth/register', { 
        email, 
        password, 
        name: fullName, 
        profilePic // Sending the SVG string to backend
      });
      alert("Registration Successful! Please login.");
      navigate('/');
    } catch (err) {
      alert("Registration Error: " + (err.response?.data?.error || "Check your details"));
    } finally {
      setLoading(false);
    }
  };
const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      // 1. Talk to backend
      const response = await axios.post('http://localhost:5000/api/auth/google-login', { idToken });
      const backendUser = response.data.user;

      // 2. CONSISTENT NAME: Use the username from the backend if available, 
      // otherwise use the Google name.
      const stableName = backendUser.username || backendUser.name || result.user.displayName || "User";

      const finalUser = {
        ...backendUser,
        // If profilePic is missing from DB, generate it using the stable name
        profilePic: backendUser.profilePic || generateRandomAvatar(stableName)
      };

      localStorage.setItem('user', JSON.stringify(finalUser));
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Google Sign-In failed.');
    }
};
  const currentSlogan = SLOGANS[sloganIndex];

  // THEME HELPERS
  const panelBg = darkMode ? 'bg-[#2b1d4d]' : 'bg-[#fff7e8]';
  const leftPanelBg = darkMode ? 'bg-[#3d2969]' : 'bg-[#ffcf5a]';
  const textMain = darkMode ? 'text-white' : 'text-[#2d1b4e]';
  const textSub = darkMode ? 'text-purple-200' : 'text-[#5c4b7f]';
  const inputBg = darkMode ? 'bg-[#49357f]' : 'bg-white';
  const border = 'border-black';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 overflow-hidden"
      style={{
        background: darkMode
          ? 'linear-gradient(135deg,#1d1436,#241744,#301c56)'
          : 'linear-gradient(135deg,#ffe9b3,#ffd86b,#ffb347)',
      }}
    >
      <div className="absolute top-[-120px] left-[-120px] w-[320px] h-[320px] rounded-full bg-pink-400/20 blur-3xl" />
      <div className="absolute bottom-[-120px] right-[-120px] w-[320px] h-[320px] rounded-full bg-lime-300/20 blur-3xl" />

      {EMOJIS.map((emoji, index) => (
        <motion.span
          key={index}
          className="absolute pointer-events-none z-0"
          style={{ fontSize: emoji.size, top: emoji.top, left: emoji.left, right: emoji.right }}
          animate={{ y: [0, -16, 0], rotate: [-8, 8, -8] }}
          transition={{ duration: 6, repeat: Infinity, delay: emoji.delay, ease: 'easeInOut' }}
        >
          {emoji.char}
        </motion.span>
      ))}

      <div className={`relative z-10 w-full max-w-5xl ${panelBg} rounded-[40px] overflow-hidden flex flex-col md:flex-row border-[5px] ${border} shadow-[10px_10px_0px_#000] transition-all duration-500`}>
        
        <button onClick={toggleDarkMode} className={`absolute top-5 right-5 z-30 w-11 h-11 rounded-full border-[4px] ${border} flex items-center justify-center transition-all ${darkMode ? 'bg-[#ffcf5a] text-[#2b1d4d]' : 'bg-[#2b1d4d] text-[#ffcf5a]'}`}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className={`relative w-full md:w-[45%] ${leftPanelBg} p-8 md:p-10 overflow-hidden flex flex-col justify-between border-r-[5px] ${border}`}>
          <div className="absolute top-[-60px] right-[-60px] w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute bottom-[-60px] left-[-60px] w-44 h-44 rounded-full bg-black/10" />

          <div className="relative z-20">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-[18px] bg-white border-[4px] border-black shadow-[5px_5px_0px_#000] flex items-center justify-center">
                <img src="/webLogo.png" alt="Logo" className="w-8 h-8 object-contain" />
              </div>
              <div>
               <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-[#2d1b4e]'}`}>NutriFind</h2>
               <p className={`text-[11px] uppercase tracking-[0.2em] font-black ${darkMode ? 'text-white/40' : 'text-[#5d4a00]'}`}>A WEEK PLAN, JUST FOR YOU.</p>
              </div>
            </div>
          </div>

          <div className="relative z-20 my-12">
            <p className={`text-[11px] uppercase tracking-[0.15em] font-black mb-3 ${darkMode ? 'text-white/40' : 'text-[#5d4a00]'}`}>Join the Club</p>
            <AnimatePresence mode="wait">
              <motion.h1 key={sloganIndex} initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }} className="text-4xl md:text-5xl font-black leading-tight flex flex-wrap">
                <span className={darkMode ? 'text-white' : 'text-[#2d1b4e]'}>
                  {currentSlogan.prefix.split('').map((char, i) => (
                    <motion.span key={i} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} transition={{ delay: i * 0.02 }}>{char === ' ' ? '\u00A0' : char}</motion.span>
                  ))}
                </span>
                <span className={darkMode ? 'text-[#ffcf5a] drop-shadow-[3px_3px_0px_#000]' : 'text-white drop-shadow-[3px_3px_0px_#000]'}>
                  {currentSlogan.accent.split('').map((char, i) => (
                    <motion.span key={i} variants={{ hidden: { opacity: 0, scale: 0.5 }, visible: { opacity: 1, scale: 1 } }} transition={{ delay: 0.3 + i * 0.03 }}>{char}</motion.span>
                  ))}
                </span>
                <span className={darkMode ? 'text-white' : 'text-[#2d1b4e]'}>
                  {currentSlogan.suffix.split('').map((char, i) => (
                    <motion.span key={i} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} transition={{ delay: 0.6 + i * 0.02 }}>{char === ' ' ? '\u00A0' : char}</motion.span>
                  ))}
                </span>
              </motion.h1>
            </AnimatePresence>
          </div>

          <div className="relative z-20 grid grid-cols-2 gap-4">
            <div className="bg-white border-[4px] border-black rounded-[24px] p-4 shadow-[5px_5px_0px_#000]">
            <i class="fa-solid fa-timeline text-3xl"></i>
              <h3 className="font-black text-[#2d1b4e] mt-2">Weekly Plan</h3>
            </div>
            <div className="bg-white border-[4px] border-black rounded-[24px] p-4 shadow-[5px_5px_0px_#000]">
             <i class="fa-brands fa-black-tie text-3xl"></i>
              <h3 className="font-black text-[#2d1b4e] mt-2">NutriTeam</h3>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className={`text-4xl font-black ${textMain} mb-1`}>Create Account</h2>
            <p className={`text-sm ${textSub} mb-8 font-semibold`}>Join the NutriVenture.</p>

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label className={`text-[11px] font-black uppercase tracking-widest ${textSub}`}>Full Name</label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-white/40' : 'text-[#2d1b4e]/40'}`} />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your name" required className={`w-full h-14 pl-12 pr-4 ${inputBg} border-[4px] ${border} rounded-[20px] outline-none text-sm font-semibold ${textMain} shadow-[5px_5px_0px_#000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[11px] font-black uppercase tracking-widest ${textSub}`}>Email Address</label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-white/40' : 'text-[#2d1b4e]/40'}`} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required className={`w-full h-14 pl-12 pr-4 ${inputBg} border-[4px] ${border} rounded-[20px] outline-none text-sm font-semibold ${textMain} shadow-[5px_5px_0px_#000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[11px] font-black uppercase tracking-widest ${textSub}`}>Password</label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-white/40' : 'text-[#2d1b4e]/40'}`} />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className={`w-full h-14 pl-12 pr-12 ${inputBg} border-[4px] ${border} rounded-[20px] outline-none text-sm font-semibold ${textMain} shadow-[5px_5px_0px_#000] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="w-5 h-5 text-[#ffcf5a]" /> : <Eye className="w-5 h-5 text-[#ffcf5a]" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full h-14 bg-[#ffcf5a] hover:translate-y-[2px] hover:translate-x-[2px] text-[#2d1b4e] rounded-[20px] border-[4px] border-black font-black text-sm tracking-wide transition-all shadow-[6px_6px_0px_#000] flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={20} /> : "START ADVENTURE →"}
              </button>
            </form>

            <div className="flex items-center gap-4 py-6">
              <div className="h-[3px] flex-1 bg-black rounded-full" />
              <span className="text-[10px] font-black text-[#8c7c5f] tracking-widest uppercase">OR</span>
              <div className="h-[3px] flex-1 bg-black rounded-full" />
            </div>

            <button onClick={handleGoogle} className={`w-full h-14 ${inputBg} border-[4px] border-black rounded-[20px] flex items-center justify-center gap-3 transition-all hover:translate-x-[2px] hover:translate-y-[2px] shadow-[5px_5px_0px_#000] mb-6`}>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.5 1.2 8.9 3.2l6.6-6.6C35.4 2.7 30 .5 24 .5 14.7.5 6.7 6.1 3 14l7.8 6c1.9-5.5 7-9.5 13.2-9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z"/><path fill="#FBBC05" d="M10.8 28.6A14.4 14.4 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6L2.5 13.4A23.5 23.5 0 0 0 .5 24c0 3.8.9 7.4 2.5 10.6l7.8-6z"/><path fill="#34A853" d="M24 47.5c6 0 11-2 14.7-5.3l-7.5-5.8c-2 1.4-4.6 2.1-7.2 2.1-6.2 0-11.4-4.2-13.2-9.9l-7.8 6C6.6 41.9 14.7 47.5 24 47.5z"/>
              </svg>
              <span className={`text-[11px] font-black uppercase tracking-widest ${textMain}`}>Sign up with Google</span>
            </button>

            <p className="text-center text-[10px] font-black uppercase tracking-widest text-[#8c7c5f]">
              Already a Member?{' '}
              <Link to="/" className="text-[#ff8b2c] hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Signup;