import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-[#2d4a2d] flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-md rounded-[45px] shadow-2xl p-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-full p-2 shadow-lg mb-4 flex items-center justify-center border border-gray-100">
           <img src="/src/assets/hero.png" alt="Logo" className="w-10 h-10 object-contain" />
        </div>
        <h2 className="text-[#3A5A40] text-xl font-black uppercase tracking-tight">Join Foodie</h2>
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[2px] mb-8">Premium Nutrition & Delivery</p>

        <form onSubmit={handleSignup} className="w-full space-y-3">
          <input 
            type="text" 
            placeholder="Username" 
            className="w-full px-5 py-3.5 bg-[#f0f4f0] border-none rounded-xl text-sm outline-none focus:ring-2 ring-[#588157]"
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full px-5 py-3.5 bg-[#f0f4f0] border-none rounded-xl text-sm outline-none focus:ring-2 ring-[#588157]"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input 
            type="password" 
            placeholder="Security Key" 
            className="w-full px-5 py-3.5 bg-[#f0f4f0] border-none rounded-xl text-sm outline-none focus:ring-2 ring-[#588157]"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <button type="submit" className="w-full py-4 bg-[#588157] text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-[#3A5A40] transition-all shadow-lg mt-2">
            Create Account
          </button>
        </form>
        <Link to="/" className="mt-8 text-[9px] text-gray-400 font-bold uppercase tracking-widest hover:text-[#588157]">Already a Member? Login</Link>
      </div>
    </div>
  );
};

export default Signup;