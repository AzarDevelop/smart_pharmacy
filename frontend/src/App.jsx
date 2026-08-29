import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Public
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import SearchMedicines from './pages/public/SearchMedicines';
import MedicineDetails from './pages/public/MedicineDetails';
import NearbyPharmacies from './pages/public/NearbyPharmacies';
import NotFound from './pages/public/NotFound';

// User
import UserDashboard from './pages/user/UserDashboard';
import Reservations from './pages/user/Reservations';
import Notifications from './pages/user/Notifications';
import Profile from './pages/user/Profile';

// Pharmacy
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import Inventory from './pages/pharmacy/Inventory';
import AddMedicine from './pages/pharmacy/AddMedicine';
import EditMedicine from './pages/pharmacy/EditMedicine';
import LowStock from './pages/pharmacy/LowStock';
import PharmacyReservations from './pages/pharmacy/PharmacyReservations';
import PharmacyProfile from './pages/pharmacy/PharmacyProfile';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManagePharmacies from './pages/admin/ManagePharmacies';
import ManageMedicines from './pages/admin/ManageMedicines';
import ManageCategories from './pages/admin/ManageCategories';
import ManageReservations from './pages/admin/ManageReservations';

const App = () => (
  <div className="app">
    <Navbar />

    <Routes>
      {/* ---------- public ---------- */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/search" element={<SearchMedicines />} />
      <Route path="/medicine/:id" element={<MedicineDetails />} />
      <Route path="/pharmacies" element={<NearbyPharmacies />} />

      {/* ---------- user ---------- */}
      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute allow={['user']}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/reservations"
        element={
          <ProtectedRoute allow={['user']}>
            <Reservations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/notifications"
        element={
          <ProtectedRoute allow={['user']}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/profile"
        element={
          <ProtectedRoute allow={['user']}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* ---------- pharmacy ---------- */}
      <Route
        path="/pharmacy/dashboard"
        element={
          <ProtectedRoute allow={['pharmacy']}>
            <PharmacyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacy/inventory"
        element={
          <ProtectedRoute allow={['pharmacy']}>
            <Inventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacy/inventory/add"
        element={
          <ProtectedRoute allow={['pharmacy']}>
            <AddMedicine />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacy/inventory/edit/:id"
        element={
          <ProtectedRoute allow={['pharmacy']}>
            <EditMedicine />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacy/low-stock"
        element={
          <ProtectedRoute allow={['pharmacy']}>
            <LowStock />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacy/reservations"
        element={
          <ProtectedRoute allow={['pharmacy']}>
            <PharmacyReservations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pharmacy/profile"
        element={
          <ProtectedRoute allow={['pharmacy']}>
            <PharmacyProfile />
          </ProtectedRoute>
        }
      />

      {/* ---------- admin ---------- */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allow={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allow={['admin']}>
            <ManageUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pharmacies"
        element={
          <ProtectedRoute allow={['admin']}>
            <ManagePharmacies />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/medicines"
        element={
          <ProtectedRoute allow={['admin']}>
            <ManageMedicines />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute allow={['admin']}>
            <ManageCategories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reservations"
        element={
          <ProtectedRoute allow={['admin']}>
            <ManageReservations />
          </ProtectedRoute>
        }
      />

      <Route path="/dashboard" element={<Navigate to="/user/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>

    <footer className="footer">
      Smart Pharmacy Availability Check System · MCA Mini Project · MERN + JWT
    </footer>
  </div>
);

export default App;
