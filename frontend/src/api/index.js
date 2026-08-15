import api from './axios';

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  getApprovedInstitutions: () => api.get('/auth/institutions/approved'),
  getPendingAdmins: () => api.get('/auth/pending-admins'),
  approveAdmin: (id) => api.put(`/auth/approve-admin/${id}`),
  changeCredentials: (data) => api.put('/auth/change-credentials', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  addAdmin: (adminData) => api.post('/auth/add-admin', adminData),
  getAdmins: () => api.get('/auth/admins'),
  deleteAdmin: (adminId) => api.delete(`/auth/admins/${adminId}`),
  clearExamSession: () => api.post('/auth/clear-exam-session'),
};

// Exam API
export const examAPI = {
  getExams: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/exams${queryString ? `?${queryString}` : ''}`);
  },
  getExam: (id) => api.get(`/exams/${id}`),
  createExam: (examData) => api.post('/exams', examData),
  updateExam: (id, examData) => api.put(`/exams/${id}`, examData),
  deleteExam: (id) => api.delete(`/exams/${id}`),
};

// Submission API
export const submissionAPI = {
  submitExam: (submissionData) => api.post('/submissions', submissionData),
  getMySubmissions: () => api.get('/submissions/my'),
  getLeaderboard: (examId) => api.get(`/submissions/leaderboard/${examId}`),
  getAllSubmissions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/submissions${queryString ? `?${queryString}` : ''}`);
  },
  getSubmission: (id) => api.get(`/submissions/${id}`),
  deleteSubmission: (id) => api.delete(`/submissions/${id}`),
};

// Schedule API
export const scheduleAPI = {
  submitSchedule: (scheduleData) => api.post('/schedules', scheduleData),
  getSchedules: () => api.get('/schedules'),
  updateStatus: (id, status) => api.put(`/schedules/${id}`, { status }),
  deleteSchedule: (id) => api.delete(`/schedules/${id}`),
};

// Question Bank API
export const questionBankAPI = {
  getQuestions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/question-bank${queryString ? `?${queryString}` : ''}`);
  },
  createQuestion: (data) => api.post('/question-bank', data),
  importBulk: (questions) => api.post('/question-bank/import', { questions }),
  getRandomQuestions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/question-bank/random?${queryString}`);
  },
  aiGenerateQuestions: (promptData) => api.post('/question-bank/ai-generate', promptData),
  publishQuestionBank: (data) => api.post('/question-bank/publish', data),
  bulkDeleteQuestions: (questionIds) => api.post('/question-bank/bulk-delete', { questionIds }),
  deleteQuestion: (id) => api.delete(`/question-bank/${id}`)
};

// AI Exam Generator API
export const aiExamAPI = {
  generateExam: (data) => api.post('/ai-exam/generate', data),
};

// Notification API
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markReadAll: () => api.put('/notifications/read-all')
};

// SuperAdmin API
export const superAdminAPI = {
  getAnalytics: () => api.get('/superadmin/analytics'),
  getAuditLogs: () => api.get('/superadmin/audit-logs'),
  updateInstitutionPlan: (name, plan) => api.put('/superadmin/institution-plan', { name, plan }),
  getBackup: () => api.get('/superadmin/backup'),
  getStudents: () => api.get('/superadmin/students'),
  deleteStudent: (id) => api.delete(`/superadmin/students/${id}`),
  resendStudentCredentials: (id, customPassword) => api.post(`/superadmin/students/${id}/resend-credentials`, { customPassword }),
  deleteInstitution: (name) => api.delete(`/superadmin/institution/${encodeURIComponent(name)}`)
};