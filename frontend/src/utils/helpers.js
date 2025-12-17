export const formatDate = (dateString) => {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const calculateTimeRemaining = (endTime) => {
  const now = new Date().getTime();
  const end = new Date(endTime).getTime();
  const difference = end - now;
  
  if (difference <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  
  const hours = Math.floor(difference / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds, expired: false };
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const getGradeColor = (percentage) => {
  if (percentage >= 90) return '#059669'; // green-600
  if (percentage >= 80) return '#3b82f6'; // blue-600
  if (percentage >= 70) return '#ca8a04'; // yellow-600
  if (percentage >= 60) return '#ea580c'; // orange-600
  return '#dc2626'; // red-600
};

export const getGradeLetter = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

export const getExamStatus = (exam) => {
  const now = new Date();
  const startTime = new Date(exam.startTime);
  const endTime = new Date(exam.endTime);
  
  if (now < startTime) {
    return { status: 'upcoming', color: '#3b82f6', text: 'Upcoming' };
  } else if (now >= startTime && now <= endTime) {
    return { status: 'active', color: '#059669', text: 'Active' };
  } else {
    return { status: 'completed', color: '#6b7280', text: 'Completed' };
  }
};