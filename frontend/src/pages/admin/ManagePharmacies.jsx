import { useEffect, useState } from 'react';
import api, { getError } from '../../api/axios';
import Loader from '../../components/Loader';
import { StatusPill } from '../../components/StockPill';

const ManagePharmacies = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/pharmacies', { params: { search, all: 1 } });
      setPharmacies(data.pharmacies);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const toggle = async (p) => {
    const status = p.status === 'active' ? 'blocked' : 'active';
    try {
      await api.put(`/pharmacies/${p._id}/status`, { status });
      setMessage(`${p.name} is now ${status}.`);
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
          <h1>Manage pharmacies</h1>
          <p>Blocked pharmacies disappear from search results and cannot take reservations.</p>
        </div>
      </div>

      <form className="filters" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input className="input" placeholder="Search by name, area or city" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                <tr><th>Pharmacy</th><th>Licence</th><th>Contact</th><th>Location</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {pharmacies.length === 0 ? (
                  <tr><td colSpan="6" className="muted">No pharmacies found.</td></tr>
                ) : (
                  pharmacies.map((p) => (
                    <tr key={p._id}>
                      <td><b>{p.name}</b><div className="small muted">{p.openingHours}</div></td>
                      <td className="mono small">{p.licenseNumber}</td>
                      <td className="small">{p.phone}<div className="muted mono">{p.email}</div></td>
                      <td className="small">
                        {p.address}, {p.city}
                        <div className="mono muted">
                          {p.location?.coordinates?.[1]?.toFixed(4)}, {p.location?.coordinates?.[0]?.toFixed(4)}
                        </div>
                      </td>
                      <td><StatusPill status={p.status} /></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggle(p)}>
                          {p.status === 'active' ? 'Block' : 'Unblock'}
                        </button>
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

export default ManagePharmacies;
