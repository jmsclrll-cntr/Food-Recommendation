import React, { useState } from 'react';
import axios from 'axios';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
// try 
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

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
      alert("Google Sign-In failed.");
    }
  };

  return (
    <div className="min-h-screen bg-[#2d4a2d] flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="w-full max-w-[380px] bg-white/95 backdrop-blur-md rounded-[45px] shadow-2xl p-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-full p-2 shadow-lg mb-4 flex items-center justify-center border border-gray-100">
           <img src="/src/assets/hero.png" alt="Logo" className="w-10 h-10 object-contain" />
        </div>
        <h2 className="text-[#3A5A40] text-xl font-black uppercase tracking-tight">Welcome Back</h2>
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[2px] mb-8">Premium Nutrition & Delivery</p>

        <form onSubmit={handleLogin} className="w-full space-y-3">
          <input type="email" placeholder="Email" className="w-full px-5 py-3.5 bg-[#f0f4f0] rounded-xl outline-none" onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="••••••••" className="w-full px-5 py-3.5 bg-[#f0f4f0] rounded-xl outline-none" onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="w-full py-4 bg-[#588157] text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest shadow-lg">Sign In →</button>
        </form>

        <div className="w-full flex items-center my-6"><div className="flex-1 border-t border-gray-200"></div><span className="px-3 text-[9px] text-gray-400 font-bold uppercase">OR</span><div className="flex-1 border-t border-gray-200"></div></div>

        <button onClick={handleGoogle} className="w-full py-3.5 border border-gray-200 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
          <span className="text-gray-600 font-bold text-[10px] uppercase tracking-widest">Continue with Google</span>
        </button>
        <p className="mt-8 text-[9px] text-gray-400 font-bold uppercase tracking-widest">New Here? <Link to="/signup" className="text-[#588157]">Register</Link></p>
      </div>
    </div>
  );
};

export default Login;