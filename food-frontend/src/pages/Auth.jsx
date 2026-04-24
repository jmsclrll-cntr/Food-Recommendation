import React, { useState } from 'react';
import axios from 'axios';
// Correct Path: go up one level from /pages to /src to find firebase.js
import { auth, googleProvider } from '../firebase'; 
import { signInWithPopup } from 'firebase/auth';

const Auth = ({ onLogin }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            const idToken = await user.getIdToken(); 

            // Matches your AuthController.js logic
            const res = await axios.post('http://localhost:5000/api/auth/google-login', {
                idToken: idToken
            });

            localStorage.setItem('token', res.data.token);
            onLogin(res.data.user);
        } catch (err) {
            console.error("Google Auth Error:", err);
            alert(err.response?.data?.error || "Google Sign-In failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuth = async (e) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        const type = isRegister ? 'register' : 'login';
        const url = `http://localhost:5000/api/auth/${type}`;
        const data = isRegister ? { email, password, username } : { email, password };

        try {
            const res = await axios.post(url, data);
            if (isRegister) {
                alert("Success! Please login.");
                setIsRegister(false);
            } else {
                localStorage.setItem('token', res.data.token);
                onLogin(res.data.user);
            }
        } catch (err) {
            alert(err.response?.data?.error || "Error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-white/30">
            {/* Header Section */}
            <div className="pt-12 pb-8 flex flex-col items-center">
                <div className="relative group mb-6">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#A3B18A] to-[#588157] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden">
                        <img 
                            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80" 
                            alt="Food Logo" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
                
                <h1 className="text-3xl font-[900] tracking-tighter text-[#344E41] uppercase leading-none text-center">
                    {isRegister ? "Join Foodie" : "Welcome Back"}
                </h1>
                <p className="text-[#588157] text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
                    Premium Nutrition & Delivery
                </p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleAuth} className="px-10 pb-6 space-y-4">
                {isRegister && (
                    <input 
                        required
                        type="text"
                        placeholder="Full Name" 
                        className="w-full bg-white/60 border border-transparent focus:border-[#A3B18A] rounded-2xl py-4 px-6 outline-none transition-all shadow-sm text-gray-700 text-sm"
                        onChange={e => setUsername(e.target.value)} 
                    />
                )}
                
                <input 
                    required
                    type="email" 
                    placeholder="Email Address" 
                    className="w-full bg-white/60 border border-transparent focus:border-[#A3B18A] rounded-2xl py-4 px-6 outline-none transition-all shadow-sm text-gray-700 text-sm"
                    onChange={e => setEmail(e.target.value)} 
                />
                
                <input 
                    required
                    type="password" 
                    placeholder="Password" 
                    className="w-full bg-white/60 border border-transparent focus:border-[#A3B18A] rounded-2xl py-4 px-6 outline-none transition-all shadow-sm text-gray-700 text-sm"
                    onChange={e => setPassword(e.target.value)} 
                />
                
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-[#588157] hover:bg-[#3A5A40] text-white rounded-full py-5 mt-4 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#588157]/30 transition-all active:scale-[0.95] disabled:opacity-50"
                >
                    {isLoading ? "AUTHENTICATING..." : (isRegister ? "CREATE ACCOUNT" : "SIGN IN →")}
                </button>
            </form>

            <div className="flex items-center my-2 px-10">
                <div className="flex-1 h-[1px] bg-gray-200"></div>
                <span className="px-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Or</span>
                <div className="flex-1 h-[1px] bg-gray-200"></div>
            </div>

            <div className="px-10 pb-4">
                <button 
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white/80 border border-gray-100 py-4 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 text-sm font-bold text-gray-600"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.12-1.92 4.12-1.2 1.2-3.08 2.48-6.12 2.48-4.92 0-8.72-4-8.72-8.92s3.8-8.92 8.72-8.92c2.6 0 4.6 1.04 6.08 2.44l2.28-2.28C18.6 1.04 15.72 0 12.48 0 6.48 0 1.6 4.84 1.6 10.84s4.88 10.84 10.88 10.84c3.24 0 5.68-1.04 7.6-3.04 2-2 2.64-4.76 2.64-6.96 0-.64-.04-1.28-.12-1.88h-10.12z"/>
                    </svg>
                    Continue with Google
                </button>
            </div>

            <p 
                className="text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-[#3A5A40] transition-colors pb-12 mt-2"
                onClick={() => setIsRegister(!isRegister)}
            >
                {isRegister ? "Already a member? Login" : "New to Foodie? Register"}
            </p>
        </div>
    );
};

export default Auth;