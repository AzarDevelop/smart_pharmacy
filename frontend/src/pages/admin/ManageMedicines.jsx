import { useEffect, useState } from 'react';
import api, { getError } from '../../api/axios';
import Loader from '../../components/Loader';

const BLANK = {
  name: '', brandName: '', genericName: '', manufacturer: '', category: '',
  strength: '', dosageForm: 'Tablet', prescriptionRequired: false, description: '',
};

const ManageMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async (p = page) => {
    setLoading(true);
    try {
      const { data } = await api.get('/medicines', { params: { search, page: p, limit: 20 } });
      setMedicines(data.medicines);
      setPages(data.pages);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); /* eslint-disable-next-line */ }, [page]);
  useEffect(() => { api.get('/categories').then(({ data }) => setCategories(data.categories)); }, []);

  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    const payload = { ...form, category: form.category || undefined };
    try {
      if (editingId) {
        await api.put(`/medicines/${editingId}`, payload);
        setMessage('Medicine updated.');
      } else {
        await api.post('/medicines', payload);
        setMessage('Medicine added to the catalogue.');
      }
      setForm(BLANK);
      setEditingId(null);
      load(page);
    } catch (err) {
      setError(getError(err));
    }
  };

  const edit = (m) => {
    setEditingId(m._id);
    setForm({
      name: m.name, brandName: m.brandName || '', genericName: m.genericName || '',
      manufacturer: m.manufacturer || '', category: m.category?._id || '',
      strength: m.strength || '', dosageForm: m.dosageForm || 'Tablet',
      prescriptionRequired: !!m.prescriptionRequired, description: m.description || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (m) => {
    if (!window.confirm(`Delete ${m.name}? It is removed from every pharmacy inventory too.`)) return;
    try {
      await api.delete(`/medicines/${m._id}`);
      setMessage(`${m.name} deleted.`);
      load(page);
    } catch (err) {
      setError(getError(err));
    }
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Medicine catalogue</h1>
          <p>The shared list every pharmacy picks from when adding stock.</p>
        </div>
      </div>

      {message && <div className="alert alert-ok">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h2>{editingId ? 'Edit medicine' : 'Add a medicine'}</h2>
        <form onSubmit={submit}>
          <div className="grid-2">
            <div className="field">
              <label>Name</label>
              <input className="input" required value={form.name} onChange={set('name')} />
            </div>
            <div className="field">
              <label>Strength</label>
              <input className="input" placeholder="500mg" value={form.strength} onChange={set('strength')} />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Brand name</label>
              <input className="input" value={form.brandName} onChange={set('brandName')} />
            </div>
            <div className="field">
              <label>Generic name</label>
              <input className="input" value={form.genericName} onChange={set('genericName')} />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Manufacturer</label>
              <input className="input" value={form.manufacturer} onChange={set('manufacturer')} />
            </div>
            <div className="field">
              <label>Category</label>
              <select className="select" value={form.category} onChange={set('category')}>
                <option value="">Uncategorised</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Dosage form</label>
              <select className="select" value={form.dosageForm} onChange={set('dosageForm')}>
                {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Gel', 'Powder', 'Sachet', 'Drops'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}>
              <input id="rx" type="checkbox" checked={form.prescriptionRequired} onChange={set('prescriptionRequired')} />
              <label htmlFor="rx" style={{ margin: 0 }}>Prescription required</label>
            </div>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea className="textarea" value={form.description} onChange={set('description')} />
          </div>
          <div className="tag-row">
            <button className="btn btn-primary">{editingId ? 'Save changes' : 'Add medicine'}</button>
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm(BLANK); }}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </div>

      <form className="filters" onSubmit={(e) => { e.preventDefault(); setPage(1); load(1); }}>
        <input className="input" placeholder="Search the catalogue" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-ghost btn-sm">Search</button>
      </form>

      {loading ? (
        <Loader />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Medicine</th><th>Generic</th><th>Category</th><th>Form</th><th>Availability</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {medicines.map((m) => (
                  <tr key={m._id}>
                    <td><b>{m.name} {m.strength}</b><div className="small muted">{m.brandName}</div></td>
                    <td className="small">{m.genericName || '—'}</td>
                    <td className="small">{m.category?.name || '—'}</td>
                    <td className="small">{m.dosageForm}</td>
                    <td className="small mono">{m.availability?.pharmacyCount || 0} pharmacies</td>
                    <td>
                      <div className="tag-row">
                        <button className="btn btn-ghost btn-sm" onClick={() => edit(m)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(m)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="tag-row" style={{ marginTop: 14, justifyContent: 'center' }}>
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span className="mono small">{page} / {pages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default ManageMedicines;
