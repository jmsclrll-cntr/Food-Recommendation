import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  // --- UI State: The Aesthetic Pulse ---
  const [isInverted, setIsInverted] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsInverted(prev => !prev);
    }, 4500); 
    return () => clearInterval(interval);
  }, []);

  // --- UI Logic: Typewriter Effect ---
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const phrases = ["Organic Delivery.", "Premium Nutrition.", "Elite Community."];

  useEffect(() => {
    const timer = setTimeout(() => {
      const i = loopNum % phrases.length;
      const fullText = phrases[i];
      setDisplayText(isDeleting ? fullText.substring(0, displayText.length - 1) : fullText.substring(0, displayText.length + 1));
      if (!isDeleting && displayText === fullText) setTimeout(() => setIsDeleting(true), 2500);
      else if (isDeleting && displayText === "") { setIsDeleting(false); setLoopNum(loopNum + 1); }
    }, isDeleting ? 40 : 80);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopNum]);

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      alert("Registration Successful!");
      navigate('/');
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Registration failed"));
    }
  };

  return (
    /* RESTORED: ORIGINAL BACKGROUND COLOR AND CUBE TEXTURE */
    <div className="custom-cursor min-h-screen bg-[#1b4332] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex items-center justify-center p-6 font-sans selection:bg-[#95d5b2] selection:text-[#1b4332]">
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-cursor {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='8' fill='black' stroke='white' stroke-width='2'/%3E%3C/svg%3E"), auto;
        }

        .aesthetic-transition {
          transition: all 1.8s cubic-bezier(0.77, 0, 0.175, 1);
        }

        /* UNIVERSAL FILL ANIMATION CLASS */
        .portal-fill-box {
          position: relative;
          overflow: hidden;
          z-index: 1;
        }

        .portal-fill-box::before {
          content: '';
          position: absolute;
          bottom: 0; left: 0; width: 100%; height: 0%;
          z-index: -1;
          transition: all 0.6s cubic-bezier(0.77, 0, 0.175, 1);
        }

        .portal-fill-box:hover::before {
          height: 100%;
        }

        .fill-dark-green::before { background: #1b4332; }
        .fill-mint::before { background: #95d5b2; }
        .fill-white::before { background: #ffffff; }

        @keyframes subtle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-subtle-float { animation: subtle-float 6s ease-in-out infinite; }
      `}} />

      <div className="relative w-full max-w-[1150px] min-h-[780px] bg-[#fcfdfc] rounded-[70px] shadow-[0_100px_180px_-40px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col md:flex-row aesthetic-transition">
        
        {/* LEFT PANEL */}
        <div className={`relative w-full md:w-[42%] p-20 flex flex-col items-center justify-center overflow-hidden text-center aesthetic-transition ${isInverted ? 'bg-[#fcfdfc]' : 'bg-[#1b4332]'}`}>
          <div className="relative z-10 animate-subtle-float">
            <div className={`w-28 h-28 rounded-[40px] flex items-center justify-center mx-auto mb-12 aesthetic-transition border shadow-2xl
              ${isInverted ? 'bg-[#1b4332]/5 border-[#1b4332]/10 backdrop-blur-md' : 'bg-white/10 border-white/20 backdrop-blur-xl'}`}>
               <img src="/src/assets/hero.png" alt="Logo" className={`w-14 h-14 object-contain transition-all duration-1000 ${isInverted ? 'brightness-100 opacity-80' : 'brightness-0 invert opacity-90'}`} />
            </div>

            <h1 className={`text-7xl font-black tracking-tighter italic mb-6 aesthetic-transition ${isInverted ? 'text-[#1b4332]' : 'text-white'}`}>
              Foodie<span className="text-[#95d5b2]">.</span>
            </h1>
            <p className="text-[#95d5b2] text-sm font-medium tracking-[8px] uppercase opacity-80">{displayText}</p>
          </div>

          <div className="absolute top-0 bottom-0 -right-1 w-36 hidden md:block">
            <svg className={`h-full w-full aesthetic-transition ${isInverted ? 'fill-[#1b4332]' : 'fill-[#fcfdfc]'}`} viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0 C 100 0 15 50 100 100 L 100 100 L 100 0 Z" />
            </svg>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className={`w-full md:w-[58%] p-12 md:p-24 flex flex-col justify-center aesthetic-transition ${isInverted ? 'bg-[#1b4332]' : 'bg-[#fcfdfc]'}`}>
          <div className="max-w-[420px] mx-auto w-full">
            
            <header className="mb-16 flex flex-col items-center md:items-start">
              <div className="text-center md:text-left">
                <h2 className={`text-7xl font-black tracking-tighter leading-[0.85] italic uppercase aesthetic-transition ${isInverted ? 'text-white' : 'text-[#1b4332]'}`}>BEGIN</h2>
                <h2 className={`text-7xl font-black tracking-tighter leading-[0.85] italic uppercase aesthetic-transition ${isInverted ? 'text-white' : 'text-[#1b4332]'}`}>JOURNEY</h2>
              </div>
              <div className="h-[4px] w-16 bg-[#95d5b2] mt-8 rounded-full shadow-[0_0_15px_rgba(149,213,178,0.6)]"></div>
            </header>

            <form onSubmit={handleSignup} className="space-y-6">
              {['username', 'email', 'password'].map((field) => {
                const labels = { username: 'Identity', email: 'Email Access', password: 'Security Key' };
                return (
                  <div key={field} 
                    className={`portal-fill-box group rounded-2xl aesthetic-transition 
                      ${isInverted ? 'bg-[#0a1a13] fill-mint' : 'bg-gray-100 fill-dark-green'}`}>
                    
                    <div className="px-8 py-5">
                      <label className={`block transition-all duration-500 font-bold uppercase mb-1 text-[10px] tracking-[4px]
                        ${isInverted ? 'text-[#95d5b2] group-hover:text-[#1b4332]' : 'text-gray-400 group-hover:text-[#95d5b2]'}`}>
                        {labels[field]}
                      </label>
                      <input 
                        type={field === 'password' ? 'password' : 'text'} 
                        required 
                        className={`w-full bg-transparent outline-none font-bold text-lg transition-all duration-500
                          ${isInverted ? 'text-white group-hover:text-[#1b4332]' : 'text-[#1b4332] group-hover:text-white'}`}
                        onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-8 space-y-6">
                <button type="submit" 
                  className={`portal-fill-box group w-full py-7 rounded-[30px] font-black text-[11px] uppercase tracking-[8px] aesthetic-transition shadow-2xl active:scale-95
                  ${isInverted ? 'bg-white text-[#1b4332] fill-mint' : 'bg-[#1b4332] text-[#95d5b2] fill-white'}`}>
                   <span className={`transition-colors duration-500 ${isInverted ? 'group-hover:text-white' : 'group-hover:text-[#1b4332]'}`}>
                    CONFIRM ACCESS
                   </span>
                </button>

                <Link to="/" 
                  className={`portal-fill-box group block w-full py-6 rounded-[30px] font-black text-[10px] uppercase tracking-[6px] text-center border-2 aesthetic-transition
                  ${isInverted ? 'border-white/10 text-white/60 fill-white' : 'border-gray-100 text-gray-400 fill-dark-green'}`}>
                  <span className={`transition-colors duration-500 ${isInverted ? 'group-hover:text-[#1b4332]' : 'group-hover:text-white'}`}>
                    BACK TO PORTAL
                  </span>
                </Link>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Signup;