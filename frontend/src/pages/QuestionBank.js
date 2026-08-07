import React, { useState, useEffect } from 'react';
import { questionBankAPI } from '../api';
import { 
  BookOpen, 
  Plus, 
  Upload, 
  Sparkles, 
  Trash2, 
  Search, 
  Filter, 
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

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
        toast.success(`✨ Gemini AI generated & added ${gen.length} questions to Question Bank!`);
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
    try {
      // Parse simple JSON or CSV format
      let parsed = [];
      try {
        parsed = JSON.parse(csvText);
      } catch (e) {
        toast.error('Invalid JSON/CSV format. Provide an array of question objects.');
        return;
      }

      await questionBankAPI.importBulk(parsed);
      toast.success(`Successfully imported ${parsed.length} questions!`);
      setShowImportModal(false);
      setCsvText('');
      fetchQuestions();
    } catch (err) {
      toast.error('Import failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question from Question Bank?')) return;
    try {
      await questionBankAPI.deleteQuestion(id);
      toast.success('Question deleted');
      fetchQuestions();
    } catch (err) {
      toast.error('Failed to delete question');
    }
  };

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
            Central repository for MCQs, categorisation, CSV import, and AI question generation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
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
              backgroundColor: '#059669',
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
          {questions.map((q, idx) => (
            <div key={q._id} style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderLeft: `4px solid ${q.difficulty === 'Hard' ? '#ef4444' : q.difficulty === 'Medium' ? '#f59e0b' : '#10b981'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', backgroundColor: '#e0e7ff', color: '#3730a3', marginRight: '8px' }}>
                    {q.category}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', backgroundColor: q.difficulty === 'Hard' ? '#fee2e2' : q.difficulty === 'Medium' ? '#fef3c7' : '#d1fae5', color: q.difficulty === 'Hard' ? '#991b1b' : q.difficulty === 'Medium' ? '#92400e' : '#065f46' }}>
                    {q.difficulty} ({q.marks} Mark{q.marks > 1 ? 's' : ''})
                  </span>
                </div>
                <button 
                  onClick={() => handleDelete(q._id)}
                  style={{ backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
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
          ))}
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
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>
                  💡 Paste your syllabus modules to generate targeted MCQs matching your exact curriculum.
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
                  <>✨ Generating up to {aiCount} Questions with Gemini AI...</>
                ) : (
                  <>✨ Generate & Add {aiCount} Questions to Question Bank</>
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
