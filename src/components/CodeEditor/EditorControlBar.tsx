import { Code2, RotateCcw, Play, Loader2 } from 'lucide-react';


interface EditorControlBarProps {
    onRun: () => void;
    onReset: () => void;
    isRunning: boolean;
    language: string;
    onLanguageChange: (lang: string) => void;
    phase: 'reading' | 'mcq' | 'coding' | 'completed';
}

const EditorControlBar: React.FC<EditorControlBarProps> = ({ onRun, onReset, isRunning, language, onLanguageChange, phase }) => {


    return (
        <>
            <div className="bg-white dark:bg-zinc-900 px-4 py-2 border-b border-black/5 dark:border-zinc-800 flex items-center justify-between flex-shrink-0 z-10 transition-colors duration-500">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-950 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
                        <Code2 className="h-4 w-4 text-violet-500" />
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Solution.{language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'java'}</span>
                    </div>

                    <div className="flex items-center gap-2 h-8 px-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 transition-colors group">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <select
                            value={language}
                            onChange={(e) => onLanguageChange(e.target.value)}
                            className="bg-transparent text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest outline-none cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                        >
                            <option value="python" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">Python 3</option>
                            <option value="cpp" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">C++ 17</option>
                            <option value="java" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">Java 11</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">

                    <button
                        onClick={onReset}
                        className="flex items-center px-3 py-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                        <RotateCcw className="h-3.5 w-3.5 mr-2" />
                        Reset
                    </button>
                    <button
                        onClick={onRun}
                        disabled={phase === 'completed' || isRunning}
                        className="flex items-center px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                    >
                        {isRunning ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4 mr-2 fill-current" />
                        )}
                        {isRunning ? 'Running...' : 'Run Code'}
                    </button>
                </div>
            </div>

        </>
    );
};

export default EditorControlBar;
