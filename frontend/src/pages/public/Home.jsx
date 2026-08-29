import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const SAMPLES = ['Paracetamol', 'Azithromycin', 'Metformin', 'Cetirizine', 'Pantoprazole'];

const Home = () => {
  const [query, setQuery] = useState('');
  const [counts, setCounts] = useState({ medicines: 0, pharmacies: 0 });
  const navigate = useNavigate();

  // Real numbers from the API, not placeholders
  useEffect(() => {
    Promise.all([api.get('/medicines?limit=1'), api.get('/pharmacies')])
      .then(([m, p]) => setCounts({ medicines: m.data.total, pharmacies: p.data.count }))
      .catch(() => {});
  }, []);

  const search = (e) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      <header className="hero">
        <div className="hero-inner">
          <p className="eyebrow" style={{ color: '#7fc9ae' }}>Medicine availability, before you leave home</p>
          <h1>Which pharmacy near you has it in stock?</h1>
          <p>
            Type a medicine name. See the pharmacies that actually have it, what they charge, and
            reserve your strip for pickup.
          </p>

          <form className="searchbar" onSubmit={search} style={{ marginTop: 22, maxWidth: 620 }}>
            <input
              className="input"
              placeholder="Paracetamol, Dolo 650, Amoxicillin..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Medicine name"
            />
            <button className="btn btn-primary" type="submit">
              Check availability
            </button>
          </form>

          <div className="hero-chips">
            {SAMPLES.map((s) => (
              <button key={s} className="chip" onClick={() => navigate(`/search?q=${s}`)}>
                {s}
              </button>
            ))}
          </div>

          <p className="mono" style={{ marginTop: 20, fontSize: '0.82rem', color: '#7fc9ae' }}>
            {counts.medicines} medicines tracked · {counts.pharmacies} pharmacies listed
          </p>
        </div>
      </header>

      <main className="page">
        <section style={{ marginBottom: 42 }}>
          <h2>How it works</h2>
          <div className="how">
            <div className="how-step">
              <div className="num">STEP 01</div>
              <h3>Search</h3>
              <p className="muted small">
                Search by medicine name, brand or generic name. Partial spellings and small typos
                still find the right medicine.
              </p>
            </div>
            <div className="how-step">
              <div className="num">STEP 02</div>
              <h3>Compare</h3>
              <p className="muted small">
                See every pharmacy stocking it, sorted by price, with live stock counts and
                distance from you.
              </p>
            </div>
            <div className="how-step">
              <div className="num">STEP 03</div>
              <h3>Reserve</h3>
              <p className="muted small">
                Hold the quantity you need. You get a pickup code, the pharmacy gets your order.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>Three ways to use it</h2>
          <div className="role-cards">
            <div className="card">
              <h3>Customers</h3>
              <p className="muted small">
                Stop calling shop after shop. Search once, reserve, and pick up.
              </p>
              <Link to="/register" className="btn btn-primary btn-sm">Create an account</Link>
            </div>
            <div className="card">
              <h3>Pharmacies</h3>
              <p className="muted small">
                List your stock, update prices, get low-stock alerts and handle reservations.
              </p>
              <Link to="/register?role=pharmacy" className="btn btn-ghost btn-sm">Register a pharmacy</Link>
            </div>
            <div className="card">
              <h3>Admin</h3>
              <p className="muted small">
                Manage users, pharmacies, the medicine catalogue and monitor system activity.
              </p>
              <Link to="/login" className="btn btn-ghost btn-sm">Admin login</Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;
