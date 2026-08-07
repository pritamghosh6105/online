import React, { useState, useEffect } from 'react';
import { questionBankAPI } from '../api';
import { 
  BookOpen, 
  Search, 
  HelpCircle, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  Sparkles
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const StudentQuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [revealedAnswers, setRevealedAnswers] = useState({});

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
      console.error('Error fetching question bank for student:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(questions.map(q => q.category).filter(Boolean)));

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '0.775rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            📚 Student Study Portal
          </span>
          <h1 style={{ margin: '8px 0 6px', fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen style={{ width: '28px', height: '28px' }} /> Published Question Bank
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', maxWidth: '650px' }}>
            Self-paced practice sets published by your institution admin with instant answer keys and step-by-step explanations.
          </p>
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '16px 20px',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.85, fontWeight: 700 }}>Total Practice MCQs</span>
          <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '2px' }}>
            {questions.length}
          </div>
        </div>
      </div>

      {/* Controls & Filters */}
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
            placeholder="Search question bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && fetchQuestions()}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.95rem' }}
          />
        </div>

        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }}
        >
          <option value="">All Subject Categories</option>
          {categories.map((cat, i) => (
            <option key={i} value={cat}>{cat}</option>
          ))}
          <option value="Mathematics">Mathematics</option>
          <option value="Physics">Physics</option>
          <option value="Computer Science">Computer Science</option>
        </select>

        <select 
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }}
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {/* Question List */}
      {loading ? (
        <LoadingSpinner text="Loading Published Question Bank..." />
      ) : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#ffffff', borderRadius: '12px', color: '#64748b', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <HelpCircle style={{ width: '48px', height: '48px', color: '#cbd5e1', marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px', color: '#1e293b' }}>No Question Bank Sets Available</h3>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Your admin has not published any Question Bank practice sets yet. Check back soon!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {questions.map((q, idx) => {
            const isAnswerRevealed = !!revealedAnswers[q._id];
            return (
              <div key={q._id} style={{
                backgroundColor: '#ffffff',
                padding: '22px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #e2e8f0',
                borderLeft: `4px solid ${q.difficulty === 'Hard' ? '#ef4444' : q.difficulty === 'Medium' ? '#f59e0b' : '#10b981'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                      {q.category || 'General'}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', backgroundColor: q.difficulty === 'Hard' ? '#fee2e2' : q.difficulty === 'Medium' ? '#fef3c7' : '#d1fae5', color: q.difficulty === 'Hard' ? '#991b1b' : q.difficulty === 'Medium' ? '#92400e' : '#065f46' }}>
                      {q.difficulty || 'Medium'} ({q.marks || 1} Mark{q.marks > 1 ? 's' : ''})
                    </span>
                  </div>

                  <button
                    onClick={() => setRevealedAnswers(prev => ({ ...prev, [q._id]: !prev[q._id] }))}
                    style={{
                      backgroundColor: isAnswerRevealed ? '#fee2e2' : '#ecfdf5',
                      color: isAnswerRevealed ? '#991b1b' : '#065f46',
                      border: `1px solid ${isAnswerRevealed ? '#fca5a5' : '#6ee7b7'}`,
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {isAnswerRevealed ? (
                      <><EyeOff style={{ width: '15px', height: '15px' }} /> Hide Answer Key</>
                    ) : (
                      <><Eye style={{ width: '15px', height: '15px' }} /> Reveal Answer Key & Explanation</>
                    )}
                  </button>
                </div>

                <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                  Q{idx + 1}. {q.question}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {q.options.map((opt, i) => {
                    const isCorrect = opt.isCorrect;
                    return (
                      <div key={i} style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        backgroundColor: isAnswerRevealed && isCorrect ? '#ecfdf5' : '#f8fafc',
                        border: isAnswerRevealed && isCorrect ? '2px solid #10b981' : '1px solid #cbd5e1',
                        color: isAnswerRevealed && isCorrect ? '#065f46' : '#334155',
                        fontWeight: isAnswerRevealed && isCorrect ? 700 : 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>{String.fromCharCode(65 + i)}. {opt.text}</span>
                        {isAnswerRevealed && isCorrect && (
                          <CheckCircle style={{ width: '18px', height: '18px', color: '#10b981' }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {isAnswerRevealed && (
                  <div style={{
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    fontSize: '0.875rem',
                    color: '#065f46',
                    marginTop: '16px'
                  }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles style={{ width: '16px', height: '16px', color: '#059669' }} /> Answer Key & Explanation:
                    </strong>
                    <p style={{ margin: '6px 0 0', lineHeight: 1.5 }}>
                      {q.explanation || 'Option ' + String.fromCharCode(65 + q.options.findIndex(o => o.isCorrect)) + ' is the correct answer.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentQuestionBank;
