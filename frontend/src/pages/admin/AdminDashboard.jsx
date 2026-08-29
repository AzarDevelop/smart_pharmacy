import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Loader from '../../components/Loader';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/activities')])
      .then(([s, a]) => {
        setData(s.data);
        setActivities(a.data.activities);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <Loader text="Loading system data" />;
  const { stats, reservationsByStatus, topMedicines } = data;
  const maxCount = Math.max(1, ...topMedicines.map((m) => m.count));

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>System overview</h1>
          <p>Everything registered in the system right now.</p>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-label">Customers</div>
          <div className="stat-value">{stats.users}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Pharmacies</div>
          <div className="stat-value">{stats.pharmacies}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Medicines</div>
          <div className="stat-value">{stats.medicines}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Categories</div>
          <div className="stat-value">{stats.categories}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Reservations</div>
          <div className="stat-value">{stats.reservations}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Pending pickups</div>
          <div className="stat-value warn">{stats.pending}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Out-of-stock listings</div>
          <div className="stat-value bad">{stats.outOfStock}</div>
        </div>
      </div>

      <div className="card">
        <h2>Reservations by status</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Status</th><th>Count</th></tr></thead>
            <tbody>
              {reservationsByStatus.length === 0 ? (
                <tr><td colSpan="2" className="muted">No reservations yet.</td></tr>
              ) : (
                reservationsByStatus.map((r) => (
                  <tr key={r._id}><td>{r._id}</td><td className="num">{r.count}</td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Most reserved medicines</h2>
        {topMedicines.length === 0 ? (
          <p className="muted">No reservation data yet.</p>
        ) : (
          <div className="list">
            {topMedicines.map((m) => (
              <div key={m._id}>
                <div className="row-between small">
                  <b>{m.name} {m.strength}</b>
                  <span className="mono">{m.count}</span>
                </div>
                <div style={{ height: 6, background: 'var(--line)', borderRadius: 4, marginTop: 4 }}>
                  <div
                    style={{
                      width: `${(m.count / maxCount) * 100}%`,
                      height: '100%',
                      background: 'var(--accent)',
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">
          <h2>Recent activity</h2>
          <Link className="small" to="/admin/reservations">All reservations</Link>
        </div>
        <div className="list">
          {activities.map((a, i) => (
            <div key={i} className="row-between small" style={{ borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>
              <span><span className="pill pill-neutral">{a.type}</span> {a.text}</span>
              <span className="mono muted">{new Date(a.at).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
