import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Moon, Sun, Loader2, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';

const EMOJIS = [
  { char: '🥗', size: '22px', top: '7%', left: '8%', delay: 0 },
  { char: '🍕', size: '24px', top: '15%', left: '25%', delay: 1.5 },
  { char: '🍎', size: '18px', top: '18%', right: '10%', delay: 1.1 },
  { char: '🥦', size: '24px', top: '34%', left: '5%', delay: 2.2 },
  { char: '🍺', size: '22px', top: '45%', right: '20%', delay: 0.8 },
  { char: '🍋', size: '19px', top: '50%', right: '10%', delay: 0.6 },
  { char: '🥕', size: '22px', top: '64%', left: '12%', delay: 1.8 },
  { char: '🫐', size: '20px', top: '76%', right: '12%', delay: 3 },
  { char: '🥑', size: '18px', top: '88%', left: '6%', delay: 0.3 },
  { char: '🍇', size: '21px', top: '42%', left: '52%', delay: 2.5 },
];

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0 = details, 1 = OTP verification
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [devCode, setDevCode] = useState('');
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  // DARK MODE LOGIC
  const [darkMode, toggleDarkMode] = useDarkMode();

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimKey(prev => prev + 1);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showNotification("Passwords do not match!", "error");
      return;
    }
    if (password.length < 6) {
      showNotification("Password must be at least 6 characters!", "error");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/send-otp', { email });
      setOtpSentMessage(response.data.message);
      
      if (response.data.devCode) {
        setDevCode(response.data.devCode);
      } else {
        setDevCode('');
      }
      
      if (response.data.method === 'console' || response.data.method === 'console_fallback') {
        showNotification("Development Mode: Verification code has been printed to the backend console terminal!", "info");
      } else {
        showNotification("Verification code has been sent to your email!", "success");
      }
      
      setStep(1);
      setResendTimer(60);
    } catch (err) {
      console.error(err);
      showNotification("Verification Error: " + (err.response?.data?.error || "Failed to send code"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0 || loading) return;
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/send-otp', { email });
      setOtpSentMessage(response.data.message);
      setResendTimer(60);
      
      if (response.data.devCode) {
        setDevCode(response.data.devCode);
      } else {
        setDevCode('');
      }
      
      if (response.data.method === 'console' || response.data.method === 'console_fallback') {
        showNotification("Development Mode: Verification code printed to the backend console terminal!", "info");
      } else {
        showNotification("Verification code has been resent to your email!", "success");
      }
    } catch (err) {
      console.error(err);
      showNotification("Resend Error: " + (err.response?.data?.error || "Failed to resend code"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!otp) {
      showNotification("Please enter the verification code.", "error");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/register', { 
        email, 
        password, 
        name: fullName,
        otp 
      });
      showNotification("Registration successful! Please log in.", "success");
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error(err);
      showNotification("Registration Error: " + (err.response?.data?.error || "Check details and code"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const response = await axios.post('http://localhost:5000/api/auth/google-login', { idToken });
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      showNotification("Google Sign-In failed.", "error");
    }
  };

  // THEME HELPERS
  const panelBg = darkMode ? 'bg-[#121212]' : 'bg-[#fdfdfc]';
  const leftPanelBg = darkMode ? 'bg-[#0f210f]' : 'bg-[#1c3a1c]';
  const textMain = darkMode ? 'text-white' : 'text-[#1c3a1c]';
  const textSub = darkMode ? 'text-white/60' : 'text-[#5a7054]';
  const inputBg = darkMode ? 'bg-white/5' : 'bg-white';
  const border = darkMode ? 'border-white/10' : 'border-[#ddd8ce]';
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 bg-cover bg-center transition-colors duration-500"
      style={{ backgroundImage: "url('/bg4.png')" }}
    >
      {/* Dynamic Overlay */}
      <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${darkMode ? 'bg-black/70' : 'bg-black/40'}`}></div>
      
      <div className={`relative z-10 w-full max-w-4xl ${panelBg} rounded-[32px] overflow-hidden clay-card flex flex-col md:flex-row min-h-[600px] transition-colors duration-500`}>
        
        {/* Theme Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className={`absolute top-6 right-6 z-30 p-2 rounded-full backdrop-blur-md transition-all ${
            darkMode ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-black/5 text-gray-600 hover:bg-black/10'
          }`}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Left Panel */}
        <div className={`relative w-full md:w-[42%] ${leftPanelBg} p-8 md:p-10 flex flex-col justify-between overflow-hidden text-white transition-colors duration-500`}>
          <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-[#2a5228]/50 z-0" />
          <div className="absolute bottom-[-40px] left-[-40px] w-48 h-48 rounded-full bg-[#243f24]/50 z-0" />

          {EMOJIS.map((emoji, index) => (
            <motion.span
              key={index}
              className="absolute pointer-events-none opacity-20 z-10"
              style={{ fontSize: emoji.size, top: emoji.top, left: emoji.left, right: emoji.right }}
              animate={{ y: [0, -14, 0], rotate: [-4, 6, -4] }}
              transition={{ duration: 7, repeat: Infinity, delay: emoji.delay, ease: "easeInOut" }}
            >
              {emoji.char}
            </motion.span>
          ))}

          <div className="relative z-20">
            <div className="flex items-center justify-left">
              <img
                src="/webLogo.png"
                alt="Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#e8f4e5] leading-none mb-1">NutriFind</h2>
            <p className="text-[9px] text-[#6a9966] uppercase tracking-[0.2em] font-black">Premium Nutrition</p>
          </div>
          
          <div className="relative z-20 grid grid-cols-1 gap-4">
            <div>
              <p className="text-xl font-semibold text-[#e8f4e5] border-l-2 border-[#8ecb84] pl-2 leading-none">7-days</p>
              <p className="text-[10px] text-[#6a9966] uppercase tracking-wider mt-1 pl-2">Plan</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-[#e8f4e5] border-l-2 border-[#8ecb84] pl-2 leading-none">NutriTeam</p>
              <p className="text-[10px] text-[#6a9966] uppercase tracking-wider mt-1 pl-2">Creation</p>
            </div>
          </div>
          
          <div className="relative z-20 my-1">
            <p className="text-[10px] text-[#6a9966] uppercase tracking-[0.12em] font-medium mb-2">Join the movement</p>
            <AnimatePresence mode="wait">
              <motion.h1 
                key={animKey}
                variants={{ hidden: { opacity: 1 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
                initial="hidden" animate="visible" exit={{ opacity: 0, transition: { duration: 0.5 } }}
                className="font-serif text-3xl md:text-4xl font-normal text-[#e8f4e5] leading-tight mb-6 flex flex-wrap"
              >
                {"Start your journey ".split("").map((char, index) => (
                  <motion.span key={`i-${index}`} variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} className="inline-block">{char === " " ? "\u00A0" : char}</motion.span>
                ))}
                <span className="italic text-[#8ecb84]">
                  {"today".split("").map((char, index) => (
                    <motion.span key={`s-${index}`} variants={{ hidden: { opacity: 0, scale: 0.8, rotate: -10 }, visible: { opacity: 1, scale: 1, rotate: 0 } }} className="inline-block">{char}</motion.span>
                  ))}
                </span>
                {" now.".split("").map((char, index) => (
                  <motion.span key={`e-${index}`} variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} className="inline-block">{char === " " ? "\u00A0" : char}</motion.span>
                ))}
              </motion.h1>
            </AnimatePresence>
          </div>
        </div>
        

        {/* Right Panel */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center transition-colors duration-500">
          <div className="max-w-md mx-auto w-full">
            {step === 0 ? (
              <>
                <h2 className={`font-serif text-3xl ${textMain} mb-1`}>Create Account</h2>
                <p className={`text-sm ${textSub} mb-8 italic`}>Premium Nutrition</p>

                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold uppercase tracking-widest ${textSub}`}>Full name</label>
                    <div className="relative group">
                      <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${darkMode ? 'text-white/30' : 'text-[#1c3a1c]/40'} group-focus-within:text-[#8ecb84]`} />
                      <input 
                        type="text" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        placeholder="Full Name" 
                        required 
                        className={`w-full h-12 pl-11 pr-4 ${inputBg} border ${border} rounded-xl focus:border-[#8ecb84] focus:ring-4 focus:ring-[#8ecb84]/10 outline-none transition-all text-sm ${textMain} clay-input`} 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold uppercase tracking-widest ${textSub}`}>Email address</label>
                    <div className="relative group">
                      <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${darkMode ? 'text-white/30' : 'text-[#1c3a1c]/40'} group-focus-within:text-[#8ecb84]`} />
                      <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="Email" 
                        required 
                        className={`w-full h-12 pl-11 pr-4 ${inputBg} border ${border} rounded-xl focus:border-[#8ecb84] focus:ring-4 focus:ring-[#8ecb84]/10 outline-none transition-all text-sm ${textMain} clay-input`} 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold uppercase tracking-widest ${textSub}`}>Password</label>
                    <div className="relative group">
                      <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${darkMode ? 'text-white/30' : 'text-[#1c3a1c]/40'} group-focus-within:text-[#8ecb84]`} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••" 
                        required 
                        className={`w-full h-12 pl-11 pr-11 ${inputBg} border ${border} rounded-xl focus:border-[#8ecb84] focus:ring-4 focus:ring-[#8ecb84]/10 outline-none transition-all text-sm ${textMain} clay-input`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1c3a1c]/40 hover:text-[#8ecb84] transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold uppercase tracking-widest ${textSub}`}>Confirm Password</label>
                    <div className="relative group">
                      <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${darkMode ? 'text-white/30' : 'text-[#1c3a1c]/40'} group-focus-within:text-[#8ecb84]`} />
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        placeholder="••••••••" 
                        required 
                        className={`w-full h-12 pl-11 pr-11 ${inputBg} border ${border} rounded-xl focus:border-[#8ecb84] focus:ring-4 focus:ring-[#8ecb84]/10 outline-none transition-all text-sm ${textMain} clay-input`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1c3a1c]/40 hover:text-[#8ecb84] transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-12 bg-[#2d5a27] hover:bg-[#3d7a35] disabled:bg-[#2d5a27]/50 text-white rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 group clay-btn mt-4"
                  >
                    {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : "Register Now →"}
                  </button>
                </form>

                <div className="flex items-center gap-4 py-6">
                  <div className={`h-[1px] flex-1 ${darkMode ? 'bg-white/10' : 'bg-[#e4dfd5]'}`} />
                  <span className="text-[10px] font-bold text-[#b0a898] tracking-widest uppercase">OR</span>
                  <div className={`h-[1px] flex-1 ${darkMode ? 'bg-white/10' : 'bg-[#e4dfd5]'}`} />
                </div>

                <button 
                  onClick={handleGoogle} 
                  className={`w-full h-12 ${darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-[#c8c2b8] hover:bg-[#f5faf4]'} border-2 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 group mb-6 clay-btn`}
                >
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.5 1.2 8.9 3.2l6.6-6.6C35.4 2.7 30 .5 24 .5 14.7.5 6.7 6.1 3 14l7.8 6c1.9-5.5 7-9.5 13.2-9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z"/><path fill="#FBBC05" d="M10.8 28.6A14.4 14.4 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6L2.5 13.4A23.5 23.5 0 0 0 .5 24c0 3.8.9 7.4 2.5 10.6l7.8-6z"/><path fill="#34A853" d="M24 47.5c6 0 11-2 14.7-5.3l-7.5-5.8c-2 1.4-4.6 2.1-7.2 2.1-6.2 0-11.4-4.2-13.2-9.9l-7.8 6C6.6 41.9 14.7 47.5 24 47.5z"/>
                  </svg>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-white/80' : 'text-gray-400'}`}>Sign up with Google</span>
                </button>

                <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                  Already a member? <Link to="/" className="text-[#2d5a27] font-black hover:underline transition-all">Sign In</Link>
                </p>
              </>
            ) : (
              <>
                <h2 className={`font-serif text-3xl ${textMain} mb-1`}>Verify Email</h2>
                <p className={`text-sm ${textSub} mb-6 italic`}>
                  We sent a 6-digit verification code to <span className="font-bold font-sans not-italic text-[#8ecb84]">{email}</span>.
                </p>

                {devCode && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 dark:bg-yellow-500/5 text-center flex flex-col items-center justify-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/30"></div>
                    <span className="text-[10px] font-black uppercase text-yellow-600 dark:text-yellow-400 tracking-[0.2em] mb-1">🛠️ Sandbox Development Helper</span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight max-w-[280px] mb-3">
                      SMTP credentials are not configured in your backend <code>.env</code>. Use the test code below:
                    </p>
                    <div className="px-5 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl">
                      <span className="text-2xl font-mono font-bold tracking-[0.2em] text-[#2d5a27] dark:text-[#8ecb84] pl-1 select-all">{devCode}</span>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className={`text-[11px] font-bold uppercase tracking-widest ${textSub} block text-center`}>Enter 6-Digit Code</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                        placeholder="000000" 
                        maxLength={6}
                        required 
                        className={`w-full h-14 text-center font-bold tracking-[1em] text-2xl pl-[1em] ${inputBg} border ${border} rounded-xl focus:border-[#8ecb84] focus:ring-4 focus:ring-[#8ecb84]/10 outline-none transition-all ${textMain} clay-input`} 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || otp.length < 6}
                    className="w-full h-12 bg-[#2d5a27] hover:bg-[#3d7a35] disabled:bg-[#2d5a27]/50 text-white rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 group clay-btn"
                  >
                    {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : "Verify & Complete Signup →"}
                  </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Didn't receive the code?{' '}
                    <button 
                      type="button" 
                      onClick={handleResendOTP} 
                      disabled={resendTimer > 0 || loading}
                      className={`font-black hover:underline transition-all ${resendTimer > 0 ? 'text-gray-500 cursor-not-allowed' : 'text-[#8ecb84]'}`}
                    >
                      Resend Code {resendTimer > 0 ? `(${resendTimer}s)` : ''}
                    </button>
                  </p>

                  <button
                    type="button"
                    onClick={() => { setStep(0); setOtp(''); }}
                    className="text-[9px] text-[#2d5a27] hover:underline uppercase font-black tracking-widest block mx-auto"
                  >
                    ← Back to signup details
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

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
    </motion.div>
  );
};

export default Signup;