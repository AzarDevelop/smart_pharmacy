import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="page">
    <div className="empty">
      <p className="eyebrow">Error 404</p>
      <h1>That page does not exist</h1>
      <p className="muted">The link may be old, or the address was typed differently.</p>
      <Link to="/" className="btn btn-primary">Go to home</Link>
    </div>
  </div>
);

export default NotFound;
