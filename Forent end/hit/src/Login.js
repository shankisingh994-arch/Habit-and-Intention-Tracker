import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/auth/login', form);
      // FastAPI will return JWT token
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('username', form.username);
      setMsg('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      setMsg(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login </h2>
        <p className="subtitle">Track Your Habits</p>
        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input 
            type="text" 
            name="username" 
            placeholder="Enter username"
            value={form.username} 
            onChange={handleChange} 
            required 
          />
          
          <label>Password</label>
          <input 
            type="password" 
            name="password" 
            placeholder="Enter password"
            value={form.password} 
            onChange={handleChange} 
            required 
          />

          <button type="submit" className="btn-primary">Login</button>
        </form>
        {msg && <p className="message">{msg}</p>}
        <p className="link-text">
          Don't have account? <Link to="/register">Signup here</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;