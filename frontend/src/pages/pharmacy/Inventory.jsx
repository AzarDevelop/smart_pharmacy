import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getError } from '../../api/axios';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import StockPill from '../../components/StockPill';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async (term = '') => {
    setLoading(true);
    try {
      const { data } = await api.get('/inventory', { params: term ? { search: term } : {} });
      setInventory(data.inventory);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id, name) => {
    if (!window.confirm(`Remove ${name} from your inventory?`)) return;
    try {
      await api.delete(`/inventory/${id}`);
      setMessage(`${name} removed from inventory.`);
      load(search);
    } catch (err) {
      setError(getError(err));
    }
  };

  // Quick +/- stock without opening the edit page
  const adjust = async (row, delta) => {
    const stock = Math.max(0, row.stock + delta);
    try {
      await api.put(`/inventory/${row._id}`, { stock });
      setInventory((list) => list.map((i) => (i._id === row._id ? { ...i, stock } : i)));
    } catch (err) {
      setError(getError(err));
    }
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>Your medicines</h1>
          <p>{inventory.length} item(s) listed. Customers see this stock in their search results.</p>
        </div>
        <Link className="btn btn-primary" to="/pharmacy/inventory/add">Add medicine</Link>
      </div>

      <form
        className="filters"
        onSubmit={(e) => { e.preventDefault(); load(search); }}
      >
        <input
          className="input"
          style={{ maxWidth: 320 }}
          placeholder="Filter by medicine name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-ghost btn-sm">Filter</button>
        {search && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); load(''); }}>
            Clear
          </button>
        )}
      </form>

      {message && <div className="alert alert-ok">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Loader />
      ) : inventory.length === 0 ? (
        <EmptyState
          title="Your inventory is empty"
          message="Add the medicines you stock so customers searching nearby can find them."
          action={<Link className="btn btn-primary" to="/pharmacy/inventory/add">Add your first medicine</Link>}
        />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Medicine</th><th>Form</th><th>Price</th><th>Stock</th>
                  <th>Status</th><th>Expiry</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((row) => (
                  <tr key={row._id}>
                    <td>
                      <b>{row.medicine?.name} {row.medicine?.strength}</b>
                      <div className="small muted">{row.medicine?.brandName}</div>
                    </td>
                    <td className="small">{row.medicine?.dosageForm}</td>
                    <td className="num">₹{row.price.toFixed(2)}</td>
                    <td className="num">
                      <div className="tag-row">
                        <button className="btn btn-ghost btn-sm" onClick={() => adjust(row, -1)} aria-label="Decrease stock">−</button>
                        <b>{row.stock}</b>
                        <button className="btn btn-ghost btn-sm" onClick={() => adjust(row, 1)} aria-label="Increase stock">+</button>
                      </div>
                    </td>
                    <td><StockPill stock={row.stock} limit={row.lowStockLimit} /></td>
                    <td className="num small">
                      {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <div className="tag-row">
                        <Link className="btn btn-ghost btn-sm" to={`/pharmacy/inventory/edit/${row._id}`}>Edit</Link>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => remove(row._id, row.medicine?.name)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
};

export default Inventory;
