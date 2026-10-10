import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/auth/register', form);
      setMsg('Account created! Please login.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Signup failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create Account</h2>
        <p className="subtitle">Signup</p>
        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input 
            type="text" 
            name="username" 
            placeholder="Choose username"
            value={form.username} 
            onChange={handleChange} 
            required 
          />

          <label>Email</label>
          <input 
            type="email" 
            name="email" 
            placeholder="Enter email"
            value={form.email} 
            onChange={handleChange} 
            required 
          />

          <label>Password</label>
          <input 
            type="password" 
            name="password" 
            placeholder="Create password (bcrypt hash saved)"
            value={form.password} 
            onChange={handleChange} 
            required 
          />

          <button type="submit" className="btn-primary">Sign Up</button>
        </form>
        {msg && <p className="message">{msg}</p>}
        <p className="link-text">
          Already have account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;