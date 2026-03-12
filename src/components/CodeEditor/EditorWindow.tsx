import React from 'react';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useUserPreferences } from '../../contexts/UserPreferencesContext';

interface EditorWindowProps {
    code: string;
    onChange: (value: string) => void;
    language: string;
    phase: 'reading' | 'mcq' | 'coding' | 'completed';
    onStartCoding: () => void;
}

const EditorWindow: React.FC<EditorWindowProps> = ({ code, onChange, language, phase, onStartCoding }) => {
    const { theme, fontSize } = useUserPreferences();

    return (
        <div className="relative h-full">
            {(phase === 'reading' || phase === 'mcq') && (
                <div className="absolute inset-0 z-20 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-[2px] flex items-center justify-center p-8 transition-colors duration-500">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full p-8 rounded-3xl border border-black/5 dark:border-white/10 text-center shadow-2xl bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="w-8 h-8 text-violet-500" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Logic Verification Required</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 leading-relaxed font-medium transition-colors">
                            Complete the problem analysis and logic assessment to unlock the development environment.
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-left p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                <div className={`w-2 h-2 rounded-full ${phase === 'reading' ? 'bg-violet-600 animate-pulse' : 'bg-emerald-500'}`}></div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${phase === 'reading' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>Step 1: Context Analysis</span>
                            </div>
                            <div className="flex items-center gap-3 text-left p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                <div className={`w-2 h-2 rounded-full ${phase === 'mcq' ? 'bg-violet-600 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-800'}`}></div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${phase === 'mcq' ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>Step 2: Logic Assessment</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="h-full">
                <Editor
                    height="100%"
                    defaultLanguage={language}
                    theme={theme}
                    value={code}
                    onChange={(value: string | undefined) => onChange(value || '')}
                    options={{
                        minimap: { enabled: false },
                        fontSize: fontSize,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                        padding: { top: 20 },
                        scrollBeyondLastLine: false,
                        lineNumbers: 'on',
                        glyphMargin: false,
                        folding: true,
                        lineDecorationsWidth: 10,
                        lineNumbersMinChars: 3,
                        automaticLayout: true,
                        tabSize: 4,
                        insertSpaces: true,
                        wordWrap: 'on',
                        suggestOnTriggerCharacters: true,
                    }}
                />
            </div>
        </div>
    );
};

export default EditorWindow;
