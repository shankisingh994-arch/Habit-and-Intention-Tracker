import { useEffect, useState } from 'react';
import axios from 'axios';
const API = "http://localhost:8000";

export default function Intentions(){
  const [list,setList]=useState([]);
  const [text,setText]=useState("");
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const load = ()=> axios.get(`${API}/intentions`,{headers}).then(r=>setList(r.data));
  useEffect(()=>{load()},[]);

  const add = async ()=>{
    await axios.post(`${API}/intentions`,{intention_text:text, intention_type:'general', planned_date:new Date()}, {headers});
    setText(""); load();
  }
  const done = async(id)=>{
    await axios.put(`${API}/intentions/${id}/done`,{}, {headers}); load();
  }
  return (
    <div>
      <h3>🎯 My Intentions</h3>
      <input value={text} onChange={e=>setText(e.target.value)} placeholder="Aaj ka intention..." />
      <button onClick={add}>Add</button>
      <ul>{list.map(i=>(
        <li key={i.id}>{i.intention_text} - {i.is_done ? "✅ Done" : <button onClick={()=>done(i.id)}>Mark Done</button>}</li>
      ))}</ul>
    </div>
  )
}