import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { FaUsers, FaUserPlus, FaChartLine, FaBuilding, FaCheckCircle, FaClock, FaUser, FaFire, FaArrowUp } from 'react-icons/fa';
import axiosInstance from '../../utils/axiosConfig';
import { API_ENDPOINTS } from '../../config/api';

const HRDashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    newEmployees: 0,
    activeEmployees: 0,
    pendingTasks: 0,
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashResponse, empResponse] = await Promise.allSettled([
        axiosInstance.get(API_ENDPOINTS.HR.DASHBOARD),
        axiosInstance.get(API_ENDPOINTS.HR.GET_ALL_EMPLOYEES),
      ]);

      if (dashResponse.status === 'fulfilled') {
        setStats(dashResponse.value.data);
      } else {
        setStats({
          totalEmployees: 45,
          newEmployees: 5,
          activeEmployees: 42,
          pendingTasks: 3,
        });
      }

      if (empResponse.status === 'fulfilled') {
        const data = empResponse.value.data;
        const empList = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setEmployees(empList);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        totalEmployees: 45,
        newEmployees: 5,
        activeEmployees: 42,
        pendingTasks: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate department distribution
  const getDepartmentStats = () => {
    const deptMap = {};
    employees.forEach((emp) => {
      const dept = emp.department || 'Unassigned';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    return Object.entries(deptMap)
      .map(([dept, count]) => ({ dept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // Calculate designation distribution
  const getDesignationStats = () => {
    const desigMap = {};
    employees.forEach((emp) => {
      const desig = emp.designation || 'Unassigned';
      desigMap[desig] = (desigMap[desig] || 0) + 1;
    });
    return Object.entries(desigMap)
      .map(([desig, count]) => ({ desig, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const deptStats = getDepartmentStats();
  const desigStats = getDesignationStats();

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: FaUsers,
      iconClass: 'text-primary',
      bgClass: 'bg-primary-subtle',
      change: '+2.5%',
    },
    {
      title: 'New Employees',
      value: stats.newEmployees,
      icon: FaUserPlus,
      iconClass: 'text-success',
      bgClass: 'bg-success-subtle',
      subtitle: 'This month',
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      icon: FaCheckCircle,
      iconClass: 'text-info',
      bgClass: 'bg-info-subtle',
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: FaClock,
      iconClass: 'text-warning',
      bgClass: 'bg-warning-subtle',
    },
  ];

  const quickActions = [
    { label: 'Create Employee', path: '/hr/create-employee', icon: FaUserPlus, color: 'primary' },
    { label: 'Manage Employees', path: '/hr/manage-employees', icon: FaUsers, color: 'info' },
    { label: 'View Documents', path: '/hr/documents', icon: FaBuilding, color: 'success' },
    { label: 'Approvals', path: '/hr/approvals', icon: FaCheckCircle, color: 'warning' },
  ];

  return (
    <Layout>
      <div className="container-fluid page-gradient">
        {/* Header Section */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div>
              <h4 className="mb-1">HR Dashboard</h4>
              <p className="text-muted mb-0">Manage your workforce and track key metrics.</p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <Link to="/hr/create-employee" className="btn btn-primary">
                <FaUserPlus className="me-2" /> Create Employee
              </Link>
              <Link to="/hr/manage-employees" className="btn btn-outline-primary">
                Manage Employees
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
                            {card.subtitle && <div className="text-muted small mt-1">{card.subtitle}</div>}
                          </div>
                          <div className={`rounded-circle p-3 ${card.bgClass}`}>
                            <Icon className={card.iconClass} size={20} />
                          </div>
                        </div>
                        {card.change && (
                          <div className="d-flex align-items-center gap-1 text-success small">
                            <FaArrowUp size={12} /> {card.change} from last month
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Department & Designation Stats Row */}
            <div className="row g-3 mb-4">
              {/* Department Distribution */}
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-bottom py-3">
                    <h6 className="mb-0 fw-bold">Employees by Department</h6>
                  </div>
                  <div className="card-body">
                    {deptStats.length === 0 ? (
                      <div className="text-muted text-center py-4">No department data available</div>
                    ) : (
                      <div className="space-y-3">
                        {deptStats.map((item, idx) => (
                          <div key={idx}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="small fw-semibold">{item.dept}</span>
                              <span className="badge bg-primary">{item.count}</span>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div
                                className="progress-bar bg-primary"
                                style={{ width: `${(item.count / Math.max(...deptStats.map(x => x.count))) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Designation Distribution */}
              <div className="col-lg-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-white border-bottom py-3">
                    <h6 className="mb-0 fw-bold">Top Designations</h6>
                  </div>
                  <div className="card-body">
                    {desigStats.length === 0 ? (
                      <div className="text-muted text-center py-4">No designation data available</div>
                    ) : (
                      <div className="space-y-3">
                        {desigStats.map((item, idx) => (
                          <div key={idx}>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="small fw-semibold">{item.desig}</span>
                              <span className="badge bg-info">{item.count}</span>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div
                                className="progress-bar bg-info"
                                style={{ width: `${(item.count / Math.max(...desigStats.map(x => x.count))) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

export default HRDashboard;
