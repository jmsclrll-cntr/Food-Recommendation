import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Auth from './pages/Auth';
import Dashboard from './pages/dashboard'; // Note: matches your lowercase filename
import DietPlanner from './pages/DietPlanner'; // 1. Must import the file to use it
import Profile from './pages/Profile'; // NEW IMPORT

function App() {
  const [user, setUser] = useState(null);
  // 2. We need a state to track which page the logged-in user is seeing
  const [view, setView] = useState('dashboard'); 

  const handleLogin = (userData) => {
    setUser(userData);
    setView('dashboard'); // Reset to dashboard on login
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-['Inter',sans-serif]">
      {/* GLOBAL BACKGROUND */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10s] scale-110 hover:scale-100"
        style={{ backgroundImage: `url('/background.jpg')` }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" />

      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="auth-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="z-10 w-full max-w-md px-4"
          >
            <Auth onLogin={handleLogin} />
          </motion.div>
        ) : (
          <motion.div 
            key={view} // Changing the key triggers the animation
            className="z-10 w-full h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* 3. Logic to switch between Dashboard, DietPlanner, and Profile */}
            {view === 'dashboard' ? (
              <Dashboard 
                user={user} 
                onLogout={handleLogout} 
                onNavigate={() => {
                  console.log("Navigating to Diet Planner..."); // Debug line
                  setView('diet');
                }} 
                onNavigateProfile={() => setView('profile')} // NEW PROP ADDED
              />
            ) : view === 'diet' ? (
              <DietPlanner onBack={() => setView('dashboard')} />
            ) : (
              <Profile user={user} onBack={() => setView('dashboard')} /> // NEW VIEW ADDED
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;