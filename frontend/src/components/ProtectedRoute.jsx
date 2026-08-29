import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

// Blocks a route unless the visitor is logged in with one of the allowed roles
const ProtectedRoute = ({ allow = [], children }) => {
  const { user, loading, homeFor } = useAuth();
  const location = useLocation();

  if (loading) return <Loader text="Checking your session" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (allow.length && !allow.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;

  return children;
};

export default ProtectedRoute;
