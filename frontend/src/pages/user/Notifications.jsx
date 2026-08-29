import { useEffect, useState } from 'react';
import api, { getError } from '../../api/axios';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await api.put('/notifications/read-all');
    load();
  };

  const markOne = async (id) => {
    await api.put(`/notifications/${id}/read`);
    load();
  };

  const remove = async (id) => {
    await api.delete(`/notifications/${id}`);
    load();
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Notifications</p>
          <h1>Alerts</h1>
          <p>{unread} unread of {notifications.length}</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAll}>Mark all as read</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Loader />
      ) : notifications.length === 0 ? (
        <EmptyState title="Nothing yet" message="Reservation updates and stock alerts will appear here." />
      ) : (
        <div className="list">
          {notifications.map((n) => (
            <article
              key={n._id}
              className="label-card"
              style={{ borderLeftColor: n.isRead ? 'var(--line-strong)' : 'var(--accent)' }}
            >
              <div className="row-between">
                <b>{n.title}</b>
                <div className="tag-row">
                  <span className="pill pill-neutral">{n.type}</span>
                  <span className="mono small muted">{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <p className="small" style={{ margin: '6px 0 8px' }}>{n.message}</p>
              <div className="tag-row">
                {!n.isRead && (
                  <button className="btn btn-ghost btn-sm" onClick={() => markOne(n._id)}>Mark as read</button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => remove(n._id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};

export default Notifications;
