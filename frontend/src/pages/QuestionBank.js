import React, { useState, useEffect } from 'react';
import { questionBankAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Plus, 
  Upload, 
  Sparkles, 
  Trash2, 
  Search, 
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  X,
  Send,
  CheckSquare,
  Square,
  Info,
  Building2
} from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const QuestionBank = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  // Selection state
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Form State
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    category: 'Mathematics',
    subject: 'General',
    difficulty: 'Medium',
    marks: 1,
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    explanation: ''
  });

  // AI Prompt State
  const [aiTopic, setAiTopic] = useState('');
  const [aiSyllabus, setAiSyllabus] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('Medium');
  const [aiCount, setAiCount] = useState(50);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Publish Form State
  const [publishForm, setPublishForm] = useState({
    category: 'General',
    note: ''
  });
  const [publishing, setPublishing] = useState(false);

  // CSV text import state
  const [csvText, setCsvText] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [categoryFilter, difficultyFilter]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await questionBankAPI.getQuestions({
        category: categoryFilter,
        difficulty: difficultyFilter,
        search
      });
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      toast.error('Failed to load question bank');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.question.trim()) {
      toast.error('Question text is required');
      return;
    }
    try {
      await questionBankAPI.createQuestion(newQuestion);
      toast.success('Question added to Question Bank!');
      setShowAddModal(false);
      fetchQuestions();
    } catch (err) {
      toast.error('Failed to add question');
    }
  };

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    try {
      setAiGenerating(true);
      const countVal = Math.min(Math.max(parseInt(aiCount) || 50, 1), 50);
      const res = await questionBankAPI.aiGenerateQuestions({
        topic: aiTopic,
        syllabus: aiSyllabus,
        difficulty: aiDifficulty,
        count: countVal
      });

      const gen = res.data.questions || [];
      if (gen.length > 0) {
        await questionBankAPI.importBulk(gen);
        toast.success(`Gemini AI generated & added ${gen.length} questions to Question Bank!`);
        setShowAIModal(false);
        setAiTopic('');
        setAiSyllabus('');
        fetchQuestions();
      } else {
        toast.error('No questions were generated');
      }
    } catch (err) {
      console.error('AI Question Generation error:', err);
      toast.error(err.response?.data?.message || 'AI question generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!csvText || !csvText.trim()) {
      toast.error('Please paste JSON or CSV text to import');
      return;
    }

    try {
      let parsed = [];
      const trimmed = csvText.trim();

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const jsonObj = JSON.parse(trimmed);
          if (Array.isArray(jsonObj)) {
            parsed = jsonObj;
          } else if (jsonObj && Array.isArray(jsonObj.questions)) {
            parsed = jsonObj.questions;
          } else if (jsonObj && jsonObj.question) {
            parsed = [jsonObj];
          }
        } catch (jsonErr) {
          toast.error('Invalid JSON format. Please check JSON syntax (quotes, commas, brackets).');
          return;
        }
      } else {
        // Simple CSV parser fallback
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        parsed = lines.map((line) => {
          const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
          if (parts.length >= 3) {
            const questionText = parts[0];
            const opts = parts.slice(1, -1);
            const ansText = parts[parts.length - 1];
            return {
              question: questionText,
              options: opts.length > 0 ? opts : parts.slice(1),
              correctAnswer: ansText
            };
          }
          return null;
        }).filter(Boolean);
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        toast.error('Could not parse valid questions. Provide an array of question objects or CSV lines.');
        return;
      }

      const res = await questionBankAPI.importBulk(parsed);
      const importedCount = res.data?.count || parsed.length;
      toast.success(`Successfully imported ${importedCount} question(s) into Question Bank!`);
      setShowImportModal(false);
      setCsvText('');
      fetchQuestions();
    } catch (err) {
      console.error('Import questions error:', err);
      toast.error(err.response?.data?.message || 'Import failed. Check question format.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question from Question Bank?')) return;
    try {
      await questionBankAPI.deleteQuestion(id);
      toast.success('Question deleted');
      setSelectedQuestionIds(prev => prev.filter(qId => qId !== id));
      fetchQuestions();
    } catch (err) {
      toast.error('Failed to delete question');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestionIds.length === 0) {
      toast.error('Please select questions to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedQuestionIds.length} selected question(s) from Question Bank?`)) {
      return;
    }

    try {
      await questionBankAPI.bulkDeleteQuestions(selectedQuestionIds);
      toast.success(`Successfully deleted ${selectedQuestionIds.length} question(s)`);
      setSelectedQuestionIds([]);
      fetchQuestions();
    } catch (err) {
      console.error('Bulk delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete selected questions');
    }
  };

  // Selection handlers
  const toggleSelectQuestion = (id) => {
    setSelectedQuestionIds(prev =>
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedQuestionIds.length === questions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(questions.map(q => q._id));
    }
  };

  const openPublishModal = () => {
    const questionsToUse = selectedQuestionIds.length > 0
      ? questions.filter(q => selectedQuestionIds.includes(q._id))
      : questions;

    if (questionsToUse.length === 0) {
      toast.error('No questions available in Question Bank to publish');
      return;
    }

    const defaultSub = categoryFilter || questionsToUse[0]?.category || 'General';

    setPublishForm({
      category: defaultSub,
      note: ''
    });
    setShowPublishModal(true);
  };

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    const targetQuestionIds = selectedQuestionIds.length > 0
      ? selectedQuestionIds
      : questions.map(q => q._id);

    try {
      setPublishing(true);
      const res = await questionBankAPI.publishQuestionBank({
        questionIds: targetQuestionIds,
        category: publishForm.category
      });

      toast.success(`Question Bank published to students! (${res.data.publishedCount || targetQuestionIds.length} MCQs active for ${user?.institution || 'your admin students'})`);
      setShowPublishModal(false);
      setSelectedQuestionIds([]);
      fetchQuestions();
    } catch (err) {
      console.error('Publish Question Bank error:', err);
      toast.error(err.response?.data?.message || 'Failed to publish Question Bank');
    } finally {
      setPublishing(false);
    }
  };

  const selectedCount = selectedQuestionIds.length;
  const targetQuestionsForPublish = selectedCount > 0
    ? questions.filter(q => selectedQuestionIds.includes(q._id))
    : questions;

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen style={{ color: '#2563eb' }} /> Question Bank & AI Generator
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b' }}>
            Central MCQ repository. Generate with AI, select questions, and publish Question Banks directly to your students.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Publish Question Bank Button */}
          <button
            onClick={openPublishModal}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            <BookOpen style={{ width: '18px', height: '18px' }} />
            Publish Question Bank to Students ({selectedCount > 0 ? selectedCount : 'All'})
          </button>

          <button 
            onClick={() => setShowAIModal(true)}
            style={{
              backgroundColor: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
            }}
          >
            <Sparkles style={{ width: '18px', height: '18px' }} /> AI Generator
          </button>

          <button 
            onClick={() => setShowImportModal(true)}
            style={{
              backgroundColor: '#475569',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Upload style={{ width: '18px', height: '18px' }} /> Import CSV/JSON
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus style={{ width: '18px', height: '18px' }} /> Add Question
          </button>
        </div>
      </div>

      {/* Floating Selection & Publish Action Bar */}
      {questions.length > 0 && (
        <div style={{
          backgroundColor: selectedCount > 0 ? '#ecfdf5' : '#ffffff',
          border: `1px solid ${selectedCount > 0 ? '#a7f3d0' : '#e2e8f0'}`,
          padding: '14px 18px',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 280px', flexWrap: 'wrap' }}>
            <button
              onClick={toggleSelectAll}
              style={{
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#334155',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {selectedCount === questions.length && questions.length > 0 ? (
                <CheckSquare style={{ width: '16px', height: '16px', color: '#059669', flexShrink: 0 }} />
              ) : (
                <Square style={{ width: '16px', height: '16px', color: '#64748b', flexShrink: 0 }} />
              )}
              <span>{selectedCount === questions.length && questions.length > 0 ? 'Deselect All' : `Select All (${questions.length})`}</span>
            </button>
            <span style={{ fontSize: '0.875rem', color: '#334155', fontWeight: 600, flex: '1 1 180px', lineHeight: '1.4' }}>
              {selectedCount > 0 ? (
                <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle style={{ width: '15px', height: '15px' }} /> {selectedCount} question(s) selected
                </span>
              ) : (
                <span style={{ color: '#64748b' }}>
                  Select questions below to publish a Question Bank study set for your students
                </span>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
            {selectedCount > 0 && (
              <button
                onClick={handleBulkDelete}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
                  whiteSpace: 'nowrap',
                  flex: '1 1 auto'
                }}
              >
                <Trash2 style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                Delete Selected ({selectedCount})
              </button>
            )}

            <button
              onClick={openPublishModal}
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '9px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                flex: '1 1 auto'
              }}
            >
              <Send style={{ width: '15px', height: '15px', flexShrink: 0 }} />
              {selectedCount > 0 ? `Publish Selected (${selectedCount}) Question Bank` : 'Publish All Question Bank'}
            </button>
          </div>
        </div>
      )}

      {/* Controls / Filters */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '16px 20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: '8px' }}>
          <Search style={{ color: '#94a3b8', width: '18px', height: '18px' }} />
          <input 
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && fetchQuestions()}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem' }}
          />
        </div>

        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
        >
          <option value="">All Categories</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Physics">Physics</option>
          <option value="Computer Science">Computer Science</option>
          <option value="General Knowledge">General Knowledge</option>
        </select>

        <select 
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {/* Question List */}
      {loading ? (
        <LoadingSpinner text="Loading Question Bank..." />
      ) : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#ffffff', borderRadius: '12px', color: '#64748b' }}>
          <HelpCircle style={{ width: '48px', height: '48px', color: '#cbd5e1', marginBottom: '12px' }} />
          <h3>No Questions Found</h3>
          <p>Click "Add Question" or "AI Generator" to populate your Question Bank.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {questions.map((q, idx) => {
            const isSelected = selectedQuestionIds.includes(q._id);
            return (
              <div 
                key={q._id} 
                onClick={() => toggleSelectQuestion(q._id)}
                style={{
                  backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  borderLeft: `4px solid ${q.difficulty === 'Hard' ? '#ef4444' : q.difficulty === 'Medium' ? '#f59e0b' : '#10b981'}`,
                  border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent div onClick
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#059669' }}
                    />
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', backgroundColor: '#e0e7ff', color: '#3730a3', marginRight: '8px' }}>
                        {q.category}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', backgroundColor: q.difficulty === 'Hard' ? '#fee2e2' : q.difficulty === 'Medium' ? '#fef3c7' : '#d1fae5', color: q.difficulty === 'Hard' ? '#991b1b' : q.difficulty === 'Medium' ? '#92400e' : '#065f46' }}>
                        {q.difficulty} ({q.marks || 1} Mark{q.marks > 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(q._id);
                    }}
                    style={{ backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    title="Delete Question"
                  >
                    <Trash2 style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>

                <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', color: '#0f172a' }}>
                  Q{idx + 1}. {q.question}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {q.options.map((opt, i) => (
                    <div key={i} style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      backgroundColor: opt.isCorrect ? '#ecfdf5' : '#f8fafc',
                      border: opt.isCorrect ? '1px solid #10b981' : '1px solid #e2e8f0',
                      color: opt.isCorrect ? '#065f46' : '#334155',
                      fontWeight: opt.isCorrect ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>{String.fromCharCode(65 + i)}. {opt.text}</span>
                      {opt.isCorrect && <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Publish Question Bank Modal */}
      {showPublishModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <BookOpen style={{ width: '22px', height: '22px' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                    Publish Question Bank to Students
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Publish MCQs directly to the Student Question Bank Practice Portal
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPublishModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Summary Box */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Questions To Publish</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>
                  {targetQuestionsForPublish.length} MCQs
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Target Students</span>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 style={{ width: '14px', height: '14px' }} /> {user?.institution || 'All Students under Admin'}
                </div>
              </div>
            </div>

            <form onSubmit={handlePublishSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>
                  Subject / Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics, Computer Science"
                  value={publishForm.category}
                  onChange={(e) => setPublishForm({ ...publishForm, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                fontSize: '0.825rem',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px'
              }}>
                <Info style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Practice Mode:</strong> Published Question Bank questions will be accessible by your students on their dashboard for self-paced study with instant answer keys and explanations (not an exam).
                </div>
              </div>

              <button
                type="submit"
                disabled={publishing}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: publishing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                }}
              >
                {publishing ? (
                  <><BookOpen style={{ width: '18px', height: '18px' }} /> Publishing Question Bank to Students...</>
                ) : (
                  <><BookOpen style={{ width: '18px', height: '18px' }} /> Confirm & Publish Question Bank ({targetQuestionsForPublish.length} MCQs)</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Add New Question to Bank</h2>
              <button onClick={() => setShowAddModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleCreateQuestion}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>Question Text</label>
                <textarea 
                  rows={3} 
                  value={newQuestion.question} 
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Category</label>
                  <input type="text" value={newQuestion.category} onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Difficulty</label>
                  <select value={newQuestion.difficulty} onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Marks</label>
                  <input type="number" min="1" value={newQuestion.marks} onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Options (Select radio for correct answer)</label>
                {newQuestion.options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <input 
                      type="radio" 
                      name="correctOption" 
                      checked={opt.isCorrect} 
                      onChange={() => {
                        const updated = newQuestion.options.map((o, idx) => ({ ...o, isCorrect: idx === i }));
                        setNewQuestion({ ...newQuestion, options: updated });
                      }} 
                    />
                    <input 
                      type="text" 
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...newQuestion.options];
                        updated[i].text = e.target.value;
                        setNewQuestion({ ...newQuestion, options: updated });
                      }}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      required
                    />
                  </div>
                ))}
              </div>

              <button type="submit" style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Save Question
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Generator Modal */}
      {showAIModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', maxWidth: '560px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed' }}>
                <Sparkles /> Gemini AI Question Generator
              </h2>
              <button onClick={() => setShowAIModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleAIGenerate}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
                  Topic / Subject <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="e.g., Data Structures & Algorithms, Organic Chemistry, Indian Polity"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                  required
                />
              </div>

              {/* Optional Syllabus Input */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>
                  Syllabus / Curriculum Guidelines <span style={{ fontWeight: 400, color: '#64748b', fontSize: '0.8rem' }}>(Optional)</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Module 1: Binary Search Trees, AVL Trees & Heaps&#10;Module 2: Graph Algorithms (BFS, DFS, Shortest Path)&#10;Module 3: Dynamic Programming & Recursion"
                  value={aiSyllabus}
                  onChange={(e) => setAiSyllabus(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Info style={{ width: '14px', height: '14px' }} /> Paste your syllabus modules to generate targeted MCQs matching your exact curriculum.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>Difficulty</label>
                  <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                    <option value="Easy">Easy (1 Mark)</option>
                    <option value="Medium">Medium (2 Marks)</option>
                    <option value="Hard">Hard (3 Marks)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: '#1e293b' }}>Question Count (Up to 50)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="50" 
                    value={aiCount} 
                    onChange={(e) => setAiCount(e.target.value)} 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={aiGenerating} 
                style={{ 
                  width: '100%', 
                  backgroundColor: aiGenerating ? '#a78bfa' : '#7c3aed', 
                  color: '#ffffff', 
                  border: 'none', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  fontWeight: 700, 
                  fontSize: '0.95rem',
                  cursor: aiGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {aiGenerating ? (
                  <><Sparkles style={{ width: '18px', height: '18px' }} /> Generating up to {aiCount} Questions with Gemini AI...</>
                ) : (
                  <><Sparkles style={{ width: '18px', height: '18px' }} /> Generate & Add {aiCount} Questions to Question Bank</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '28px', maxWidth: '550px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet /> Import Questions (JSON / CSV)
              </h2>
              <button onClick={() => setShowImportModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleImportCSV}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>Paste JSON Array of Question Objects</label>
                <textarea 
                  rows={8}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`[\n  {\n    "question": "What is 2+2?",\n    "category": "Mathematics",\n    "difficulty": "Easy",\n    "options": [\n      {"text": "4", "isCorrect": true},\n      {"text": "5", "isCorrect": false}\n    ]\n  }\n]`}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>
              <button type="submit" style={{ width: '100%', backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Import Questions
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
