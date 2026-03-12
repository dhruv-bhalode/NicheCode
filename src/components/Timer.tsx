import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserPreferences } from '../contexts/UserPreferencesContext';

interface TimerProps {
  running: boolean;
  successProbability?: number | null;
  acceptanceRate?: number | null;
}

export default function Timer({ running, successProbability, acceptanceRate }: TimerProps) {
  const [time, setTime] = useState(0);
  const { theme, fontSize } = useUserPreferences();

  const displayValue = (acceptanceRate && acceptanceRate > 0) ? acceptanceRate / 100 : successProbability;
  const displayLabel = (acceptanceRate && acceptanceRate > 0) ? "Acceptance" : "Success Prob.";
  const displayColor = displayValue !== null && displayValue !== undefined ? (
    displayValue >= 0.7 ? 'text-emerald-400' :
      displayValue >= 0.4 ? 'text-amber-400' : 'text-rose-400'
  ) : '';

  useEffect(() => {
    let interval: any;

    if (running) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [running]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border p-2 transition-all shadow-sm ${theme === 'vs-dark' ? 'bg-zinc-900/80 border-white/5 shadow-black/20 backdrop-blur-sm hover:border-violet-500/20' : 'bg-white border-zinc-200 shadow-zinc-200/50 hover:border-violet-500/30'
      }`}
      style={{ fontSize: `${Math.min(fontSize * 0.9, 14)}px` }}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${running
        ? 'bg-violet-600/20 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.2)] animate-pulse'
        : theme === 'vs-dark' ? 'bg-zinc-950 text-zinc-600' : 'bg-zinc-100 text-zinc-400'
        }`}>
        <Clock className="h-4 w-4" />
      </div>
      <div>
        <div className={`text-[9px] font-bold uppercase tracking-widest leading-none mb-1 ${theme === 'vs-dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>Elapsed Time</div>
        <span className={`font-mono text-lg font-bold tracking-tight transition-colors ${theme === 'vs-dark' ? 'text-white group-hover:text-violet-300' : 'text-zinc-900 group-hover:text-violet-600'}`}>
          {formatTime(time)}
        </span>
      </div>

      {displayValue !== undefined && displayValue !== null && (
        <div className={`ml-3 pl-3 border-l ${theme === 'vs-dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className={`text-[9px] font-bold uppercase tracking-widest leading-none mb-1 ${theme === 'vs-dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>{displayLabel}</div>
          <span className={`font-mono text-lg font-bold tracking-tight ${displayColor}`}>
            {(displayValue * 100).toFixed(2)}%
          </span>
        </div>
      )}

      {running && (
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="ml-2 w-1.5 h-1.5 rounded-full bg-violet-600"
        ></motion.div>
      )}
    </div>
  );
}