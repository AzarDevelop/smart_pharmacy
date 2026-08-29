import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import SearchMedicine from './pages/SearchMedicine';
import CustomerChat from './pages/CustomerChat';
import Reservations from './pages/Reservations';
import PharmacyDashboard from './pages/PharmacyDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<SearchMedicine />} />
          <Route path="/chat" element={<CustomerChat />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reservations" element={
            <ProtectedRoute><Reservations /></ProtectedRoute>
          } />
          <Route path="/pharmacy" element={
            <ProtectedRoute roles={['pharmacy', 'admin']}><PharmacyDashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

