import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';


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

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimKey(prev => prev + 1);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err) {
      alert("Login Error: " + (err.response?.data?.error || "Invalid Credentials"));
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
      alert("Google Sign-In failed.");
    }
  };

const texts = [
  "Designed for your balance.",
  "Refined nutrition, everyday.",
  "Where health feels effortless."
];

 const [textIndex, setTextIndex] = useState(0);
const [displayText, setDisplayText] = useState("");
const [isDeleting, setIsDeleting] = useState(false);
const [speed, setSpeed] = useState(80);

useEffect(() => {
  const currentText = texts[textIndex];

  const handleTyping = () => {
    if (!isDeleting) {
      setDisplayText(currentText.substring(0, displayText.length + 1));

      if (displayText === currentText) {
        setTimeout(() => setIsDeleting(true), 1200);
      }
    } else {
      setDisplayText(currentText.substring(0, displayText.length - 1));

      if (displayText === "") {
        setIsDeleting(false);
        setTextIndex((prev) => (prev + 1) % texts.length);
      }
    }
  };

  const timer = setTimeout(handleTyping, isDeleting ? 40 : speed);

  return () => clearTimeout(timer);
}, [displayText, isDeleting, textIndex]);

  return (
   <div
  className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 bg-cover bg-center"
  style={{ backgroundImage: "url('/bg3.png')" }}
>

{/* Overlay */}
  <div className="absolute inset-0 bg-black/40 z-0"></div>
       <div className="relative z-10 w-full max-w-4xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Panel */}
        <div className="relative w-full md:w-[42%] bg-[#1c3a1c] p-8 md:p-10 flex flex-col justify-between overflow-hidden text-white">
          <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-[#2a5228] z-0" />
          <div className="absolute bottom-[-40px] left-[-40px] w-48 h-48 rounded-full bg-[#243f24] z-0" />

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
                className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
              />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#e8f4e5] leading-none mb-1 text-shadow-sm">NutriFind</h2>
            <p className="text-[9px] text-[#6a9966] uppercase tracking-[0.2em] font-black">Premium Nutrition</p>
          </div>

          <div className="relative z-20 my-12">
            <p className="text-[10px] text-[#6a9966] uppercase tracking-[0.12em] font-medium mb-2">Eat smarter, live better</p>

          <h1 className="font-serif text-3xl md:text-2xl font-normal text-[#e8f4e5] leading-tight mb-6 flex flex-wrap">
                    {displayText}
                    <span className="ml-1 animate-pulse text-[#8ecb84]">|</span>
                  </h1>
                      </div>

          <div className="relative z-20 grid grid-cols-3 gap-4">
            {/* <div><p className="text-xl font-semibold text-[#e8f4e5] border-l-2 border-brand-accent pl-2 leading-none">7-days</p><p className="text-[10px] text-[#6a9966] uppercase tracking-wider mt-1 pl-2">Plan</p></div> */}
            <div><p className="text-xl font-semibold text-[#e8f4e5] border-l-2 border-brand-accent pl-2 leading-none">NutriTeam</p><p className="text-[10px] text-[#6a9966] uppercase tracking-wider mt-1 pl-2">Creation</p></div>
            {/* <div><p className="text-xl font-semibold text-[#e8f4e5] border-l-2 border-brand-accent pl-2 leading-none">3</p><p className="text-[10px] text-[#6a9966] uppercase tracking-wider mt-1 pl-2">Goals</p></div> */}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-brand-light p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <h2 className="font-serif text-3xl text-brand-text mb-1">Welcome Back</h2>
            <p className="text-sm text-brand-muted mb-8 italic">Premium Nutrition</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#5a7054]">Email address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-brand-text/40 group-focus-within:text-brand-accent transition-colors" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full h-12 pl-11 pr-4 bg-white border-1.5 border-[#ddd8ce] rounded-xl focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10 outline-none transition-all text-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#5a7054]">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-brand-text/40 group-focus-within:text-brand-accent transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    required 
                    className="w-full h-12 pl-11 pr-11 bg-white border-1.5 border-[#ddd8ce] rounded-xl focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10 outline-none transition-all text-sm" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text/40 hover:text-brand-accent transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full h-12 bg-[#2d5a27] hover:bg-[#3d7a35] text-white rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 group shadow-lg shadow-brand-secondary/20 mt-4">
                Sign In →
              </button>
            </form>

            <div className="flex items-center gap-4 py-6">
              <div className="h-[1px] flex-1 bg-[#e4dfd5]" />
              <span className="text-[10px] font-bold text-[#b0a898] tracking-widest uppercase">OR</span>
              <div className="h-[1px] flex-1 bg-[#e4dfd5]" />
            </div>

            <button onClick={handleGoogle} className="w-full h-12 bg-white hover:bg-[#f5faf4] border-2 border-[#c8c2b8] hover:border-brand-accent rounded-xl flex items-center justify-center gap-3 transition-all duration-200 group mb-6">
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.5 1.2 8.9 3.2l6.6-6.6C35.4 2.7 30 .5 24 .5 14.7.5 6.7 6.1 3 14l7.8 6c1.9-5.5 7-9.5 13.2-9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z"/><path fill="#FBBC05" d="M10.8 28.6A14.4 14.4 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6L2.5 13.4A23.5 23.5 0 0 0 .5 24c0 3.8.9 7.4 2.5 10.6l7.8-6z"/><path fill="#34A853" d="M24 47.5c6 0 11-2 14.7-5.3l-7.5-5.8c-2 1.4-4.6 2.1-7.2 2.1-6.2 0-11.4-4.2-13.2-9.9l-7.8 6C6.6 41.9 14.7 47.5 24 47.5z"/>
              </svg>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Continue with Google</span>
            </button>

            <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
              New Here? <Link to="/signup" className="text-[#2d5a27] font-black hover:underline transition-all">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
