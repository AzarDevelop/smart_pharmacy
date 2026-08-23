import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'pharmacy') navigate('/pharmacy');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page container" style={{ maxWidth: 420 }}>
      <div className="card">
        <h2 style={{ marginBottom: 4 }}>Welcome back</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 4, marginBottom: 20, fontSize: 14 }}>
          Log in to search medicines and manage your reservations.
        </p>

        {error && <div style={{ background: '#FCE9E9', color: 'var(--color-red-500)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="label">Password</label>
            <input className="input" type="password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--color-teal-700)', fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
