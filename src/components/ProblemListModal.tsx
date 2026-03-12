import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronLeft, ChevronRight, Filter, Circle, Brain, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { Problem } from '../data/problems';
import { useProblem } from '../contexts/ProblemContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { useAuth } from '../contexts/AuthContext';

interface ProblemListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ProblemsResponse {
    problems: Problem[];
    totalPages: number;
    currentPage: number;
}

export default function ProblemListModal({ isOpen, onClose }: ProblemListModalProps) {
    const { selectProblem, currentProblem } = useProblem();
    const { theme, fontSize } = useUserPreferences();
    const { user } = useAuth();
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [difficulty, setDifficulty] = useState<string>('');
    const [company, setCompany] = useState<string>('');
    const [companies, setCompanies] = useState<string[]>([]);
    const [topic, setTopic] = useState<string>('');
    const [topics, setTopics] = useState<string[]>([]);
    const [debounceSearch, setDebounceSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebounceSearch(searchTerm);
            setPage(1); // Reset to page 1 on search change
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch companies and topics on mount
    useEffect(() => {
        if (!isOpen) return;
        const fetchMetadata = async () => {
            try {
                const res = await axios.get('http://localhost:5001/api/problems/metadata');
                setCompanies(res.data.companies || []);
                setTopics(res.data.tags || []);
            } catch (err) {
                console.error("Failed to fetch metadata", err);
            }
        };
        fetchMetadata();
    }, [isOpen]);

    // Fetch problems
    useEffect(() => {
        if (!isOpen) return;

        const fetchProblems = async () => {
            setLoading(true);
            try {
                const params: any = {
                    page,
                    limit: 10
                };
                if (debounceSearch) params.search = debounceSearch;
                if (difficulty) params.difficulty = difficulty;
                if (company) params.company = company;
                if (topic) params.topic = topic;

                const response = await axios.get<ProblemsResponse>('http://localhost:5001/api/problems', { params });
                setProblems(response.data.problems);
                setTotalPages(response.data.totalPages);
            } catch (error) {
                console.error("Failed to fetch problems", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProblems();
    }, [isOpen, page, debounceSearch, difficulty, company, topic]);

    const handleSelect = (id: string) => {
        selectProblem(id);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
                    >
                        <div className={`border w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto relative transition-colors duration-300 ${theme === 'vs-dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                            }`}
                            style={{ fontSize: `${fontSize}px` }}
                        >

                            {/* Header */}
                            <div className={`p-6 border-b flex items-center justify-between backdrop-blur-md transition-colors ${theme === 'vs-dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-100 bg-white/50'
                                }`}>
                                <div>
                                    <h2 className={`text-xl font-bold flex items-center gap-2 ${theme === 'vs-dark' ? 'text-white' : 'text-zinc-900'}`}>
                                        <Brain className="w-6 h-6 text-violet-500" />
                                        Problem Library
                                    </h2>
                                    <p className="text-zinc-400 text-xs mt-1">Browse 2800+ algorithmic challenges</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${theme === 'vs-dark' ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'
                                        }`}
                                >
                                    <X className={`w-4 h-4 ${theme === 'vs-dark' ? 'text-zinc-400' : 'text-zinc-500'}`} />
                                </button>
                            </div>

                            {/* Toolbar */}
                            <div className={`p-4 border-b flex gap-3 transition-colors ${theme === 'vs-dark' ? 'border-zinc-800 bg-zinc-900/30' : 'border-zinc-100 bg-zinc-50'
                                }`}>
                                <div className="relative flex-[2.5]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        placeholder="Search by title or problem number..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm transition-all focus:outline-none focus:border-violet-500/50 ${theme === 'vs-dark'
                                            ? 'bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600'
                                            : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 shadow-sm'
                                            }`}
                                    />
                                </div>
                                <div className="relative w-44">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <select
                                        value={difficulty}
                                        onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
                                        className={`w-full border rounded-xl pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer transition-colors ${theme === 'vs-dark'
                                            ? 'bg-zinc-950 border-zinc-800 text-white hover:bg-zinc-900'
                                            : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-sm'
                                            }`}
                                    >
                                        <option value="">Difficulties</option>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                                <div className="relative w-44">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <select
                                        value={company}
                                        onChange={(e) => { setCompany(e.target.value); setPage(1); }}
                                        className={`w-full border rounded-xl pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer transition-colors ${theme === 'vs-dark'
                                            ? 'bg-zinc-950 border-zinc-800 text-white hover:bg-zinc-900'
                                            : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-sm'
                                            }`}
                                    >
                                        <option value="">Companies</option>
                                        {companies.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="relative w-44">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <select
                                        value={topic}
                                        onChange={(e) => { setTopic(e.target.value); setPage(1); }}
                                        className={`w-full border rounded-xl pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer transition-colors ${theme === 'vs-dark'
                                            ? 'bg-zinc-950 border-zinc-800 text-white hover:bg-zinc-900'
                                            : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-sm'
                                            }`}
                                    >
                                        <option value="">Topics</option>
                                        {topics.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>


                            {/* List */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {loading ? (
                                    <div className="grid gap-2">
                                        {/* Skeleton Header */}
                                        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 mb-2">
                                            <div className="col-span-1">Status</div>
                                            <div className="col-span-6">Title</div>
                                            <div className="col-span-2">Acceptance</div>
                                            <div className="col-span-2">Difficulty</div>
                                            <div className="col-span-1"></div>
                                        </div>
                                        {/* Skeleton Rows */}
                                        {[...Array(10)].map((_, i) => (
                                            <div key={i} className="grid grid-cols-12 gap-4 items-center p-4 rounded-xl bg-zinc-900/50 border border-transparent animate-pulse">
                                                <div className="col-span-1">
                                                    <div className="w-4 h-4 rounded-full bg-zinc-800"></div>
                                                </div>
                                                <div className="col-span-6">
                                                    <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="h-4 bg-zinc-800 rounded w-12"></div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="h-6 bg-zinc-800 rounded-md w-16"></div>
                                                </div>
                                                <div className="col-span-1"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid gap-2">
                                        {/* Table Header */}
                                        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 mb-2">
                                            <div className="col-span-1">Status</div>
                                            <div className="col-span-6">Title</div>
                                            <div className="col-span-2">Acceptance</div>
                                            <div className="col-span-2">Difficulty</div>
                                            <div className="col-span-1"></div>
                                        </div>

                                        {problems.map((problem) => (
                                            <motion.div
                                                key={problem.id}
                                                layoutId={problem.id}
                                                onClick={() => handleSelect(problem.id)}
                                                className={`grid grid-cols-12 gap-4 items-center p-4 rounded-xl cursor-pointer border transition-all group ${currentProblem?.id === problem.id
                                                    ? 'bg-violet-600/10 border-violet-500/30'
                                                    : theme === 'vs-dark'
                                                        ? 'bg-zinc-900/50 border-transparent hover:bg-zinc-800 hover:border-zinc-700'
                                                        : 'bg-white border-zinc-100 hover:bg-zinc-50 hover:border-zinc-200 shadow-sm'
                                                    }`}
                                            >
                                                <div className="col-span-1">
                                                    {user?.uniqueSolvedIds?.includes(String(problem.id)) ? (
                                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                    ) : user?.uniqueAttemptedIds?.includes(String(problem.id)) ? (
                                                        <CheckCircle className="w-4 h-4 text-amber-500" />
                                                    ) : (
                                                        <Circle className="w-4 h-4 text-zinc-700" />
                                                    )}
                                                </div>
                                                <div className={`col-span-6 font-medium transition-colors truncate ${theme === 'vs-dark' ? 'text-zinc-200 group-hover:text-white' : 'text-zinc-700 group-hover:text-zinc-950'}`}>
                                                    {problem.id}. {problem.title}
                                                </div>
                                                <div className="col-span-2 text-sm text-zinc-500 font-mono">
                                                    {problem.acceptanceRate ? `${problem.acceptanceRate.toFixed(1)}%` : '-'}
                                                </div>
                                                <div className="col-span-2">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                                                            'bg-rose-500/10 text-rose-400'
                                                        }`}>
                                                        {problem.difficulty}
                                                    </span>
                                                </div>
                                                <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                                                </div>
                                            </motion.div>
                                        ))}

                                        {problems.length === 0 && (
                                            <div className="text-center py-20">
                                                <p className="text-zinc-500">No problems found matching your criteria.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer Pagination */}
                            <div className={`p-4 border-t flex items-center justify-between transition-colors ${theme === 'vs-dark' ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-100 bg-zinc-50'
                                }`}>
                                <p className="text-xs text-zinc-500">
                                    Page <span className="text-white font-bold">{page}</span> of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className={`p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${theme === 'vs-dark' ? 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700' : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100 shadow-sm'
                                            }`}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className={`p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${theme === 'vs-dark' ? 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700' : 'bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-100 shadow-sm'
                                            }`}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </motion.div>
                </>
            )
            }
        </AnimatePresence >
    );
}
