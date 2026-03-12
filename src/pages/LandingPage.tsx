import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Cpu, Zap, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SettingsModal from '../components/SettingsModal';
import { useAuth } from '../contexts/AuthContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { } = useUserPreferences();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop')] bg-cover bg-center overflow-hidden relative transition-colors duration-500">
      <div className="absolute inset-0 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-sm"></div>

      {/* Navigation */}
      <nav className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
          <Bot className="w-8 h-8 text-violet-500" />
          <span className="text-zinc-900 dark:text-white">Niche<span className="text-violet-500">Code</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          {user ? (
            <>
              <button
                onClick={() => logout()}
                className="px-6 py-2 rounded-full text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 rounded-full text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-violet-600 text-zinc-950 dark:text-white text-sm font-medium transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            Next Generation AI Architecture
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-zinc-900 dark:text-white mb-6">
            Your Personalized <br />
            <span className="text-violet-500">Coding Journey</span>
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium transition-colors">
            Learn and skill up to get your favourite roles at your dream companies.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-semibold text-lg transition-all shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] flex items-center gap-2"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-semibold text-lg transition-all shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] flex items-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => navigate('/guide')}
              className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-semibold text-lg transition-all shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)]"
            >
              Quick Guide
            </button>
            <button
              onClick={() => navigate('/about')}
              className="px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-semibold text-lg transition-all shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)]"
            >
              About Us
            </button>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-6xl"
        >
          {[
            { icon: Cpu, title: 'LangGraph Core', desc: 'Stateful multi-actor orchestration for complex workflows.' },
            { icon: Zap, title: 'Fast Retrieval', desc: 'Optimized RAG pipeline with sub-millisecond latency.' },
            { icon: Bot, title: 'Agentic Behavior', desc: 'Autonomous reasoning and tool use capabilities.' }
          ].map((feature, i) => (
            <div key={i} className="glass-panel p-8 rounded-3xl text-left border border-black/5 dark:border-white/5 bg-white/50 dark:bg-white/[0.02] hover:bg-white/80 dark:hover:bg-white/[0.05] transition-all group">
              <feature.icon className="w-10 h-10 text-violet-500 dark:text-violet-400 mb-4 transition-transform group-hover:scale-110" />
              <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div >
  );
};

export default LandingPage;
