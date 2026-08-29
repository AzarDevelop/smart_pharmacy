import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import StockPill, { StatusPill } from '../../components/StockPill';

const PharmacyDashboard = () => {
  const { pharmacy, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/inventory/stats'),
      api.get('/inventory/low-stock'),
      api.get('/reservations/pharmacy'),
    ])
      .then(([s, l, r]) => {
        setStats(s.data.stats);
        setLowStock(l.data.inventory.slice(0, 5));
        setReservations(r.data.reservations.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) return <Loader text="Loading your pharmacy" />;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Pharmacy dashboard</p>
          <h1>{pharmacy?.name || user.name}</h1>
          <p className="mono small">
            {pharmacy?.address}, {pharmacy?.city} · Licence {pharmacy?.licenseNumber}
          </p>
        </div>
        <Link className="btn btn-primary" to="/pharmacy/inventory/add">Add medicine</Link>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-label">Medicines listed</div>
          <div className="stat-value">{stats.totalItems}</div>
        </div>
        <div className="stat">
          <div className="stat-label">In stock</div>
          <div className="stat-value ok">{stats.inStock}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Low stock</div>
          <div className="stat-value warn">{stats.lowStock}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Out of stock</div>
          <div className="stat-value bad">{stats.outOfStock}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Pending reservations</div>
          <div className="stat-value warn">{stats.pendingReservations}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Stock value</div>
          <div className="stat-value">₹{stats.stockValue.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <h2>Needs restocking</h2>
          <Link className="small" to="/pharmacy/low-stock">View all</Link>
        </div>
        {lowStock.length === 0 ? (
          <p className="muted">Every medicine is above its low-stock limit.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Medicine</th><th>Stock</th><th>Limit</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {lowStock.map((row) => (
                  <tr key={row._id}>
                    <td>{row.medicine?.name} {row.medicine?.strength}</td>
                    <td className="num">{row.stock}</td>
                    <td className="num">{row.lowStockLimit}</td>
                    <td><StockPill stock={row.stock} limit={row.lowStockLimit} /></td>
                    <td>
                      <Link className="btn btn-ghost btn-sm" to={`/pharmacy/inventory/edit/${row._id}`}>
                        Update stock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          <h2>Recent reservations</h2>
          <Link className="small" to="/pharmacy/reservations">View all</Link>
        </div>
        {reservations.length === 0 ? (
          <p className="muted">No reservations yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Code</th><th>Customer</th><th>Medicine</th><th>Qty</th><th>Status</th></tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r._id}>
                    <td><span className="code-chip">{r.code}</span></td>
                    <td>{r.user?.name}</td>
                    <td>{r.medicine?.name} {r.medicine?.strength}</td>
                    <td className="num">{r.quantity}</td>
                    <td><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
};

export default PharmacyDashboard;
