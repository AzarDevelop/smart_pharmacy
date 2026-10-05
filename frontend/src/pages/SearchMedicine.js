import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import Spinner, { LoadingState } from '../components/Spinner';

const POPULAR_CATEGORIES = [
  'Paracetamol',
  'Pain Relief',
  'Antibiotics',
  'Fever & Cold',
  'Diabetes',
  'Antacid',
  'Cetirizine',
  'Supplements'
];

export default function SearchMedicine() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: 'success' });
  const [quantities, setQuantities] = useState({});
  const [reservingStockId, setReservingStockId] = useState(null);

  // Sorting & Filtering
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'price_asc', 'price_desc', 'quantity'
  const [rxFilter, setRxFilter] = useState('ALL'); // 'ALL', 'OTC', 'RX'

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(null)
      );
    }
  }, []);

  const triggerSearch = useCallback(async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    setFeedback({ text: '', type: 'success' });
    try {
      const params = { query: q };
      if (coords) { params.lat = coords.lat; params.lng = coords.lng; }
      const { data } = await api.get('/medicines/search', { params });
      setResults(data.results || []);

      // initialize reservation quantities to 1
      const initialQty = {};
      (data.results || []).forEach((r) => {
        initialQty[r.stock_id] = 1;
      });
      setQuantities(initialQty);
    } catch (err) {
      console.error(err);
      setFeedback({ text: 'Something went wrong while searching. Please check your connection.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [query, coords]);

  const handleSearch = (e) => {
    e.preventDefault();
    triggerSearch();
  };

  const handleCategoryClick = (cat) => {
    setQuery(cat);
    triggerSearch(cat);
  };

  const handleReserve = async (row) => {
    if (!user) {
      setFeedback({ text: 'Please log in to reserve a medicine at this pharmacy.', type: 'error' });
      return;
    }
    const qty = quantities[row.stock_id] || 1;
    setReservingStockId(row.stock_id);
    try {
      await api.post('/reservations', {
        pharmacy_id: row.pharmacy_id,
        medicine_id: row.medicine_id,
        quantity: qty
      });
      setFeedback({
        text: `✅ Successfully reserved ${qty} × ${row.medicine_name} at ${row.pharmacy_name}. Please pick up within 24 hours.`,
        type: 'success'
      });
      setResults((prev) =>
        prev.map((r) => (r.stock_id === row.stock_id ? { ...r, quantity: r.quantity - qty } : r))
      );
    } catch (err) {
      setFeedback({
        text: err?.response?.data?.message || 'Could not complete reservation.',
        type: 'error'
      });
    } finally {
      setReservingStockId(null);
    }
  };

  // Filter & Sort
  const processedResults = useMemo(() => {
    let list = [...results];

    // Filter by Rx
    if (rxFilter === 'OTC') {
      list = list.filter((r) => !r.requires_prescription);
    } else if (rxFilter === 'RX') {
      list = list.filter((r) => r.requires_prescription);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'distance') {
        if (a.distance_km == null) return 1;
        if (b.distance_km == null) return -1;
        return a.distance_km - b.distance_km;
      }
      if (sortBy === 'price_asc') {
        return parseFloat(a.price) - parseFloat(b.price);
      }
      if (sortBy === 'price_desc') {
        return parseFloat(b.price) - parseFloat(a.price);
      }
      if (sortBy === 'quantity') {
        return b.quantity - a.quantity;
      }
      return 0;
    });

    return list;
  }, [results, rxFilter, sortBy]);

  return (
    <div className="page container">
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, marginBottom: 10 }}>Find medicines nearby, in real time</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 15, maxWidth: 640, margin: '0 auto' }}>
          Search by brand or generic name — our AI understands typos and medical terms — and see verified stock, prices, and GPS distances.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="card" style={{ display: 'flex', gap: 10, maxWidth: 660, margin: '0 auto 16px' }}>
        <input
          className="input"
          placeholder="e.g. paracetamol, crocin, azithromycin, cetirizine…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn btn-primary" disabled={loading} style={{ whiteSpace: 'nowrap', minWidth: 120 }}>
          {loading ? <Spinner size="sm" label="Searching…" /> : '🔍 Search'}
        </button>
      </form>

      {/* Popular Chips */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 680, margin: '0 auto 24px' }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', alignSelf: 'center', fontWeight: 600 }}>Try searching:</span>
        {POPULAR_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategoryClick(cat)}
            style={{
              background: '#F0F4F3',
              border: '1px solid var(--color-border)',
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              color: 'var(--color-teal-900)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Geolocation Notice */}
      {!coords && !loading && (
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
          📍 Enable browser location access to sort nearby pharmacies by precise distance.
        </p>
      )}

      {/* Feedback Banner */}
      {feedback.text && (
        <div
          style={{
            maxWidth: 680,
            margin: '0 auto 20px',
            backgroundColor: feedback.type === 'error' ? '#FCE9E9' : '#E3F2EF',
            color: feedback.type === 'error' ? 'var(--color-red-500)' : 'var(--color-teal-900)',
            border: `1px solid ${feedback.type === 'error' ? '#F6CACA' : '#C1E3DC'}`,
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            textAlign: 'center'
          }}
        >
          {feedback.text}
        </div>
      )}

      {loading && <LoadingState text="AI analyzing catalogue & live stock across pharmacies…" />}

      {/* Results Header: Sort and Filter Bar */}
      {searched && !loading && results.length > 0 && (
        <div className="card" style={{ maxWidth: 780, margin: '0 auto 16px', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>
            Found {processedResults.length} available stock {processedResults.length === 1 ? 'entry' : 'entries'}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Filter by Rx */}
            <select
              className="input"
              style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
              value={rxFilter}
              onChange={(e) => setRxFilter(e.target.value)}
            >
              <option value="ALL">All Medicines</option>
              <option value="OTC">OTC Only (No Rx)</option>
              <option value="RX">Prescription Required (Rx)</option>
            </select>

            {/* Sort Dropdown */}
            <select
              className="input"
              style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="distance">📍 Nearest Distance</option>
              <option value="price_asc">💰 Price: Low to High</option>
              <option value="price_desc">💎 Price: High to Low</option>
              <option value="quantity">📦 Most Stock Available</option>
            </select>
          </div>
        </div>
      )}

      {/* Results List */}
      <div style={{ display: 'grid', gap: 14, maxWidth: 780, margin: '0 auto' }}>
        {processedResults.map((row) => {
          const selectedQty = quantities[row.stock_id] || 1;
          const maxAvailable = Math.min(row.quantity, 10);
          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.pharmacy_name + ' ' + row.address + ' ' + row.city)}`;

          return (
            <div
              key={row.stock_id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 14,
                borderLeft: '4px solid var(--color-teal-700)'
              }}
            >
              <div style={{ flex: '1 1 340px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 18, color: 'var(--color-teal-900)' }}>{row.medicine_name}</h3>
                  {row.requires_prescription ? (
                    <span className="badge badge-amber" style={{ fontSize: 11 }}>Doctor's Rx Required</span>
                  ) : (
                    <span className="badge badge-green" style={{ fontSize: 11 }}>OTC (No Rx)</span>
                  )}
                </div>

                {row.generic_name && (
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                    Generic: <strong>{row.generic_name}</strong>
                  </p>
                )}

                <div style={{ marginTop: 6, fontSize: 13 }}>
                  <strong>🏥 {row.pharmacy_name}</strong> — {row.address}, {row.city}
                </div>

                {/* Contact and Directions links */}
                <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 12 }}>
                  {row.phone && (
                    <a href={`tel:${row.phone}`} style={{ color: 'var(--color-teal-700)', fontWeight: 600 }}>
                      📞 Call: {row.phone}
                    </a>
                  )}
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-teal-700)', fontWeight: 600 }}>
                    🗺️ Directions in Google Maps →
                  </a>
                </div>

                {/* Stock and Price Badges */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="badge badge-green" style={{ fontSize: 14, fontWeight: 700 }}>
                    ₹{row.price}
                  </span>
                  <span className={`badge ${row.quantity <= 5 ? 'badge-amber' : 'badge-green'}`}>
                    {row.quantity} units available {row.quantity <= 5 ? '(Low Stock)' : ''}
                  </span>
                  {row.distance_km != null && (
                    <span className="badge badge-green">
                      📍 {row.distance_km} km away
                    </span>
                  )}
                </div>
              </div>

              {/* Reservation action box with Quantity selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Quantity:</label>
                  <select
                    className="input"
                    style={{ width: 'auto', padding: '4px 8px', fontSize: 13 }}
                    value={selectedQty}
                    onChange={(e) => setQuantities({ ...quantities, [row.stock_id]: parseInt(e.target.value, 10) })}
                    disabled={row.quantity < 1}
                  >
                    {Array.from({ length: maxAvailable }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => handleReserve(row)}
                  disabled={row.quantity < 1 || reservingStockId === row.stock_id}
                  style={{ minWidth: 130 }}
                >
                  {reservingStockId === row.stock_id ? (
                    <Spinner size="sm" label="Holding…" />
                  ) : (
                    `Reserve (₹${(parseFloat(row.price) * selectedQty).toFixed(2)})`
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {searched && !loading && results.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💊</div>
            <h4>No pharmacies currently stock this medication</h4>
            <p style={{ margin: '6px 0 16px', fontSize: 14 }}>
              Try searching with generic names, or use the <strong>AI Assistant</strong> to find clinically approved alternatives.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
