import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import Spinner, { LoadingState } from '../components/Spinner';

export default function SearchMedicine() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null)
      );
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setMessage('');
    try {
      const params = { query };
      if (coords) { params.lat = coords.lat; params.lng = coords.lng; }
      const { data } = await api.get('/medicines/search', { params });
      setResults(data.results || []);
    } catch (err) {
      setMessage('Something went wrong while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (row) => {
    if (!user) {
      setMessage('Please log in to reserve a medicine.');
      return;
    }
    try {
      await api.post('/reservations', { pharmacy_id: row.pharmacy_id, medicine_id: row.medicine_id, quantity: 1 });
      setMessage(`Reserved ${row.medicine_name} at ${row.pharmacy_name}. Please collect within 24 hours.`);
      setResults((prev) => prev.map((r) => (r.stock_id === row.stock_id ? { ...r, quantity: r.quantity - 1 } : r)));
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Could not reserve this medicine.');
    }
  };

  return (
    <div className="page container">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, marginBottom: 10 }}>Find medicines nearby, in real time</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>
          Search by name — our AI understands typos and different formats — and see live stock, price, and distance.
        </p>
      </div>

      <form onSubmit={handleSearch} className="card" style={{ display: 'flex', gap: 10, maxWidth: 640, margin: '0 auto 28px' }}>
        <input
          className="input"
          placeholder="e.g. paracetamol, crocin, azithromycin…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn btn-primary" disabled={loading} style={{ whiteSpace: 'nowrap', minWidth: 120 }}>
          {loading ? <Spinner size="sm" label="Searching…" /> : '🔍 Search'}
        </button>
      </form>

      {loading && <LoadingState text="AI analyzing catalogue & live stock across pharmacies…" />}

      {!coords && !loading && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          📍 Enable location access to sort results by distance.
        </p>
      )}


      {message && (
        <div style={{ maxWidth: 640, margin: '0 auto 20px', background: 'var(--color-teal-100)', color: 'var(--color-teal-900)', padding: '10px 14px', borderRadius: 8, fontSize: 13, textAlign: 'center' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gap: 14, maxWidth: 780, margin: '0 auto' }}>
        {results.map((row) => (
          <div key={row.stock_id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 17 }}>{row.medicine_name}</h3>
              <p style={{ margin: '4px 0', fontSize: 14, color: 'var(--color-text-muted)' }}>{row.pharmacy_name} — {row.address}, {row.city}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-green">₹{row.price}</span>
                <span className={`badge ${row.quantity <= 5 ? 'badge-amber' : 'badge-green'}`}>{row.quantity} in stock</span>
                {row.distance_km != null && <span className="badge badge-green">{row.distance_km} km away</span>}
                {row.requires_prescription ? <span className="badge badge-red">Prescription required</span> : null}
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => handleReserve(row)} disabled={row.quantity < 1}>
              Reserve
            </button>
          </div>
        ))}

        {searched && !loading && results.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No pharmacy currently has this medicine in stock. Try a different name or check back later.
          </div>
        )}
      </div>
    </div>
  );
}
