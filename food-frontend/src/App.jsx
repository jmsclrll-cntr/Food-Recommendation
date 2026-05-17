import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/login';
import Signup from './pages/signup';
import Dashboard from './pages/dashboard';
import GenerateWeekly from './pages/generateWeekly.jsx';
import Profile from './pages/Profile.jsx';
import ViewWeekly from './pages/viewWeekly.jsx';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/generate-weekly" element={<GenerateWeekly />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/view-weekly" element={<ViewWeekly />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;