import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import axiosInstance from '../../utils/axiosConfig';
import { API_ENDPOINTS } from '../../config/api';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaUserShield } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const formatRole = (role) => {
  if (!role) return '';
  return role.replace('ROLE_', '').replace(/_/g, ' ');
};

const ManageHR = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchHRs = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.ADMIN.GET_ALL_HR);
      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      setHrs(list);
    } catch (err) {
      console.error('Error fetching HRs:', err);
      setError(err.response?.data?.message || 'Failed to load HRs');
      setHrs([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchHRs();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`${API_ENDPOINTS.ADMIN.DELETE_HR}/${id}`);
      setHrs((prev) => prev.filter((hr) => hr.id !== id));
      await fetchHRs({ silent: true });
      showToast({ type: 'success', title: 'HR removed', message: 'HR account deleted successfully.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Delete failed', message: err.response?.data?.message || 'Failed to delete HR' });
    }
  };

  const roleNames = (roles) =>
    (Array.isArray(roles) ? roles : []).map((r) => (typeof r === 'string' ? r : r?.name || '')).filter(Boolean);

  const isAdmin = roleNames(user?.roles).some((r) => r === 'ROLE_ADMIN') || user?.role === 'ADMIN';
  const isHrManager = roleNames(user?.roles).some((r) => r === 'ROLE_HR_MANAGER');
  const userDepartment = user?.department?.toLowerCase?.() || '';

  const isHrManagerRole = (hr) => roleNames(hr?.roles).some((r) => r === 'ROLE_HR_MANAGER');
  const matchesDepartment = (hrDept, selected) => {
    if (!selected || selected === 'ALL') return true;
    if (!hrDept) return false;
    return hrDept.toLowerCase() === selected.toLowerCase();
  };

  const visibleHRs = hrs.filter((hr) => {
    if (isAdmin) return true;

    const deptOk = userDepartment
      ? hr?.department?.toLowerCase?.() === userDepartment
      : true;

    if (isHrManager) {
      return deptOk;
    }

    return deptOk && isHrManagerRole(hr);
  });

  const filteredHRs = visibleHRs.filter(
    (hr) =>
      matchesDepartment(hr?.department, selectedDepartment) &&
      (hr.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (hr.roles &&
          Array.isArray(hr.roles) &&
          hr.roles.some((r) => r?.toLowerCase().includes(searchTerm.toLowerCase()))))
  );

  const departmentOptions = Array.from(
    new Set(visibleHRs.map((hr) => hr?.department).filter(Boolean))
  );

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold mb-1">Manage HR Accounts</h2>
            <p className="text-muted mb-0">View and manage HR users</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-danger d-flex align-items-center gap-2" onClick={() => navigate('/admin/create-admin')}>
              <FaPlus size={14} /> Create Admin
            </button>
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => navigate('/admin/create-hr')}>
              <FaPlus size={14} /> Create HR
            </button>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0">
            <div className="row">
              <div className="col-12 col-md-6 col-lg-4">
                <div className="input-group">
                  <span className="input-group-text bg-light border-0">
                    <FaSearch className="text-muted" size={14} />
                  </span>
                  <input
                    type="text"
                    className="form-control bg-light border-0"
                    placeholder="Search by email or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-12 col-md-4 col-lg-3 mt-2 mt-md-0">
                <select
                  className="form-select bg-light border-0"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <option value="ALL">All Departments</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" />
              <p className="text-muted mt-2 mb-0">Loading HRs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-5 px-4">
              <p className="text-danger mb-2">{error}</p>
              <button className="btn btn-outline-primary btn-sm" onClick={fetchHRs}>
                Retry
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0">Email / Username</th>
                    <th className="border-0">Role</th>
                    <th className="border-0">Status</th>
                    <th className="border-0 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHRs.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-5 text-muted">
                        <FaUserShield size={32} className="mb-2 opacity-50" />
                        <p className="mb-0">No HR accounts found. Create one to get started.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredHRs.map((hr) => (
                      <tr key={hr.id}>
                        <td className="fw-semibold">{hr.username}</td>
                        <td>
                          {hr.roles && hr.roles.length > 0 ? (
                            hr.roles
                              .filter((r) => r?.startsWith('ROLE_HR') || r === 'ROLE_TALENT_ACQUISITION')
                              .map((r) => (
                                <span key={r} className="badge text-bg-primary me-1">
                                  {formatRole(r)}
                                </span>
                              ))
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${hr.enabled ? 'text-bg-success' : 'text-bg-secondary'}`}>
                            {hr.enabled ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => navigate(`/admin/manage-hr/${hr.id}/edit`)}
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setConfirmDeleteId(hr.id)}
                            title="Delete"
                          >
                            <FaTrash size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {confirmDeleteId !== null && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h5 className="mb-2">Remove HR account?</h5>
            <p className="text-muted mb-4">This action cannot be undone.</p>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  const id = confirmDeleteId;
                  setConfirmDeleteId(null);
                  await handleDelete(id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ManageHR;
