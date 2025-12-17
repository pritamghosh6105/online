import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examAPI } from '../api';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Save, 
  Calendar,
  Clock,
  FileText,
  Check,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';

const CreateExam = () => {
  const navigate = useNavigate();
  
  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    duration: 60,
    startDate: '',
    endDate: '',
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
      navigate('/admin');
    } catch (error) {
      console.error('Error creating exam:', error);
      console.error('Error response:', error.response?.data);
      // If validation errors came from the server (express-validator), map them to the form
      const serverErrors = error.response?.data?.errors;
      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        console.error('Server validation errors:', serverErrors);
        const newErrors = {};
        serverErrors.forEach(err => {
          // err.param might be like 'title' or 'questions.0.question'
          // We'll map it directly so existing inputs can read the message if named accordingly.
          newErrors[err.param] = err.msg || err.message || 'Invalid value';
        });
        setErrors(prev => ({ ...prev, ...newErrors }));
        toast.error(error.response?.data?.message || 'Validation failed');
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
          marginBottom: '2rem'
        }}>
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
            fontSize: '1rem'
          }}>
            Fill in the exam details and add questions to create a new exam.
          </p>
        </div>

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
                      onClick={() => handleCorrectAnswerChange(index)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: '50%',
                        border: `2px solid ${option.isCorrect ? '#059669' : '#d1d5db'}`,
                        backgroundColor: option.isCorrect ? '#059669' : '#ffffff',
                        color: '#ffffff',
                        cursor: 'pointer'
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
                        outline: 'none'
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    {currentQuestion.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2rem',
                          height: '2rem',
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
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
                        flex: 1
                      }}>
                        Q{index + 1}. {question.question}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        style={{
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '0.375rem',
                          padding: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                      </button>
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