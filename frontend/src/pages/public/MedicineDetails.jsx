import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getError } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import StockPill from '../../components/StockPill';

const MedicineDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [medicine, setMedicine] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reserving, setReserving] = useState(null); // inventory row being reserved
  const [quantity, setQuantity] = useState(1);

  const load = async (position) => {
    try {
      const { data } = await api.get(`/medicines/${id}`, {
        params: position ? { lat: position.lat, lng: position.lng } : {},
      });
      setMedicine(data.medicine);
      setAvailability(data.availability);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Ask for the location once so distances can be shown
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(c);
          load(c);
        },
        () => load(null),
        { timeout: 5000 }
      );
    } else load(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const reserve = async (row) => {
    setMessage('');
    setError('');
    if (!user) return navigate('/login', { state: { from: `/medicine/${id}` } });
    if (user.role !== 'user') return setError('Only customer accounts can reserve medicines.');

    try {
      const { data } = await api.post('/reservations', { inventoryId: row._id, quantity: Number(quantity) });
      setMessage(`Reserved. Show code ${data.reservation.code} at ${row.pharmacy.name}.`);
      setReserving(null);
      setQuantity(1);
      load(coords);
    } catch (err) {
      setError(getError(err));
    }
  };

  if (loading) return <Loader text="Loading medicine" />;
  if (!medicine) return <main className="page"><div className="alert alert-error">{error || 'Medicine not found'}</div></main>;

  const inStock = availability.filter((a) => a.stock > 0);
  const cheapest = inStock[0];

  return (
    <main className="page">
      <p className="small"><Link to="/search">← Back to search</Link></p>

      <div className="page-head">
        <div>
          <p className="eyebrow">{medicine.category?.name || 'Medicine'}</p>
          <h1>{medicine.name} {medicine.strength}</h1>
          <p>
            {medicine.brandName && <>Brand: <b>{medicine.brandName}</b> · </>}
            Generic: <b>{medicine.genericName || '—'}</b> · {medicine.dosageForm}
            {medicine.manufacturer && <> · {medicine.manufacturer}</>}
          </p>
        </div>
        <div className="tag-row">
          {medicine.prescriptionRequired ? (
            <span className="pill pill-warn">Prescription required</span>
          ) : (
            <span className="pill pill-ok">Over the counter</span>
          )}
        </div>
      </div>

      {message && <div className="alert alert-ok">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {medicine.description && (
        <div className="card">
          <h3>About this medicine</h3>
          <p className="muted" style={{ margin: 0 }}>{medicine.description}</p>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          <h2>Availability at pharmacies</h2>
          <span className="mono small muted">
            {inStock.length} of {availability.length} pharmacies have stock
            {cheapest && ` · lowest ₹${cheapest.price.toFixed(2)}`}
          </span>
        </div>

        {availability.length === 0 ? (
          <p className="muted">No pharmacy has listed this medicine yet.</p>
        ) : (
          <div className="list">
            {availability.map((row) => (
              <div key={row._id} className="label-card">
                <div className="row-between">
                  <div>
                    <h3 style={{ marginBottom: 2 }}>{row.pharmacy.name}</h3>
                    <p className="small muted" style={{ margin: 0 }}>
                      {row.pharmacy.address}, {row.pharmacy.city} · {row.pharmacy.phone}
                    </p>
                  </div>
                  <div className="tag-row">
                    <StockPill stock={row.stock} limit={row.lowStockLimit} />
                    <span className="price">₹{row.price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="label-row">
                  <span>HOURS <b>{row.pharmacy.openingHours}</b></span>
                  {row.distanceKm != null && <span>DISTANCE <b>{row.distanceKm} km</b></span>}
                  {row.batchNumber && <span>BATCH <b>{row.batchNumber}</b></span>}
                  {row.expiryDate && (
                    <span>EXPIRY <b>{new Date(row.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</b></span>
                  )}
                </div>

                {row.stock > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {reserving === row._id ? (
                      <div className="tag-row">
                        <input
                          className="input mono"
                          style={{ width: 90 }}
                          type="number"
                          min="1"
                          max={row.stock}
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          aria-label="Quantity"
                        />
                        <span className="small muted">
                          Total ₹{(row.price * (Number(quantity) || 0)).toFixed(2)}
                        </span>
                        <button className="btn btn-primary btn-sm" onClick={() => reserve(row)}>
                          Confirm reservation
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setReserving(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setReserving(row._id); setQuantity(1); }}
                      >
                        Reserve for pickup
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default MedicineDetails;
