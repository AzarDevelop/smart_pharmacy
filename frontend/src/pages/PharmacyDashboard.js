import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { LoadingState } from '../components/Spinner';

const TABS = ['Inventory', 'Low Stock Alerts', 'Demand Prediction', 'Reservations'];

export default function PharmacyDashboard() {
  const [pharmacies, setPharmacies] = useState([]);
  const [activePharmacy, setActivePharmacy] = useState(null);
  const [tab, setTab] = useState('Inventory');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api.get('/pharmacy/mine').then(({ data }) => {
      setPharmacies(data);
      if (data.length > 0) setActivePharmacy(data[0]);
      else setShowCreate(true);
    });
  }, []);

  if (showCreate && pharmacies.length === 0) {
    return <CreatePharmacy onCreated={(p) => { setPharmacies([p]); setActivePharmacy(p); setShowCreate(false); }} />;
  }

  if (!activePharmacy) return <div className="page container"><LoadingState text="Loading pharmacy dashboard…" /></div>;

  return (
    <div className="page container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2>{activePharmacy.name}</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: '4px 0 0' }}>{activePharmacy.address}, {activePharmacy.city}</p>
        </div>
        <span className={`badge ${activePharmacy.is_verified ? 'badge-green' : 'badge-amber'}`}>
          {activePharmacy.is_verified ? 'Verified' : 'Pending verification'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid var(--color-border)' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', padding: '10px 14px', fontSize: 14, fontWeight: 600,
              color: tab === t ? 'var(--color-teal-700)' : 'var(--color-text-muted)',
              borderBottom: tab === t ? '2px solid var(--color-teal-700)' : '2px solid transparent'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Inventory' && <Inventory pharmacyId={activePharmacy.pharmacy_id} />}
      {tab === 'Low Stock Alerts' && <LowStock pharmacyId={activePharmacy.pharmacy_id} />}
      {tab === 'Demand Prediction' && <DemandPrediction pharmacyId={activePharmacy.pharmacy_id} />}
      {tab === 'Reservations' && <PharmacyReservations pharmacyId={activePharmacy.pharmacy_id} />}
    </div>
  );
}

