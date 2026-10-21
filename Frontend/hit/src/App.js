import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';

import MyHabits from "./MyHabits";
import CalendarView from "./CalendarView";
import Layout from "./Layout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
		<Route path="/my-habits" element={<MyHabits />} />
          <Route path="/calendar" element={<CalendarView />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;