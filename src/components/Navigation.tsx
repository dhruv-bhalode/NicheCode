import React from 'react';
import { LogOut, Home, Bot, Zap, Code2, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SettingsModal from './SettingsModal';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  return (
    <>
      <nav className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-md border-b border-black/5 dark:border-zinc-800 px-6 py-3 sticky top-0 z-50 transition-colors duration-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center cursor-pointer group" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                <Bot className="h-6 w-6 text-violet-500" />
              </div>
              <span className="text-xl font-bold text-zinc-900 dark:text-white tracking-tighter">
                Niche<span className="text-violet-500">Code</span>
              </span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex items-center px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium ${location.pathname === '/dashboard'
                  ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => navigate('/practice')}
                className={`flex items-center px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium ${location.pathname === '/practice'
                  ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
              >
                <Zap className="h-4 w-4 mr-2" />
                Practice
              </button>
              <button
                onClick={() => navigate('/ide')}
                className={`flex items-center px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium ${location.pathname === '/ide'
                  ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
              >
                <Code2 className="h-4 w-4 mr-2" />
                IDE
              </button>
              <button
                onClick={() => navigate('/chat')}
                className={`flex items-center px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium ${location.pathname === '/chat'
                  ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
              >
                <Bot className="h-4 w-4 mr-2" />
                NicheCodeAI
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 pr-6 border-r border-black/5 dark:border-zinc-800">
              <div className="relative">
                <img
                  src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kshitij'}
                  alt={user?.name}
                  className="h-9 w-9 rounded-full border border-violet-500/30 ring-2 ring-violet-500/10"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full"></div>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold text-zinc-900 dark:text-white leading-none">{user?.name || 'Kshitij'}</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mt-1">{user?.experience || 'Pro Developer'}</div>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 text-zinc-500 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-500/10 dark:hover:bg-violet-400/10 rounded-xl transition-all duration-300"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>

            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-2.5 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-400/10 rounded-xl transition-all duration-300"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
