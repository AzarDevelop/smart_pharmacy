import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../api/api';
import Spinner, { LoadingState } from '../components/Spinner';

const TABS = ['Inventory', 'Low Stock Alerts', 'Demand Prediction', 'Reservations'];

export default function PharmacyDashboard() {
  const [pharmacies, setPharmacies] = useState([]);
  const [activePharmacy, setActivePharmacy] = useState(null);
  const [tab, setTab] = useState('Inventory');
  const [showCreate, setShowCreate] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [reservationsCount, setReservationsCount] = useState(0);

  useEffect(() => {
    api.get('/pharmacy/mine').then(({ data }) => {
      setPharmacies(data);
      if (data.length > 0) setActivePharmacy(data[0]);
      else setShowCreate(true);
    }).catch(console.error);
  }, []);

  const refreshBadges = useCallback(async () => {
    if (!activePharmacy) return;
    try {
      const [lowRes, resRes] = await Promise.all([
        api.get(`/pharmacy/${activePharmacy.pharmacy_id}/low-stock`).catch(() => ({ data: [] })),
        api.get(`/pharmacy/${activePharmacy.pharmacy_id}/reservations`).catch(() => ({ data: [] }))
      ]);
      setLowStockCount(lowRes.data.length);
      const pendingReservations = resRes.data.filter((r) => r.status === 'pending' || r.status === 'confirmed');
      setReservationsCount(pendingReservations.length);
    } catch (e) {
      console.error(e);
    }
  }, [activePharmacy]);

  useEffect(() => {
    refreshBadges();
  }, [refreshBadges]);

  if (showCreate && pharmacies.length === 0) {
    return <CreatePharmacy onCreated={(p) => { setPharmacies([p]); setActivePharmacy(p); setShowCreate(false); }} />;
  }

  if (!activePharmacy) return <div className="page container"><LoadingState text="Loading pharmacy dashboard…" /></div>;

  return (
    <div className="page container">
      {/* Pharmacy Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2>{activePharmacy.name}</h2>
            <span className={`badge ${activePharmacy.is_verified ? 'badge-green' : 'badge-amber'}`}>
              {activePharmacy.is_verified ? 'Verified Pharmacy' : 'Pending Verification'}
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: '4px 0 0' }}>
            📍 {activePharmacy.address}, {activePharmacy.city} {activePharmacy.phone ? `· 📞 ${activePharmacy.phone}` : ''}
          </p>
        </div>

        {pharmacies.length > 1 && (
          <select
            className="input"
            style={{ width: 'auto' }}
            value={activePharmacy.pharmacy_id}
            onChange={(e) => {
              const selected = pharmacies.find((p) => p.pharmacy_id === parseInt(e.target.value, 10));
              if (selected) setActivePharmacy(selected);
            }}
          >
            {pharmacies.map((p) => (
              <option key={p.pharmacy_id} value={p.pharmacy_id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', padding: '10px 14px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
              color: tab === t ? 'var(--color-teal-700)' : 'var(--color-text-muted)',
              borderBottom: tab === t ? '2px solid var(--color-teal-700)' : '2px solid transparent'
            }}
          >
            {t}
            {t === 'Low Stock Alerts' && lowStockCount > 0 && (
              <span className="badge badge-amber" style={{ padding: '2px 7px', fontSize: 11 }}>
                {lowStockCount}
              </span>
            )}
            {t === 'Reservations' && reservationsCount > 0 && (
              <span className="badge badge-green" style={{ padding: '2px 7px', fontSize: 11 }}>
                {reservationsCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'Inventory' && <Inventory pharmacyId={activePharmacy.pharmacy_id} onInventoryChange={refreshBadges} />}
      {tab === 'Low Stock Alerts' && <LowStock pharmacyId={activePharmacy.pharmacy_id} onStockUpdated={refreshBadges} />}
      {tab === 'Demand Prediction' && <DemandPrediction pharmacyId={activePharmacy.pharmacy_id} />}
      {tab === 'Reservations' && <PharmacyReservations pharmacyId={activePharmacy.pharmacy_id} onReservationChange={refreshBadges} />}
    </div>
  );
}

function CreatePharmacy({ onCreated }) {
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', latitude: '', longitude: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/pharmacy', form);
      onCreated({ ...form, pharmacy_id: data.pharmacy_id, is_verified: false });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page container" style={{ maxWidth: 480 }}>
      <div className="card">
        <h2 style={{ marginBottom: 4 }}>Set up your pharmacy</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 20 }}>
          This profile is what customers will see when your medicines show up in search.
        </p>
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
            {loading ? <Spinner size="sm" label="Creating…" /> : 'Create pharmacy profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// INVENTORY COMPONENT (Search, Metrics, Add, Inline Edit, Restock)
// ============================================================
function Inventory({ pharmacyId, onInventoryChange }) {
  const [items, setItems] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [form, setForm] = useState({ medicine_id: '', price: '', quantity: '', low_stock_threshold: 10 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, catRes] = await Promise.all([
        api.get(`/pharmacy/${pharmacyId}/inventory`),
        api.get('/medicines')
      ]);
      setItems(invRes.data);
      setCatalogue(catRes.data);
      if (onInventoryChange) onInventoryChange();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, onInventoryChange]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/pharmacy/${pharmacyId}/inventory`, form);
      setForm({ medicine_id: '', price: '', quantity: '', low_stock_threshold: 10 });
      setShowAddForm(false);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setSaving(true);
    try {
      await api.post(`/pharmacy/${pharmacyId}/inventory`, {
        medicine_id: editingItem.medicine_id,
        price: editingItem.price,
        quantity: editingItem.quantity,
        low_stock_threshold: editingItem.low_stock_threshold
      });
      setEditingItem(null);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const quickRestock = async (item, delta) => {
    try {
      const newQty = (parseInt(item.quantity, 10) || 0) + delta;
      await api.post(`/pharmacy/${pharmacyId}/inventory`, {
        medicine_id: item.medicine_id,
        price: item.price,
        quantity: newQty,
        low_stock_threshold: item.low_stock_threshold
      });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const remove = async (stockId, name) => {
    if (!window.confirm(`Remove ${name} from your pharmacy inventory?`)) return;
    await api.delete(`/pharmacy/${pharmacyId}/inventory/${stockId}`);
    load();
  };

  // Metrics
  const totalSKUs = items.length;
  const totalUnits = items.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0);
  const totalValuation = items.reduce((acc, it) => acc + ((parseFloat(it.price) || 0) * (parseInt(it.quantity, 10) || 0)), 0);
  const lowStockItemsCount = items.filter((it) => it.quantity <= it.low_stock_threshold).length;

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (it.name && it.name.toLowerCase().includes(q)) ||
        (it.generic_name && it.generic_name.toLowerCase().includes(q)) ||
        (it.category && it.category.toLowerCase().includes(q));

      const matchesCat =
        categoryFilter === 'ALL' ||
        (it.category && it.category.toLowerCase() === categoryFilter.toLowerCase());

      return matchesSearch && matchesCat;
    });
  }, [items, search, categoryFilter]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return Array.from(set);
  }, [items]);

  return (
    <div>
      {/* Inventory KPI Banner */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Medicines Stocked</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-teal-900)' }}>{totalSKUs}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Total Units</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-teal-900)' }}>{totalUnits}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Inventory Value</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-teal-700)' }}>₹{totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Low Stock Alerts</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: lowStockItemsCount > 0 ? 'var(--color-amber-500)' : 'var(--color-teal-900)' }}>
            {lowStockItemsCount}
          </div>
        </div>
      </div>

      {/* Action / Search Header */}
      <div className="card" style={{ marginBottom: 20, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1, minWidth: 260 }}>
            <input
              className="input"
              style={{ minWidth: 200, flex: 2 }}
              placeholder="🔍 Search in your inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {categories.length > 0 && (
              <select
                className="input"
                style={{ minWidth: 140, flex: 1 }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ Close Form' : '➕ Add Medicine to Stock'}
          </button>
        </div>
      </div>

      {/* Add Stock Form */}
      {showAddForm && (
        <form onSubmit={submit} className="card" style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20, background: '#F8FAF9' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="label">Select Medicine *</label>
            <select className="input" required value={form.medicine_id} onChange={(e) => setForm({ ...form, medicine_id: e.target.value })}>
              <option value="">Select from catalogue</option>
              {catalogue.map((m) => (
                <option key={m.medicine_id} value={m.medicine_id}>
                  {m.name} {m.generic_name ? `(${m.generic_name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div style={{ width: 110 }}>
            <label className="label">Price (₹) *</label>
            <input className="input" type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div style={{ width: 110 }}>
            <label className="label">Quantity *</label>
            <input className="input" type="number" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
          <div style={{ width: 110 }}>
            <label className="label">Alert below</label>
            <input className="input" type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
          </div>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? <Spinner size="sm" label="Saving…" /> : 'Save Stock'}
          </button>
        </form>
      )}

      {/* Edit Stock Modal */}
      {editingItem && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 440, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: 14 }}>Edit Stock: {editingItem.name}</h3>
            <form onSubmit={submitEdit}>
              <div style={{ marginBottom: 12 }}>
                <label className="label">Price (₹)</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  required
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="label">Quantity in Stock (units)</label>
                <input
                  className="input"
                  type="number"
                  required
                  value={editingItem.quantity}
                  onChange={(e) => setEditingItem({ ...editingItem, quantity: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label className="label">Low Stock Alert Threshold</label>
                <input
                  className="input"
                  type="number"
                  value={editingItem.low_stock_threshold}
                  onChange={(e) => setEditingItem({ ...editingItem, low_stock_threshold: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Spinner size="sm" label="Updating…" /> : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items List */}
      {loading ? (
        <LoadingState text="Loading pharmacy inventory…" />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filteredItems.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 36 }}>
              {search ? 'No inventory items match your search.' : 'No medicines currently added to this inventory. Use the button above to add stock.'}
            </div>
          )}
          {filteredItems.map((it) => {
            const isLow = it.quantity <= it.low_stock_threshold;
            return (
              <div
                key={it.stock_id}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  borderLeft: isLow ? '4px solid var(--color-amber-500)' : '4px solid var(--color-teal-500)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 16 }}>{it.name}</strong>
                    {it.category && <span style={{ fontSize: 11, backgroundColor: '#EFF3F2', padding: '2px 8px', borderRadius: 4 }}>{it.category}</span>}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {it.generic_name || 'No generic info'} · Low alert threshold: {it.low_stock_threshold} units
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span className="badge badge-green" style={{ fontSize: 14 }}>₹{it.price}</span>
                  <span className={`badge ${isLow ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 13 }}>
                    {it.quantity} units {isLow && '⚠️'}
                  </span>

                  {/* Quick delta buttons */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: 12 }}
                      title="Quick add 10 units"
                      onClick={() => quickRestock(it, 10)}
                    >
                      +10
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: 12 }}
                      title="Quick add 25 units"
                      onClick={() => quickRestock(it, 25)}
                    >
                      +25
                    </button>
                  </div>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: 13 }}
                    onClick={() => setEditingItem(it)}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 12px', fontSize: 13 }}
                    onClick={() => remove(it.stock_id, it.name)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// LOW STOCK COMPONENT (With 1-click Quick Restock)
// ============================================================
function LowStock({ pharmacyId, onStockUpdated }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/pharmacy/${pharmacyId}/low-stock`)
      .then(({ data }) => setItems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pharmacyId]);

  useEffect(() => {
    load();
  }, [load]);

  const restock = async (item, amount) => {
    try {
      const newQty = (parseInt(item.quantity, 10) || 0) + amount;
      await api.post(`/pharmacy/${pharmacyId}/inventory`, {
        medicine_id: item.medicine_id,
        price: item.price,
        quantity: newQty,
        low_stock_threshold: item.low_stock_threshold
      });
      load();
      if (onStockUpdated) onStockUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingState text="Checking low stock levels…" />;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {items.length === 0 && (
        <div className="card" style={{ color: 'var(--color-teal-700)', textAlign: 'center', padding: 32 }}>
          🎉 All medicine inventory levels look healthy! No items are currently at or below low stock threshold.
        </div>
      )}

      {items.map((it) => (
        <div
          key={it.stock_id}
          className="card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderLeft: '4px solid var(--color-amber-500)',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div>
            <strong style={{ fontSize: 16 }}>{it.name}</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Currently <strong>{it.quantity}</strong> units remaining (Alert threshold: {it.low_stock_threshold})
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Quick Restock:</span>
            <button className="btn btn-secondary" onClick={() => restock(it, 10)}>+10</button>
            <button className="btn btn-secondary" onClick={() => restock(it, 25)}>+25</button>
            <button className="btn btn-primary" onClick={() => restock(it, 50)}>+50 Units</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// DEMAND PREDICTION COMPONENT (AI Forecasting)
// ============================================================
function DemandPrediction({ pharmacyId }) {
  const [catalogue, setCatalogue] = useState([]);
  const [medicineId, setMedicineId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingCatalogue, setFetchingCatalogue] = useState(true);

  useEffect(() => {
    setFetchingCatalogue(true);
    api.get('/medicines')
      .then(({ data }) => setCatalogue(data))
      .catch(console.error)
      .finally(() => setFetchingCatalogue(false));
  }, []);

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

  if (fetchingCatalogue) return <LoadingState text="Loading medicines catalogue…" />;

  return (
    <div>
      <div className="card" style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label className="label">Select Medicine for Demand Forecasting</label>
          <select className="input" value={medicineId} onChange={(e) => setMedicineId(e.target.value)}>
            <option value="">Select medicine</option>
            {catalogue.map((m) => <option key={m.medicine_id} value={m.medicine_id}>{m.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={runPrediction} disabled={loading || !medicineId}>
          {loading ? <Spinner size="sm" label="Forecasting with AI…" /> : '📈 Run AI Demand Forecast'}
        </button>
      </div>

      {loading && <LoadingState text="AI agent running trend regression & 7-day demand calculation…" />}

      {error && <div className="card" style={{ color: 'var(--color-red-500)' }}>{error}</div>}

      {result && !loading && (
        <div className="card">
          <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
            <Stat label="Trend" value={result.trend || 'Stable'} />
            <Stat label="Avg daily demand (next 7 days)" value={result.predicted_daily_avg || result.predictions?.[0]?.predicted_quantity || '-'} />
            <Stat label="Predicted total (next 7 days)" value={result.total_predicted_demand || result.predicted_total_next_period || '-'} />
            <Stat label="Recommendation" value={result.reorder_recommendation || result.recommend_restock_units || 'Restock as per trend'} />
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
          {result.predictions?.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 12 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '6px 0' }}>Day</th>
                  <th>Predicted quantity</th>
                </tr>
              </thead>
              <tbody>
                {result.predictions.map((p, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '6px 0' }}>Day {p.day || idx + 1}</td>
                    <td>{p.predicted_quantity}</td>
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

// ============================================================
// PHARMACY RESERVATIONS COMPONENT (Filter Tabs, Call Customer, Workflow)
// ============================================================
const RESERVATION_STATUS_FILTERS = ['ALL', 'pending', 'confirmed', 'ready', 'completed', 'cancelled'];

function PharmacyReservations({ pharmacyId, onReservationChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/pharmacy/${pharmacyId}/reservations`);
      setItems(data);
      if (onReservationChange) onReservationChange();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pharmacyId, onReservationChange]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    await api.patch(`/reservations/${id}/status`, { status });
    load();
  };

  const filteredItems = useMemo(() => {
    return items.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
        (r.medicine_name && r.medicine_name.toLowerCase().includes(q)) ||
        (r.customer_phone && r.customer_phone.includes(q));

      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  if (loading && items.length === 0) return <LoadingState text="Loading customer reservations…" />;

  return (
    <div>
      {/* Reservation Filter Tabs */}
      <div className="card" style={{ marginBottom: 16, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {RESERVATION_STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  background: statusFilter === s ? 'var(--color-teal-700)' : '#f0f3f2',
                  color: statusFilter === s ? 'white' : 'var(--color-text-muted)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {s === 'ALL' ? 'All Reservations' : s}
                {' (' + (s === 'ALL' ? items.length : items.filter((i) => i.status === s).length) + ')'}
              </button>
            ))}
          </div>

          <input
            className="input"
            style={{ width: 220 }}
            placeholder="🔍 Search customer or medicine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {filteredItems.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>
            No reservations found for the selected filter.
          </div>
        )}

        {filteredItems.map((r) => {
          const totalCost = r.price ? (parseFloat(r.price) * r.quantity).toFixed(2) : null;
          return (
            <div
              key={r.reservation_id}
              className="card"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 16 }}>{r.medicine_name} × {r.quantity}</strong>
                  {totalCost && <span className="badge badge-green">Total: ₹{totalCost}</span>}
                </div>

                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                  👤 Customer: <strong>{r.customer_name}</strong>
                  {r.customer_phone && (
                    <span> · 📞 <a href={`tel:${r.customer_phone}`} style={{ color: 'var(--color-teal-700)', fontWeight: 600 }}>{r.customer_phone}</a></span>
                  )}
                </p>

                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Reserved on {new Date(r.reserved_at).toLocaleDateString()} · Pickup deadline: {new Date(r.pickup_by).toLocaleDateString()}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${
                  r.status === 'confirmed' || r.status === 'ready' || r.status === 'completed'
                    ? 'badge-green'
                    : r.status === 'cancelled'
                    ? 'badge-red'
                    : 'badge-amber'
                }`} style={{ textTransform: 'capitalize' }}>
                  {r.status}
                </span>

                {r.status === 'pending' && (
                  <button className="btn btn-secondary" onClick={() => updateStatus(r.reservation_id, 'confirmed')}>
                    Confirm Hold
                  </button>
                )}
                {r.status === 'confirmed' && (
                  <button className="btn btn-secondary" onClick={() => updateStatus(r.reservation_id, 'ready')}>
                    Mark Ready for Pickup
                  </button>
                )}
                {r.status === 'ready' && (
                  <button className="btn btn-primary" onClick={() => updateStatus(r.reservation_id, 'completed')}>
                    Mark Handed Over
                  </button>
                )}
                {['pending', 'confirmed'].includes(r.status) && (
                  <button
                    className="btn btn-danger"
                    style={{ padding: '6px 10px', fontSize: 12 }}
                    onClick={() => {
                      if (window.confirm('Cancel this reservation? Stock will be released back to inventory.')) {
                        updateStatus(r.reservation_id, 'cancelled');
                      }
                    }}
                  >
                    Cancel
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
