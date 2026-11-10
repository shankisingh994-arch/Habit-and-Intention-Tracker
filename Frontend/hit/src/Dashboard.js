import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import MyHabits from "./MyHabits";
import CalendarView from "./CalendarView";

// Chart.js imports
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const API = "http://localhost:8000";

function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';
  // dashboard | my-habits | calendar | intentions | reminders | summary
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ today_completed: 0, today_total: 0, streak: 0, total_habits: 0 });

  // Intentions state
  const [intentions, setIntentions] = useState([]);
  const [newIntention, setNewIntention] = useState('');
  const [intentionType, setIntentionType] = useState('health');

  // Reminder state
  const [reminders, setReminders] = useState([]);
  const [reminderForm, setReminderForm] = useState({
    habit_id: '',
    habit_type: 'daily',
    reminder_time: '08:00',
    reminder_days: 'Daily'
  });

  // Weekly summary for chart
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchDashboard = () => {
    axios.get(`${API}/dashboard`, { headers: getHeaders() })
      .then(res => setStats(res.data))
      .catch(() => {});
  };

  const fetchIntentions = () => {
    axios.get(`${API}/intentions`, { headers: getHeaders() })
      .then(res => setIntentions(res.data))
      .catch(() => {});
  };

  const fetchReminders = () => {
    axios.get(`${API}/reminders`, { headers: getHeaders() })
      .then(res => setReminders(res.data))
      .catch(() => {});
  };

  const fetchWeekly = () => {
    axios.get(`${API}/summary/weekly`, { headers: getHeaders() })
      .then(res => {
        // Backend se [Mon..Sun] array aayega, agar nahi aaya to dummy
        if (Array.isArray(res.data) && res.data.length === 7) setWeeklyData(res.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDashboard();
    fetchIntentions();
    fetchReminders();
    fetchWeekly();
  }, [navigate, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  // --- Intentions Functions ---
  const addIntention = async () => {
    if (!newIntention.trim()) return;
    try {
      await axios.post(`${API}/intentions`,
        { intention_text: newIntention, intention_type: intentionType, planned_date: new Date().toISOString().split('T')[0] },
        { headers: getHeaders() });
      setNewIntention('');
      fetchIntentions();
    } catch (e) { alert('Failed to add intention'); }
  };

  const markIntentionDone = async (id) => {
    await axios.put(`${API}/intentions/${id}/done`, {}, { headers: getHeaders() });
    fetchIntentions();
  };

  // --- Reminder Functions ---
  const addReminder = async () => {
    if (!reminderForm.habit_id) { alert('Habit ID dalo'); return; }
    try {
      await axios.post(`${API}/reminders`, reminderForm, { headers: getHeaders() });
      alert('Reminder Set!');
      fetchReminders();
    } catch (e) { alert('Failed to set reminder'); }
  };

  // --- Chart Data ---
  const barData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Completed Habits',
      data: weeklyData,
      backgroundColor: '#4CAF50',
      borderRadius: 6,
    }]
  };

  const doughnutData = {
    labels: ['Completed', 'Pending'],
    datasets: [{
      data: [stats.today_completed, Math.max(0, stats.today_total - stats.today_completed)],
      backgroundColor: ['#4CAF50', '#E0E0E0'],
    }]
  };

  const barOptions = { responsive: true, plugins: { legend: { display: false } } };

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
            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</li>
            <li className={activeTab === 'my-habits' ? 'active' : ''} onClick={() => setActiveTab('my-habits')}>✅ My Habits</li>
            <li className={activeTab === 'calendar' ? 'active' : ''} onClick={() => setActiveTab('calendar')}>📅 Calendar</li>
            <li className={activeTab === 'intentions' ? 'active' : ''} onClick={() => setActiveTab('intentions')}>🎯 Intentions</li>
            <li className={activeTab === 'reminders' ? 'active' : ''} onClick={() => setActiveTab('reminders')}>⏰ Reminder Rules</li>
            <li className={activeTab === 'summary' ? 'active' : ''} onClick={() => setActiveTab('summary')}>📈 Progress / Summary</li>
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
                <div className="card"><h3>🔥 Today's Habits</h3><p>{stats.today_completed} / {stats.today_total} Completed</p></div>
                <div className="card"><h3>🏆 Streak</h3><p>{stats.streak} Days</p></div>
                <div className="card"><h3>📊 Total Habits</h3><p>{stats.total_habits} Habits</p></div>
              </div>

              {/* Summary Chart on Dashboard */}
              <div className="habit-box">
                <h3>📈 This Week Summary</h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ width: '60%', minWidth: '280px' }}><Bar data={barData} options={barOptions} /></div>
                  <div style={{ width: '30%', minWidth: '200px' }}><Doughnut data={doughnutData} /></div>
                </div>
              </div>

              <div className="habit-box">
                <h3>Add New Habit</h3>
                <MyHabits />
              </div>
            </>
          )}

          {activeTab === 'my-habits' && <MyHabits />}

          {activeTab === 'calendar' && <CalendarView />}

          {/* ===== INTENTIONS TAB ===== */}
          {activeTab === 'intentions' && (
            <div>
              <h2>🎯 My Intentions</h2>
              <p>Apne daily intentions set karo.</p>
              <div className="habit-box" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  value={newIntention}
                  onChange={e => setNewIntention(e.target.value)}
                  placeholder="e.g. Aaj 30 min workout karunga"
                  style={{ flex: 1, padding: '8px' }}
                />
                <select value={intentionType} onChange={e => setIntentionType(e.target.value)}>
                  <option value="health">Health</option>
                  <option value="learning">Learning</option>
                  <option value="work">Work</option>
                  <option value="general">General</option>
                </select>
                <button onClick={addIntention}>Add Intention</button>
              </div>

              <div className="habit-box">
                {intentions.length === 0 ? <p>No intentions yet. Upar se add karo.</p> : (
                  <ul>
                    {intentions.map(item => (
                      <li key={item.id} style={{ marginBottom: '8px', textDecoration: item.is_done ? 'line-through' : 'none' }}>
                        {item.intention_text} <small>({item.intention_type})</small>
                        {!item.is_done && <button style={{ marginLeft: '10px' }} onClick={() => markIntentionDone(item.id)}>Mark Done ✅</button>}
                        {item.is_done && <span> ✅ Done</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* ===== REMINDER RULES TAB ===== */}
          {activeTab === 'reminders' && (
            <div>
              <h2>⏰ Reminder Rules</h2>
              <p>Habit ke liye time + days set karo.</p>

              <div className="habit-box" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  placeholder="Habit ID (e.g. 1)"
                  value={reminderForm.habit_id}
                  onChange={e => setReminderForm({ ...reminderForm, habit_id: e.target.value })}
                />
                <select value={reminderForm.habit_type} onChange={e => setReminderForm({ ...reminderForm, habit_type: e.target.value })}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
                <input
                  type="time"
                  value={reminderForm.reminder_time}
                  onChange={e => setReminderForm({ ...reminderForm, reminder_time: e.target.value })}
                />
                <input
                  placeholder="Mon,Wed,Fri ya Daily"
                  value={reminderForm.reminder_days}
                  onChange={e => setReminderForm({ ...reminderForm, reminder_days: e.target.value })}
                />
                <button onClick={addReminder}>Set Reminder</button>
              </div>

              <div className="habit-box">
                <h3>Active Reminders</h3>
                {reminders.length === 0 ? <p>No reminders yet.</p> : (
                  <ul>
                    {reminders.map(r => (
                      <li key={r.id}>Habit {r.habit_id} ({r.habit_type}) - {r.reminder_time} - {r.reminder_days} {r.is_active ? '🟢' : '🔴'}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* ===== SUMMARY / PROGRESS TAB ===== */}
          {activeTab === 'summary' && (
            <div>
              <h2>📈 Progress / Summary</h2>
              <div className="cards">
                <div className="card"><h3>🔥 Today</h3><p>{stats.today_completed} / {stats.today_total}</p></div>
                <div className="card"><h3>🏆 Streak</h3><p>{stats.streak} Days</p></div>
                <div className="card"><h3>📊 Total</h3><p>{stats.total_habits} Habits</p></div>
              </div>

              <div className="habit-box">
                <h3>Weekly Completion - Bar Chart</h3>
                <Bar data={barData} options={barOptions} />
              </div>

              <div className="habit-box">
                <h3>Today's Progress - Doughnut Chart</h3>
                <div style={{ width: '300px', maxWidth: '100%' }}><Doughnut data={doughnutData} /></div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default Dashboard;