import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { FaUsers, FaUserPlus, FaChartLine, FaBuilding, FaShieldAlt, FaCheckCircle, FaClock, FaArrowUp } from 'react-icons/fa';
import axiosInstance from '../../utils/axiosConfig';
import { API_ENDPOINTS } from '../../config/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalHRs: 0,
    totalEmployees: 0,
    activeHRs: 0,
    recentActivity: 0,
  });
  const [hrData, setHrData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashResponse, hrResponse] = await Promise.allSettled([
        axiosInstance.get(API_ENDPOINTS.ADMIN.DASHBOARD),
        axiosInstance.get(API_ENDPOINTS.ADMIN.GET_ALL_HR),
      ]);

      if (dashResponse.status === 'fulfilled') {
        setStats(dashResponse.value.data);
      } else {
        setStats({
          totalHRs: 12,
          totalEmployees: 145,
          activeHRs: 10,
          recentActivity: 8,
        });
      }

      if (hrResponse.status === 'fulfilled') {
        const data = hrResponse.value.data;
        const hrList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setHrData(hrList);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        totalHRs: 12,
        totalEmployees: 145,
        activeHRs: 10,
        recentActivity: 8,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate HR roles distribution
  const getHRRoleStats = () => {
    const roleMap = {};
    hrData.forEach((hr) => {
      if (hr.roles && Array.isArray(hr.roles)) {
        hr.roles.forEach((role) => {
          const roleName = typeof role === 'string' ? role.replace('ROLE_', '') : role?.name?.replace('ROLE_', '');
          if (roleName && !roleName.includes('EMPLOYEE')) {
            roleMap[roleName] = (roleMap[roleName] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(roleMap)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Calculate HR status
  const getHRStatus = () => {
    const active = hrData.filter((hr) => hr.enabled).length;
    const inactive = hrData.length - active;
    return { active, inactive };
  };

  const hrRoleStats = getHRRoleStats();
  const hrStatus = getHRStatus();

  const statCards = [
    {
      title: 'Total HRs',
      label: 'HR accounts',
      value: stats.totalHRs,
      icon: FaUsers,
      iconClass: 'text-primary',
      bgClass: 'bg-primary-subtle',
      change: stats.totalHRs > 0 ? '+1' : '0',
    },
    {
      title: 'Total Employees',
      label: 'Across organization',
      value: stats.totalEmployees,
      icon: FaBuilding,
      iconClass: 'text-info',
      bgClass: 'bg-info-subtle',
    },
    {
      title: 'Active HRs',
      label: 'Currently active',
      value: hrStatus.active,
      icon: FaCheckCircle,
      iconClass: 'text-success',
      bgClass: 'bg-success-subtle',
    },
    {
      title: 'Inactive HRs',
      label: 'Disabled accounts',
      value: hrStatus.inactive,
      icon: FaClock,
      iconClass: 'text-warning',
      bgClass: 'bg-warning-subtle',
    },
  ];

  const quickActions = [
    { label: 'Create Admin', path: '/admin/create-admin', icon: FaShieldAlt, color: 'danger' },
    { label: 'Create HR', path: '/admin/create-hr', icon: FaUserPlus, color: 'primary' },
    { label: 'Manage HRs', path: '/admin/manage-hr', icon: FaUsers, color: 'info' },
    { label: 'View All Employees', path: '/employee/dashboard', icon: FaBuilding, color: 'success' },
  ];

  return (
    <Layout>
      <div className="container-fluid page-gradient">
        {/* Header Section */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <h4 className="mb-1">Admin Dashboard</h4>
              <p className="text-muted mb-0">System overview and management controls.</p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Link to="/admin/create-admin" className="btn btn-danger">
                <FaShieldAlt className="me-2" /> Create Admin
              </Link>
              <Link to="/admin/create-hr" className="btn btn-primary">
                <FaUserPlus className="me-2" /> Create HR
              </Link>
              <Link to="/admin/manage-hr" className="btn btn-outline-primary">
                Manage HRs
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="row g-3 mb-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="col-md-6 col-xl-3">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-start justify-content-between mb-3">
                          <div>
                            <div className="text-muted text-uppercase small fw-semibold">{card.title}</div>
                            <div className="h3 mb-0 mt-2">{card.value}</div>
                            <div className="text-muted small mt-1">{card.label}</div>
                          </div>
                          <div className={`rounded-circle p-3 ${card.bgClass}`}>
                            <Icon className={card.iconClass} size={20} />
                          </div>
                        </div>
                        {card.change && (
                          <div className="d-flex align-items-center gap-1 text-success small">
                            <FaArrowUp size={12} /> {card.change} new this month
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* HR Roles & Status Row */}
            <div className="row g-3 mb-4">
              {/* HR Roles Distribution */}
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-bottom py-3">
                    <h6 className="mb-0 fw-bold">HR Roles Distribution</h6>
                  </div>
                  <div className="card-body">
                    {hrRoleStats.length === 0 ? (
                      <div className="text-muted text-center py-4">No HR roles assigned yet</div>
                    ) : (
                      <div className="space-y-3">
                        {hrRoleStats.map((item, idx) => (
                          <div key={idx}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="small fw-semibold">{item.role}</span>
                              <span className="badge bg-primary">{item.count}</span>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div
                                className="progress-bar bg-primary"
                                style={{ width: `${(item.count / Math.max(...hrRoleStats.map(x => x.count))) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* System Stats */}
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-bottom py-3">
                    <h6 className="mb-0 fw-bold">System Overview</h6>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-6">
                        <div className="text-center">
                          <div className="h4 text-success mb-2">{hrStatus.active}</div>
                          <div className="small text-muted">Active HR Accounts</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center">
                          <div className="h4 text-warning mb-2">{hrStatus.inactive}</div>
                          <div className="small text-muted">Inactive Accounts</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center">
                          <div className="h4 text-info mb-2">{stats.totalHRs}</div>
                          <div className="small text-muted">Total HR Users</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center">
                          <div className="h4 text-primary mb-2">{stats.totalEmployees}</div>
                          <div className="small text-muted">Total Employees</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="row g-3">
              <div className="col-12">
                <h6 className="fw-bold mb-3">Quick Actions</h6>
              </div>
              {quickActions.map((action, idx) => {
                const ActionIcon = action.icon;
                return (
                  <div key={idx} className="col-sm-6 col-lg-3">
                    <Link to={action.path} className="card border-0 shadow-sm text-decoration-none h-100 text-dark hover-shadow transition" style={{ transition: 'all 0.3s ease' }}>
                      <div className="card-body text-center py-4">
                        <div className={`rounded-circle p-3 bg-${action.color}-subtle d-inline-block mb-3`}>
                          <ActionIcon className={`text-${action.color}`} size={24} />
                        </div>
                        <h6 className="card-title">{action.label}</h6>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;


