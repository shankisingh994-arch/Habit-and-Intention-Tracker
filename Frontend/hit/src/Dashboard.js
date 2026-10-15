import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';

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
        {/* Sidebar */}
        <aside className="sidebar">
          <ul>
            <li className="active">📊 Dashboard</li>
            <li>✅ My Habits</li>
            <li>📅 Calendar</li>
            <li>📈 Progress</li>
            <li>⚙️ Settings</li>
          </ul>
        </aside>

        {/* Content */}
        <main className="content">
          <h2>Welcome back, {username}!</h2>
          <p>Track your habits and stay consistent.</p>

          <div className="cards">
            <div className="card">
              <h3>🔥 Today's Habits</h3>
              <p>3 / 5 Completed</p>
            </div>
            <div className="card">
              <h3>🏆 Streak</h3>
              <p>7 Days</p>
            </div>
            <div className="card">
              <h3>📊 Total Habits</h3>
              <p>12 Habits</p>
            </div>
          </div>

          <div className="habit-box">
            <h3>Add New Habit</h3>
            <p>Coming soon - Your habit tracking feature here</p>
            <button className="btn-primary">+ New Habit</button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;