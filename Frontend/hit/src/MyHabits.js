import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = "http://localhost:8000";

function MyHabits({ onHabitChange }) {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [description, setDescription] = useState('');

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchHabits = () => {
    axios.get(`${API}/habits`, { headers: getHeaders() })
      .then(res => setHabits(res.data))
      .catch(() => {});
  };

  useEffect(() => { fetchHabits(); }, []);

  const addHabit = async () => {
    if (!newHabit.trim()) return;
    await axios.post(`${API}/habits`, { habit_name: newHabit, description, frequency: 'daily' }, { headers: getHeaders() });
    setNewHabit(''); setDescription('');
    fetchHabits();
    if (onHabitChange) onHabitChange();
  };

  const toggleHabit = async (id) => {
    await axios.patch(`${API}/habits/${id}/toggle`, {}, { headers: getHeaders() });
    fetchHabits();
    if (onHabitChange) onHabitChange();
  };

  const deleteHabit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this habit?')) return;
    await axios.delete(`${API}/habits/${id}`, { headers: getHeaders() });
    fetchHabits();
    if (onHabitChange) onHabitChange();
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
        <input value={newHabit} onChange={e => setNewHabit(e.target.value)} placeholder="e.g. Running" style={{ flex: 1, padding: '8px' }} />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" style={{ flex: 1, padding: '8px' }} />
        <button onClick={addHabit}>Add Habit</button>
      </div>

      {habits.length === 0 ? <p>No habits yet.</p> : habits.map(h => (
        <div key={h.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: h.is_completed_today ? '#E8F5E9' : '#fff' }}>
          <div>
            <b>{h.habit_name}</b> <small style={{ color: '#888' }}>ID: {h.id}</small>
            <div style={{ fontSize: '13px', color: '#666' }}>{h.description || ''}</div>
            <div style={{ fontSize: '13px' }}>Streak: <b>{h.streak_count} days</b> {h.is_completed_today ? 'Completed Today' : 'Pending Today'} {h.last_completed_date ? `| Last Completed: ${h.last_completed_date}` : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => toggleHabit(h.id)} style={{ background: h.is_completed_today ? '#4CAF50' : '#eee', color: h.is_completed_today ? '#fff' : '#000' }}>
              {h.is_completed_today ? 'Completed' : 'Mark as Done'}
            </button>
            <button onClick={() => deleteHabit(h.id)} style={{ background: '#ffebee' }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
export default MyHabits;