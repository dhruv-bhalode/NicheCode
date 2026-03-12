import { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useProblem } from '../contexts/ProblemContext';
import axios from 'axios';

// Import extracted components
import EditorControlBar from './CodeEditor/EditorControlBar';
import EditorWindow from './CodeEditor/EditorWindow';
import OutputConsole, { TestCaseResult } from './CodeEditor/OutputConsole';

interface CodeEditorProps {
  onStartCoding: () => void;
  phase: 'reading' | 'mcq' | 'coding' | 'completed';
  language: string;
  onLanguageChange: (lang: string) => void;
  code: string;
  onCodeChange: (code: string) => void;
}

export default function CodeEditor({ onStartCoding, phase, language, onLanguageChange, code, onCodeChange }: CodeEditorProps) {
  const { currentProblem } = useProblem();
  // const [code, setCode] = useState(currentProblem?.template || ''); // Lifted up
  // const [language, setLanguage] = useState('python'); // Lifted up
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [showOutput, setShowOutput] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  // Update code when problem changes
  useEffect(() => {
    if (currentProblem) {
      // Use templates for specific language if available
      // Check for saved code first
      const savedCode = localStorage.getItem(`code-${currentProblem.id}-${language}`);

      let initialCode = '';

      if (savedCode) {
        initialCode = savedCode;
      } else if (currentProblem.templates && currentProblem.templates[language]) {
        initialCode = currentProblem.templates[language];
      } else if (language === 'python' && currentProblem.template) {
        // Fallback for Python using the legacy template field
        initialCode = currentProblem.template;
      } else {
        // Placeholder for missing templates
        const taskName = currentProblem.methodName || 'solution';
        if (language === 'python') {
          initialCode = `class Solution:\n    # Function to implement\n    # def ${taskName}(self, ...):\n    pass`;
        } else if (language === 'cpp') {
          initialCode = `class Solution {\npublic:\n    // Function to implement\n    // void ${taskName}() {\n    //     \n    // }\n};`;
        } else if (language === 'java') {
          initialCode = `class Solution {\n    // Function to implement\n    // public void ${taskName}() {\n    //     \n    // }\n}`;
        } else {
          initialCode = `// No template available for ${language}`;
        }
      }

      onCodeChange(initialCode);
      setResults([]);
      setShowOutput(false);
      setGeneralError(null);
    }
  }, [currentProblem, language]);

  // Save code to localStorage whenever it changes
  useEffect(() => {
    if (currentProblem && code) {
      localStorage.setItem(`code-${currentProblem.id}-${language}`, code);
    }
  }, [code, currentProblem, language]);


  const handleLanguageChange = (newLang: string) => {
    onLanguageChange(newLang);
  };

  const handleRunCode = async () => {
    if (phase === 'reading' || phase === 'mcq') {
      onStartCoding();
      return;
    }

    if (!currentProblem) return;

    setIsRunning(true);
    setResults([]);
    setGeneralError(null);
    setShowOutput(true);

    try {
      const testCases = currentProblem.testCases.map((tc: { input: string; output: string }) => ({
        input: tc.input,
        expected_output: tc.output,
      }));

      const response = await axios.post('http://localhost:5002/execute', {
        code: code,
        language: language, // Using the state language
        method_name: currentProblem.methodName,
        test_cases: testCases,
      });

      setResults(response.data.results);
      if (response.data.error) {
        setGeneralError(response.data.error);
      }
    } catch (err: any) {
      setGeneralError(err.response?.data?.detail || 'Failed to connect to the execution server. Is the backend running?');
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    if (currentProblem) {
      let initialCode = '';

      if (currentProblem.templates && currentProblem.templates[language]) {
        initialCode = currentProblem.templates[language];
      } else if (language === 'python' && currentProblem.template) {
        initialCode = currentProblem.template;
      } else {
        const taskName = currentProblem.methodName || 'solution';
        if (language === 'cpp') {
          initialCode = `class Solution {\npublic:\n    // Function to implement\n    // void ${taskName}() {\n    //     \n    // }\n};`;
        } else if (language === 'java') {
          initialCode = `class Solution {\n    // Function to implement\n    // public void ${taskName}() {\n    //     \n    // }\n}`;
        } else {
          initialCode = `// No template available for ${language}`;
        }
      }
      onCodeChange(initialCode);
    }
    setResults([]);
    setShowOutput(false);
    setGeneralError(null);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 relative overflow-hidden group/editor">
      {/* Editor Control Bar */}
      <EditorControlBar
        onRun={handleRunCode}
        onReset={handleReset}
        isRunning={isRunning}
        language={language}
        onLanguageChange={handleLanguageChange}
        phase={phase}
      />

      {/* Editor Area */}
      <div className="relative" style={{ flex: showOutput ? '1 1 60%' : '1 1 100%', minHeight: 0 }}>
        <EditorWindow
          code={code}
          onChange={onCodeChange}
          language={language}
          phase={phase}
          onStartCoding={onStartCoding}
        />
      </div>

      {/* Output Console */}
      <AnimatePresence>
        <OutputConsole
          show={showOutput}
          onClose={() => setShowOutput(false)}
          isRunning={isRunning}
          results={results}
          generalError={generalError}
        />
      </AnimatePresence>

      {/* Terminal Footer (when output is hidden) */}
      {!showOutput && (
        <div className="h-10 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between px-4 flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Console</span>
            </div>
            <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse">
              Ready
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[10px] text-zinc-600 font-medium whitespace-nowrap">Python 3 • LeetCode Mode</div>
          </div>
        </div>
      )}
    </div>
  );
}