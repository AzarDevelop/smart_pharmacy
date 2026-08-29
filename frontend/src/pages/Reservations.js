import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { LoadingState } from '../components/Spinner';

const statusColor = { pending: 'badge-amber', confirmed: 'badge-green', ready: 'badge-green', completed: 'badge-green', cancelled: 'badge-red' };

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/reservations/mine');
    setReservations(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    await api.patch(`/reservations/${id}/status`, { status: 'cancelled' });
    load();
  };

  return (
    <div className="page container" style={{ maxWidth: 780 }}>
      <h2 style={{ marginBottom: 20 }}>My Reservations</h2>

      {loading && <LoadingState text="Fetching your reservations…" />}

      {!loading && reservations.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          You haven't reserved any medicines yet. Search for one to get started.
        </div>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        {reservations.map((r) => (
          <div key={r.reservation_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16 }}>{r.medicine_name} × {r.quantity}</h3>
              <p style={{ margin: '4px 0', fontSize: 14, color: 'var(--color-text-muted)' }}>{r.pharmacy_name} — {r.address}</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>Pickup by: {new Date(r.pickup_by).toLocaleString()}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`badge ${statusColor[r.status] || 'badge-green'}`}>{r.status}</span>
              {['pending', 'confirmed'].includes(r.status) && (
                <button className="btn btn-danger" onClick={() => cancel(r.reservation_id)}>Cancel</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
