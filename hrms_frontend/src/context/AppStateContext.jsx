import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const AppStateContext = createContext(null);

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
};

export const AppStateProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [accountInfo, setAccountInfo] = useState({ username: '', role: '', employeeId: '' });

  const [personal, setPersonal] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [education, setEducation] = useState([]);
  const [skills, setSkills] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [jobDetails, setJobDetails] = useState(null);
  const [account, setAccount] = useState(null);
  const [bandHistory, setBandHistory] = useState([]);
  const [managerHistory, setManagerHistory] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [profileDataLoading, setProfileDataLoading] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsBlocked, setNotificationsBlocked] = useState(false);
  const [pendingDocumentsCount, setPendingDocumentsCount] = useState(0);
  const [pendingLeavesCount, setPendingLeavesCount] = useState(0);
  const [pendingCountsLoading, setPendingCountsLoading] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState(null);

  const [settings, setSettings] = useState({
    notificationsEnabled: (localStorage.getItem('hrms-notifications-enabled') ?? 'true') === 'true',
  });

  const role = user?.role?.toUpperCase();
  
  // Inline flexible role checks to handle different role formats (ADMIN, ROLE_ADMIN, admin, etc.)
  const isEmployee = role?.includes('EMPLOYEE');
  const isAdmin = role?.includes('ADMIN');
  const isHR = role?.includes('HR');
  const isAdminOrHR = isAdmin || isHR;
  
  const canSeeNotifications = isAdminOrHR;
  const lastNotificationIds = useRef(
    new Set(JSON.parse(localStorage.getItem('hrms-seen-notifications') || '[]'))
  );

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    try {
      const meResponse = await axiosInstance.get(API_ENDPOINTS.AUTH.ME);
      const me = meResponse.data || {};
      const roleValue = Array.isArray(me.roles) ? me.roles.join(', ') : me.roles || '';
      const employeeId = me.employeeId || user?.employeeId || '';
      setAccountInfo({
        username: me.username || user?.email || '',
        role: roleValue || user?.role || '',
        employeeId,
      });

      if (!employeeId) {
        setProfile(null);
        return;
      }
      const response = await axiosInstance.get(`${API_ENDPOINTS.EMPLOYEE.PROFILE}/${employeeId}/profile`);
      setProfile(response.data || null);
    } catch (error) {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [user, isAuthenticated]);

  const refreshProfileData = useCallback(async () => {
    // Check if user is an EMPLOYEE to load employee-specific data
    console.log('[AppStateContext] refreshProfileData - role:', role, 'isEmployee:', isEmployee);
    if (!isEmployee) return;
    const employeeId = accountInfo.employeeId || user?.employeeId;
    console.log('[AppStateContext] refreshProfileData - employeeId:', employeeId);
    if (!employeeId) return;
    setProfileDataLoading(true);
    try {
      const safeGet = async (url, fallback) => {
        try {
          const res = await axiosInstance.get(url, {
            validateStatus: () => true,
          });
          return res.status === 200 ? res.data : fallback;
        } catch (error) {
          return fallback;
        }
      };

      const [
        personalValue,
        addressesValue,
        educationValue,
        emergenciesValue,
        skillsValue,
        experiencesValue,
        jobValue,
        accountValue,
        bandsValue,
        managerHistoryValue,
        contractsValue,
        documentsValue,
      ] = await Promise.all([
        safeGet(`${API_ENDPOINTS.EMPLOYEE.PERSONAL}/${employeeId}/personal`, null),
        safeGet(`${API_ENDPOINTS.EMPLOYEE.ADDRESSES}/${employeeId}/addresses`, []),
        safeGet(`${API_ENDPOINTS.EMPLOYEE.EDUCATION}/${employeeId}/education`, []),
        safeGet(`${API_ENDPOINTS.EMPLOYEE_EXTRA.EMERGENCIES}/${employeeId}/emergencies`, []),
        safeGet(`${API_ENDPOINTS.EMPLOYEE_EXTRA.SKILLS}/${employeeId}/skills`, []),
        safeGet(`${API_ENDPOINTS.EMPLOYEE_EXTRA.EXPERIENCE}/${employeeId}/experience`, []),
        safeGet(`${API_ENDPOINTS.EMPLOYEE_EXTRA.JOB}/${employeeId}/job`, null),
        safeGet(`${API_ENDPOINTS.EMPLOYEE_EXTRA.ACCOUNT}/${employeeId}/account`, null),
        safeGet(`${API_ENDPOINTS.EMPLOYEE_EXTRA.BANDS}/${employeeId}/bands`, []),
        safeGet(`${API_ENDPOINTS.EMPLOYEE_EXTRA.MANAGER_HISTORY}/${employeeId}/manager-history`, []),
        safeGet(`${API_ENDPOINTS.EMPLOYEE_EXTRA.CONTRACTS}/${employeeId}/contracts`, []),
        safeGet(`${API_ENDPOINTS.DOCUMENTS.BY_EMPLOYEE}/${employeeId}`, []),
      ]);

      setPersonal(personalValue || null);
      setAddresses(Array.isArray(addressesValue) ? addressesValue : []);
      setEducation(Array.isArray(educationValue) ? educationValue : []);
      setEmergencies(Array.isArray(emergenciesValue) ? emergenciesValue : []);
      setSkills(Array.isArray(skillsValue) ? skillsValue : []);
      setExperiences(Array.isArray(experiencesValue) ? experiencesValue : []);
      setJobDetails(jobValue || null);
      setAccount(accountValue || null);
      setBandHistory(Array.isArray(bandsValue) ? bandsValue : []);
      setManagerHistory(Array.isArray(managerHistoryValue) ? managerHistoryValue : []);
      setContracts(Array.isArray(contractsValue) ? contractsValue : []);
      setDocuments(Array.isArray(documentsValue) ? documentsValue : []);
    } finally {
      setProfileDataLoading(false);
    }
  }, [accountInfo.employeeId, user, role]);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !canSeeNotifications || notificationsBlocked || !settings.notificationsEnabled) return;
    setLoadingNotifications(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.NOTIFICATIONS.LIST);
      const list = Array.isArray(res.data) ? res.data : [];
      setNotifications(list);

      const newIds = [];
      list.forEach((note) => {
        const key = note.id || `${note.type}-${note.createdAt || ''}`;
        if (key && !lastNotificationIds.current.has(key)) {
          lastNotificationIds.current.add(key);
          newIds.push(key);
        }
      });

      if (newIds.length > 0) {
        const newest = list.find((note) => {
          const key = note.id || `${note.type}-${note.createdAt || ''}`;
          return newIds.includes(key);
        });
        if (newest) {
          showToast({
            type: 'info',
            title: newest.title || 'Notification',
            message: newest.message || 'You have a new update.',
          });
        }
        localStorage.setItem('hrms-seen-notifications', JSON.stringify([...lastNotificationIds.current]));
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setNotificationsBlocked(true);
      }
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  }, [isAuthenticated, canSeeNotifications, notificationsBlocked, settings.notificationsEnabled, showToast]);

  const refreshPendingCounts = useCallback(async () => {
    if (!isAuthenticated || !isAdminOrHR) return;
    setPendingCountsLoading(true);
    try {
      const [docsResult, leavesResult] = await Promise.allSettled([
        axiosInstance.get(`${API_ENDPOINTS.DOCUMENTS.GET}/pending`),
        axiosInstance.get(API_ENDPOINTS.TIME.LEAVE_PENDING),
      ]);

      const docs =
        docsResult.status === 'fulfilled' && Array.isArray(docsResult.value.data)
          ? docsResult.value.data
          : [];
      const leaves =
        leavesResult.status === 'fulfilled' && Array.isArray(leavesResult.value.data)
          ? leavesResult.value.data
          : [];

      setPendingDocumentsCount(docs.length);
      setPendingLeavesCount(leaves.length);
    } catch (error) {
      setPendingDocumentsCount(0);
      setPendingLeavesCount(0);
    } finally {
      setPendingCountsLoading(false);
    }
  }, [isAuthenticated, role]);

  const refreshEmployees = useCallback(async () => {
    if (!isAdminOrHR) return;
    setEmployeesLoading(true);
    setEmployeesError(null);
    try {
      const response = await axiosInstance.get(API_ENDPOINTS.HR.GET_ALL_EMPLOYEES);
      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
        ? payload.data
        : [];
      setEmployees(list);
    } catch (error) {
      setEmployeesError(error.response?.data?.message || 'Failed to load employees');
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  }, [role]);

  const updateSettings = useCallback((next) => {
    setSettings((prev) => ({ ...prev, ...next }));
    if (typeof next.notificationsEnabled === 'boolean') {
      localStorage.setItem('hrms-notifications-enabled', next.notificationsEnabled ? 'true' : 'false');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshProfile();
    } else {
      setProfile(null);
      setProfileLoading(false);
    }
  }, [refreshProfile, isAuthenticated]);

  useEffect(() => {
    if (accountInfo.employeeId) {
      refreshProfileData();
    }
  }, [accountInfo.employeeId, refreshProfileData]);

  const decreasePendingCount = useCallback((type) => {
    if (type === 'DOCUMENTS') {
      setPendingDocumentsCount((prev) => Math.max(0, prev - 1));
    } else if (type === 'LEAVES') {
      setPendingLeavesCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
    if (notificationsBlocked || !settings.notificationsEnabled) return undefined;
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifications, notificationsBlocked, settings.notificationsEnabled]);

  useEffect(() => {
    refreshPendingCounts();
    if (!isAdminOrHR) return undefined;
    const interval = setInterval(refreshPendingCounts, 30000);
    return () => clearInterval(interval);
  }, [refreshPendingCounts, role]);

  const value = useMemo(
    () => ({
      profile,
      profileLoading,
      accountInfo,
      refreshProfile,
      personal,
      addresses,
      emergencies,
      education,
      skills,
      experiences,
      jobDetails,
      account,
      bandHistory,
      managerHistory,
      contracts,
      documents,
      profileDataLoading,
      refreshProfileData,
      notifications,
      loadingNotifications,
      notificationsBlocked,
      refreshNotifications,
      pendingDocumentsCount,
      pendingLeavesCount,
      pendingCountsLoading,
      refreshPendingCounts,
      decreasePendingCount,
      settings,
      updateSettings,
      employees,
      employeesLoading,
      employeesError,
      refreshEmployees,
      setEmployees,
      setAddresses,
      setPersonal,
      setEmergencies,
      setEducation,
      setSkills,
      setExperiences,
      setJobDetails,
      setAccount,
      setBandHistory,
      setManagerHistory,
      setContracts,
      setDocuments,
    }),
    [
      profile,
      profileLoading,
      accountInfo,
      refreshProfile,
      personal,
      addresses,
      emergencies,
      education,
      skills,
      experiences,
      jobDetails,
      account,
      bandHistory,
      managerHistory,
      contracts,
      documents,
      profileDataLoading,
      refreshProfileData,
      notifications,
      loadingNotifications,
      notificationsBlocked,
      refreshNotifications,
      pendingDocumentsCount,
      pendingLeavesCount,
      pendingCountsLoading,
      refreshPendingCounts,
      settings,
      updateSettings,
      employees,
      employeesLoading,
      employeesError,
      refreshEmployees,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};
