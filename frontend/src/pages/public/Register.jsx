import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getError } from '../../api/axios';

const Register = () => {
  const { register, homeFor } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get('role') === 'pharmacy' ? 'pharmacy' : 'user');
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', address: '', city: 'Chennai',
    pharmacyName: '', licenseNumber: '', openingHours: '9:00 AM - 9:00 PM',
    pincode: '', latitude: '13.0827', longitude: '80.2707',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = {
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, address: form.address, city: form.city, role,
      };
      if (role === 'pharmacy') {
        payload.pharmacy = {
          name: form.pharmacyName, licenseNumber: form.licenseNumber, phone: form.phone,
          address: form.address, city: form.city, pincode: form.pincode,
          openingHours: form.openingHours, latitude: form.latitude, longitude: form.longitude,
        };
      }
      const user = await register(payload);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  };

  // Fills the coordinates from the browser so "nearby" works for a real pharmacy
  const useMyLocation = () => {
    if (!navigator.geolocation) return setError('This browser cannot share a location.');
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        })),
      () => setError('Location permission was denied. Enter the coordinates manually.')
    );
  };

  return (
    <div className="auth-wrap">
      <p className="eyebrow">Account</p>
      <h1>Create an account</h1>

      <div className="auth-tabs">
        <button className={role === 'user' ? 'active' : ''} onClick={() => setRole('user')} type="button">
          I am a customer
        </button>
        <button className={role === 'pharmacy' ? 'active' : ''} onClick={() => setRole('pharmacy')} type="button">
          I run a pharmacy
        </button>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>{role === 'pharmacy' ? 'Owner name' : 'Full name'}</label>
            <input className="input" required value={form.name} onChange={set('name')} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" required value={form.email} onChange={set('email')} />
            </div>
            <div className="field">
              <label>Password</label>
              <input className="input" type="password" required minLength={6} value={form.password} onChange={set('password')} />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Phone</label>
              <input className="input" required value={form.phone} onChange={set('phone')} />
            </div>
            <div className="field">
              <label>City</label>
              <input className="input" required value={form.city} onChange={set('city')} />
            </div>
          </div>
          <div className="field">
            <label>Address</label>
            <input className="input" required value={form.address} onChange={set('address')} />
          </div>

          {role === 'pharmacy' && (
            <>
              <hr className="divider" />
              <div className="grid-2">
                <div className="field">
                  <label>Pharmacy name</label>
                  <input className="input" required value={form.pharmacyName} onChange={set('pharmacyName')} />
                </div>
                <div className="field">
                  <label>Drug licence number</label>
                  <input className="input" required value={form.licenseNumber} onChange={set('licenseNumber')} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Pincode</label>
                  <input className="input" value={form.pincode} onChange={set('pincode')} />
                </div>
                <div className="field">
                  <label>Opening hours</label>
                  <input className="input" value={form.openingHours} onChange={set('openingHours')} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Latitude</label>
                  <input className="input mono" value={form.latitude} onChange={set('latitude')} />
                </div>
                <div className="field">
                  <label>Longitude</label>
                  <input className="input mono" value={form.longitude} onChange={set('longitude')} />
                </div>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={useMyLocation}>
                Use my current location
              </button>
              <p className="hint" style={{ marginTop: 6 }}>
                Coordinates decide where your shop appears in "nearby pharmacies".
              </p>
            </>
          )}

          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} disabled={busy}>
            {busy ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>

      <p className="small muted" style={{ marginTop: 14 }}>
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
};

export default Register;
