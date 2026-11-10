import { useState } from 'react';
import axios from 'axios';
const API = "http://localhost:8000";

export default function ReminderRules({ habitId }){
  const [time,setTime]=useState("08:00");
  const [days,setDays]=useState("Mon,Wed,Fri");
  const token = localStorage.getItem('token');

  const save = async ()=>{
    await axios.post(`${API}/reminders`,{ habit_id: habitId, habit_type:'daily', reminder_time: time, reminder_days: days },
    {headers:{Authorization:`Bearer ${token}`}});
    alert("Reminder Set!");
  }
  return (
    <div className="habit-box">
      <h3>⏰ Reminder Rule</h3>
      <input type="time" value={time} onChange={e=>setTime(e.target.value)} />
      <input value={days} onChange={e=>setDays(e.target.value)} placeholder="Mon,Wed,Fri" />
      <button onClick={save}>Set Reminder</button>
    </div>
  )
}