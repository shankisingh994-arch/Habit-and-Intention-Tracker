import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API = "http://localhost:8000";

export default function MyHabits() {
  const [habits, setHabits] = useState([]);
  const [filter, setFilter] = useState('all'); // all | daily | weekly
  const [form, setForm] = useState({ habit_name: '', description: '', frequency: 'daily' });
  const [editId, setEditId] = useState(null);
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchHabits = () => {
    const url = filter === 'all' ? `${API}/habits` : `${API}/habits?frequency=${filter}`;
    axios.get(url, config).then(res => setHabits(res.data));
  };

  useEffect(() => { fetchHabits(); }, [filter]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      // EDIT
      axios.put(`${API}/habits/${editId}`, form, config).then(() => {
        setEditId(null); setForm({ habit_name: '', description: '', frequency: 'daily' }); fetchHabits();
      });
    } else {
      // CREATE
      axios.post(`${API}/habits`, form, config).then(() => {
        setForm({ habit_name: '', description: '', frequency: 'daily' }); fetchHabits();
      });
    }
  };

  const handleEdit = (h) => {
    setEditId(h.id);
    setForm({ habit_name: h.habit_name, description: h.description || '', frequency: h.frequency });
    window.scrollTo(0,0);
  };

  const handleToggle = (id) => { axios.patch(`${API}/habits/${id}/toggle`, {}, config).then(fetchHabits); };
  const handleDelete = (id) => { if(window.confirm('Delete?')) axios.delete(`${API}/habits/${id}`, config).then(fetchHabits); };

  return (
    <div>
      <h3>{editId ? 'Edit Habit' : 'Add New Habit'}</h3>
      <form onSubmit={handleSubmit} style={{display:'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
        <input required placeholder="Habit name" value={form.habit_name} onChange={e=>setForm({...form, habit_name:e.target.value})} />
        <input placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        <select value={form.frequency} onChange={e=>setForm({...form, frequency:e.target.value})}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <button type="submit">{editId ? 'Update' : 'Add'}</button>
        {editId && <button type="button" onClick={()=>{setEditId(null); setForm({habit_name:'', description:'', frequency:'daily'})}}>Cancel</button>}
      </form>

      <div style={{marginBottom:'15px'}}>
        <button onClick={()=>setFilter('all')} style={{fontWeight: filter==='all'?'bold':''}}>All</button> | 
        <button onClick={()=>setFilter('daily')} style={{fontWeight: filter==='daily'?'bold':''}}> Daily</button> | 
        <button onClick={()=>setFilter('weekly')} style={{fontWeight: filter==='weekly'?'bold':''}}> Weekly</button>
      </div>

      {habits.map(h=>(
        <div key={h.id} style={{border:'1px solid #ccc', padding:'10px', marginBottom:'8px', display:'flex', justifyContent:'space-between', background: h.is_completed_today ? '#e6ffea' : 'white'}}>
          <div>
            <b>{h.habit_name}</b> <small>({h.frequency})</small> - {h.description}
            <div>Streak: {h.streak_count} {h.is_completed_today ? '✅' : ''}</div>
          </div>
          <div>
            <button onClick={()=>handleToggle(h.id)}>{h.is_completed_today ? 'Undo' : 'Done'}</button>
            <button onClick={()=>handleEdit(h)}>Edit</button>
            <button onClick={()=>handleDelete(h.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}