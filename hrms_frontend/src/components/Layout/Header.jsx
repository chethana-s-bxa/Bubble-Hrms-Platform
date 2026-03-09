import React, { useEffect, useRef, useState } from 'react';
import { FaBell, FaSearch, FaUserCircle, FaBars } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/AppStateContext';
import axiosInstance from '../../utils/axiosConfig';

import {API_ENDPOINTS,API_AUTH_BASE_URL} from '../../config/api';
 
const Header = ({ user, onMenuClick }) => {

  const [profileImageUrl, setProfileImageUrl] = useState(null);

useEffect(() => {
  if (!user?.employeeId) return;

  const loadProfileImage = async () => {
    try {
      const res = await axiosInstance.get(
        `${API_AUTH_BASE_URL}/api/profile-images/${user.employeeId}`
      );

      setProfileImageUrl(
        typeof res.data === "string"
          ? res.data
          : res.data?.url || null
      );
    } catch (err) {
      console.error("Profile image load failed", err);
      setProfileImageUrl(null);
    }
  };

  loadProfileImage();
}, [user]);



  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const {
    notifications,
    loadingNotifications,
    refreshNotifications,
    settings,
    pendingDocumentsCount,
    pendingLeavesCount,
    profile,
    refreshPendingCounts,
    decreasePendingCount,
  } = useAppState();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
 
 
  const role = user?.role?.replace("ROLE_", "").toUpperCase();
  const canSeeNotifications = isAuthenticated && (role === 'ADMIN' || role === 'HR');
  const canSearchEmployees = true;
  const pendingTotal = pendingDocumentsCount + pendingLeavesCount;
 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    if (showNotifications || showProfileMenu || showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showProfileMenu, showSearchResults]);

  // Refresh pending counts when notification panel is opened
  useEffect(() => {
    if (showNotifications && (role === 'ADMIN' || role === 'HR')) {
      refreshPendingCounts();
    }
  }, [showNotifications, role, refreshPendingCounts]);
 
  useEffect(() => {
    if (!canSearchEmployees) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError('');
      return;
    }
 
    const term = searchQuery.trim();
    if (!term) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError('');
      return;
    }
 
    const handler = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError('');
      try {
        const payload = {};
        
        // Determine the appropriate search endpoint based on role
        let searchUrl;
        if (role === "ADMIN") {
          // Admin can search employees using the same HR endpoint
          searchUrl = API_ENDPOINTS.HR.SEARCH_EMPLOYEES;
        } else if (role === "HR") {
          // HR uses their dedicated search endpoint
          searchUrl = API_ENDPOINTS.HR.SEARCH_EMPLOYEES;
        } else if (role === "EMPLOYEE") {
          // Employee searches using employee-specific endpoint
          searchUrl = `${API_AUTH_BASE_URL}/api/employees/search`;
        } else {
          setSearchError('Search not available for your role');
          setShowSearchResults(true);
          setSearchLoading(false);
          return;
        }

        // Build search payload
        if (/^\d+$/.test(term)) {
          // if number → search by employeeId
          payload.employeeId = Number(term);
        } else {
          // text → search all fields (backend OR logic)
          payload.name = term;
          payload.department = term;
          payload.designation = term;
          payload.companyBaseLocation = term;
          payload.band = term;
        }

        const response = await axiosInstance.post(
          searchUrl,
          payload
        );

        const data = response.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setSearchResults(list);
        setShowSearchResults(true);
      } catch (error) {
        setSearchResults([]);
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Search failed';
        setSearchError(errorMsg);
        console.log("Search error:", error.response?.status, error.response?.data);
        setShowSearchResults(true);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
 
    return () => clearTimeout(handler);
  }, [searchQuery, canSearchEmployees]);
 
  const formatTimestamp = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
  };
 
  return (
    <header className="header-bar">
      <style>
        {`
          .notification-item.read {
            opacity: 0.6;
          }
          .notification-item.read .fw-semibold {
            font-weight: normal !important;
          }
        `}
      </style>
      <div className="container-fluid py-2">
        <div className="row align-items-center g-2">
          <div className="col-12 col-lg-6">
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm d-lg-none"
                onClick={onMenuClick}
                aria-label="Open menu"
              >
                <FaBars />
              </button>
              <div className="input-group input-group-sm flex-grow-1 position-relative" ref={searchRef}>
                <span className="input-group-text bg-light border-0 text-muted">
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-0"
                  placeholder={canSearchEmployees ? 'Search employees...' : 'Search disabled'}
                  aria-label="Search"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) {
                      setShowSearchResults(true);
                    }
                  }}
                  disabled={!canSearchEmployees}
                />
                {showSearchResults && (
                  <div
                    className="position-absolute top-100 start-0 mt-2 w-100 bg-white border rounded shadow-sm"
                    style={{ zIndex: 1050 }}
                  >
                    {searchLoading ? (
                      <div className="px-3 py-2 text-muted small">Searching…</div>
                    ) : searchError ? (
                      <div className="px-3 py-2 text-danger small">{searchError}</div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-3 py-2 text-muted small">No employees found.</div>
                    ) : (
                      <div className="list-group list-group-flush">
                        {searchResults.slice(0, 6).map((emp) => {
                          const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
                            || emp.companyEmail
                            || 'Employee';
                          return (
                            <button
                              type="button"
                              key={emp.employeeId || emp.companyEmail || name}
                              className="list-group-item list-group-item-action"
                              onClick={() => {
                                console.log("Clicked employee:", emp);   
                                setShowSearchResults(false);
                                setSearchQuery('');
                                if (role === "EMPLOYEE") {
                                  navigate("/employee/dashboard");
                                } else {
                                  navigate(`/employee/dashboard/${emp.employeeId}`);
                                }
                              }}
                            >
                              <div className="fw-semibold">{name}</div>
                              <div className="small text-muted">
                                {emp.designation || 'Role'} · {emp.department || 'Department'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-auto ms-lg-auto">
            <div className="d-flex align-items-center gap-2 justify-content-lg-end">
              <button
                type="button"
                className="btn btn-sm theme-toggle-switch"
                id="theme-toggle"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                <span className="theme-toggle-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                <span className={`theme-toggle-track ${theme === 'dark' ? 'is-dark' : ''}`}>
                  <span className="theme-toggle-knob" />
                  <span className="theme-toggle-dot" />
                </span>
              </button>
              {canSeeNotifications && settings.notificationsEnabled && (
                <div className="position-relative" ref={dropdownRef}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm notification-trigger"
                    aria-label="Notifications"
                    onClick={() => setShowNotifications((prev) => !prev)}
                  >
                    <FaBell />
                    {pendingTotal > 0 && <span className="notification-badge">{pendingTotal}</span>}
                  </button>
                  {showNotifications && (
                    <div className="notification-panel shadow">
                      <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
                        <div className="fw-semibold">Notifications</div>
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-decoration-none"
                          onClick={refreshNotifications}
                        >
                          Refresh
                        </button>
                      </div>
                      <div className="notification-body">
                        {loadingNotifications ? (
                          <div className="text-center py-3">
                            <div className="spinner-border spinner-border-sm text-primary" role="status" />
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="text-muted px-3 py-3">No notifications yet.</div>
                        ) : (
                          notifications.map((note, index) => (
                            <div key={note.id || `${note.type}-${index}`} className={`notification-item d-flex justify-content-between align-items-start ${note.read ? 'read' : ''}`}>
                              <div className="flex-grow-1">
                                <div className="fw-semibold">{note.title || 'Update'}</div>
                                <div className="small text-muted">{note.message}</div>
                                {note.createdAt && (
                                  <div className="small text-muted">{formatTimestamp(note.createdAt)}</div>
                                )}
                              </div>
                              {note.id && !note.read && (
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm ms-2 text-decoration-none text-nowrap"
                                  title="Mark as read"
                                  onClick={async () => {
                                    try {
                                      await axiosInstance.put(`${API_ENDPOINTS.NOTIFICATIONS}/${note.id}/read`);
                                      refreshNotifications();
                                    } catch (error) {
                                      console.error('Failed to mark as read:', error);
                                    }
                                  }}
                                >
                                  ✓
                                </button>
                              )}
                              {(note.type === 'PENDING_DOCUMENTS' || note.type === 'PENDING_LEAVES') && (
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm ms-2 text-decoration-none text-nowrap"
                                  title="Mark as seen"
                                  onClick={() => {
                                    if (note.type === 'PENDING_DOCUMENTS') {
                                      decreasePendingCount('DOCUMENTS');
                                    } else if (note.type === 'PENDING_LEAVES') {
                                      decreasePendingCount('LEAVES');
                                    }
                                  }}
                                >
                                  ✓
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="position-relative" ref={profileRef}>
                <button
                  type="button"
                  className="d-flex align-items-center gap-2 bg-light border rounded px-2 py-1 user-chip user-chip-button"
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  aria-label="Open profile menu"
                >
                  {profileImageUrl ? (
  <img
    src={profileImageUrl}
    alt="Profile"
    className="rounded-circle"
    style={{
      width: '36px',
      height: '36px',
      objectFit: 'cover',
      border: '1px solid #ddd',
    }}
    onError={(e) => {
      e.target.style.display = 'none';
    }}
  />
) : (
  <FaUserCircle className="fs-3 text-secondary" />
)}
                  <div className="d-none d-md-block text-start">
                    <div className="fw-semibold small">{user?.name || user?.email}</div>
                    <div className="text-muted text-uppercase small">
  {profile?.designation || user?.designation || 'Employee'}
</div>
                  </div>
                </button>
                {showProfileMenu && (
                  <div className="profile-menu shadow">
                    <button
                      type="button"
                      className="profile-menu-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/profile');
                      }}
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      className="profile-menu-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/profile');
                      }}
                    >
                      Settings
                    </button>
                    <button
                      type="button"
                      className="profile-menu-item profile-menu-logout"
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                        navigate('/login');
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;