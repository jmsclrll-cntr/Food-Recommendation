import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Signup from './pages/signup';
import Dashboard from './pages/dashboard';
import GenerateWeekly from './pages/generateWeekly.jsx';
import Profile from './pages/Profile.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/Login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/generate-weekly" element={<GenerateWeekly />} />
        <Route path="/Profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}   

export default App;