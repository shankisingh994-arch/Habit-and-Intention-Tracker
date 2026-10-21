import { useEffect, useState } from "react";
import axios from "axios";
const API="http://localhost:8000";

export default function CalendarView(){
  const [logs, setLogs] = useState({});
  const [date, setDate] = useState(new Date());
  
  useEffect(()=>{
    const token = localStorage.getItem("token");
    axios.get(`${API}/calendar?month=${date.getMonth()+1}&year=${date.getFullYear()}`,{
      headers:{Authorization:`Bearer ${token}`}
    }).then(res=>setLogs(res.data.logs));
  },[date]);

  // Generate days of month
  const daysInMonth = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate();
  const days = [...Array(daysInMonth).keys()].map(i=>i+1);

  return(
    <div style={{padding:"25px"}}>
      <h2>🗓️ Habit Calendar - {date.toLocaleString('default',{month:'long', year:'numeric'})}</h2>
      <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"10px", marginTop:"20px"}}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><b key={d}>{d}</b>)}
        {days.map(day=>{
          const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const completed = logs[dateStr];
          return(
            <div key={day} style={{border:"1px solid #ddd", padding:"15px", borderRadius:"10px", background: completed ? "#D1FAE5" : "white"}}>
              <div>{day}</div>
              {completed && <div style={{fontSize:"12px", color:"green"}}>✅ {completed.length} habits</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}