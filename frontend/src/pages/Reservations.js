import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { LoadingState } from '../components/Spinner';

const statusColor = {
  pending: 'badge-amber',
  confirmed: 'badge-green',
  ready: 'badge-green',
  completed: 'badge-green',
  cancelled: 'badge-red'
};

const TABS = ['Active Reservations', 'Completed History', 'Cancelled', 'All'];

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Active Reservations');
  const [cancellingId, setCancellingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reservations/mine');
      setReservations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (id, medName) => {
    if (!window.confirm(`Are you sure you want to cancel your reservation for ${medName}? The stock will be released back to the pharmacy.`)) {
      return;
    }
    setCancellingId(id);
    try {
      await api.patch(`/reservations/${id}/status`, { status: 'cancelled' });
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredReservations = useMemo(() => {
    if (tab === 'Active Reservations') {
      return reservations.filter((r) => ['pending', 'confirmed', 'ready'].includes(r.status));
    }
    if (tab === 'Completed History') {
      return reservations.filter((r) => r.status === 'completed');
    }
    if (tab === 'Cancelled') {
      return reservations.filter((r) => r.status === 'cancelled');
    }
    return reservations;
  }, [reservations, tab]);

  const activeCount = reservations.filter((r) => ['pending', 'confirmed', 'ready'].includes(r.status)).length;

  return (
    <div className="page container" style={{ maxWidth: 840 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2>My Reservations</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: '4px 0 0' }}>
            Track and manage your held medications for local pharmacy pickup.
          </p>
        </div>
        <Link to="/" className="btn btn-secondary">
          🔍 Search More Medicines
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
        {TABS.map((t) => {
          let count = null;
          if (t === 'Active Reservations') count = activeCount;
          if (t === 'Completed History') count = reservations.filter((r) => r.status === 'completed').length;
          if (t === 'Cancelled') count = reservations.filter((r) => r.status === 'cancelled').length;
          if (t === 'All') count = reservations.length;

          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 14px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                color: tab === t ? 'var(--color-teal-700)' : 'var(--color-text-muted)',
                borderBottom: tab === t ? '2px solid var(--color-teal-700)' : '2px solid transparent'
              }}
            >
              {t}
              {count !== null && (
                <span
                  style={{
                    backgroundColor: tab === t ? 'var(--color-teal-100)' : '#EBEFED',
                    color: tab === t ? 'var(--color-teal-700)' : 'var(--color-text-muted)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: 12
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && <LoadingState text="Fetching your reservations…" />}

      {!loading && filteredReservations.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
          <h4>No reservations found in this view</h4>
          <p style={{ margin: '6px 0 18px', fontSize: 14 }}>
            {tab === 'Active Reservations'
              ? "You don't have any active medicine holds right now."
              : `No ${tab.toLowerCase()} found.`}
          </p>
          <Link to="/" className="btn btn-primary">
            🔍 Search Nearby Medicines
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        {filteredReservations.map((r) => {
          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.pharmacy_name + ' ' + (r.address || '') + ' ' + (r.city || ''))}`;
          const isExpiringSoon = ['pending', 'confirmed'].includes(r.status);
          const totalCost = r.price ? (parseFloat(r.price) * r.quantity).toFixed(2) : null;

          return (
            <div
              key={r.reservation_id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 14,
                borderLeft: r.status === 'cancelled'
                  ? '4px solid #D64545'
                  : r.status === 'ready'
                  ? '4px solid #14877A'
                  : '4px solid var(--color-teal-700)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 17, color: 'var(--color-teal-900)' }}>
                    {r.medicine_name} × {r.quantity}
                  </h3>
                  {totalCost && <span className="badge badge-green">Total: ₹{totalCost}</span>}
                </div>

                {r.generic_name && (
                  <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                    Composition: {r.generic_name}
                  </p>
                )}

                <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--color-teal-900)' }}>
                  🏥 <strong>{r.pharmacy_name}</strong> {r.city ? `(${r.city})` : ''} — {r.address}
                </p>

                <div style={{ display: 'flex', gap: 14, marginTop: 4, fontSize: 12 }}>
                  {r.phone && (
                    <a href={`tel:${r.phone}`} style={{ color: 'var(--color-teal-700)', fontWeight: 600 }}>
                      📞 Call: {r.phone}
                    </a>
                  )}
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-teal-700)', fontWeight: 600 }}>
                    🗺️ Directions in Google Maps →
                  </a>
                </div>

                <p style={{ margin: '6px 0 0', fontSize: 12, color: isExpiringSoon ? '#B45309' : 'var(--color-text-muted)' }}>
                  {isExpiringSoon ? '⏳ Pick up by: ' : 'Reserved pickup by: '}
                  <strong>{new Date(r.pickup_by).toLocaleString()}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  className={`badge ${statusColor[r.status] || 'badge-green'}`}
                  style={{ textTransform: 'capitalize', fontSize: 13, padding: '4px 12px' }}
                >
                  {r.status === 'ready' ? 'Ready for Pickup ✅' : r.status}
                </span>

                {['pending', 'confirmed'].includes(r.status) && (
                  <button
                    className="btn btn-danger"
                    onClick={() => cancel(r.reservation_id, r.medicine_name)}
                    disabled={cancellingId === r.reservation_id}
                  >
                    {cancellingId === r.reservation_id ? 'Cancelling…' : 'Cancel Hold'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
