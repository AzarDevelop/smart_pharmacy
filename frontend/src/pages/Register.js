import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      if (user.role === 'pharmacy') navigate('/pharmacy');
      else navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page container" style={{ maxWidth: 460 }}>
      <div className="card">
        <h2 style={{ marginBottom: 4 }}>Create your account</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 4, marginBottom: 20, fontSize: 14 }}>
          Search medicines nearby, reserve for pickup, or manage a pharmacy's stock.
        </p>

        {error && <div style={{ background: '#FCE9E9', color: 'var(--color-red-500)', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Full name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Password</label>
            <input className="input" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="label">I am a</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="customer">Customer looking for medicines</option>
              <option value="pharmacy">Pharmacy owner</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <Spinner size="sm" label="Creating account…" /> : 'Sign up'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-teal-700)', fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
