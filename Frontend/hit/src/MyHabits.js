import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:8000";
const getToken = () => localStorage.getItem("token");

export default function MyHabits() {
  const [habits, setHabits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ habit_name: "", description: "" });

  const fetchHabits = async () => {
    const res = await axios.get(`${API}/habits`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    setHabits(res.data);
  };

  useEffect(() => { fetchHabits(); }, []);

  const addHabit = async () => {
    if (!form.habit_name) return alert("Enter name");
    await axios.post(`${API}/habits`, form, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    setForm({ habit_name: "", description: "" });
    setShowModal(false);
    fetchHabits();
  };

  const toggle = async (id) => {
    await axios.patch(`${API}/habits/${id}/toggle`, {}, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    fetchHabits();
  };

  const del = async (id) => {
    await axios.delete(`${API}/habits/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    fetchHabits();
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>My Habits ({habits.length})</h2>
        <button onClick={() => setShowModal(true)} style={{ background: "#4F6EF7", color: "white", padding: "8px 16px", borderRadius: "8px" }}>+ New Habit</button>
      </div>

      {habits.map(h => (
        <div key={h.id} style={{ background: "white", padding: "15px", margin: "10px 0", borderRadius: "10px", display: "flex", justifyContent: "space-between", boxShadow: "0 1px 3px #ddd" }}>
          <div>
            <input type="checkbox" checked={h.is_completed_today} onChange={() => toggle(h.id)} /> 
            <b style={{ marginLeft: "10px", textDecoration: h.is_completed_today ? "line-through" : "none" }}>{h.habit_name}</b>
            <p style={{ color: "#666", fontSize: "13px" }}>{h.description} - 🔥 {h.streak_count} days</p>
          </div>
          <button onClick={() => del(h.id)} style={{ color: "red" }}>Delete</button>
        </div>
      ))}

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "grid", placeItems: "center" }}>
          <div style={{ background: "white", padding: "25px", borderRadius: "12px", width: "350px" }}>
            <h3>Add New Habit</h3>
            <input placeholder="Habit name e.g. Drink Water" value={form.habit_name} onChange={e => setForm({ ...form, habit_name: e.target.value })} style={{ width: "100%", padding: "10px", margin: "8px 0" }} />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: "100%", padding: "10px" }} />
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={addHabit} style={{ background: "#4F6EF7", color: "white", flex: 1, padding: "10px", borderRadius: "8px" }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}