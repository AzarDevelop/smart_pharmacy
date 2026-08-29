import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getError } from '../../api/axios';

const AddMedicine = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('catalogue'); // catalogue | new
  const [catalogue, setCatalogue] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    medicineId: '', price: '', stock: '', lowStockLimit: 10, batchNumber: '', expiryDate: '',
    name: '', brandName: '', genericName: '', manufacturer: '', category: '',
    strength: '', dosageForm: 'Tablet', prescriptionRequired: false, description: '',
  });

  useEffect(() => {
    api.get('/medicines', { params: { limit: 50 } }).then(({ data }) => setCatalogue(data.medicines)).catch(() => {});
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = {
        price: Number(form.price),
        stock: Number(form.stock),
        lowStockLimit: Number(form.lowStockLimit),
        batchNumber: form.batchNumber,
        expiryDate: form.expiryDate || undefined,
      };
      if (mode === 'catalogue') {
        if (!form.medicineId) throw new Error('Choose a medicine from the catalogue');
        payload.medicineId = form.medicineId;
      } else {
        payload.newMedicine = {
          name: form.name, brandName: form.brandName, genericName: form.genericName,
          manufacturer: form.manufacturer, category: form.category || undefined,
          strength: form.strength, dosageForm: form.dosageForm,
          prescriptionRequired: form.prescriptionRequired, description: form.description,
        };
      }
      await api.post('/inventory', payload);
      navigate('/pharmacy/inventory');
    } catch (err) {
      setError(err.response ? getError(err) : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <p className="small"><Link to="/pharmacy/inventory">← Back to inventory</Link></p>
      <div className="page-head">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>Add a medicine</h1>
          <p>Pick it from the shared catalogue, or enter one that is not listed yet.</p>
        </div>
      </div>

      <div className="auth-tabs" style={{ maxWidth: 420 }}>
        <button type="button" className={mode === 'catalogue' ? 'active' : ''} onClick={() => setMode('catalogue')}>
          From catalogue
        </button>
        <button type="button" className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>
          New medicine
        </button>
      </div>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          {mode === 'catalogue' ? (
            <div className="field">
              <label>Medicine</label>
              <select className="select" value={form.medicineId} onChange={set('medicineId')} required>
                <option value="">Select a medicine</option>
                {catalogue.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} {m.strength} {m.brandName ? `(${m.brandName})` : ''}
                  </option>
                ))}
              </select>
              <p className="hint">Showing the first 50 catalogue entries.</p>
            </div>
          ) : (
            <>
              <div className="grid-2">
                <div className="field">
                  <label>Medicine name</label>
                  <input className="input" required value={form.name} onChange={set('name')} />
                </div>
                <div className="field">
                  <label>Strength</label>
                  <input className="input" placeholder="500mg" value={form.strength} onChange={set('strength')} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Brand name</label>
                  <input className="input" value={form.brandName} onChange={set('brandName')} />
                </div>
                <div className="field">
                  <label>Generic name</label>
                  <input className="input" value={form.genericName} onChange={set('genericName')} />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Manufacturer</label>
                  <input className="input" value={form.manufacturer} onChange={set('manufacturer')} />
                </div>
                <div className="field">
                  <label>Category</label>
                  <select className="select" value={form.category} onChange={set('category')}>
                    <option value="">Uncategorised</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Dosage form</label>
                  <select className="select" value={form.dosageForm} onChange={set('dosageForm')}>
                    {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Gel', 'Powder', 'Sachet', 'Drops'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}>
                  <input
                    id="rx" type="checkbox" checked={form.prescriptionRequired}
                    onChange={set('prescriptionRequired')}
                  />
                  <label htmlFor="rx" style={{ margin: 0 }}>Prescription required</label>
                </div>
              </div>
              <div className="field">
                <label>Description</label>
                <textarea className="textarea" value={form.description} onChange={set('description')} />
              </div>
            </>
          )}

          <hr className="divider" />
          <h3>Your stock details</h3>
          <div className="grid-2">
            <div className="field">
              <label>Price (₹)</label>
              <input className="input mono" type="number" step="0.01" min="0" required value={form.price} onChange={set('price')} />
            </div>
            <div className="field">
              <label>Stock quantity</label>
              <input className="input mono" type="number" min="0" required value={form.stock} onChange={set('stock')} />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Low-stock alert at</label>
              <input className="input mono" type="number" min="0" value={form.lowStockLimit} onChange={set('lowStockLimit')} />
            </div>
            <div className="field">
              <label>Batch number</label>
              <input className="input mono" value={form.batchNumber} onChange={set('batchNumber')} />
            </div>
          </div>
          <div className="field">
            <label>Expiry date</label>
            <input className="input" type="date" value={form.expiryDate} onChange={set('expiryDate')} />
          </div>

          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Adding...' : 'Add to inventory'}
          </button>
        </form>
      </div>
    </main>
  );
};

export default AddMedicine;