function CreatePharmacy({ onCreated }) {
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', latitude: '', longitude: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data } = await api.post('/pharmacy', form);
    onCreated({ ...form, pharmacy_id: data.pharmacy_id, is_verified: false });
    setLoading(false);
  };

  return (
    <div className="page container" style={{ maxWidth: 480 }}>
      <div className="card">
        <h2 style={{ marginBottom: 4 }}>Set up your pharmacy</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20 }}>This profile is what customers will see when your medicines show up in search.</p>
        <form onSubmit={submit}>
          {[['name', 'Pharmacy name'], ['address', 'Address'], ['city', 'City'], ['phone', 'Phone']].map(([key, label]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label className="label">{label}</label>
              <input className="input" required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Latitude (optional)</label>
              <input className="input" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Longitude (optional)</label>
              <input className="input" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating…' : 'Create pharmacy profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Inventory({ pharmacyId }) {
  const [items, setItems] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [form, setForm] = useState({ medicine_id: '', price: '', quantity: '', low_stock_threshold: 10 });

  const load = React.useCallback(() => {
    api.get(`/pharmacy/${pharmacyId}/inventory`).then(({ data }) => setItems(data));
  }, [pharmacyId]);

  useEffect(() => {
    load();
    api.get('/medicines').then(({ data }) => setCatalogue(data));
  }, [pharmacyId, load]);

  const submit = async (e) => {
    e.preventDefault();
    await api.post(`/pharmacy/${pharmacyId}/inventory`, form);
    setForm({ medicine_id: '', price: '', quantity: '', low_stock_threshold: 10 });
    load();
  };

  const remove = async (stockId) => {
    await api.delete(`/pharmacy/${pharmacyId}/inventory/${stockId}`);
    load();
  };

  return (
    <div>
      <form onSubmit={submit} className="card" style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ flex: '1 1 200px' }}>
          <label className="label">Medicine</label>
          <select className="input" required value={form.medicine_id} onChange={(e) => setForm({ ...form, medicine_id: e.target.value })}>
            <option value="">Select medicine</option>
            {catalogue.map((m) => <option key={m.medicine_id} value={m.medicine_id}>{m.name}</option>)}
          </select>
        </div>
        <div style={{ width: 110 }}>
          <label className="label">Price (₹)</label>
          <input className="input" type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <div style={{ width: 110 }}>
          <label className="label">Quantity</label>
          <input className="input" type="number" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
        </div>
        <div style={{ width: 110 }}>
          <label className="label">Alert below</label>
          <input className="input" type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
        </div>
        <button className="btn btn-primary">Save stock</button>
      </form>

      <div style={{ display: 'grid', gap: 10 }}>
        {items.map((it) => (
          <div key={it.stock_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{it.name}</strong>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>{it.generic_name} · {it.category}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="badge badge-green">₹{it.price}</span>
              <span className={`badge ${it.quantity <= it.low_stock_threshold ? 'badge-amber' : 'badge-green'}`}>{it.quantity} units</span>
              <button className="btn btn-danger" onClick={() => remove(it.stock_id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LowStock({ pharmacyId }) {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get(`/pharmacy/${pharmacyId}/low-stock`).then(({ data }) => setItems(data)); }, [pharmacyId]);

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.length === 0 && <div className="card" style={{ color: 'var(--color-text-muted)' }}>No low-stock alerts right now — inventory levels look healthy.</div>}
      {items.map((it) => (
        <div key={it.stock_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--color-amber-500)' }}>
          <div>
            <strong>{it.name}</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>Only {it.quantity} left (threshold: {it.low_stock_threshold})</p>
          </div>
          <span className="badge badge-amber">Restock soon</span>
        </div>
      ))}
    </div>
  );
}

function DemandPrediction({ pharmacyId }) {
  const [catalogue, setCatalogue] = useState([]);
  const [medicineId, setMedicineId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/medicines').then(({ data }) => setCatalogue(data)); }, []);

  const runPrediction = async () => {
    if (!medicineId) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.get(`/pharmacy/${pharmacyId}/predict/${medicineId}`);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not generate a prediction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label className="label">Medicine</label>
          <select className="input" value={medicineId} onChange={(e) => setMedicineId(e.target.value)}>
            <option value="">Select medicine</option>
            {catalogue.map((m) => <option key={m.medicine_id} value={m.medicine_id}>{m.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={runPrediction} disabled={loading}>
          {loading ? 'Predicting…' : 'Predict demand'}
        </button>
      </div>

      {error && <div className="card" style={{ color: 'var(--color-red-500)' }}>{error}</div>}

      {result && (
        <div className="card">
          <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
            <Stat label="Trend" value={result.trend} />
            <Stat label="Avg daily demand (next 7 days)" value={result.predicted_daily_avg} />
            <Stat label="Predicted total (next 7 days)" value={result.predicted_total_next_period} />
            <Stat label="Suggested restock units" value={result.recommend_restock_units} />
          </div>
          {result.forecast?.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '6px 0' }}>Date</th>
                  <th>Predicted quantity</th>
                </tr>
              </thead>
              <tbody>
                {result.forecast.map((f) => (
                  <tr key={f.date} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '6px 0' }}>{f.date}</td>
                    <td>{f.predicted_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-teal-900)' }}>{value}</div>
    </div>
  );
}

function PharmacyReservations({ pharmacyId }) {
  const [items, setItems] = useState([]);
  const load = React.useCallback(() => {
    api.get(`/pharmacy/${pharmacyId}/reservations`).then(({ data }) => setItems(data));
  }, [pharmacyId]);
  useEffect(() => { load(); }, [pharmacyId, load]);

  const updateStatus = async (id, status) => {
    await api.patch(`/reservations/${id}/status`, { status });
    load();
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {items.length === 0 && <div className="card" style={{ color: 'var(--color-text-muted)' }}>No reservations yet.</div>}
      {items.map((r) => (
        <div key={r.reservation_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <strong>{r.medicine_name} × {r.quantity}</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>{r.customer_name} · {r.customer_phone}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge badge-green">{r.status}</span>
            {r.status === 'pending' && <button className="btn btn-secondary" onClick={() => updateStatus(r.reservation_id, 'confirmed')}>Confirm</button>}
            {r.status === 'confirmed' && <button className="btn btn-secondary" onClick={() => updateStatus(r.reservation_id, 'ready')}>Mark ready</button>}
            {r.status === 'ready' && <button className="btn btn-primary" onClick={() => updateStatus(r.reservation_id, 'completed')}>Mark picked up</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
