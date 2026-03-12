import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Loader2, CheckCircle, XCircle } from 'lucide-react';

export interface TestCaseResult {
    input: string;
    expected_output: string;
    actual_output: string;
    passed: boolean;
    error?: string;
}

interface OutputConsoleProps {
    show: boolean;
    onClose: () => void;
    isRunning: boolean;
    results: TestCaseResult[];
    generalError: string | null;
}

const OutputConsole: React.FC<OutputConsoleProps> = ({ show, onClose, isRunning, results, generalError }) => {
    if (!show) return null;

    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;

    return (
        <motion.div
            initial={{ height: 0 }}
            animate={{ height: '40%' }}
            exit={{ height: 0 }}
            className="bg-white dark:bg-zinc-900 border-t-2 border-black/5 dark:border-zinc-700 flex flex-col overflow-hidden flex-shrink-0 transition-colors duration-500"
        >
            {/* Output Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                    <Terminal className="h-4 w-4 text-violet-500" />
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-300 uppercase tracking-widest">Test Results</span>
                    {results.length > 0 && !isRunning && (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${passedCount === totalCount
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30'
                            : 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-rose-500/30'
                            }`}>
                            {passedCount === totalCount ? '✓ All Passed' : `${passedCount}/${totalCount} Passed`}
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm font-bold transition-colors px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                >
                    ✕
                </button>
            </div>

            {/* Output Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isRunning && (
                    <div className="flex items-center gap-3 text-zinc-400 p-6 justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                        <span className="text-sm font-medium">Executing code against test cases...</span>
                    </div>
                )}

                {generalError && !isRunning && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
                        ⚠️ {generalError}
                    </div>
                )}

                {results.map((result, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-xl border transition-all ${result.passed
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-rose-500/5 border-rose-500/20'
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            {result.passed ? (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <XCircle className="h-4 w-4 text-rose-500" />
                            )}
                            <span className={`text-xs font-bold uppercase tracking-widest ${result.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                Test Case {index + 1} — {result.passed ? 'Accepted' : 'Wrong Answer'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div>
                                <div className="text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest mb-1.5 text-[10px]">Input</div>
                                <code className="block bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-black/5 dark:border-white/5 text-zinc-600 dark:text-zinc-300 font-mono whitespace-pre-wrap">{result.input}</code>
                            </div>
                            <div>
                                <div className="text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest mb-1.5 text-[10px]">Expected Output</div>
                                <code className="block bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-black/5 dark:border-white/5 text-emerald-600 dark:text-emerald-400 font-mono whitespace-pre-wrap">{result.expected_output}</code>
                            </div>
                            <div>
                                <div className="text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest mb-1.5 text-[10px]">Your Output</div>
                                <code className={`block bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-black/5 dark:border-white/5 font-mono whitespace-pre-wrap ${result.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {result.error || result.actual_output || '(no output)'}
                                </code>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default OutputConsole;
