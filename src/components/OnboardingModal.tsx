import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, X, Building2, BookOpen, Code2 } from 'lucide-react';

interface OnboardingModalProps {
    userId: string;
    onComplete: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ userId, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { setUser } = useAuth();

    // Data Sources
    const [companies, setCompanies] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);

    // User Selections
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [experience, setExperience] = useState('');
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const res = await fetch('http://localhost:5001/api/problems/metadata');
                if (res.ok) {
                    const data = await res.json();
                    setCompanies(data.companies || []);
                    setTags(data.tags || []);
                }
            } catch (err) {
                console.error("Failed to fetch metadata", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMetadata();
    }, []);

    const handleNext = () => {
        if (step === 1 && selectedCompanies.length > 0) setStep(2);
        else if (step === 2 && experience) setStep(3);
        else if (step === 3) handleSubmit();
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload = {
                userId,
                preferredCompanies: selectedCompanies,
                preferredCompany: selectedCompanies[0], // Fallback/Primary
                experience,
                topics: selectedTopics
            };

            const res = await fetch('http://localhost:5001/api/users/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                console.log("Onboarding successful. Received user:", data.user);

                if (data.user) {
                    // Update AuthContext and LocalStorage immediately
                    const updatedUser = { ...data.user, isOnboarded: true };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));

                    setIsSuccess(true);

                    // 5-second timer as requested by user to ensure backend propagation and premium feel
                    console.log("Starting 5s synchronization delay...");
                    setTimeout(() => {
                        onComplete();
                    }, 5000);
                } else {
                    onComplete();
                }
            } else {
                console.error("Onboarding API returned error status:", res.status);
            }
        } catch (err) {
            console.error("Critical onboarding error:", err);
        } finally {
            if (!isSuccess) setSubmitting(false);
        }
    };

    const toggleTopic = (topic: string) => {
        if (selectedTopics.includes(topic)) {
            setSelectedTopics(selectedTopics.filter(t => t !== topic));
        } else {
            setSelectedTopics([...selectedTopics, topic]);
        }
    };

    if (loading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl h-[80vh] bg-zinc-950 border border-white/10 rounded-3xl flex overflow-hidden shadow-2xl relative"
            >
                {/* Steps Indicator (Left Sidebar) */}
                <div className="w-72 bg-zinc-900 border-r border-white/5 p-8 flex flex-col">
                    <h2 className="text-3xl font-bold mb-10 text-white">Setup Profile</h2>
                    <div className="space-y-8">
                        <StepIndicator
                            number={1}
                            title="Dream Company"
                            subtitle="Where do you want to work?"
                            active={step === 1}
                            completed={step > 1}
                            icon={Building2}
                        />
                        <StepIndicator
                            number={2}
                            title="Experience"
                            subtitle="Your current level"
                            active={step === 2}
                            completed={step > 2}
                            icon={BookOpen}
                        />
                        <StepIndicator
                            number={3}
                            title="Skills"
                            subtitle="Your strengths"
                            active={step === 3}
                            completed={step > 3}
                            icon={Code2}
                        />
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-10 flex flex-col relative overflow-y-auto custom-scrollbar bg-zinc-950">
                    {isSuccess ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
                        >
                            <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                >
                                    <Check className="w-12 h-12 text-green-500" />
                                </motion.div>
                            </div>
                            <h3 className="text-4xl font-bold text-white">Setup Complete!</h3>
                            <p className="text-zinc-400 text-xl max-w-md">
                                Your personalized experience is ready. Get ready to master your coding journey.
                            </p>
                            <motion.div
                                className="w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden"
                            >
                                <motion.div
                                    className="h-full bg-green-500"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 2 }}
                                />
                            </motion.div>
                            <p className="text-zinc-500 text-sm animate-pulse">Entering Dashboard...</p>
                        </motion.div>
                    ) : (
                        <>
                            <div className="flex-1">
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 max-w-2xl mx-auto mt-10">
                                            <div>
                                                <h3 className="text-3xl font-bold text-white mb-3">Target Company</h3>
                                                <p className="text-zinc-400 text-lg">Select the company you are preparing for. We'll verify your skills against their common questions.</p>
                                            </div>

                                            <div className="relative">
                                                {/* Search Input */}
                                                <input
                                                    type="text"
                                                    placeholder="Search companies..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full p-4 rounded-xl bg-zinc-900 border border-white/10 text-white mb-4 focus:outline-none focus:border-violet-500"
                                                />

                                                {/* Company Grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                                    {companies.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                                                        <button
                                                            key={c}
                                                            onClick={() => {
                                                                if (selectedCompanies.includes(c)) {
                                                                    setSelectedCompanies(selectedCompanies.filter(sc => sc !== c));
                                                                } else {
                                                                    setSelectedCompanies([...selectedCompanies, c]);
                                                                }
                                                            }}
                                                            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left truncate ${selectedCompanies.includes(c)
                                                                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                                                                : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
                                                                }`}
                                                        >
                                                            {c}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 max-w-2xl mx-auto mt-10">
                                            <div>
                                                <h3 className="text-3xl font-bold text-white mb-3">Proficiency Level</h3>
                                                <p className="text-zinc-400 text-lg">Help us personalize your learning path.</p>
                                            </div>

                                            <div className="grid gap-4">
                                                {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                                                    <button
                                                        key={level}
                                                        onClick={() => setExperience(level)}
                                                        className={`p-6 rounded-2xl border text-left transition-all ${experience === level
                                                            ? 'bg-violet-600/20 border-violet-500 ring-1 ring-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.2)]'
                                                            : 'bg-zinc-900 border-white/5 hover:bg-zinc-800 hover:border-white/10'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h4 className="text-xl font-bold text-white">{level}</h4>
                                                            {experience === level && <Check className="text-violet-500 w-6 h-6" />}
                                                        </div>
                                                        <p className="text-zinc-400">
                                                            {level === 'Beginner' && "I am new to Data Structures & Algorithms."}
                                                            {level === 'Intermediate' && "I have solved 100+ problems."}
                                                            {level === 'Advanced' && "I am comfortable with Hard problems."}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 max-w-3xl mx-auto mt-10">
                                            <div>
                                                <h3 className="text-3xl font-bold text-white mb-3">Strong Topics</h3>
                                                <p className="text-zinc-400 text-lg">Select topics you are already comfortable with.</p>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {tags.map((tag) => (
                                                    <button
                                                        key={tag}
                                                        onClick={() => toggleTopic(tag)}
                                                        className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left truncate ${selectedTopics.includes(tag)
                                                            ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                                                            : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
                                                            }`}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5 flex justify-end">
                                <button
                                    onClick={handleNext}
                                    disabled={(step === 1 && selectedCompanies.length === 0) || (step === 2 && !experience) || submitting}
                                    className={`px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all shadow-xl ${((step === 1 && selectedCompanies.length === 0) || (step === 2 && !experience) || submitting)
                                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                        : 'bg-white text-black hover:bg-zinc-200 hover:scale-105'
                                        }`}
                                >
                                    {submitting ? (isSuccess ? 'Redirecting...' : 'Setting up...') : step === 3 ? 'Get Started' : 'Next Step'}
                                    {!submitting && <ChevronRight className="w-5 h-5" />}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const StepIndicator = ({ number, title, subtitle, active, completed, icon: Icon }: any) => (
    <div className={`flex items-start gap-4 transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-40 grayscale'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 ${completed ? 'bg-green-500 border-green-500 text-white' :
            active ? 'bg-violet-600 border-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.5)]' : 'bg-transparent border-zinc-700 text-zinc-500'
            }`}>
            {completed ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
        </div>
        <div>
            <div className={`font-bold text-lg ${active ? 'text-white' : 'text-zinc-400'}`}>{title}</div>
            <div className="text-sm text-zinc-500">{subtitle}</div>
        </div>
    </div>
);

export default OnboardingModal;
