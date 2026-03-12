import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ArrowRight, Brain, Clock, Zap, ShieldCheck, X } from 'lucide-react';
import { useProblem } from '../contexts/ProblemContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserPreferences } from '../contexts/UserPreferencesContext';

interface MCQSectionProps {
  onComplete: () => void;
  onClose?: () => void;
  forceTheme?: 'vs-dark' | 'light';
}

export default function MCQSection({ onComplete, onClose, forceTheme }: MCQSectionProps) {
  const { currentProblem, mcqQuestions, currentMCQIndex, nextMCQ } = useProblem();
  const { theme: globalTheme, fontSize } = useUserPreferences();
  const theme = forceTheme || globalTheme;
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [startTime] = useState(Date.now());
  const [answerTime, setAnswerTime] = useState<number | null>(null);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setAnswered(false);
    setShowExplanation(false);
    setAnswerTime(null);
  }, [currentMCQIndex, currentProblem?.id]);

  const currentQuestion = mcqQuestions[currentMCQIndex];

  if (!currentQuestion) {
    return null;
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (answered) return;

    setAnswerTime(Date.now() - startTime);
    setSelectedAnswer(answerIndex);
    setAnswered(true);
    setShowExplanation(true);
    console.log('Answer selected:', answerIndex, 'Correct:', currentQuestion.correctAnswer);
  };

  const handleNext = () => {
    if (currentMCQIndex < mcqQuestions.length - 1) {
      nextMCQ();
      setSelectedAnswer(null);
      setShowExplanation(false);
      setAnswered(false);
    } else {
      onComplete();
    }
  };

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

  return (
    <div className={`h-full flex flex-col transition-colors duration-300 ${theme === 'vs-dark' ? 'bg-zinc-900/40 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl'
      }`}
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col p-8 md:p-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Brain className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h3 className={`text-xl font-bold tracking-tight transition-colors ${theme === 'vs-dark' ? 'text-white' : 'text-zinc-900'}`}>Logic Assessment</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Step 2 of 3 • Knowledge Check</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              {mcqQuestions.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-500 ${index === currentMCQIndex
                    ? 'w-8 bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]'
                    : index < currentMCQIndex
                      ? 'w-4 bg-emerald-500'
                      : 'w-4 bg-zinc-200 dark:bg-zinc-800'
                    }`}
                />
              ))}
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all border border-black/5 dark:border-white/5"
                title="Close Assessment"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto pr-2 custom-scrollbar">
          <div className="mb-8">
            <p className={`text-lg font-medium leading-relaxed mb-8 p-6 rounded-2xl border transition-colors ${theme === 'vs-dark' ? 'text-zinc-200 bg-zinc-950/40 border-white/5' : 'text-zinc-700 bg-zinc-100/50 border-zinc-200'
              }`}>
              {currentQuestion.question}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={!answered ? { scale: 1.02, x: 5 } : {}}
                  whileTap={!answered ? { scale: 0.98 } : {}}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answered}
                  className={`p-5 text-left rounded-2xl border-2 transition-all relative group overflow-hidden ${answered
                    ? selectedAnswer === index
                      ? isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/50 text-rose-400'
                      : index === currentQuestion.correctAnswer
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : theme === 'vs-dark'
                          ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500 opacity-50'
                          : 'bg-zinc-50 border-zinc-100 text-zinc-400 opacity-50'
                    : theme === 'vs-dark'
                      ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-violet-500/50 hover:bg-zinc-800/80 hover:text-white'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:border-violet-500/50 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm'
                    }`}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors ${answered && (selectedAnswer === index || index === currentQuestion.correctAnswer)
                      ? 'bg-current/10 border-current/20'
                      : theme === 'vs-dark'
                        ? 'bg-zinc-950 border-white/5 group-hover:border-violet-500/30'
                        : 'bg-white border-zinc-200 group-hover:border-violet-500/30'
                      }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="font-medium">{option}</span>
                  </div>

                  {answered && selectedAnswer === index && (
                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                      {isCorrect ? (
                        <CheckCircle className="h-6 w-6 text-emerald-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-rose-500" />
                      )}
                    </div>
                  )}

                  {answered && index === currentQuestion.correctAnswer && selectedAnswer !== index && (
                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    </div>
                  )}

                  {/* Hover Glow */}
                  {!answered && (
                    <div className="absolute inset-0 bg-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Logic Feedback Section - Always visible after answer */}
          {(answered || showExplanation) && (
            <div
              id="logic-feedback-box"
              className={`p-6 rounded-3xl mb-8 relative overflow-hidden border-2 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 ${isCorrect
                ? 'bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/40'
                : 'bg-rose-500/10 border-rose-500/20 dark:border-rose-500/40'
                }`}
            >
              <div className="flex items-start gap-4 h-full">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                  }`}>
                  {isCorrect ? <Zap className="w-6 h-6 text-emerald-400" /> : <ShieldCheck className="w-6 h-6 text-rose-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`text-sm font-black uppercase tracking-[0.2em] ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isCorrect ? 'Logic Verified' : `Logic Correction • Expected: ${String.fromCharCode(65 + currentQuestion.correctAnswer)}`}
                    </h4>
                    {isCorrect && (
                      <div className="flex items-center text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">
                        <Clock className="h-3 w-3 mr-1" />
                        {Math.round((answerTime || 0) / 1000)}s
                      </div>
                    )}
                  </div>
                  <p className={`text-base font-semibold leading-relaxed mb-1 ${theme === 'vs-dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {currentQuestion.explanation || "No explanation provided for this question."}
                  </p>
                  {!isCorrect && (
                    <p className="text-zinc-400 text-xs font-medium italic mt-2">
                      Review the logic above before proceeding to the next challenge.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {answered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-end pt-4 border-t border-black/5 dark:border-zinc-800 mt-auto"
            >
              <button
                onClick={handleNext}
                className="group flex items-center px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl transition-all font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
              >
                <span className="mr-3">{currentMCQIndex < mcqQuestions.length - 1 ? 'Next Challenge' : 'Initialize IDE'}</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div >
  );
}