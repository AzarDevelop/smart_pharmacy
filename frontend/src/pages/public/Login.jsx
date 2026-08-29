import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getError } from '../../api/axios';

const DEMO = [
  ['Customer', 'ravi@example.com', 'User@123'],
  ['Pharmacy', 'apollo@pharmacy.com', 'Pharma@123'],
  ['Admin', 'admin@pharma.com', 'Admin@123'],
];

const Login = () => {
  const { login, homeFor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      navigate(location.state?.from || homeFor(user.role), { replace: true });
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <p className="eyebrow">Account</p>
      <h1>Log in</h1>
      <p className="muted">Customers, pharmacies and the admin all use this one form.</p>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className="demo-logins">
          <p className="small muted" style={{ marginBottom: 6 }}>Sample logins (seed data) — tap to fill:</p>
          {DEMO.map(([label, email, password]) => (
            <button
              key={email}
              type="button"
              onClick={() => setForm({ email, password })}
            >
              <b>{label}</b> — {email} / {password}
            </button>
          ))}
        </div>
      </div>

      <p className="small muted" style={{ marginTop: 14 }}>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
};

export default Login;
