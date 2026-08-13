import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examAPI, aiExamAPI, authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Plus,
  Trash2,
  Save,
  FileText,
  Check,
  X,
  Sparkles,
  Wand2,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { toast } from 'react-toastify';

const CreateExam = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin' || user?.email === 'admin@examin.com';

  const [approvedInstitutions, setApprovedInstitutions] = useState([]);

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const res = await authAPI.getApprovedInstitutions();
      setApprovedInstitutions(res.data?.institutions || []);
    } catch (err) {
      console.error('Error fetching approved institutions:', err);
    }
  };

  const getDefaultDates = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formatDateTime = (date) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    return {
      startDate: formatDateTime(now),
      endDate: formatDateTime(tomorrow)
    };
  };

  const defaults = getDefaultDates();

  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    duration: 60,
    institution: user?.institution || '',
    startDate: defaults.startDate,
    endDate: defaults.endDate,
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    marks: 1
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // AI Generator Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiForm, setAiForm] = useState({
    topic: '',
    subject: '',
    difficulty: 'Medium',
    count: 5
  });

  const handleGenerateAiExam = async (e) => {
    if (e) e.preventDefault();
    const topicToUse = aiForm.topic || examData.subject || examData.title || 'General Knowledge';
    
    setAiLoading(true);
    try {
      const res = await aiExamAPI.generateExam({
        topic: topicToUse,
        subject: aiForm.subject || examData.subject || topicToUse,
        difficulty: aiForm.difficulty,
        count: aiForm.count
      });

      if (res.data?.success) {
        const generated = res.data;
        const formattedQuestions = (generated.questions || []).map(q => ({
          ...q,
          isAiGenerated: true,
          source: generated.source || 'AI Engine'
        }));

        setExamData(prev => ({
          ...prev,
          title: prev.title || generated.title,
          subject: prev.subject || generated.subject,
          duration: prev.duration || generated.duration || 60,
          questions: [...prev.questions, ...formattedQuestions]
        }));

        toast.success(`${generated.source || 'AI'} generated ${generated.questions.length} questions for "${topicToUse}"!`);
        setShowAiModal(false);
      }
    } catch (err) {
      console.error('Error generating AI exam:', err);
      toast.error('Failed to generate AI questions. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleExamDataChange = (e) => {
    const { name, value } = e.target;
    setExamData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) =>
        i === index ? { ...option, text: value } : option
      )
    }));
  };

  const handleCorrectAnswerChange = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) => ({
        ...option,
        isCorrect: i === index
      }))
    }));
  };

  const addOption = () => {
    if (currentQuestion.options.length < 6) {
      setCurrentQuestion(prev => ({
        ...prev,
        options: [...prev.options, { text: '', isCorrect: false }]
      }));
    }
  };

  const removeOption = (index) => {
    if (currentQuestion.options.length > 2) {
      setCurrentQuestion(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const addQuestion = () => {
    // Validate current question
    if (!currentQuestion.question.trim()) {
      toast.error('Question text is required');
      return;
    }

    const filledOptions = currentQuestion.options.filter(opt => opt.text.trim());
    if (filledOptions.length < 2) {
      toast.error('At least 2 options are required');
      return;
    }

    const hasCorrectAnswer = currentQuestion.options.some(opt => opt.isCorrect);
    if (!hasCorrectAnswer) {
      toast.error('Please select the correct answer');
      return;
    }

    const questionToAdd = {
      ...currentQuestion,
      options: currentQuestion.options.filter(opt => opt.text.trim())
    };

    setExamData(prev => ({
      ...prev,
      questions: [...prev.questions, questionToAdd]
    }));

    // Reset current question
    setCurrentQuestion({
      question: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      marks: 1
    });

    toast.success('Question added successfully');
  };

  const removeQuestion = (index) => {
    setExamData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
    toast.success('Question removed');
  };

  const editQuestion = (index) => {
    const qToEdit = examData.questions[index];
    setCurrentQuestion({
      question: qToEdit.question,
      options: qToEdit.options.map(opt => ({ ...opt })),
      marks: qToEdit.marks || 1
    });
    setExamData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
    toast.info(`Editing Question Q${index + 1}. Modify details and click "Add Question" to save.`);
  };

  const validateExam = () => {
    const newErrors = {};

    if (!examData.title.trim()) {
      newErrors.title = 'Exam title is required';
    }

    if (!examData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!examData.duration || examData.duration < 1) {
      newErrors.duration = 'Duration must be at least 1 minute';
    }

    if (!examData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!examData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (examData.startDate && examData.endDate) {
      const startDate = new Date(examData.startDate);
      const endDate = new Date(examData.endDate);

      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (examData.questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('=== EXAM CREATION DEBUG ===');
    console.log('Exam Data:', JSON.stringify(examData, null, 2));
    console.log('Title:', examData.title);
    console.log('Subject:', examData.subject);
    console.log('Duration:', examData.duration);
    console.log('Start Date:', examData.startDate);
    console.log('End Date:', examData.endDate);
    console.log('Questions Count:', examData.questions.length);
    console.log('Questions:', examData.questions);

    if (!validateExam()) {
      console.error('Frontend validation failed');
      return;
    }

    console.log('Frontend validation passed, sending to backend...');
    setLoading(true);
    try {
      const response = await examAPI.createExam(examData);
      console.log('Exam created successfully:', response);
      toast.success('Exam created successfully!');
      if (isSuperAdmin) {
        navigate('/super-admin');
      } else {
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      console.error('Error response:', error.response?.data);
      // If validation errors came from the server (express-validator), map them to the form
      const serverErrors = error.response?.data?.errors;
      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        console.error('Server validation errors:', serverErrors);
        const newErrors = {};
        const errorList = serverErrors.map(err => `• ${err.path || err.param || 'field'}: ${err.msg || err.message}`).join('\n');
        serverErrors.forEach(err => {
          newErrors[err.param || err.path] = err.msg || err.message || 'Invalid value';
        });
        setErrors(prev => ({ ...prev, ...newErrors }));
        alert(`Exam Validation Failed:\n\n${errorList}`);
        toast.error('Exam validation failed. Please check the inputs.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create exam');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem'
            }}>
              Create New Exam
            </h1>
            <p style={{
              color: '#6b7280',
              fontSize: '1rem',
              margin: 0
            }}>
              Fill in the exam details or use AI to generate questions automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setAiForm(prev => ({
                ...prev,
                topic: examData.subject || examData.title || '',
                subject: examData.subject || ''
              }));
              setShowAiModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              color: '#ffffff',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.5rem',
              fontWeight: '700',
              fontSize: '0.925rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            <Sparkles size={18} /> Build Exam with AI
          </button>
        </div>

        {/* AI Generator Modal */}
        {showAiModal && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              maxWidth: '520px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid #e2e8f0'
            }}>
              {/* Modal Header */}
              <div style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                color: '#ffffff',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Sparkles size={22} />
                  <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>
                    AI Exam & Question Builder
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleGenerateAiExam} style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: 0, marginBottom: '1.25rem' }}>
                  Enter any topic or subject below. AI will automatically generate structured questions, options, and duration for your exam!
                </p>

                {/* Topic Field */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Exam Topic / Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={aiForm.topic}
                    onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                    placeholder="e.g. Python Basics, Machine Learning, World History..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Quick Topic Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  {['Python', 'JavaScript', 'Data Structures', 'Mathematics', 'General Science', 'Java'].map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setAiForm({ ...aiForm, topic: item, subject: item })}
                      style={{
                        backgroundColor: aiForm.topic === item ? '#7c3aed' : '#f1f5f9',
                        color: aiForm.topic === item ? '#ffffff' : '#475569',
                        border: 'none',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        fontSize: '0.775rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      + {item}
                    </button>
                  ))}
                </div>

                {/* Difficulty & Count */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                      Difficulty Level
                    </label>
                    <select
                      value={aiForm.difficulty}
                      onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.7rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                      Number of Questions
                    </label>
                    <select
                      value={aiForm.count}
                      onChange={(e) => setAiForm({ ...aiForm, count: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.7rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}
                    >
                      <option value="5">5 Questions</option>
                      <option value="10">10 Questions</option>
                      <option value="15">15 Questions</option>
                      <option value="20">20 Questions</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAiModal(false)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={aiLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.4rem',
                      background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      opacity: aiLoading ? 0.7 : 1
                    }}
                  >
                    {aiLoading ? <RefreshCw size={18} className="animate-spin" /> : <Wand2 size={18} />}
                    {aiLoading ? 'Generating AI Questions...' : 'Generate Questions'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Exam Details */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            marginBottom: '2rem'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center'
              }}>
                <BookOpen style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                Exam Details
              </h2>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={examData.title}
                    onChange={handleExamDataChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.title ? '#dc2626' : '#d1d5db'}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    placeholder="Enter exam title"
                  />
                  {errors.title && (
                    <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {errors.title}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={examData.subject}
                    onChange={handleExamDataChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.subject ? '#dc2626' : '#d1d5db'}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    placeholder="Enter subject"
                  />
                  {errors.subject && (
                    <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {errors.subject}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>
                    Target Institution / School
                  </label>
                  {isSuperAdmin ? (
                    <select
                      name="institution"
                      value={examData.institution}
                      onChange={handleExamDataChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#0f172a',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <option value="">🏢 All Institutions (Global / All Students)</option>
                      {approvedInstitutions.map((inst) => (
                        <option key={inst} value={inst}>
                          🏫 {inst}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="institution"
                      value={examData.institution || user?.institution || 'General'}
                      readOnly
                      disabled
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        backgroundColor: '#f8fafc',
                        color: '#64748b',
                        fontWeight: '600'
                      }}
                    />
                  )}
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                    {isSuperAdmin
                      ? 'Select the specific institution for this exam, or choose "All Institutions" for global availability.'
                      : 'Automatically assigned to your institution.'}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={examData.duration}
                    onChange={handleExamDataChange}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.duration ? '#dc2626' : '#d1d5db'}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    placeholder="60"
                  />
                  {errors.duration && (
                    <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {errors.duration}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={examData.startDate}
                    onChange={handleExamDataChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.startDate ? '#dc2626' : '#d1d5db'}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                  {errors.startDate && (
                    <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {errors.startDate}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={examData.endDate}
                    onChange={handleExamDataChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.endDate ? '#dc2626' : '#d1d5db'}`,
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                  {errors.endDate && (
                    <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {errors.endDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Add Question */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            marginBottom: '2rem'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Plus style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                Add Question
              </h2>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Question *
                </label>
                <textarea
                  name="question"
                  value={currentQuestion.question}
                  onChange={handleQuestionChange}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  placeholder="Enter your question here..."
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Options (Select the correct answer)
                </label>
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <button
                      type="button"
                      className="option-radio-btn"
                      onClick={() => handleCorrectAnswerChange(index)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '1.5rem',
                        height: '1.5rem',
                        minWidth: '1.5rem',
                        minHeight: '1.5rem',
                        maxWidth: '1.5rem',
                        maxHeight: '1.5rem',
                        borderRadius: '50%',
                        border: `2px solid ${option.isCorrect ? '#059669' : '#d1d5db'}`,
                        backgroundColor: option.isCorrect ? '#059669' : '#ffffff',
                        color: '#ffffff',
                        cursor: 'pointer',
                        flexShrink: 0,
                        padding: 0,
                        boxSizing: 'border-box'
                      }}
                    >
                      {option.isCorrect && <Check style={{ width: '0.75rem', height: '0.75rem' }} />}
                    </button>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        outline: 'none',
                        minWidth: 0
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    {currentQuestion.options.length > 2 && (
                      <button
                        type="button"
                        className="remove-option-btn"
                        onClick={() => removeOption(index)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2.25rem',
                          height: '2.25rem',
                          minWidth: '2.25rem',
                          minHeight: '2.25rem',
                          maxWidth: '2.25rem',
                          maxHeight: '2.25rem',
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          flexShrink: 0,
                          padding: 0,
                          boxSizing: 'border-box'
                        }}
                      >
                        <X style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    )}
                  </div>
                ))}

                {currentQuestion.options.length < 6 && (
                  <button
                    type="button"
                    onClick={addOption}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      color: '#3b82f6',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      marginTop: '0.5rem'
                    }}
                  >
                    <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                    Add Option
                  </button>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Marks
                  </label>
                  <input
                    type="number"
                    name="marks"
                    value={currentQuestion.marks}
                    onChange={handleQuestionChange}
                    min="1"
                    style={{
                      width: '80px',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={addQuestion}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  Add Question
                </button>
              </div>
            </div>
          </div>

          {/* Questions List */}
          {examData.questions.length > 0 && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              marginBottom: '2rem'
            }}>
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <FileText style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                  Questions ({examData.questions.length})
                </h2>
              </div>

              <div style={{ padding: '1.5rem' }}>
                {examData.questions.map((question, index) => (
                  <div
                    key={index}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      marginBottom: '1rem'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <h4 style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: '#1f2937',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        <span>Q{index + 1}. {question.question}</span>
                        {question.isAiGenerated ? (
                          <span style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', fontSize: '0.7rem', padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: '700', border: '1px solid #d8b4fe' }}>
                            AI Generated ({question.source || 'AI'})
                          </span>
                        ) : (
                          <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}>
                            Manual
                          </span>
                        )}
                      </h4>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => editQuestion(index)}
                          title="Edit Question"
                          style={{
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.3rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Edit3 style={{ width: '0.875rem', height: '0.875rem' }} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          title="Delete Question"
                          style={{
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.3rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Trash2 style={{ width: '0.875rem', height: '0.875rem' }} />
                        </button>
                      </div>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.5rem',
                            backgroundColor: option.isCorrect ? '#d1fae5' : '#f8fafc',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                          }}
                        >
                          <span style={{
                            width: '1rem',
                            height: '1rem',
                            borderRadius: '50%',
                            backgroundColor: option.isCorrect ? '#059669' : '#d1d5db',
                            marginRight: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {option.isCorrect && <Check style={{ width: '0.5rem', height: '0.5rem', color: '#ffffff' }} />}
                          </span>
                          {option.text}
                        </div>
                      ))}
                    </div>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                      Marks: {question.marks}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.questions && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '1rem',
              borderRadius: '0.375rem',
              marginBottom: '2rem'
            }}>
              {errors.questions}
            </div>
          )}

          {/* Submit Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={{
                backgroundColor: '#6b7280',
                color: '#ffffff',
                padding: '0.75rem 2rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || examData.questions.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: loading || examData.questions.length === 0 ? '#9ca3af' : '#3b82f6',
                color: '#ffffff',
                padding: '0.75rem 2rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: loading || examData.questions.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              <Save style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              {loading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExam;