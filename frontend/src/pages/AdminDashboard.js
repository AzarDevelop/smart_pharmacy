import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../api/api';
import Spinner, { LoadingState } from '../components/Spinner';

const TABS = ['Overview', 'Medicines Catalogue', 'Pharmacies', 'Users'];

const COMMON_CATEGORIES = [
  'Pain Relief',
  'Antibiotic',
  'Antihistamine',
  'Antacid',
  'Diabetes',
  'Cardiovascular',
  'Supplement',
  'Dermatology',
  'Respiratory',
  'General'
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [overview, setOverview] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ message: '', type: 'success' });

  // Modal / Form state for Medicines
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [medicineForm, setMedicineForm] = useState({
    name: '',
    generic_name: '',
    category: '',
    manufacturer: '',
    description: '',
    requires_prescription: false
  });
  const [savingMedicine, setSavingMedicine] = useState(false);

  // Pharmacy Stock Inspector Modal State
  const [inspectingPharmacy, setInspectingPharmacy] = useState(null);
  const [pharmacyStock, setPharmacyStock] = useState([]);
  const [loadingPharmacyStock, setLoadingPharmacyStock] = useState(false);

  // Filters & Search
  const [medicineSearch, setMedicineSearch] = useState('');
  const [medicineCategoryFilter, setMedicineCategoryFilter] = useState('ALL');
  const [medicineRxFilter, setMedicineRxFilter] = useState('ALL');

  const [pharmacySearch, setPharmacySearch] = useState('');
  const [pharmacyStatusFilter, setPharmacyStatusFilter] = useState('ALL');

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  const showNotification = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: 'success' }), 4000);
  };

  const handleInspectPharmacyStock = async (pharmacy) => {
    setInspectingPharmacy(pharmacy);
    setLoadingPharmacyStock(true);
    try {
      const { data } = await api.get(`/pharmacy/${pharmacy.pharmacy_id}/inventory`);
      setPharmacyStock(data || []);
    } catch (err) {
      console.error(err);
      showNotification('Could not load inventory for this pharmacy.', 'error');
    } finally {
      setLoadingPharmacyStock(false);
    }
  };

  const exportCatalogueCSV = () => {
    if (medicines.length === 0) {
      showNotification('No medicines available to export.', 'error');
      return;
    }
    const headers = ['ID', 'Name', 'Generic Name', 'Category', 'Manufacturer', 'Requires Prescription', 'Pharmacy Count', 'Total Stock'];
    const rows = medicines.map((m) => [
      m.medicine_id,
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${(m.generic_name || '').replace(/"/g, '""')}"`,
      `"${(m.category || '').replace(/"/g, '""')}"`,
      `"${(m.manufacturer || '').replace(/"/g, '""')}"`,
      m.requires_prescription ? 'Yes' : 'No',
      m.pharmacy_count || 0,
      m.total_stock || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medicines_catalogue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Catalogue exported to CSV successfully.');
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, usersRes, pharmaciesRes, medsRes] = await Promise.all([
        api.get('/admin/reports/overview').catch(() => ({ data: null })),
        api.get('/admin/users').catch(() => ({ data: [] })),
        api.get('/admin/pharmacies').catch(() => ({ data: [] })),
        api.get('/admin/medicines').catch(() => api.get('/medicines'))
      ]);

      setOverview(overviewRes.data);
      setUsers(usersRes.data || []);
      setPharmacies(pharmaciesRes.data || []);
      setMedicines(medsRes.data || []);
    } catch (e) {
      console.error('Failed to load admin data:', e);
      showNotification('Failed to load dashboard data. Check backend connection.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pharmacy actions
  const verifyPharmacy = async (id) => {
    try {
      await api.patch(`/admin/pharmacies/${id}/verify`);
      showNotification('Pharmacy verified successfully.');
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error verifying pharmacy', 'error');
    }
  };

  const unverifyPharmacy = async (id) => {
    try {
      await api.patch(`/admin/pharmacies/${id}/unverify`);
      showNotification('Pharmacy unverified.');
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error updating pharmacy', 'error');
    }
  };

  const deletePharmacy = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently remove pharmacy "${name}"?`)) return;
    try {
      await api.delete(`/admin/pharmacies/${id}`);
      showNotification(`Pharmacy "${name}" removed.`);
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error deleting pharmacy', 'error');
    }
  };

  // User actions
  const removeUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove user "${name}"?`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      showNotification(`User "${name}" removed.`);
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error deleting user', 'error');
    }
  };

  // Medicine Actions
  const openAddMedicineModal = () => {
    setEditingMedicine(null);
    setMedicineForm({
      name: '',
      generic_name: '',
      category: 'General',
      manufacturer: '',
      description: '',
      requires_prescription: false
    });
    setIsMedicineModalOpen(true);
  };

  const openEditMedicineModal = (med) => {
    setEditingMedicine(med);
    setMedicineForm({
      name: med.name || '',
      generic_name: med.generic_name || '',
      category: med.category || 'General',
      manufacturer: med.manufacturer || '',
      description: med.description || '',
      requires_prescription: Boolean(med.requires_prescription)
    });
    setIsMedicineModalOpen(true);
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    if (!medicineForm.name.trim()) {
      showNotification('Please enter medicine name.', 'error');
      return;
    }

    setSavingMedicine(true);
    try {
      if (editingMedicine) {
        await api.put(`/admin/medicines/${editingMedicine.medicine_id}`, medicineForm);
        showNotification(`Medicine "${medicineForm.name}" updated successfully.`);
      } else {
        await api.post('/admin/medicines', medicineForm);
        showNotification(`Medicine "${medicineForm.name}" added to catalogue.`);
      }
      setIsMedicineModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      showNotification(err.response?.data?.message || 'Failed to save medicine.', 'error');
    } finally {
      setSavingMedicine(false);
    }
  };

  const handleDeleteMedicine = async (med) => {
    if (!window.confirm(`Are you sure you want to delete "${med.name}" from the catalogue? This will also remove it from any linked pharmacy stocks.`)) {
      return;
    }
    try {
      await api.delete(`/admin/medicines/${med.medicine_id}`);
      showNotification(`Medicine "${med.name}" deleted.`);
      loadData();
    } catch (err) {
      console.error(err);
      showNotification(err.response?.data?.message || 'Failed to delete medicine.', 'error');
    }
  };

  // Filtered lists
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const q = medicineSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.generic_name && m.generic_name.toLowerCase().includes(q)) ||
        (m.category && m.category.toLowerCase().includes(q)) ||
        (m.manufacturer && m.manufacturer.toLowerCase().includes(q));

      const matchesCategory =
        medicineCategoryFilter === 'ALL' ||
        (m.category && m.category.toLowerCase() === medicineCategoryFilter.toLowerCase());

      const matchesRx =
        medicineRxFilter === 'ALL' ||
        (medicineRxFilter === 'RX' && m.requires_prescription) ||
        (medicineRxFilter === 'OTC' && !m.requires_prescription);

      return matchesSearch && matchesCategory && matchesRx;
    });
  }, [medicines, medicineSearch, medicineCategoryFilter, medicineRxFilter]);

  const filteredPharmacies = useMemo(() => {
    return pharmacies.filter((p) => {
      const q = pharmacySearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.owner_name && p.owner_name.toLowerCase().includes(q));

      const matchesStatus =
        pharmacyStatusFilter === 'ALL' ||
        (pharmacyStatusFilter === 'VERIFIED' && p.is_verified) ||
        (pharmacyStatusFilter === 'PENDING' && !p.is_verified);

      return matchesSearch && matchesStatus;
    });
  }, [pharmacies, pharmacySearch, pharmacyStatusFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));

      const matchesRole =
        userRoleFilter === 'ALL' ||
        (u.role && u.role.toLowerCase() === userRoleFilter.toLowerCase());

      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  if (loading && !overview && medicines.length === 0) {
    return (
      <div className="page container">
        <LoadingState text="Loading administrative dashboard…" />
      </div>
    );
  }

  const pendingPharmaciesCount = pharmacies.filter((p) => !p.is_verified).length;

  return (
    <div className="page container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2>Admin Control Center</h2>
            <span className="badge badge-amber" style={{ fontSize: 11 }}>SYSTEM ADMIN</span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: '4px 0 0' }}>
            Manage medicine catalogue, verify pharmacies, oversee registered users, and monitor system metrics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
            {loading ? <Spinner size="sm" label="Refreshing…" /> : '🔄 Refresh Data'}
          </button>
          <button className="btn btn-primary" onClick={openAddMedicineModal}>
            ➕ Add Medicine
          </button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedback.message && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            fontSize: 14,
            fontWeight: 500,
            backgroundColor: feedback.type === 'error' ? '#FCE9E9' : '#E3F2EF',
            color: feedback.type === 'error' ? 'var(--color-red-500)' : 'var(--color-teal-700)',
            border: `1px solid ${feedback.type === 'error' ? '#F6CACA' : '#C1E3DC'}`
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
        {TABS.map((t) => {
          let count = null;
          if (t === 'Medicines Catalogue') count = medicines.length;
          if (t === 'Pharmacies') count = pharmacies.length;
          if (t === 'Users') count = users.length;

          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                color: activeTab === t ? 'var(--color-teal-700)' : 'var(--color-text-muted)',
                borderBottom: activeTab === t ? '3px solid var(--color-teal-700)' : '3px solid transparent'
              }}
            >
              {t}
              {count !== null && (
                <span
                  style={{
                    backgroundColor: activeTab === t ? 'var(--color-teal-100)' : '#EBEFED',
                    color: activeTab === t ? 'var(--color-teal-700)' : 'var(--color-text-muted)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: 12
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW */}
      {/* ======================================================== */}
      {activeTab === 'Overview' && (
        <div>
          {/* Key Metrics */}
          <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 16 }}>
            <Stat label="Total Users" value={overview?.userCount ?? users.length} />
            <Stat
              label="Pharmacies"
              value={overview?.pharmacyCount ?? pharmacies.length}
              subtext={pendingPharmaciesCount > 0 ? `${pendingPharmaciesCount} pending` : 'All verified'}
            />
            <Stat label="Medicines in Catalogue" value={overview?.medicineCount ?? medicines.length} />
            <Stat label="Low Stock Alerts" value={overview?.lowStockCount ?? 0} accent />
          </div>

          {/* User Role Distribution Pills */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28, padding: '12px 20px', background: '#FAFCFB' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-teal-900)' }}>
              👥 User Account Distribution:
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge badge-green" style={{ fontSize: 12, padding: '4px 12px' }}>
                Customers: {users.filter((u) => u.role === 'customer').length}
              </span>
              <span className="badge badge-green" style={{ fontSize: 12, padding: '4px 12px', background: '#E3F2EF', color: 'var(--color-teal-700)' }}>
                Pharmacy Owners: {users.filter((u) => u.role === 'pharmacy').length}
              </span>
              <span className="badge badge-amber" style={{ fontSize: 12, padding: '4px 12px' }}>
                System Admins: {users.filter((u) => u.role === 'admin').length}
              </span>
            </div>
          </div>

          {/* Action Quick Launchers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ marginBottom: 6 }}>💊 Manage Medicine Catalogue</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 14 }}>
                  Add new medications, update dosage or generic information, and remove expired or discontinued drugs.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={openAddMedicineModal} style={{ flex: 1 }}>
                  ➕ Add Medicine
                </button>
                <button className="btn btn-secondary" onClick={() => setActiveTab('Medicines Catalogue')}>
                  View Catalogue
                </button>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ marginBottom: 6 }}>🏥 Pharmacy Verification</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 14 }}>
                  {pendingPharmaciesCount > 0
                    ? `There are ${pendingPharmaciesCount} pharmacies waiting for administrative verification.`
                    : 'All registered pharmacies are currently verified.'}
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setActiveTab('Pharmacies');
                  setPharmacyStatusFilter(pendingPharmaciesCount > 0 ? 'PENDING' : 'ALL');
                }}
              >
                {pendingPharmaciesCount > 0 ? `Review ${pendingPharmaciesCount} Pending` : 'View Pharmacies'}
              </button>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ marginBottom: 6 }}>👥 Registered Accounts</h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 14 }}>
                  Manage customer, pharmacy owner, and system administrator access credentials.
                </p>
              </div>
              <button className="btn btn-secondary" onClick={() => setActiveTab('Users')}>
                Manage Users ({users.length})
              </button>
            </div>
          </div>

          {/* Recent Catalogue Sample */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3>Recently Added Medicines</h3>
              <button className="btn btn-ghost" onClick={() => setActiveTab('Medicines Catalogue')}>
                View all ({medicines.length}) →
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
              {medicines.slice(0, 4).map((m) => (
                <div key={m.medicine_id} className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <strong style={{ fontSize: 15, color: 'var(--color-teal-900)' }}>{m.name}</strong>
                    <span className={`badge ${m.requires_prescription ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 10 }}>
                      {m.requires_prescription ? 'Rx' : 'OTC'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                    {m.generic_name || 'No generic'} · {m.category || 'General'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-teal-700)' }}>
                    Manufacturer: {m.manufacturer || 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MEDICINES CATALOGUE (ADMIN CRUD) */}
      {/* ======================================================== */}
      {activeTab === 'Medicines Catalogue' && (
        <div>
          {/* Controls Bar */}
          <div className="card" style={{ marginBottom: 20, padding: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1, minWidth: 280 }}>
                {/* Search */}
                <input
                  className="input"
                  style={{ minWidth: 200, flex: 2 }}
                  placeholder="🔍 Search medicine, generic name, category..."
                  value={medicineSearch}
                  onChange={(e) => setMedicineSearch(e.target.value)}
                />

                {/* Category Filter */}
                <select
                  className="input"
                  style={{ minWidth: 150, flex: 1 }}
                  value={medicineCategoryFilter}
                  onChange={(e) => setMedicineCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {COMMON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Rx Filter */}
                <select
                  className="input"
                  style={{ minWidth: 130, flex: 1 }}
                  value={medicineRxFilter}
                  onChange={(e) => setMedicineRxFilter(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  <option value="OTC">OTC (No Rx)</option>
                  <option value="RX">Prescription (Rx)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  onClick={exportCatalogueCSV}
                  style={{ whiteSpace: 'nowrap' }}
                  title="Download full master catalogue in CSV format"
                >
                  📥 Export CSV
                </button>
                <button className="btn btn-primary" onClick={openAddMedicineModal} style={{ whiteSpace: 'nowrap' }}>
                  ➕ Add New Medicine
                </button>
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-text-muted)' }}>
              Showing {filteredMedicines.length} of {medicines.length} catalogue medicines
            </div>
          </div>

          {/* Medicines Grid / List */}
          {filteredMedicines.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>💊</div>
              <h4>No medicines found</h4>
              <p style={{ margin: '6px 0 16px', fontSize: 14 }}>
                {medicineSearch || medicineCategoryFilter !== 'ALL' || medicineRxFilter !== 'ALL'
                  ? 'Try adjusting your search or category filters.'
                  : 'Get started by adding your first medicine into the system catalogue.'}
              </p>
              <button className="btn btn-primary" onClick={openAddMedicineModal}>
                ➕ Add Medicine
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {filteredMedicines.map((m) => (
                <div
                  key={m.medicine_id}
                  className="card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 14,
                    padding: '16px 20px'
                  }}
                >
                  <div style={{ flex: '1 1 320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 16, color: 'var(--color-teal-900)' }}>{m.name}</strong>
                      <span className={`badge ${m.requires_prescription ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 11 }}>
                        {m.requires_prescription ? 'Prescription Required (Rx)' : 'OTC'}
                      </span>
                      {m.category && (
                        <span style={{ fontSize: 12, backgroundColor: '#EFF3F2', color: '#3A524D', padding: '2px 8px', borderRadius: 6, fontWeight: 500 }}>
                          {m.category}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4, flexWrap: 'wrap' }}>
                      {m.generic_name && <span>Generic: <strong>{m.generic_name}</strong></span>}
                      {m.manufacturer && <span>Manufacturer: <strong>{m.manufacturer}</strong></span>}
                    </div>

                    {m.description && (
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: '#445350' }}>{m.description}</p>
                    )}

                    {/* Stocking pharmacies info */}
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: 'var(--color-teal-700)' }}>
                      <span>🏥 In {m.pharmacy_count || 0} pharmacies</span>
                      <span>📦 Total units in stock: {m.total_stock || 0}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => openEditMedicineModal(m)} style={{ padding: '8px 14px', fontSize: 13 }}>
                      ✏️ Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => handleDeleteMedicine(m)} style={{ padding: '8px 14px', fontSize: 13 }}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PHARMACIES */}
      {/* ======================================================== */}
      {activeTab === 'Pharmacies' && (
        <div>
          {/* Pharmacy Filters */}
          <div className="card" style={{ marginBottom: 20, padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              className="input"
              style={{ minWidth: 240, flex: 2 }}
              placeholder="🔍 Search pharmacy name, city, owner..."
              value={pharmacySearch}
              onChange={(e) => setPharmacySearch(e.target.value)}
            />
            <select
              className="input"
              style={{ minWidth: 160, flex: 1 }}
              value={pharmacyStatusFilter}
              onChange={(e) => setPharmacyStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="PENDING">Pending Verification</option>
            </select>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {filteredPharmacies.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                No pharmacies match the filter criteria.
              </div>
            ) : (
              filteredPharmacies.map((p) => (
                <div
                  key={p.pharmacy_id}
                  className="card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <strong style={{ fontSize: 16 }}>{p.name}</strong>
                      <span className={`badge ${p.is_verified ? 'badge-green' : 'badge-amber'}`}>
                        {p.is_verified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                      📍 {p.address}, {p.city} {p.phone ? `· 📞 ${p.phone}` : ''}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-teal-700)' }}>
                      👤 Owner: {p.owner_name} ({p.owner_email})
                      {p.latitude && p.longitude && ` · GPS: (${p.latitude}, ${p.longitude})`}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleInspectPharmacyStock(p)}
                      title="Inspect live inventory and pricing for this pharmacy"
                    >
                      📦 View Stock
                    </button>
                    {!p.is_verified ? (
                      <button className="btn btn-primary" onClick={() => verifyPharmacy(p.pharmacy_id)}>
                        ✅ Verify
                      </button>
                    ) : (
                      <button className="btn btn-secondary" onClick={() => unverifyPharmacy(p.pharmacy_id)}>
                        Unverify
                      </button>
                    )}
                    <button className="btn btn-danger" onClick={() => deletePharmacy(p.pharmacy_id, p.name)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: USERS */}
      {/* ======================================================== */}
      {activeTab === 'Users' && (
        <div>
          {/* User Filters */}
          <div className="card" style={{ marginBottom: 20, padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              className="input"
              style={{ minWidth: 240, flex: 2 }}
              placeholder="🔍 Search user name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            <select
              className="input"
              style={{ minWidth: 160, flex: 1 }}
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="PHARMACY">Pharmacy Owner</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {filteredUsers.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                No users match the search.
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.user_id}
                  className="card"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 15 }}>{u.name}</strong>
                      <span
                        className={`badge ${
                          u.role === 'admin'
                            ? 'badge-amber'
                            : u.role === 'pharmacy'
                            ? 'badge-green'
                            : 'badge-secondary'
                        }`}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {u.role}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                      ✉️ {u.email} {u.phone ? `· 📞 ${u.phone}` : ''}
                      {u.created_at && ` · Joined: ${new Date(u.created_at).toLocaleDateString()}`}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      className="btn btn-danger"
                      onClick={() => removeUser(u.user_id, u.name)}
                      disabled={u.role === 'admin'}
                      title={u.role === 'admin' ? 'Cannot remove administrator' : 'Remove user'}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT MEDICINE */}
      {/* ======================================================== */}
      {isMedicineModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 59, 54, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMedicineModalOpen(false);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 540,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>
                {editingMedicine ? '✏️ Edit Medicine' : '➕ Add New Medicine to Catalogue'}
              </h3>
              <button
                onClick={() => setIsMedicineModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMedicine}>
              {/* Medicine Name */}
              <div style={{ marginBottom: 14 }}>
                <label className="label">
                  Medicine Name & Dosage *
                </label>
                <input
                  className="input"
                  required
                  placeholder="e.g. Paracetamol 650mg, Augmentin 625 Duo"
                  value={medicineForm.name}
                  onChange={(e) => setMedicineForm({ ...medicineForm, name: e.target.value })}
                />
              </div>

              {/* Generic Name */}
              <div style={{ marginBottom: 14 }}>
                <label className="label">Generic Name / Composition</label>
                <input
                  className="input"
                  placeholder="e.g. Acetaminophen, Amoxicillin + Clavulanic Acid"
                  value={medicineForm.generic_name}
                  onChange={(e) => setMedicineForm({ ...medicineForm, generic_name: e.target.value })}
                />
              </div>

              {/* Category */}
              <div style={{ marginBottom: 14 }}>
                <label className="label">Therapeutic Category</label>
                <input
                  className="input"
                  placeholder="e.g. Antibiotic, Pain Relief, Antacid"
                  value={medicineForm.category}
                  onChange={(e) => setMedicineForm({ ...medicineForm, category: e.target.value })}
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {COMMON_CATEGORIES.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setMedicineForm({ ...medicineForm, category: c })}
                      style={{
                        background: medicineForm.category === c ? 'var(--color-teal-100)' : '#f0f3f2',
                        color: medicineForm.category === c ? 'var(--color-teal-700)' : 'var(--color-text-muted)',
                        border: 'none',
                        borderRadius: 999,
                        padding: '3px 10px',
                        fontSize: 11,
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manufacturer */}
              <div style={{ marginBottom: 14 }}>
                <label className="label">Manufacturer / Brand</label>
                <input
                  className="input"
                  placeholder="e.g. Cipla, Sun Pharma, GSK, Abbott"
                  value={medicineForm.manufacturer}
                  onChange={(e) => setMedicineForm({ ...medicineForm, manufacturer: e.target.value })}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 14 }}>
                <label className="label">Description / Instructions</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Optional usage indications, dosage notes, or warnings..."
                  value={medicineForm.description}
                  onChange={(e) => setMedicineForm({ ...medicineForm, description: e.target.value })}
                />
              </div>

              {/* Prescription Toggle */}
              <div
                style={{
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  backgroundColor: '#F8FAF9',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <input
                  type="checkbox"
                  id="requires_prescription_cb"
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                  checked={medicineForm.requires_prescription}
                  onChange={(e) => setMedicineForm({ ...medicineForm, requires_prescription: e.target.checked })}
                />
                <label htmlFor="requires_prescription_cb" style={{ cursor: 'pointer', fontSize: 13, userSelect: 'none' }}>
                  <strong>Requires Doctor's Prescription (Rx)</strong>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                    If enabled, customers will be notified to produce a valid prescription during pickup.
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsMedicineModalOpen(false)}
                  disabled={savingMedicine}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingMedicine}>
                  {savingMedicine ? (
                    <Spinner size="sm" label={editingMedicine ? 'Updating…' : 'Saving…'} />
                  ) : editingMedicine ? (
                    'Update Medicine'
                  ) : (
                    'Save to Catalogue'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PHARMACY STOCK INSPECTOR */}
      {/* ======================================================== */}
      {inspectingPharmacy && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 59, 54, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectingPharmacy(null);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 680,
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0 }}>📦 {inspectingPharmacy.name} — Live Stock</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {inspectingPharmacy.address}, {inspectingPharmacy.city} · Owner: {inspectingPharmacy.owner_name}
                </p>
              </div>
              <button
                onClick={() => setInspectingPharmacy(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)'
                }}
              >
                ✕
              </button>
            </div>

            {loadingPharmacyStock ? (
              <LoadingState text="Loading pharmacy inventory records…" />
            ) : pharmacyStock.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--color-text-muted)' }}>
                This pharmacy has not added any medicines to its inventory yet.
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                  Total {pharmacyStock.length} medicines stocked
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {pharmacyStock.map((it) => (
                    <div
                      key={it.stock_id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        backgroundColor: '#F8FAF9',
                        borderRadius: 8,
                        border: '1px solid var(--color-border)',
                        flexWrap: 'wrap',
                        gap: 10
                      }}
                    >
                      <div>
                        <strong>{it.name}</strong>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                          {it.generic_name} {it.category ? `· ${it.category}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span className="badge badge-green">₹{it.price}</span>
                        <span className={`badge ${it.quantity <= it.low_stock_threshold ? 'badge-amber' : 'badge-green'}`}>
                          {it.quantity} units {it.quantity <= it.low_stock_threshold ? '(Low)' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setInspectingPharmacy(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, subtext, accent }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: accent ? 'var(--color-amber-500)' : 'var(--color-teal-900)'
        }}
      >
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{subtext}</div>
      )}
    </div>
  );
}
