import { useEffect, useState } from 'react';
import api, { getError } from '../../api/axios';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { StatusPill } from '../../components/StockPill';

const FILTERS = ['', 'pending', 'confirmed', 'ready', 'completed', 'rejected', 'cancelled'];

// Which buttons a pharmacy sees for each status
const NEXT_ACTIONS = {
  pending: [['confirmed', 'Confirm'], ['rejected', 'Reject']],
  confirmed: [['ready', 'Mark ready'], ['rejected', 'Reject']],
  ready: [['completed', 'Mark picked up']],
};

const PharmacyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reservations/pharmacy', { params: status ? { status } : {} });
      setReservations(data.reservations);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const update = async (id, next) => {
    setError(''); setMessage('');
    try {
      await api.put(`/reservations/${id}/status`, { status: next });
      setMessage(`Reservation marked ${next}. The customer has been notified.`);
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
          <h1>Customer reservations</h1>
          <p>Confirm what you can fulfil. Rejecting a reservation returns the stock automatically.</p>
        </div>
      </div>

      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f || 'all'} className={`btn btn-sm ${status === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatus(f)}>
            {f || 'All'}
          </button>
        ))}
      </div>

      {message && <div className="alert alert-ok">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Loader />
      ) : reservations.length === 0 ? (
        <EmptyState title="No reservations here" message="Reservations placed by customers will appear on this page." />
      ) : (
        <div className="list">
          {reservations.map((r) => (
            <article key={r._id} className="label-card">
              <div className="row-between">
                <div>
                  <h3 style={{ marginBottom: 2 }}>{r.medicine?.name} {r.medicine?.strength}</h3>
                  <p className="small muted" style={{ margin: 0 }}>
                    {r.user?.name} · {r.user?.phone || r.user?.email}
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

              {NEXT_ACTIONS[r.status] && (
                <div className="tag-row" style={{ marginTop: 10 }}>
                  {NEXT_ACTIONS[r.status].map(([next, label]) => (
                    <button
                      key={next}
                      className={`btn btn-sm ${next === 'rejected' ? 'btn-danger' : 'btn-primary'}`}
                      onClick={() => update(r._id, next)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
};

export default PharmacyReservations;
