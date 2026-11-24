import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import MyHabits from "./MyHabits";
import CalendarView from "./CalendarView";
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const API = "http://localhost:8000";

function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ today_completed: 0, today_total: 0, streak: 0, total_habits: 0 });
  const [intentions, setIntentions] = useState([]);
  const [newIntention, setNewIntention] = useState('');
  const [intentionType, setIntentionType] = useState('health');
  const [reminders, setReminders] = useState([]);
  const [reminderForm, setReminderForm] = useState({ habit_id: '', habit_type: 'daily', reminder_time: '08:00', reminder_days: 'Daily' });
  const [weeklyData, setWeeklyData] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [progress, setProgress] = useState([]);
  const [dueReminders, setDueReminders] = useState([]);
  const shownReminderRef = useRef(new Set());

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchDashboard = () => axios.get(`${API}/dashboard`, { headers: getHeaders() }).then(res => setStats(res.data)).catch(() => {});
  const fetchIntentions = () => axios.get(`${API}/intentions`, { headers: getHeaders() }).then(res => setIntentions(res.data)).catch(() => {});
  const fetchReminders = () => axios.get(`${API}/reminders`, { headers: getHeaders() }).then(res => setReminders(res.data)).catch(() => {});
  const fetchWeekly = () => axios.get(`${API}/summary/weekly`, { headers: getHeaders() }).then(res => { if (Array.isArray(res.data) && res.data.length === 7) setWeeklyData(res.data); }).catch(() => {});
  const fetchProgress = () => axios.get(`${API}/habits/progress`, { headers: getHeaders() }).then(res => setProgress(res.data)).catch(() => {});
  const fetchDue = () => axios.get(`${API}/reminders/due`, { headers: getHeaders() }).then(res => setDueReminders(res.data)).catch(() => {});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchDashboard(); fetchIntentions(); fetchReminders(); fetchWeekly(); fetchProgress(); fetchDue();
  }, [navigate, activeTab]);

  // Reminder Check - Check every 60 seconds, alert if time is reached and habit is pending
  useEffect(() => {
    const interval = setInterval(() => { fetchDue(); }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Show alert once when a due reminder arrives
  useEffect(() => {
    dueReminders.forEach(r => {
      const key = `${r.reminder_id}-${new Date().toDateString()}`;
      if (!shownReminderRef.current.has(key)) {
        shownReminderRef.current.add(key);
        alert(`Reminder: ${r.message}`);
      }
    });
  }, [dueReminders]);

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('username'); navigate('/login'); };

  const addIntention = async () => {
    if (!newIntention.trim()) return;
    try {
      await axios.post(`${API}/intentions`, { intention_text: newIntention, intention_type: intentionType, planned_date: new Date().toISOString().split('T')[0] }, { headers: getHeaders() });
      setNewIntention(''); fetchIntentions();
    } catch (e) { alert('Failed to add intention'); }
  };
  const markIntentionDone = async (id) => { await axios.put(`${API}/intentions/${id}/done`, {}, { headers: getHeaders() }); fetchIntentions(); };

  const addReminder = async () => {
    if (!reminderForm.habit_id) { alert('Please enter a Habit ID'); return; }
    try {
      await axios.post(`${API}/reminders`, { ...reminderForm, habit_id: parseInt(reminderForm.habit_id) }, { headers: getHeaders() });
      alert('Reminder set successfully!'); fetchReminders(); fetchDue();
    } catch (e) { alert('Failed to set reminder. Please check if the Habit ID is correct.'); }
  };

  const deleteReminder = async (id) => {
    await axios.delete(`${API}/reminders/${id}`, { headers: getHeaders() });
    fetchReminders(); fetchDue();
  };

  const getProgressColor = (percent) => {
    if (percent >= 80) return '#4CAF50';
    if (percent >= 50) return '#FF9800';
    return '#F44336';
  };

  const barData = { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ label: 'Completed Habits', data: weeklyData, backgroundColor: '#4CAF50', borderRadius: 6 }] };
  const doughnutData = { labels: ['Completed', 'Pending'], datasets: [{ data: [stats.today_completed, Math.max(0, stats.today_total - stats.today_completed)], backgroundColor: ['#4CAF50', '#E0E0E0'] }] };
  const barOptions = { responsive: true, plugins: { legend: { display: false } } };

  const renderHabitProgress = () => {
    if (progress.length === 0) return <p>No habits yet. Create a habit to get started.</p>;
    return (
      <div>
        {progress.map(p => (
          <div key={p.habit_id} style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <b>{p.habit_name} - {p.streak} Day Streak</b>
              <span>{p.completed_days} / {p.total_days} days - <b style={{ color: getProgressColor(p.percent) }}>{p.percent}%</b> {p.is_completed_today ? 'Completed Today' : 'Pending Today'}</span>
            </div>
            <div style={{ background: '#E0E0E0', height: '12px', borderRadius: '6px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${p.percent}%`, background: getProgressColor(p.percent), height: '12px', borderRadius: '6px', transition: 'width 0.5s ease' }}></div>
            </div>
            <small style={{ color: '#666' }}>{p.percent === 100 ? 'Perfect! 100% Complete' : p.percent >= 50 ? 'Great progress! Keep it up.' : 'Keep pushing! If you skip a day, your streak will reset to 0.'}</small>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">HIT - Habit Tracker</div>
        <div className="header-right">
          <span className="welcome">Hi, <b>{username}</b></span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* DUE REMINDER BANNER - If any habit is pending */}
      {dueReminders.length > 0 && (
        <div style={{ background: '#FFF3CD', border: '1px solid #FFC107', padding: '12px 20px', margin: '10px 20px 0', borderRadius: '8px' }}>
          <b>Reminder:</b> {dueReminders.map(r => r.message).join(' | ')}
          <button style={{ marginLeft: '15px' }} onClick={() => setActiveTab('my-habits')}>Complete Now</button>
        </div>
      )}

      <div className="dashboard-main">
        <aside className="sidebar">
          <ul>
            <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</li>
            <li className={activeTab === 'my-habits' ? 'active' : ''} onClick={() => setActiveTab('my-habits')}>My Habits</li>
            <li className={activeTab === 'calendar' ? 'active' : ''} onClick={() => setActiveTab('calendar')}>Calendar</li>
            <li className={activeTab === 'intentions' ? 'active' : ''} onClick={() => setActiveTab('intentions')}>Intentions</li>
            <li className={activeTab === 'reminders' ? 'active' : ''} onClick={() => setActiveTab('reminders')}>Reminder Rules {dueReminders.length > 0 && `(${dueReminders.length})`}</li>
            <li className={activeTab === 'summary' ? 'active' : ''} onClick={() => setActiveTab('summary')}>Progress / Summary</li>
            <li onClick={() => alert('Settings coming soon')}>Settings</li>
          </ul>
        </aside>

        <main className="content">
          {activeTab === 'dashboard' && (
            <>
              <h2>Welcome back, {username}!</h2>
              <p>Track your habits and stay consistent.</p>
              <div className="cards">
                <div className="card"><h3>Today's Habits</h3><p>{stats.today_completed} / {stats.today_total} Completed</p></div>
                <div className="card"><h3>Streak</h3><p>{stats.streak} Days</p></div>
                <div className="card"><h3>Total Habits</h3><p>{stats.total_habits} Habits</p></div>
              </div>
              <div className="habit-box">
                <h3>Habit Completion - Last 7 Days</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>Example: Running - 4/7 days = 57%</p>
                {renderHabitProgress()}
              </div>
              <div className="habit-box">
                <h3>This Week Summary</h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ width: '60%', minWidth: '280px' }}><Bar data={barData} options={barOptions} /></div>
                  <div style={{ width: '30%', minWidth: '200px' }}><Doughnut data={doughnutData} /></div>
                </div>
              </div>
              <div className="habit-box"><h3>Add New Habit</h3><MyHabits /></div>
            </>
          )}

          {activeTab === 'my-habits' && <MyHabits onHabitChange={() => { fetchDashboard(); fetchProgress(); fetchDue(); }} />}

          {activeTab === 'calendar' && <CalendarView />}

          {activeTab === 'intentions' && (
            <div>
              <h2>My Intentions</h2>
              <p>Set your daily intentions.</p>
              <div className="habit-box" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input value={newIntention} onChange={e => setNewIntention(e.target.value)} placeholder="e.g. I will work out for 30 minutes today" style={{ flex: 1, padding: '8px' }} />
                <select value={intentionType} onChange={e => setIntentionType(e.target.value)}>
                  <option value="health">Health</option><option value="learning">Learning</option><option value="work">Work</option><option value="game">Game</option><option value="general">General</option>
                </select>
                <button onClick={addIntention}>Add Intention</button>
              </div>
              <div className="habit-box">
                {intentions.length === 0 ? <p>No intentions yet. Add one above.</p> : (
                  <ul>{intentions.map(item => (
                    <li key={item.id} style={{ marginBottom: '8px', textDecoration: item.is_done ? 'line-through' : 'none' }}>
                      {item.intention_text} <small>({item.intention_type})</small>
                      {!item.is_done && <button style={{ marginLeft: '10px' }} onClick={() => markIntentionDone(item.id)}>Mark Done</button>}
                      {item.is_done && <span> Done</span>}
                    </li>))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reminders' && (
            <div>
              <h2>Reminder Rules</h2>
              <p>Set a time and days for a habit. You will receive a reminder if the habit is still pending at that time.</p>
              <div className="habit-box">
                <h4>Your Habits and IDs:</h4>
                {progress.map(p => <div key={p.habit_id}>ID: <b>{p.habit_id}</b> - {p.habit_name} - {p.is_completed_today ? 'Completed' : 'Pending'}</div>)}
              </div>
              <div className="habit-box" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input placeholder="Habit ID (e.g. 1)" value={reminderForm.habit_id} onChange={e => setReminderForm({ ...reminderForm, habit_id: e.target.value })} />
                <select value={reminderForm.habit_type} onChange={e => setReminderForm({ ...reminderForm, habit_type: e.target.value })}><option value="daily">Daily</option><option value="weekly">Weekly</option></select>
                <input type="time" value={reminderForm.reminder_time} onChange={e => setReminderForm({ ...reminderForm, reminder_time: e.target.value })} />
                <input placeholder="Mon,Wed,Fri or Daily" value={reminderForm.reminder_days} onChange={e => setReminderForm({ ...reminderForm, reminder_days: e.target.value })} />
                <button onClick={addReminder}>Set Reminder</button>
              </div>
              <div className="habit-box">
                <h3>Active Reminders</h3>
                {reminders.length === 0 ? <p>No reminders yet.</p> : (
                  <ul>{reminders.map(r => (
                    <li key={r.id}>Habit {r.habit_id} ({r.habit_type}) - {r.reminder_time} - {r.reminder_days} {r.is_active ? 'Active' : 'Inactive'} <button style={{ marginLeft: '10px' }} onClick={() => deleteReminder(r.id)}>Delete</button></li>))}
                  </ul>
                )}
              </div>
              <div className="habit-box">
                <h3>Due Today (Pending)</h3>
                {dueReminders.length === 0 ? <p>All habits are complete, or it is not time yet.</p> : dueReminders.map(r => <p key={r.reminder_id}>{r.message}</p>)}
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <h2>Progress / Summary</h2>
              <div className="cards">
                <div className="card"><h3>Today</h3><p>{stats.today_completed} / {stats.today_total}</p></div>
                <div className="card"><h3>Streak</h3><p>{stats.streak} Days</p></div>
                <div className="card"><h3>Total</h3><p>{stats.total_habits} Habits</p></div>
              </div>
              <div className="habit-box"><h3>Habit-wise Completion %</h3>{renderHabitProgress()}</div>
              <div className="habit-box"><h3>Weekly Completion - Bar Chart</h3><Bar data={barData} options={barOptions} /></div>
              <div className="habit-box"><h3>Today's Progress - Doughnut Chart</h3><div style={{ width: '300px', maxWidth: '100%' }}><Doughnut data={doughnutData} /></div></div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
export default Dashboard;