const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Knowledge base for AI Question Generation across topics
const questionTemplates = {
  python: [
    {
      question: "Which of the following data types in Python is immutable?",
      options: ["Tuple", "List", "Dictionary", "Set"],
      correct: 0
    },
    {
      question: "What is the output of len({'a': 1, 'b': 2, 'c': 3})?",
      options: ["3", "6", "1", "TypeError"],
      correct: 0
    },
    {
      question: "Which keyword is used to define a function in Python?",
      options: ["def", "function", "func", "define"],
      correct: 0
    },
    {
      question: "What does the 'is' operator test in Python?",
      options: ["Object Identity (memory reference)", "Value equality", "Data type match", "String length"],
      correct: 0
    },
    {
      question: "Which built-in module is used for random number generation in Python?",
      options: ["random", "math", "os", "sys"],
      correct: 0
    },
    {
      question: "How do you start a list comprehension in Python?",
      options: ["[x for x in iterable]", "{x for x in iterable}", "(x for x in iterable)", "list(x for x in iterable)"],
      correct: 0
    }
  ],
  javascript: [
    {
      question: "Which method converts a JSON string into a JavaScript object?",
      options: ["JSON.parse()", "JSON.stringify()", "JSON.toObject()", "JSON.convert()"],
      correct: 0
    },
    {
      question: "Which operator is used for strict equality comparison without type coercion?",
      options: ["===", "==", "=", "equals()"],
      correct: 0
    },
    {
      question: "What is the return type of typeof NaN in JavaScript?",
      options: ["'number'", "'nan'", "'undefined'", "'object'"],
      correct: 0
    },
    {
      question: "Which keyword declares a block-scoped reassignable variable in ES6?",
      options: ["let", "var", "const", "static"],
      correct: 0
    },
    {
      question: "What is the default value of an uninitialized variable in JavaScript?",
      options: ["undefined", "null", "0", "false"],
      correct: 0
    }
  ],
  java: [
    {
      question: "Which OOP concept is achieved using Interfaces and Abstract Classes in Java?",
      options: ["Abstraction", "Encapsulation", "Inheritance", "Polymorphism"],
      correct: 0
    },
    {
      question: "What is the size of an int data type in Java?",
      options: ["32 bits (4 bytes)", "16 bits (2 bytes)", "64 bits (8 bytes)", "8 bits (1 byte)"],
      correct: 0
    },
    {
      question: "Which collection class allows unique elements only in Java?",
      options: ["HashSet", "ArrayList", "LinkedList", "Vector"],
      correct: 0
    },
    {
      question: "Which keyword prevents a method from being overridden in Java?",
      options: ["final", "static", "abstract", "private"],
      correct: 0
    }
  ],
  data_structures: [
    {
      question: "What is the time complexity of searching an element in a Balanced Binary Search Tree (AVL/Red-Black)?",
      options: ["O(log n)", "O(n)", "O(1)", "O(n log n)"],
      correct: 0
    },
    {
      question: "Which data structure follows the LIFO (Last In First Out) principle?",
      options: ["Stack", "Queue", "Heap", "Tree"],
      correct: 0
    },
    {
      question: "Which algorithm is used to find the shortest path in a weighted graph?",
      options: ["Dijkstra's Algorithm", "Kruskal's Algorithm", "Prim's Algorithm", "Breadth First Search"],
      correct: 0
    },
    {
      question: "What is the worst-case time complexity of QuickSort?",
      options: ["O(n²)", "O(n log n)", "O(n)", "O(log n)"],
      correct: 0
    }
  ],
  math: [
    {
      question: "What is the derivative of f(x) = x³ + 5x?",
      options: ["3x² + 5", "x² + 5", "3x²", "6x + 5"],
      correct: 0
    },
    {
      question: "What is the value of log₁₀(1000)?",
      options: ["3", "10", "100", "1"],
      correct: 0
    },
    {
      question: "If a matrix A has dimensions 3x2 and B has dimensions 2x4, what is the dimension of A * B?",
      options: ["3x4", "2x2", "3x2", "Matrix multiplication not possible"],
      correct: 0
    }
  ],
  general_science: [
    {
      question: "What is the SI unit of electric current?",
      options: ["Ampere (A)", "Volt (V)", "Watt (W)", "Ohm (Ω)"],
      correct: 0
    },
    {
      question: "Which organelle is known as the powerhouse of the cell?",
      options: ["Mitochondria", "Nucleus", "Ribosome", "Endoplasmic Reticulum"],
      correct: 0
    },
    {
      question: "What is the pH value of pure distilled water at 25°C?",
      options: ["7 (Neutral)", "0 (Strongly Acidic)", "14 (Strongly Basic)", "5.5"],
      correct: 0
    }
  ]
};

