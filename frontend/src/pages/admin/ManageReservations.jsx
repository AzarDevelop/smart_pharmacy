import { useEffect, useState } from 'react';
import api, { getError } from '../../api/axios';
import Loader from '../../components/Loader';
import { StatusPill } from '../../components/StockPill';

const FILTERS = ['', 'pending', 'confirmed', 'ready', 'completed', 'cancelled', 'rejected'];

const ManageReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/reservations', { params: status ? { status } : {} })
      .then(({ data }) => setReservations(data.reservations))
      .catch((err) => setError(getError(err)))
      .finally(() => setLoading(false));
  }, [status]);

  const revenue = reservations
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.totalPrice, 0);

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>All reservations</h1>
          <p className="mono small">
            {reservations.length} shown · completed value ₹{revenue.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f || 'all'} className={`btn btn-sm ${status === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatus(f)}>
            {f || 'All'}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Loader />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Code</th><th>Customer</th><th>Medicine</th><th>Pharmacy</th><th>Qty</th><th>Total</th><th>Status</th><th>Placed</th></tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr><td colSpan="8" className="muted">No reservations match this filter.</td></tr>
                ) : (
                  reservations.map((r) => (
                    <tr key={r._id}>
                      <td><span className="code-chip">{r.code}</span></td>
                      <td className="small">{r.user?.name}<div className="muted mono">{r.user?.email}</div></td>
                      <td className="small">{r.medicine?.name} {r.medicine?.strength}</td>
                      <td className="small">{r.pharmacy?.name}</td>
                      <td className="num">{r.quantity}</td>
                      <td className="num">₹{r.totalPrice.toFixed(2)}</td>
                      <td><StatusPill status={r.status} /></td>
                      <td className="small mono">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
};

export default ManageReservations;
