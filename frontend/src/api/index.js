import api from './axios';

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  changeCredentials: (data) => api.put('/auth/change-credentials', data),
  addAdmin: (adminData) => api.post('/auth/add-admin', adminData),
  getAdmins: () => api.get('/auth/admins'),
  deleteAdmin: (adminId) => api.delete(`/auth/admins/${adminId}`),
};

// Exam API
export const examAPI = {
  getExams: () => api.get('/exams'),
  getExam: (id) => api.get(`/exams/${id}`),
  createExam: (examData) => api.post('/exams', examData),
  updateExam: (id, examData) => api.put(`/exams/${id}`, examData),
  deleteExam: (id) => api.delete(`/exams/${id}`),
};

// Submission API
export const submissionAPI = {
  submitExam: (submissionData) => api.post('/submissions', submissionData),
  getMySubmissions: () => api.get('/submissions/my'),
  getAllSubmissions: (examId) => api.get(`/submissions${examId ? `?examId=${examId}` : ''}`),
  getSubmission: (id) => api.get(`/submissions/${id}`),
  deleteSubmission: (id) => api.delete(`/submissions/${id}`),
};