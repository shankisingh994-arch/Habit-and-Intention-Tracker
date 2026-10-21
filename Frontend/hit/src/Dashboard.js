import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import MyHabits from "./MyHabits";
import CalendarView from "./CalendarView";

const API = "http://localhost:8000";

function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | my-habits | calendar
  const [stats, setStats] = useState({ today_completed: 0, today_total: 0, streak: 0, total_habits: 0 });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // Fetch real stats for your cards
    axios.get(`${API}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setStats(res.data)).catch(() => {
      // if token invalid
      // navigate('/login');
    });
  }, [navigate, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo">HIT - Habit Tracker</div>
        <div className="header-right">
          <span className="welcome">Hi, <b>{username}</b></span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-main">
        {/* Sidebar - NOW CLICKABLE */}
        <aside className="sidebar">
          <ul>
            <li 
              className={activeTab === 'dashboard' ? 'active' : ''} 
              onClick={() => setActiveTab('dashboard')}
            >📊 Dashboard</li>
            
            <li 
              className={activeTab === 'my-habits' ? 'active' : ''} 
              onClick={() => setActiveTab('my-habits')}
            >✅ My Habits</li>
            
            <li 
              className={activeTab === 'calendar' ? 'active' : ''} 
              onClick={() => setActiveTab('calendar')}
            >📅 Calendar</li>
            
            <li onClick={() => alert('Progress coming soon')}>📈 Progress</li>
            <li onClick={() => alert('Settings coming soon')}>⚙️ Settings</li>
          </ul>
        </aside>

        {/* Content */}
        <main className="content">
          
          {activeTab === 'dashboard' && (
            <>
              <h2>Welcome back, {username}!</h2>
              <p>Track your habits and stay consistent.</p>

              <div className="cards">
                <div className="card">
                  <h3>🔥 Today's Habits</h3>
                  <p>{stats.today_completed} / {stats.today_total} Completed</p>
                </div>
                <div className="card">
                  <h3>🏆 Streak</h3>
                  <p>{stats.streak} Days</p>
                </div>
                <div className="card">
                  <h3>📊 Total Habits</h3>
                  <p>{stats.total_habits} Habits</p>
                </div>
              </div>

              <div className="habit-box">
                <h3>Add New Habit</h3>
                <MyHabits />
              </div>
            </>
          )}

          {activeTab === 'my-habits' && (
            <MyHabits />
          )}

          {activeTab === 'calendar' && (
            <CalendarView />
          )}

        </main>
      </div>
    </div>
  );
}

export default Dashboard;