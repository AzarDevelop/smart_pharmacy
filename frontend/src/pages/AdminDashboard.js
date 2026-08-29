import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { LoadingState } from '../components/Spinner';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [o, u, p] = await Promise.all([
        api.get('/admin/reports/overview'),
        api.get('/admin/users'),
        api.get('/admin/pharmacies')
      ]);
      setOverview(o.data);
      setUsers(u.data);
      setPharmacies(p.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const verify = async (id) => { await api.patch(`/admin/pharmacies/${id}/verify`); load(); };
  const removeUser = async (id) => { if (window.confirm('Remove this user?')) { await api.delete(`/admin/users/${id}`); load(); } };

  if (loading && !overview) {
    return <div className="page container"><LoadingState text="Loading administrative overview…" /></div>;
  }

  return (
    <div className="page container">
      <h2 style={{ marginBottom: 20 }}>System Monitoring</h2>

      {overview && (
        <div className="card" style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 28 }}>
          <Stat label="Users" value={overview.userCount} />
          <Stat label="Pharmacies" value={overview.pharmacyCount} />
          <Stat label="Medicines" value={overview.medicineCount} />
          <Stat label="Reservations" value={overview.reservationCount} />
          <Stat label="Low stock alerts" value={overview.lowStockCount} accent />
        </div>
      )}

      <h3 style={{ marginBottom: 12 }}>Pharmacies</h3>
      <div style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
        {pharmacies.map((p) => (
          <div key={p.pharmacy_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{p.name}</strong>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>{p.address}, {p.city} · Owner: {p.owner_name}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className={`badge ${p.is_verified ? 'badge-green' : 'badge-amber'}`}>{p.is_verified ? 'Verified' : 'Pending'}</span>
              {!p.is_verified && <button className="btn btn-secondary" onClick={() => verify(p.pharmacy_id)}>Verify</button>}
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ marginBottom: 12 }}>Users</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        {users.map((u) => (
          <div key={u.user_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{u.name}</strong>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>{u.email}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-green">{u.role}</span>
              <button className="btn btn-danger" onClick={() => removeUser(u.user_id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 700, color: accent ? 'var(--color-amber-500)' : 'var(--color-teal-900)' }}>{value}</div>
    </div>
  );
}
