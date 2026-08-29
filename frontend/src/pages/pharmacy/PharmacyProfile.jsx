import { useEffect, useState } from 'react';
import api, { getError } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';

const PharmacyProfile = () => {
  const { setPharmacy } = useAuth();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/pharmacies/me')
      .then(({ data }) => {
        const p = data.pharmacy;
        setForm({
          name: p.name, phone: p.phone, address: p.address, city: p.city,
          pincode: p.pincode || '', openingHours: p.openingHours || '',
          latitude: p.location?.coordinates?.[1] ?? '',
          longitude: p.location?.coordinates?.[0] ?? '',
          licenseNumber: p.licenseNumber, email: p.email,
        });
      })
      .catch((err) => setError(getError(err)))
      .finally(() => setLoading(false));
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const { data } = await api.put('/pharmacies/me', form);
      setPharmacy(data.pharmacy);
      setMessage('Pharmacy profile updated.');
    } catch (err) {
      setError(getError(err));
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError('This browser cannot share a location.');
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((f) => ({
        ...f,
        latitude: pos.coords.latitude.toFixed(6),
        longitude: pos.coords.longitude.toFixed(6),
      })),
      () => setError('Location permission denied. Enter the coordinates manually.')
    );
  };

  if (loading) return <Loader />;
  if (!form) return <main className="page"><div className="alert alert-error">{error}</div></main>;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Pharmacy</p>
          <h1>Shop profile</h1>
          <p className="mono small">Licence {form.licenseNumber} · {form.email}</p>
        </div>
      </div>

      {message && <div className="alert alert-ok">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={submit}>
          <div className="grid-2">
            <div className="field">
              <label>Pharmacy name</label>
              <input className="input" required value={form.name} onChange={set('name')} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input className="input" required value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div className="field">
            <label>Address</label>
            <input className="input" required value={form.address} onChange={set('address')} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>City</label>
              <input className="input" required value={form.city} onChange={set('city')} />
            </div>
            <div className="field">
              <label>Pincode</label>
              <input className="input" value={form.pincode} onChange={set('pincode')} />
            </div>
          </div>
          <div className="field">
            <label>Opening hours</label>
            <input className="input" value={form.openingHours} onChange={set('openingHours')} />
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
          <p className="hint">These coordinates decide where your shop appears in nearby search results.</p>

          <div className="tag-row" style={{ marginTop: 12 }}>
            <button className="btn btn-primary">Save changes</button>
            <button type="button" className="btn btn-ghost" onClick={useMyLocation}>Use my current location</button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default PharmacyProfile;
