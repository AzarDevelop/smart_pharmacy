import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEFAULT_USERS = [
  {
    roleName: 'Customer',
    icon: '👤',
    email: 'customer@pharmacy.com',
    password: 'password123',
    desc: 'Search meds, check stock & make reservations'
  },
  {
    roleName: 'Pharmacy Owner',
    icon: '🏥',
    email: 'pharmacy@pharmacy.com',
    password: 'password123',
    desc: 'Manage inventory & AI demand predictions'
  },
  {
    roleName: 'Admin',
    icon: '🛡️',
    email: 'admin@pharmacy.com',
    password: 'password123',
    desc: 'Approve pharmacies & system management'
  }
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const performLogin = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'pharmacy') navigate('/pharmacy');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await performLogin(form.email, form.password);
  };

  const handleQuickLogin = (user) => {
    setForm({ email: user.email, password: user.password });
    performLogin(user.email, user.password);
  };

  return (
    <div className="page container" style={{ maxWidth: 460 }}>
      <div className="card">
        <h2 style={{ marginBottom: 4 }}>Welcome back</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 4, marginBottom: 20, fontSize: 14 }}>
          Log in to search medicines and manage your reservations.
        </p>

        {/* 1-Click Quick Demo User Selector */}
        <div style={{ marginBottom: 22, background: 'var(--color-slate-50, #F8FAFC)', border: '1px solid var(--color-slate-200, #E2E8F0)', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-teal-700, #0F766E)', marginBottom: 8 }}>
            ⚡ 1-Click Demo Login (Select a Role):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {DEFAULT_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => handleQuickLogin(u)}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--color-teal-500, #0D9488)')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = '#E2E8F0')}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1E293B' }}>
                    {u.icon} {u.roleName}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{u.email}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-teal-700, #0F766E)', background: '#F0FDFA', padding: '4px 8px', borderRadius: 4 }}>
                  Auto-fill &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>

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

