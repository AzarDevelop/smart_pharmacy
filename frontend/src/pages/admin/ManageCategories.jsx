import { useEffect, useState } from 'react';
import api, { getError } from '../../api/axios';
import Loader from '../../components/Loader';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, form);
        setMessage('Category updated.');
      } else {
        await api.post('/categories', form);
        setMessage('Category created.');
      }
      setForm({ name: '', description: '' });
      setEditingId(null);
      load();
    } catch (err) {
      setError(getError(err));
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete the ${c.name} category?`)) return;
    try {
      await api.delete(`/categories/${c._id}`);
      setMessage('Category deleted.');
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
          <h1>Medicine categories</h1>
          <p>Categories power the filter on the customer search page.</p>
        </div>
      </div>

      {message && <div className="alert alert-ok">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <h2>{editingId ? 'Edit category' : 'Add a category'}</h2>
        <form onSubmit={submit}>
          <div className="grid-2">
            <div className="field">
              <label>Name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Description</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="tag-row">
            <button className="btn btn-primary">{editingId ? 'Save changes' : 'Add category'}</button>
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm({ name: '', description: '' }); }}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Category</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id}>
                    <td><b>{c.name}</b></td>
                    <td className="small muted">{c.description || '—'}</td>
                    <td>
                      <div className="tag-row">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => { setEditingId(c._id); setForm({ name: c.name, description: c.description || '' }); }}
                        >
                          Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
};

export default ManageCategories;
