// API Configuration - Spring Boot backend (default port 8081)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1';

// Base without /api/v1
export const API_AUTH_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, '');

// NEW → Base for non-v1 endpoints (/api)
export const API_ROOT_URL = API_AUTH_BASE_URL + '/api';




export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    CHANGE_PASSWORD: '/auth/me/password',
    RESET: '/auth/reset-password',
    FORGOT: '/auth/forgot-password',
  },

  // Admin endpoints
  ADMIN: {
    CREATE_HR: '/admin/hr',
    CREATE_ADMIN: '/admin/hr/admin',
    GET_ALL_HR: '/admin/hr/all',
    GET_HR_BY_ID: '/admin/hr',
    UPDATE_HR: '/admin/hr/update',
    DELETE_HR: '/admin/hr',
    DASHBOARD: '/admin/dashboard',
  },

  // HR endpoints
  HR: {
    CREATE_EMPLOYEE: '/hr/employees',
    GET_ALL_EMPLOYEES: '/hrms/employees',
    GET_EMPLOYEE_BY_ID: '/hrms/employees',
    UPDATE_EMPLOYEE: '/hrms/employees',
    DELETE_EMPLOYEE: '/hrms/employees',
    SEARCH_EMPLOYEES: '/hrms/employees/search',
    DASHBOARD: '/hr/dashboard',
  },

  EMPLOYEE: {
    PROFILE: '/hrms/employees',
    UPDATE_PROFILE: '/hrms/employees',
    PERSONAL: '/hrms/employees',
    PERSONAL_UPDATE: '/hrms/employees/update',
    ADDRESSES: '/hrms/employees',
    EDUCATION: '/hrms/employees',
  },

  DOCUMENTS: {
    UPLOAD: '/hrms/documents/upload',
    BY_EMPLOYEE: '/hrms/documents/employee',
    GET: '/hrms/documents',
    DOWNLOAD: '/hrms/documents',
    REUPLOAD: '/hrms/documents',
  },

  TIME: {
    ATTENDANCE: '/hrms/time/attendance',
    ATTENDANCE_ME: '/hrms/time/attendance/me',
    CHECK_IN: '/hrms/time/attendance/check-in',
    CHECK_IN_ME: '/hrms/time/attendance/check-in/me',
    CHECK_OUT: '/hrms/time/attendance/check-out',
    CHECK_OUT_ME: '/hrms/time/attendance/check-out/me',
    LEAVE_APPLY: '/hrms/time/leaves/apply',
    LEAVE_PENDING: '/hrms/time/leaves/pending',
    LEAVE_APPROVE: '/hrms/time/leaves',
    LEAVE_REJECT: '/hrms/time/leaves',
    LEAVE_HISTORY_ME: '/hrms/time/leaves/history/me',
    LEAVE_BALANCES_ME: '/hrms/time/leaves/balances/me',
    HOLIDAYS_BY_LOCATION: '/hrms/time/holidays/location',
    SHIFTS: '/hrms/time/shifts',
  },

  EMPLOYEE_EXTRA: {
    EMERGENCIES: '/employees',
    SKILLS: '/employees',
    EXPERIENCE: '/employees',
    JOB: '/employees',
    ACCOUNT: '/employees',
    BANDS: '/employees',
    MANAGER_HISTORY: '/employees',
    CONTRACTS: '/employees',
  },

  // NEW → Profile Images endpoint
  PROFILE_IMAGES: {
    BY_EMPLOYEE: '/profile-images', // usage: /profile-images/{employeeId}
  },

  NOTIFICATIONS: {
    LIST: '/notifications',
  },
  PROFILE_IMAGES: {
    BY_EMPLOYEE: "/profile-images",
  },
};

export default API_BASE_URL;