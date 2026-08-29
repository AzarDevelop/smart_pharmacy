import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const linksFor = (role) => {
  if (role === 'admin')
    return [
      ['/admin/dashboard', 'Dashboard'],
      ['/admin/users', 'Users'],
      ['/admin/pharmacies', 'Pharmacies'],
      ['/admin/medicines', 'Medicines'],
      ['/admin/categories', 'Categories'],
      ['/admin/reservations', 'Reservations'],
    ];
  if (role === 'pharmacy')
    return [
      ['/pharmacy/dashboard', 'Dashboard'],
      ['/pharmacy/inventory', 'Inventory'],
      ['/pharmacy/low-stock', 'Low stock'],
      ['/pharmacy/reservations', 'Reservations'],
      ['/pharmacy/profile', 'Profile'],
    ];
  if (role === 'user')
    return [
      ['/user/dashboard', 'Dashboard'],
      ['/search', 'Search medicines'],
      ['/pharmacies', 'Nearby pharmacies'],
      ['/user/reservations', 'Reservations'],
      ['/user/profile', 'Profile'],
    ];
  return [
    ['/search', 'Search medicines'],
    ['/pharmacies', 'Pharmacies'],
  ];
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return setUnread(0);
    api
      .get('/notifications')
      .then(({ data }) => setUnread(data.unread))
      .catch(() => setUnread(0));
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">Rx</span>
          Smart Pharmacy
        </Link>

        <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          Menu
        </button>

        <div className={`nav-links ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
          {linksFor(user?.role).map(([to, label]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {label}
            </NavLink>
          ))}

          {user ? (
            <>
              <NavLink
                to={user.role === 'user' ? '/user/notifications' : '/notifications'}
                className="bell"
                title="Notifications"
              >
                Alerts
                {unread > 0 && <span className="bell-dot">{unread}</span>}
              </NavLink>
              <span className="nav-role">{user.role}</span>
              <button className="btn btn-sm btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <Link to="/register" className="btn btn-sm btn-primary">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
