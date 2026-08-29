import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getError } from '../../api/axios';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';

const SearchMedicines = () => {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState({ medicines: [], total: 0, pages: 1, matchType: 'all' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/medicines', {
        params: { search: params.get('q') || '', category: params.get('category') || '', page, limit: 12 },
      });
      setData(data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, [params, page]);

  useEffect(() => { load(); }, [load]);

  const submit = (e) => {
    e.preventDefault();
    setPage(1);
    const next = {};
    if (query.trim()) next.q = query.trim();
    if (category) next.category = category;
    setParams(next);
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Search</p>
          <h1>Find a medicine</h1>
          <p>Search by medicine name, brand name or generic name.</p>
        </div>
      </div>

      <form className="card" onSubmit={submit} style={{ marginBottom: 20 }}>
        <div className="searchbar">
          <input
            className="input"
            placeholder="e.g. Dolo, Paracetamol, Acetaminophen"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search medicines"
          />
          <select className="select" style={{ width: 'auto' }} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <button className="btn btn-primary">Search</button>
        </div>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {data.matchType === 'fuzzy' && !loading && (
        <div className="alert alert-info">
          No exact match for "{params.get('q')}". Showing the closest medicine names instead.
        </div>
      )}

      {loading ? (
        <Loader text="Checking pharmacies" />
      ) : data.medicines.length === 0 ? (
        <EmptyState
          title="No medicine matched that name"
          message="Try the generic name (for example Acetaminophen instead of Dolo), or a shorter word."
        />
      ) : (
        <>
          <p className="mono small muted">
            {data.total} result{data.total === 1 ? '' : 's'} · page {data.page} of {data.pages}
          </p>
          <div className="list">
            {data.medicines.map((m) => (
              <article key={m._id} className="label-card">
                <div className="row-between">
                  <div>
                    <h3 style={{ marginBottom: 2 }}>
                      {m.name} {m.strength}
                    </h3>
                    <p className="small muted" style={{ margin: 0 }}>
                      {m.brandName && `${m.brandName} · `}
                      {m.genericName} · {m.dosageForm}
                      {m.category?.name ? ` · ${m.category.name}` : ''}
                    </p>
                  </div>
                  <div className="tag-row">
                    {m.prescriptionRequired && <span className="pill pill-neutral">Rx only</span>}
                    {m.availability.available ? (
                      <span className="pill pill-ok">
                        {m.availability.pharmacyCount} pharmac{m.availability.pharmacyCount === 1 ? 'y' : 'ies'}
                      </span>
                    ) : (
                      <span className="pill pill-bad">Not in stock anywhere</span>
                    )}
                  </div>
                </div>

                <div className="label-row">
                  {m.availability.available && (
                    <>
                      <span>
                        FROM <b>₹{m.availability.minPrice?.toFixed(2)}</b>
                      </span>
                      <span>
                        TO <b>₹{m.availability.maxPrice?.toFixed(2)}</b>
                      </span>
                      <span>
                        UNITS AVAILABLE <b>{m.availability.totalStock}</b>
                      </span>
                    </>
                  )}
                  <Link to={`/medicine/${m._id}`}>See pharmacy-wise stock →</Link>
                </div>
              </article>
            ))}
          </div>

          {data.pages > 1 && (
            <div className="tag-row" style={{ marginTop: 20, justifyContent: 'center' }}>
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span className="mono small">{page} / {data.pages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default SearchMedicines;
