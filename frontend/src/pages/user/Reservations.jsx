import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getError } from '../../api/axios';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { StatusPill } from '../../components/StockPill';

const FILTERS = ['', 'pending', 'confirmed', 'ready', 'completed', 'cancelled', 'rejected'];

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reservations/my', { params: status ? { status } : {} });
      setReservations(data.reservations);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this reservation? The stock goes back to the pharmacy.')) return;
    setError('');
    setMessage('');
    try {
      await api.put(`/reservations/${id}/cancel`);
      setMessage('Reservation cancelled.');
      load();
    } catch (err) {
      setError(getError(err));
    }
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Reservations</p>
          <h1>Your reservations</h1>
          <p>Show the pickup code at the pharmacy counter.</p>
        </div>
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f || 'all'}
            className={`btn btn-sm ${status === f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatus(f)}
          >
            {f || 'All'}
          </button>
        ))}
      </div>

      {message && <div className="alert alert-ok">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Loader />
      ) : reservations.length === 0 ? (
        <EmptyState
          title="No reservations here"
          message="Reserve a medicine after checking which pharmacy has it in stock."
          action={<Link className="btn btn-primary" to="/search">Search medicines</Link>}
        />
      ) : (
        <div className="list">
          {reservations.map((r) => (
            <article key={r._id} className="label-card">
              <div className="row-between">
                <div>
                  <h3 style={{ marginBottom: 2 }}>{r.medicine?.name} {r.medicine?.strength}</h3>
                  <p className="small muted" style={{ margin: 0 }}>
                    {r.pharmacy?.name} · {r.pharmacy?.address}, {r.pharmacy?.city} · {r.pharmacy?.phone}
                  </p>
                </div>
                <div className="tag-row">
                  <StatusPill status={r.status} />
                  <span className="code-chip">{r.code}</span>
                </div>
              </div>

              <div className="label-row">
                <span>QTY <b>{r.quantity}</b></span>
                <span>UNIT <b>₹{r.unitPrice.toFixed(2)}</b></span>
                <span>TOTAL <b>₹{r.totalPrice.toFixed(2)}</b></span>
                <span>PLACED <b>{new Date(r.createdAt).toLocaleString('en-IN')}</b></span>
              </div>

              {['pending', 'confirmed', 'ready'].includes(r.status) && (
                <div style={{ marginTop: 10 }}>
                  <button className="btn btn-danger btn-sm" onClick={() => cancel(r._id)}>
                    Cancel reservation
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
};

export default Reservations;
