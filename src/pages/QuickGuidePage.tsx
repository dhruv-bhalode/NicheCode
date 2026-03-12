import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ChevronRight,
    ChevronLeft,
    LayoutDashboard,
    Brain,
    Code2,
    MessageSquare,
    Zap,
    Target,
    Sparkles,
    Search,
    CheckCircle2,
    Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SettingsModal from '../components/SettingsModal';

const steps = [
    {
        title: "The Intelligence Dashboard",
        icon: LayoutDashboard,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
        border: "border-violet-500/20",
        desc: "Your central hub for tracking progress. The Radar Chart visualizes your skill distribution across 10 core algorithmic domains.",
        features: [
            "Real-time Skill Radar Chart",
            "Dynamic Top 5 Problem Recommendations",
            "Progress Statistics & Activity Heatmaps"
        ],
        image: "/dashboard_sample.png"
    },
    {
        title: "Browse & Discover",
        icon: Search,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
        border: "border-violet-500/20",
        desc: "Access our vast library of 2,800+ curated problems using the LeetCode-style navigation menu.",
        features: [
            "Filter by Difficulty (Easy, Medium, Hard)",
            "Search by Algorithm Tags (DP, Graphs, Trees)",
            "Target Specific Companies (Google, Meta, Amazon)"
        ],
        image: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&q=80&w=1000"
    },
    {
        title: "Analysis Phase",
        icon: Brain,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
        border: "border-violet-500/20",
        desc: "Before you code, we help you understand. Read the description, critical constraints, and analyze logical use cases.",
        features: [
            "Rich Semantic Problem Descriptions",
            "Structured Edge-Case Analysis",
            "Interactive Step-by-Step Logic Guidance"
        ],
        image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=1000"
    },
    {
        title: "Logic Verification (MCQ)",
        icon: CheckCircle2,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
        border: "border-violet-500/20",
        desc: "Unique to NicheCode: Pass a Multiple Choice test to verify your algorithmic logic before entering the IDE.",
        features: [
            "Validate Complexity Understanding",
            "Verify Edge Case Readiness",
            "Prevents 'Guess-and-Check' Coding"
        ],
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000"
    },
    {
        title: "Professional IDE",
        icon: Code2,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
        border: "border-violet-500/20",
        desc: "Implement your solution in Python, C++, or Java with our high-performance local execution engine.",
        features: [
            "Sub-millisecond Local Compilation",
            "Support for INT_MAX & Complex Structures",
            "Integrated Test-Case Runner & Console"
        ],
        image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=1000"
    },
    {
        title: "AI Intelligent Agent",
        icon: MessageSquare,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
        border: "border-violet-500/20",
        desc: "Stuck? Our RAG-powered AI agent has knowledge of every problem in the database to provide precise hints.",
        features: [
            "Context-Aware Algorithmic Hints",
            "Optimal Solution Generation",
            "Complexity Analysis & Explanations"
        ],
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000"
    },
    {
        title: "Success Prediction",
        icon: Target,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
        border: "border-violet-500/20",
        desc: "Our machine learning model predicts your success probability based on your historical interactions.",
        features: [
            "Real-time Probability Calculation",
            "Dynamic Success Scoring",
            "Performance-based Difficulty Scaling"
        ],
        image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1000"
    }
];

const QuickGuidePage: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const activeStep = steps[currentStep];

    const next = () => setCurrentStep(prev => (prev + 1) % steps.length);
    const prev = () => setCurrentStep(prev => (prev - 1 + steps.length) % steps.length);

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-hidden selection:bg-violet-500/30 selection:text-violet-200 transition-colors duration-500">
            {/* Background Orbs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full"></div>
            </div>

            <nav className="relative z-10 p-4 flex items-center justify-between max-w-7xl mx-auto">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all text-sm font-bold text-zinc-600 dark:text-zinc-300"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </button>

                <div className="flex items-center gap-6">
                    <div className="flex gap-2">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 cursor-pointer rounded-full transition-all duration-500 ${i === currentStep ? 'w-10 bg-violet-600 shadow-lg shadow-violet-600/30' : 'w-3 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-600'}`}
                                onClick={() => setCurrentStep(i)}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center justify-center p-2 rounded-full bg-zinc-100 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all text-zinc-600 dark:text-zinc-300"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 h-[calc(100vh-120px)] flex items-center">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">

                    {/* Infographic Content */}
                    <div className="space-y-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl ${activeStep.bgColor} ${activeStep.border} ${activeStep.color} mb-6`}>
                                    <activeStep.icon className="w-5 h-5" />
                                    <span className="text-sm font-bold uppercase tracking-widest">Step {currentStep + 1} of {steps.length}</span>
                                </div>

                                <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-white/50">
                                    {activeStep.title}
                                </h1>

                                <p className="text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8 max-w-xl font-medium">
                                    {activeStep.desc}
                                </p>

                                <div className="grid gap-4 mb-10">
                                    {activeStep.features.map((feature, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 + (i * 0.1) }}
                                            className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-black/5 dark:border-white/10 group hover:border-black/10 dark:hover:border-white/20 transition-all shadow-sm dark:shadow-none"
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeStep.bgColor} ${activeStep.color} shadow-sm`}>
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-zinc-700 dark:text-zinc-200">{feature}</span>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={prev}
                                        disabled={currentStep === 0}
                                        className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-black/5 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-zinc-600 dark:text-zinc-300 shadow-sm dark:shadow-none"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={next}
                                        className="flex-1 p-5 rounded-2xl bg-violet-600 hover:bg-violet-500 font-bold text-lg transition-all shadow-xl shadow-violet-500/30 flex items-center justify-center gap-2 group"
                                    >
                                        {currentStep === steps.length - 1 ? "Finish Guide" : "Proceed to Next Step"}
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Visual Showcase */}
                    <div className="relative group perspective-1000 hidden lg:block">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, scale: 0.9, rotateY: 20 }}
                                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                exit={{ opacity: 0, scale: 1.1, rotateY: -20 }}
                                transition={{ duration: 0.6, type: "spring" }}
                                className="relative z-10"
                            >
                                {/* Decorative Frame */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/50 to-violet-400/50 blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

                                <div className="relative h-[600px] w-full rounded-[40px] overflow-hidden border border-black/5 dark:border-white/20 bg-zinc-50 dark:bg-zinc-900 shadow-2xl">
                                    <img
                                        src={activeStep.image}
                                        alt={activeStep.title}
                                        className="w-full h-full object-cover opacity-80 dark:opacity-60 scale-105 group-hover:scale-100 transition-transform duration-[2s]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-transparent to-transparent"></div>

                                    {/* Floating UI Elements based on step */}
                                    <div className="absolute bottom-10 left-10 right-10">
                                        <div className="glass-panel p-6 rounded-3xl border border-black/5 dark:border-white/10 backdrop-blur-xl bg-white/80 dark:bg-white/5">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/40 text-white">
                                                    <Zap className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">Live Engine Context</p>
                                                    <h4 className="text-lg font-black text-zinc-900 dark:text-white">NicheCode Platform</h4>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                                        className="h-full bg-violet-600"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest text-right">Step {currentStep + 1} / {steps.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Satellite Elements */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/20 blur-[60px] rounded-full animate-pulse"></div>
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-violet-500/20 blur-[60px] rounded-full animate-pulse delay-700"></div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </main>

            <footer className="fixed bottom-10 left-0 right-0 z-10 pointer-events-none">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                </div>
            </footer>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};

export default QuickGuidePage;
