import React from 'react';
import { Trophy, Target, Clock, TrendingUp, Code2, Brain, Zap, ArrowRight, BookOpen, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Problems Solved', value: user?.solvedProblems || 0, icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Accuracy Rate', value: `${user?.accuracy || 0}%`, icon: Target, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Avg. Time', value: '12m 34s', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Streak', value: '7 days', icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-400/10' }
  ];

  const recommendedProblems = [
    {
      id: '1',
      title: 'Two Sum',
      difficulty: 'Easy',
      tags: ['Array', 'Hash Table'],
      successRate: 89,
      estimatedTime: '15 min'
    },
    {
      id: '2',
      title: 'Valid Parentheses',
      difficulty: 'Easy',
      tags: ['String', 'Stack'],
      successRate: 92,
      estimatedTime: '10 min'
    },
    {
      id: '3',
      title: 'Merge Two Sorted Lists',
      difficulty: 'Easy',
      tags: ['Linked List', 'Recursion'],
      successRate: 85,
      estimatedTime: '18 min'
    }
  ];

  const weakAreas = [
    { topic: 'Dynamic Programming', score: 65, improvement: '+12%', color: 'bg-rose-500' },
    { topic: 'Graph Algorithms', score: 72, improvement: '+8%', color: 'bg-amber-500' },
    { topic: 'Tree Traversal', score: 78, improvement: '+15%', color: 'bg-violet-500' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 relative">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 blur-[100px] rounded-full -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-600/5 blur-[100px] rounded-full -z-10"></div>

      {/* Welcome Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-12 border border-white/10 bg-gradient-to-br from-violet-600/20 via-zinc-900/50 to-zinc-900/80 backdrop-blur-xl group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Zap className="w-40 h-40 text-violet-500" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-bold uppercase tracking-widest mb-6">
            Pro Performance Dashboard
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Welcome back, <span className="text-gradient">{user?.name || 'Kshitij'}</span>!
          </h1>
          <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
            Your performance is 15% better than last week. Ready to crush some more algorithms today?
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/chat')}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] flex items-center gap-2"
            >
              Start AI Chat <ArrowRight className="w-4 h-4" />
            </button>
            <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-all backdrop-blur-md">
              View Progress
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-panel p-6 rounded-2xl group hover:border-violet-500/30 transition-all border border-white/5 bg-zinc-900/40"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Real-time
              </div>
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recommended Problems */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 bg-zinc-900/40">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/20">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-violet-400" />
                </div>
                Recommended Problems
              </h2>
              <button className="text-xs font-bold text-violet-500 hover:text-violet-400 transition-colors uppercase tracking-widest">
                Refresh Path
              </button>
            </div>

            <div className="p-6 space-y-4">
              {recommendedProblems.map((problem) => (
                <motion.div
                  key={problem.id}
                  whileHover={{ x: 8 }}
                  className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer flex items-center justify-between group"
                  onClick={() => navigate(`/solve/${problem.id}`)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-white/5 group-hover:border-violet-500/30 transition-all shadow-inner">
                      <Code2 className="h-6 w-6 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-violet-300 transition-colors">{problem.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5 font-medium">
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded-md ${problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                          {problem.difficulty}
                        </span>
                        <div className="flex gap-2">
                          {problem.tags.map((tag) => (
                            <span key={tag} className="text-[10px] text-zinc-500 uppercase tracking-wider">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="hidden md:block text-right">
                      <div className="text-xs font-bold text-white">{problem.successRate}% <span className="text-zinc-500">Success</span></div>
                      <div className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">{problem.estimatedTime}</div>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-violet-600 transition-all group-hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                      <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights Section */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-900/40">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
              <Star className="h-5 w-5 text-amber-400" />
              Skill Distribution
            </h3>
            <div className="space-y-6">
              {weakAreas.map((area) => (
                <div key={area.topic}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-zinc-300">{area.topic}</span>
                    <span className="text-xs font-bold text-white">{area.score}%</span>
                  </div>
                  <div className="w-full bg-zinc-900/80 rounded-full h-1.5 overflow-hidden border border-white/5 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${area.score}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`${area.color} h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Momentum</span>
                    <span className="text-[10px] text-emerald-400 font-bold">{area.improvement}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all backdrop-blur-md uppercase tracking-widest">
              Detailed Roadmap
            </button>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-900/40">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
              <Zap className="h-5 w-5 text-violet-400" />
              Recent Activity
            </h3>
            <div className="space-y-6 relative">
              <div className="absolute left-1 top-2 bottom-2 w-px bg-zinc-800"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 relative z-10">
                  <div className="w-2 h-2 rounded-full bg-violet-600 mt-1.5 shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
                  <div>
                    <p className="text-sm font-bold text-zinc-200">Solved "Two Sum" in 14 minutes</p>
                    <p className="text-[10px] text-zinc-500 mt-1 font-medium uppercase tracking-widest">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
