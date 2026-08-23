import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      height: 64, borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)',
      position: 'sticky', top: 0, zIndex: 10
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--color-teal-700)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'var(--font-display)'
          }}>+</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--color-teal-900)' }}>MediFind</span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link to="/" className="btn btn-ghost">Search</Link>
          {user && <Link to="/reservations" className="btn btn-ghost">My Reservations</Link>}
          {user && user.role === 'pharmacy' && <Link to="/pharmacy" className="btn btn-ghost">Pharmacy Dashboard</Link>}
          {user && user.role === 'admin' && <Link to="/admin" className="btn btn-ghost">Admin</Link>}

          {!user && (
            <>
              <Link to="/login" className="btn btn-ghost">Log in</Link>
              <Link to="/register" className="btn btn-primary">Sign up</Link>
            </>
          )}
          {user && (
            <>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 8 }}>Hi, {user.name.split(' ')[0]}</span>
              <button className="btn btn-secondary" onClick={handleLogout}>Log out</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
