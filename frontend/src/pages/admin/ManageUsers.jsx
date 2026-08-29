import { useEffect, useState } from 'react';
import api, { getError } from '../../api/axios';
import Loader from '../../components/Loader';
import { StatusPill } from '../../components/StockPill';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('user');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { role, search } });
      setUsers(data.users);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [role]);

  const toggle = async (user) => {
    const status = user.status === 'active' ? 'blocked' : 'active';
    try {
      await api.put(`/admin/users/${user._id}/status`, { status });
      setMessage(`${user.name} is now ${status}.`);
      load();
    } catch (err) {
      setError(getError(err));
    }
  };

  const remove = async (user) => {
    if (!window.confirm(`Delete ${user.name}? Their reservations will also be removed.`)) return;
    try {
      await api.delete(`/admin/users/${user._id}`);
      setMessage(`${user.name} deleted.`);
      load();
    } catch (err) {
      setError(getError(err));
    }
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Manage accounts</h1>
          <p>{users.length} account(s) shown.</p>
        </div>
      </div>

      <form className="filters" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">Customers</option>
          <option value="pharmacy">Pharmacy owners</option>
          <option value="admin">Admins</option>
          <option value="">All roles</option>
        </select>
        <input className="input" placeholder="Search name, email or city" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-ghost btn-sm">Search</button>
      </form>

      {message && <div className="alert alert-ok">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <Loader />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan="7" className="muted">No accounts match this filter.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id}>
                      <td><b>{u.name}</b></td>
                      <td className="small mono">{u.email}</td>
                      <td><span className="pill pill-neutral">{u.role}</span></td>
                      <td className="small">{u.city || '—'}</td>
                      <td><StatusPill status={u.status} /></td>
                      <td className="small mono">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div className="tag-row">
                          <button className="btn btn-ghost btn-sm" onClick={() => toggle(u)}>
                            {u.status === 'active' ? 'Block' : 'Unblock'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => remove(u)}>Delete</button>
                        </div>
                      </td>
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

export default ManageUsers;
