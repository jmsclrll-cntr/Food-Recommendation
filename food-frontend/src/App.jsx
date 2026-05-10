import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Signup from './pages/signup';
import Dashboard from './pages/dashboard';
import GenerateWeekly from './pages/generateWeekly.jsx';
import Profile from './pages/Profile.jsx';
import ViewWeekly from './pages/viewWeekly.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/generate-weekly" element={<GenerateWeekly />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/view-weekly" element={<ViewWeekly />} />
      </Routes>
    </Router>
  );
}   

export default App;