// @route   POST /api/ai-exam/generate
// @desc    Generate AI exam questions based on topic, subject, difficulty & syllabus (using Gemini API or built-in engine)
// @access  Private (Admin / Student)
router.post('/generate', protect, async (req, res) => {
  try {
    const { topic = '', subject = '', count = 5, difficulty = 'Medium', syllabus = '', questionType = 'MCQ' } = req.body;

    const targetCount = Math.min(Math.max(parseInt(count) || 5, 1), 20);
    const cleanTopic = topic.trim() || subject.trim() || 'General Knowledge';
    const cleanSyllabus = (syllabus || '').trim();
    const hasSyllabus = cleanSyllabus.length > 0;
    const formatInstruction = questionType === 'TrueFalse' 
      ? 'All questions MUST be True/False format with exactly 2 options ("True" and "False").' 
      : questionType === 'Mixed' 
      ? 'Include a mix of 4-option Multiple Choice (MCQ) and True/False questions.' 
      : 'All questions MUST be Multiple Choice (MCQ) format with exactly 4 options per question.';

    let syllabusPromptSection = '';
    if (hasSyllabus) {
      syllabusPromptSection = `\n\nPROVIDED COURSE SYLLABUS / STUDY MATERIAL:\n"""\n${cleanSyllabus}\n"""\nCRITICAL INSTRUCTION: All generated questions MUST be directly extracted from or specifically testing concepts, topics, or chapters in the above syllabus material. Do not generate questions outside this syllabus scope.`;
    }

    // 1. Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() && !apiKey.startsWith('AQ.')) {
      const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-pro'];
      const prompt = `You are an expert academic exam creator. Generate ${targetCount} high-quality questions for the topic "${cleanTopic}" (Subject: ${subject || cleanTopic}) at ${difficulty} difficulty level. ${formatInstruction}${syllabusPromptSection}
Return STRICTLY a JSON object with no markdown backticks, no commentary, matching this structure:
{
  "title": "${cleanTopic} ${difficulty} Assessment",
  "subject": "${subject || cleanTopic}",
  "duration": ${Math.min(targetCount * 5, 120)},
  "questions": [
    {
      "question": "Clear and detailed question text?",
      "options": [
        { "text": "Option 1", "isCorrect": true },
        { "text": "Option 2", "isCorrect": false }
      ],
      "marks": 1
    }
  ]
}`;

      for (const model of models) {
        try {
          console.log(`🤖 Invoking Gemini API model (${model}) for topic "${cleanTopic}" ${hasSyllabus ? 'with syllabus' : ''}...`);
          const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleanJson);
              if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                console.log(`✅ Gemini API (${model}) generated ${parsed.questions.length} questions successfully!`);
                return res.json({
                  success: true,
                  title: parsed.title || `${cleanTopic} ${difficulty} Assessment`,
                  subject: parsed.subject || subject || cleanTopic,
                  duration: parsed.duration || Math.min(targetCount * 5, 120),
                  questions: parsed.questions,
                  source: `Google Gemini API (${model})`
                });
              }
            }
          } else {
            console.warn(`Gemini model ${model} status: ${geminiRes.status}`);
          }
        } catch (geminiErr) {
          console.warn(`Gemini model ${model} error: ${geminiErr.message}`);
        }
      }
      console.warn('Gemini API calls finished without success. Using fallback generator.');
    }

    // 2. Built-in Dynamic Fallback AI Question Generator
    const searchTerm = (topic + ' ' + subject).toLowerCase();
    let baseQuestions = [];

    if (!hasSyllabus) {
      if (searchTerm.includes('python')) {
        baseQuestions = questionTemplates.python;
      } else if (searchTerm.includes('javascript') || searchTerm.includes('js') || searchTerm.includes('web')) {
        baseQuestions = questionTemplates.javascript;
      } else if (searchTerm.includes('java')) {
        baseQuestions = questionTemplates.java;
      } else if (searchTerm.includes('data structure') || searchTerm.includes('algorithm') || searchTerm.includes('dsa')) {
        baseQuestions = questionTemplates.data_structures;
      } else if (searchTerm.includes('math') || searchTerm.includes('calculus') || searchTerm.includes('algebra')) {
        baseQuestions = questionTemplates.math;
      } else if (searchTerm.includes('science') || searchTerm.includes('physics') || searchTerm.includes('chemistry') || searchTerm.includes('biology')) {
        baseQuestions = questionTemplates.general_science;
      }
    }

    // Extract syllabus lines/modules if provided
    const syllabusTopics = hasSyllabus
      ? cleanSyllabus
          .split(/\r?\n|;|\./)
          .map(line => line.replace(/^[-*•\d.\s]+/, '').trim())
          .filter(line => line.length > 3)
      : [];

    const generatedQuestions = [];

    for (let i = 0; i < targetCount; i++) {
      if (baseQuestions[i]) {
        const item = baseQuestions[i];
        generatedQuestions.push({
          question: item.question,
          options: item.options.map((opt, idx) => ({
            text: opt,
            isCorrect: idx === item.correct
          })),
          marks: 1
        });
      } else {
        const qNum = i + 1;
        let questionText = ``;
        let opts = [];

        if (hasSyllabus && syllabusTopics.length > 0) {
          const currentSyllabusTopic = syllabusTopics[i % syllabusTopics.length];
          questionText = `According to the syllabus topic "${currentSyllabusTopic}", which of the following is the key foundational concept?`;
          opts = [
            { text: `Primary core principle of ${currentSyllabusTopic}`, isCorrect: true },
            { text: `Auxiliary unrelated method`, isCorrect: false },
            { text: `Deprecated legacy parameter`, isCorrect: false },
            { text: `Incorrect assumption regarding ${currentSyllabusTopic}`, isCorrect: false }
          ];
        } else if (qNum === 1) {
          questionText = `Which of the following is a fundamental core concept of ${cleanTopic}?`;
          opts = [
            { text: `Primary Principles of ${cleanTopic}`, isCorrect: true },
            { text: `Secondary Auxiliary Rules`, isCorrect: false },
            { text: `Unrelated Legacy Architecture`, isCorrect: false },
            { text: `Deprecated Static Constants`, isCorrect: false }
          ];
        } else if (qNum === 2) {
          questionText = `In the context of ${cleanTopic}, what is the main objective of standard evaluation?`;
          opts = [
            { text: `Ensuring optimal performance and structural accuracy`, isCorrect: true },
            { text: `Bypassing validation checks`, isCorrect: false },
            { text: `Increasing memory overhead needlessly`, isCorrect: false },
            { text: `Disabling security parameters`, isCorrect: false }
          ];
        } else if (qNum === 3) {
          questionText = `Which best practice should be followed when implementing ${cleanTopic} solutions?`;
          opts = [
            { text: `Adhering to modular design and clear documentation`, isCorrect: true },
            { text: `Hardcoding temporary values permanently`, isCorrect: false },
            { text: `Ignoring error handling mechanisms`, isCorrect: false },
            { text: `Using unverified third-party libraries`, isCorrect: false }
          ];
        } else if (qNum === 4) {
          questionText = `What is a key advantage of utilizing ${cleanTopic} in modern workflows?`;
          opts = [
            { text: `Enhanced efficiency and scalable execution`, isCorrect: true },
            { text: `Higher latency and execution delay`, isCorrect: false },
            { text: `Complex manual configuration requirement`, isCorrect: false },
            { text: `Incompatibility with standard tools`, isCorrect: false }
          ];
        } else {
          questionText = `When analyzing ${cleanTopic} under ${difficulty} scenarios, what is the primary consideration?`;
          opts = [
            { text: `System reliability and correct output validation`, isCorrect: true },
            { text: `Arbitrary data allocation`, isCorrect: false },
            { text: `Manual register override`, isCorrect: false },
            { text: `Single-threaded execution bottleneck`, isCorrect: false }
          ];
        }

        generatedQuestions.push({
          question: questionText,
          options: opts,
          marks: 1
        });
      }
    }

    res.json({
      success: true,
      title: `${cleanTopic} ${difficulty} Assessment`,
      subject: subject.trim() || cleanTopic,
      duration: Math.min(targetCount * 5, 120),
      questions: generatedQuestions,
      source: hasSyllabus ? 'Internal AI Engine (Syllabus Driven)' : 'Internal AI Engine'
    });
  } catch (error) {
    console.error('AI Exam Generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI exam questions'
    });
  }
});

module.exports = router;
