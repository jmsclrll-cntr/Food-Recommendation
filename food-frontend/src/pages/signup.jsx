import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  // --- UI ONLY: Typewriter Effect ---
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
    /* BACKGROUND: GEOMETRIC CUBES */
    <div className="custom-cursor min-h-screen bg-[#1b4332] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex items-center justify-center p-4 font-sans selection:bg-[#95d5b2] selection:text-[#1b4332]">
      
      {/* CLEAN UI ENGINE */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-cursor {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='8' fill='black' stroke='white' stroke-width='2'/%3E%3C/svg%3E"), auto;
        }
        
        input { caret-color: #95d5b2 !important; }

        @keyframes float-header {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float { animation: float-header 5s ease-in-out infinite; }

        /* THE CLEAN PORTAL CONTAINER */
        .portal-container {
          position: relative;
          background: #fcfdfc;
          border-radius: 16px 16px 4px 4px;
          overflow: hidden; /* Stops fill from leaking */
          transition: all 0.4s ease;
          border-bottom: 2px solid #edf2ed;
        }

        /* THE RISING GREEN FILL (BEHIND CONTENT) */
        .portal-container::before {
          content: '';
          position: absolute;
          bottom: 0; left: 0; width: 100%; height: 0%;
          background: #1b4332; /* Forest Green Abyss */
          z-index: 0;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* ACTIVE STATES */
        .portal-active::before {
          height: 100%;
        }
        .portal-active {
          border-bottom: 2px solid #95d5b2;
          box-shadow: 0 10px 30px -10px rgba(27,67,50,0.3);
          transform: translateY(-2px);
        }

        /* CONTENT LAYER (STAYS ON TOP) */
        .portal-content {
          position: relative;
          z-index: 10;
        }

        .portal-btn-abyss {
          position: relative;
          z-index: 1;
          overflow: hidden;
          transition: all 0.4s ease;
        }
        .portal-btn-abyss::before {
          content: '';
          position: absolute;
          bottom: 0; left: 0; width: 100%; height: 0%;
          background: #1b4332;
          z-index: -1;
          transition: all 0.4s ease;
        }
        .portal-btn-abyss:hover::before { height: 100%; }
      `}} />

      <div className="relative w-full max-w-[1100px] min-h-[750px] bg-white rounded-[60px] shadow-[0_80px_150px_-30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT PANEL: BRANDING */}
        <div className="relative w-full md:w-[40%] bg-[#1b4332] p-16 flex flex-col items-center justify-center overflow-hidden text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#2d6a4f_0%,_transparent_70%)] opacity-30 animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[35px] flex items-center justify-center mx-auto mb-10 shadow-2xl">
               <img src="/src/assets/hero.png" alt="Logo" className="w-12 h-12 object-contain brightness-0 invert" />
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter italic mb-4">Foodie<span className="text-[#95d5b2]">.</span></h1>
            <p className="text-[#95d5b2] text-xl font-light tracking-[5px] uppercase">{displayText}</p>
          </div>

          <div className="absolute top-0 bottom-0 -right-1 w-32 hidden md:block">
            <svg className="h-full w-full fill-white" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0 C 100 0 20 50 100 100 L 100 100 L 100 0 Z" />
            </svg>
          </div>
        </div>

        {/* RIGHT PANEL: CLEAN FORM */}
        <div className="w-full md:w-[60%] p-10 md:p-20 bg-white flex flex-col justify-center">
          <div className="max-w-[400px] mx-auto w-full">
            
            {/* FLOATING HEADER */}
            <header className="mb-14 flex flex-col items-center md:items-start">
              <div className="animate-float text-center md:text-left">
                <h2 className="text-7xl font-black text-[#1b4332] tracking-tighter leading-none italic uppercase">BEGIN</h2>
                <h2 className="text-7xl font-black text-[#1b4332] tracking-tighter leading-none italic mt-1 uppercase">JOURNEY</h2>
              </div>
              <div className="h-[3px] w-14 bg-[#95d5b2] mt-6 rounded-full shadow-lg"></div>
            </header>

            <form onSubmit={handleSignup} className="space-y-8">
              
              {/* DYNAMIC SURGICAL INPUTS */}
              {['username', 'email', 'password'].map((field) => {
                const hasValue = formData[field].length > 0;
                const labels = { username: 'Identity', email: 'Email Access', password: 'Security Key' };
                
                return (
                  <div key={field} className={`portal-container ${hasValue ? 'portal-active' : 'focus-within:portal-active'}`}>
                    <div className="portal-content px-6 py-4">
                      <label className={`block transition-all duration-500 font-black uppercase mb-1
                        ${hasValue ? 'text-[#95d5b2] text-[10px] tracking-[3px]' : 'text-gray-400 text-[10px] tracking-widest'}`}>
                        {labels[field]}
                      </label>
                      <input 
                        type={field === 'password' ? 'password' : 'text'} 
                        required 
                        placeholder={hasValue ? "" : `Enter ${labels[field]}`}
                        className={`w-full bg-transparent outline-none font-bold transition-all duration-500 py-1
                          ${hasValue ? 'text-white' : 'text-gray-700'}`}
                        onChange={(e) => setFormData({...formData, [field]: e.target.value})}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-6 space-y-5">
                <button type="submit" className="relative w-full py-6 bg-[#1b4332] text-[#95d5b2] rounded-[24px] font-black text-xs uppercase tracking-[6px] transition-all duration-500 hover:bg-[#2d6a4f] hover:text-white hover:shadow-2xl active:scale-95">
                   CONFIRM ACCESS
                </button>

                <Link to="/" className="portal-btn-abyss block w-full py-6 border-2 border-gray-100 text-gray-400 rounded-[24px] font-black text-xs uppercase tracking-[6px] text-center hover:text-[#95d5b2] hover:border-[#1b4332]">
                  BACK TO PORTAL
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