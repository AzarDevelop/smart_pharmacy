import { useState } from 'react';
import api, { getError } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name, phone: user.phone || '', address: user.address || '', city: user.city || '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const saveProfile = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      setMessage('Profile updated.');
    } catch (err) {
      setError(getError(err));
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await api.put('/auth/password', passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      setMessage('Password changed.');
    } catch (err) {
      setError(getError(err));
    }
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Your profile</h1>
          <p className="mono small">{user.email} · role: {user.role}</p>
        </div>
      </div>

      {message && <div className="alert alert-ok">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h2>Personal details</h2>
        <form onSubmit={saveProfile}>
          <div className="grid-2">
            <div className="field">
              <label>Full name</label>
              <input className="input" required value={form.name} onChange={set('name')} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input className="input" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div className="field">
            <label>Address</label>
            <input className="input" value={form.address} onChange={set('address')} />
          </div>
          <div className="field">
            <label>City</label>
            <input className="input" value={form.city} onChange={set('city')} />
          </div>
          <button className="btn btn-primary">Save changes</button>
        </form>
      </div>

      <div className="card">
        <h2>Change password</h2>
        <form onSubmit={savePassword}>
          <div className="grid-2">
            <div className="field">
              <label>Current password</label>
              <input
                className="input" type="password" required
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              />
            </div>
            <div className="field">
              <label>New password</label>
              <input
                className="input" type="password" required minLength={6}
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              />
            </div>
          </div>
          <button className="btn btn-primary">Change password</button>
        </form>
      </div>
    </main>
  );
};

export default Profile;
