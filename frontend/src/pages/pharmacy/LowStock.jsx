import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getError } from '../../api/axios';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import StockPill from '../../components/StockPill';

const LowStock = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restock, setRestock] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/inventory/low-stock');
      setRows(data.inventory);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addStock = async (row) => {
    const add = Number(restock[row._id] || 0);
    if (add <= 0) return;
    try {
      await api.put(`/inventory/${row._id}`, { stock: row.stock + add });
      setRestock({ ...restock, [row._id]: '' });
      load();
    } catch (err) {
      setError(getError(err));
    }
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Alerts</p>
          <h1>Low stock</h1>
          <p>Medicines at or below the alert quantity you set for them.</p>
        </div>
        <Link className="btn btn-ghost" to="/pharmacy/inventory">Full inventory</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Loader />
      ) : rows.length === 0 ? (
        <EmptyState title="Nothing to restock" message="Every medicine is above its low-stock limit." />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Medicine</th><th>Stock</th><th>Limit</th><th>Status</th><th>Add stock</th></tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id}>
                    <td>
                      <b>{row.medicine?.name} {row.medicine?.strength}</b>
                      <div className="small muted">{row.medicine?.dosageForm}</div>
                    </td>
                    <td className="num">{row.stock}</td>
                    <td className="num">{row.lowStockLimit}</td>
                    <td><StockPill stock={row.stock} limit={row.lowStockLimit} /></td>
                    <td>
                      <div className="tag-row">
                        <input
                          className="input mono" style={{ width: 90 }} type="number" min="1" placeholder="Qty"
                          value={restock[row._id] || ''}
                          onChange={(e) => setRestock({ ...restock, [row._id]: e.target.value })}
                        />
                        <button className="btn btn-primary btn-sm" onClick={() => addStock(row)}>Add</button>
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

export default LowStock;
