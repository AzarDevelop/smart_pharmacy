import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getError } from '../../api/axios';
import Loader from '../../components/Loader';
import StockPill from '../../components/StockPill';

const EditMedicine = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [form, setForm] = useState({ price: '', stock: '', lowStockLimit: '', batchNumber: '', expiryDate: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api
      .get(`/inventory/${id}`)
      .then(({ data }) => {
        setItem(data.item);
        setForm({
          price: data.item.price,
          stock: data.item.stock,
          lowStockLimit: data.item.lowStockLimit,
          batchNumber: data.item.batchNumber || '',
          expiryDate: data.item.expiryDate ? data.item.expiryDate.slice(0, 10) : '',
        });
      })
      .catch((err) => setError(getError(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const { data } = await api.put(`/inventory/${id}`, {
        price: Number(form.price),
        stock: Number(form.stock),
        lowStockLimit: Number(form.lowStockLimit),
        batchNumber: form.batchNumber,
        expiryDate: form.expiryDate || undefined,
      });
      setItem((prev) => ({ ...prev, ...data.item }));
      setMessage('Saved. Customers now see the updated price and stock.');
    } catch (err) {
      setError(getError(err));
    }
  };

  if (loading) return <Loader />;
  if (!item) return <main className="page"><div className="alert alert-error">{error || 'Item not found'}</div></main>;

  return (
    <main className="page">
      <p className="small"><Link to="/pharmacy/inventory">← Back to inventory</Link></p>
      <div className="page-head">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>{item.medicine?.name} {item.medicine?.strength}</h1>
          <p className="mono small">
            {item.medicine?.brandName} · {item.medicine?.genericName} · {item.medicine?.dosageForm}
          </p>
        </div>
        <StockPill stock={Number(form.stock) || 0} limit={Number(form.lowStockLimit) || 10} />
      </div>

      {message && <div className="alert alert-ok">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={submit}>
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

          <div className="tag-row">
            <button className="btn btn-primary">Save changes</button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/pharmacy/inventory')}>
              Back to inventory
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default EditMedicine;
