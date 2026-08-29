import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import { StatusPill } from '../../components/StockPill';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [reservations, setReservations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reservations/my'),
      api.get('/notifications'),
      api.get('/pharmacies/nearby', { params: { distance: 10 } }),
    ])
      .then(([r, n, p]) => {
        setReservations(r.data.reservations);
        setNotifications(n.data.notifications.slice(0, 4));
        setNearby(p.data.pharmacies.slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  const active = reservations.filter((r) => ['pending', 'confirmed', 'ready'].includes(r.status));

  if (loading) return <Loader text="Loading your dashboard" />;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Hello, {user.name.split(' ')[0]}</h1>
          <p>Check availability, reserve a medicine, and track your pickups.</p>
        </div>
      </div>

      <form
        className="card"
        style={{ marginBottom: 20 }}
        onSubmit={(e) => { e.preventDefault(); navigate(`/search?q=${encodeURIComponent(query.trim())}`); }}
      >
        <div className="searchbar">
          <input
            className="input"
            placeholder="Search a medicine by name, brand or generic name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search medicines"
          />
          <button className="btn btn-primary">Check availability</button>
        </div>
      </form>

      <div className="stats">
        <div className="stat">
          <div className="stat-label">Active reservations</div>
          <div className="stat-value ok">{active.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Total reservations</div>
          <div className="stat-value">{reservations.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Unread alerts</div>
          <div className="stat-value warn">{notifications.filter((n) => !n.isRead).length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Pharmacies within 10 km</div>
          <div className="stat-value">{nearby.length ? `${nearby.length}+` : 0}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <h2>Your active reservations</h2>
          <Link className="small" to="/user/reservations">View all</Link>
        </div>
        {active.length === 0 ? (
          <p className="muted">
            Nothing reserved right now. <Link to="/search">Search for a medicine</Link> to reserve one.
          </p>
        ) : (
          <div className="list">
            {active.slice(0, 4).map((r) => (
              <div key={r._id} className="label-card">
                <div className="row-between">
                  <div>
                    <h3 style={{ marginBottom: 2 }}>{r.medicine?.name} {r.medicine?.strength}</h3>
                    <p className="small muted" style={{ margin: 0 }}>{r.pharmacy?.name} · {r.pharmacy?.address}</p>
                  </div>
                  <div className="tag-row">
                    <StatusPill status={r.status} />
                    <span className="code-chip">{r.code}</span>
                  </div>
                </div>
                <div className="label-row">
                  <span>QTY <b>{r.quantity}</b></span>
                  <span>TOTAL <b>₹{r.totalPrice.toFixed(2)}</b></span>
                  <span>PLACED <b>{new Date(r.createdAt).toLocaleDateString('en-IN')}</b></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          <h2>Latest notifications</h2>
          <Link className="small" to="/user/notifications">View all</Link>
        </div>
        {notifications.length === 0 ? (
          <p className="muted">No notifications yet.</p>
        ) : (
          <div className="list">
            {notifications.map((n) => (
              <div key={n._id} className="label-card">
                <div className="row-between">
                  <b>{n.title}</b>
                  <span className="mono small muted">{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                </div>
                <p className="small muted" style={{ margin: '4px 0 0' }}>{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          <h2>Pharmacies near you</h2>
          <Link className="small" to="/pharmacies">View all</Link>
        </div>
        <div className="grid-cards">
          {nearby.map((p) => (
            <div key={p._id} className="label-card">
              <div className="row-between">
                <b>{p.name}</b>
                <span className="code-chip">{p.distanceKm} km</span>
              </div>
              <div className="label-row">
                <span>STOCKED ITEMS <b>{p.medicineCount}</b></span>
                <span>HOURS <b>{p.openingHours}</b></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default UserDashboard;
