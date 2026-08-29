import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getError } from '../../api/axios';
import Loader from '../../components/Loader';

const CHENNAI = { lat: 13.0827, lng: 80.2707 };

const NearbyPharmacies = () => {
  const [pharmacies, setPharmacies] = useState([]);
  const [coords, setCoords] = useState(CHENNAI);
  const [radius, setRadius] = useState(10);
  const [usingMyLocation, setUsingMyLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (position, distance) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/pharmacies/nearby', {
        params: { lat: position.lat, lng: position.lng, distance },
      });
      setPharmacies(data.pharmacies);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(coords, radius); }, [coords, radius]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError('This browser cannot share a location.');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUsingMyLocation(true);
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setError('Location permission denied. Showing results around central Chennai.')
    );
  };

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Pharmacies</p>
          <h1>Pharmacies near you</h1>
          <p>Sorted by distance from {usingMyLocation ? 'your current location' : 'central Chennai'}.</p>
        </div>
        <div className="tag-row">
          <select className="select" style={{ width: 'auto' }} value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            <option value={2}>Within 2 km</option>
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
            <option value={25}>Within 25 km</option>
          </select>
          <button className="btn btn-ghost btn-sm" onClick={useMyLocation}>Use my location</button>
        </div>
      </div>

      {error && <div className="alert alert-info">{error}</div>}
      <p className="mono small muted">
        CENTRE {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)} · RADIUS {radius} km
      </p>

      {loading ? (
        <Loader text="Finding pharmacies" />
      ) : pharmacies.length === 0 ? (
        <div className="empty">
          <h3>No pharmacy within {radius} km</h3>
          <p className="muted">Widen the radius to see more results.</p>
        </div>
      ) : (
        <div className="grid-cards">
          {pharmacies.map((p) => (
            <article key={p._id} className="label-card">
              <div className="row-between">
                <h3 style={{ marginBottom: 0 }}>{p.name}</h3>
                <span className="code-chip">{p.distanceKm} km</span>
              </div>
              <p className="small muted" style={{ margin: '6px 0 0' }}>
                {p.address}, {p.city} {p.pincode}
              </p>
              <div className="label-row">
                <span>PHONE <b>{p.phone}</b></span>
                <span>HOURS <b>{p.openingHours}</b></span>
                <span>MEDICINES IN STOCK <b>{p.medicineCount}</b></span>
              </div>
              <div style={{ marginTop: 10 }}>
                <Link className="btn btn-ghost btn-sm" to={`/search`}>Search a medicine</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};

export default NearbyPharmacies;
