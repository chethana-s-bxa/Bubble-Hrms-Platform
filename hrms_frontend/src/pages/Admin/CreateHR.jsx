import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import axiosInstance from '../../utils/axiosConfig';
import { API_ENDPOINTS } from '../../config/api';
import { useToast } from '../../context/ToastContext';
import {
  FaUser,
  FaEnvelope,
  FaBuilding,
  FaPhone,
  FaSave,
  FaTimes,
  FaIdCard,
  FaBriefcase,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';

const CreateHR = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    role: '',
    firstName: '',
    lastName: '',
    department: '',
    designation: '',
    personalEmail: '',
    currentBand: '',
    currentExperience: '',
    salary: '',
    phone: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
  
    if (!formData.firstName.trim()) newErrors.firstName = 'First name required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name required';
    if (!formData.department.trim()) newErrors.department = 'Department required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation required';
  
    if (!formData.personalEmail.trim())
      newErrors.personalEmail = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalEmail))
      newErrors.personalEmail = 'Invalid email';
  
    if (!formData.currentExperience || formData.currentExperience < 0)
      newErrors.currentExperience = 'Valid experience required';
  
    if (!formData.salary || formData.salary <= 0)
      newErrors.salary = 'Valid salary required';
  
    if (!formData.phone) newErrors.phone = 'Phone required';
  
    setErrors(newErrors);
  
    return Object.keys(newErrors).length === 0;
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await axiosInstance.post(API_ENDPOINTS.ADMIN.CREATE_HR, {
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        department: formData.department,
        designation: formData.designation,
        personalEmail: formData.personalEmail,
        currentBand: formData.currentBand,
        currentExperience: parseFloat(formData.currentExperience) || 0,
        ctc: parseInt(formData.salary, 10) || 0,
        phoneNumber: parseInt(String(formData.phone).replace(/\D/g, ''), 10) || 0,
        dateOfJoining: formData.dateOfJoining,
      });
      showToast({ type: 'success', title: 'HR created', message: 'HR created successfully!' });
      navigate('/admin/manage-hr');
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Failed to create HR';
      showToast({ type: 'error', title: 'Create failed', message: msg });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Layout>
      <div className="container-fluid page-gradient">
        <div className="mb-4">
          <h2 className="fw-bold mb-2">
            <FaUser className="me-3 text-primary" />
            Create HR Personnel
          </h2>
          <p className="text-muted mb-0">
            Add a new HR team member with appropriate role and permissions.
          </p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {/* Basic Information Section */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <FaIdCard className="text-primary me-2" />
                      <h5 className="mb-0 fw-semibold">Basic Information</h5>
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          First Name <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
                            <FaUser size={14} className="text-muted" />
                          </span>
                          <input
                            type="text"
                            className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Enter first name"
                          />
                        </div>
                        {errors.firstName && <div className="invalid-feedback d-block">{errors.firstName}</div>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Last Name <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
                            <FaUser size={14} className="text-muted" />
                          </span>
                          <input
                            type="text"
                            className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Enter last name"
                          />
                        </div>
                        {errors.lastName && <div className="invalid-feedback d-block">{errors.lastName}</div>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Personal Email <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
                            <FaEnvelope size={14} className="text-muted" />
                          </span>
                          <input
                            type="email"
                            className={`form-control ${errors.personalEmail ? 'is-invalid' : ''}`}
                            name="personalEmail"
                            value={formData.personalEmail}
                            onChange={handleChange}
                            placeholder="hr@company.com"
                          />
                        </div>
                        {errors.personalEmail && <div className="invalid-feedback d-block">{errors.personalEmail}</div>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Phone Number <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
                            <FaPhone size={14} className="text-muted" />
                          </span>
                          <input
                            type="tel"
                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 9876543210"
                          />
                        </div>
                        {errors.phone && <div className="invalid-feedback d-block">{errors.phone}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Professional Information Section */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <FaBriefcase className="text-primary me-2" />
                      <h5 className="mb-0 fw-semibold">Professional Information</h5>
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Department <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
                            <FaBuilding size={14} className="text-muted" />
                          </span>
                          <input
                            type="text"
                            className={`form-control ${errors.department ? 'is-invalid' : ''}`}
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            placeholder="e.g., Human Resources, Talent Acquisition"
                          />
                        </div>
                        {errors.department && <div className="invalid-feedback d-block">{errors.department}</div>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Designation <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
                            <FaBriefcase size={14} className="text-muted" />
                          </span>
                          <input
                            type="text"
                            className={`form-control ${errors.designation ? 'is-invalid' : ''}`}
                            name="designation"
                            value={formData.designation}
                            onChange={handleChange}
                            placeholder="e.g., HR Manager, Talent Acquisition Specialist"
                          />
                        </div>
                        {errors.designation && <div className="invalid-feedback d-block">{errors.designation}</div>}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          HR Role <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                        >
                          <option value="">Select HR Role</option>
                          <option value="ROLE_HR_OPERATIONS">HR Operations</option>
                          <option value="ROLE_HR_PAYROLL">HR Payroll</option>
                          <option value="ROLE_HR_BP">HR Business Partner</option>
                          <option value="ROLE_TALENT_ACQUISITION">Talent Acquisition</option>
                          <option value="ROLE_HR_MANAGER">HR Manager</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Experience (Years)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className={`form-control ${errors.currentExperience ? 'is-invalid' : ''}`}
                          name="currentExperience"
                          value={formData.currentExperience}
                          onChange={handleChange}
                          placeholder="0.0 - 50.0"
                          min="0"
                          max="50"
                        />
                        {errors.currentExperience && (
                          <div className="invalid-feedback d-block">{errors.currentExperience}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Advanced Options Toggle */}
                  <div className="mb-4">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      {showAdvanced ? <FaChevronUp /> : <FaChevronDown />}
                      {showAdvanced ? "Hide" : "Show"} Additional Details
                    </button>
                  </div>

                  {/* Advanced Information Section */}
                  {showAdvanced && (
                    <div className="mb-4">
                      <div className="d-flex align-items-center mb-3">
                        <FaCalendarAlt className="text-primary me-2" />
                        <h5 className="mb-0 fw-semibold">Additional Details</h5>
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Current Band</label>
                          <select
                            className="form-select"
                            name="currentBand"
                            value={formData.currentBand}
                            onChange={handleChange}
                          >
                            <option value="">Select Band</option>
                            <option value="L1">L1 - Entry Level</option>
                            <option value="L2">L2 - Junior</option>
                            <option value="L3">L3 - Mid Level</option>
                            <option value="L4">L4 - Senior</option>
                            <option value="L5">L5 - Lead</option>
                            <option value="L6">L6 - Principal</option>
                            <option value="L7">L7 - Architect</option>
                          </select>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Date of Joining</label>
                          <div className="input-group">
                            <span className="input-group-text bg-light">
                              <FaCalendarAlt size={14} className="text-muted" />
                            </span>
                            <input
                              type="date"
                              className="form-control"
                              name="dateOfJoining"
                              value={formData.dateOfJoining}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compensation Section */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <FaMoneyBillWave className="text-primary me-2" />
                      <h5 className="mb-0 fw-semibold">Compensation</h5>
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Salary (CTC) <span className="text-danger">*</span>
                        </label>
                        <div className="input-group">
                          <span className="input-group-text bg-light">₹</span>
                          <input
                            type="number"
                            className={`form-control ${errors.salary ? 'is-invalid' : ''}`}
                            name="salary"
                            value={formData.salary}
                            onChange={handleChange}
                            placeholder="50000 (min: 10,000)"
                            min="10000"
                            step="0.01"
                          />
                        </div>
                        {errors.salary && <div className="invalid-feedback d-block">{errors.salary}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-3 justify-content-end pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center gap-2"
                      onClick={() => navigate('/admin/dashboard')}
                    >
                      <FaTimes /> Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary d-flex align-items-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" />
                          Creating HR...
                        </>
                      ) : (
                        <>
                          <FaSave /> Create HR Personnel
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateHR;
