import { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { Problem, MCQQuestion } from '../data/problems';
import axios from 'axios';
import { useAuth } from './AuthContext';

interface ProblemContextType {
  currentProblem: Problem | null;
  problems: Problem[];
  allProblems: Problem[];
  mcqQuestions: MCQQuestion[];
  currentMCQIndex: number;
  setCurrentProblem: (problem: Problem) => void;
  nextMCQ: () => void;
  resetMCQ: () => void;
  selectProblem: (id: string) => void;
  fetchProblem: (slug: string) => Promise<void>;
}

const ProblemContext = createContext<ProblemContextType | undefined>(undefined);

export function ProblemProvider({ children }: { children: ReactNode }) {
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [currentMCQIndex, setCurrentMCQIndex] = useState(0);
  const { user, loading: authLoading } = useAuth();
  const [initialSelectDone, setInitialSelectDone] = useState(false);

  // Reset selection flag when user changes (login/logout)
  useEffect(() => {
    setInitialSelectDone(false);
  }, [user?.id]);

  const mcqQuestions = useMemo(() => currentProblem?.mcqs || [], [currentProblem]);

  // 1. Fetch baseline problem list on mount
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/problems?limit=100');
        if (response.data && response.data.problems) {
          setAllProblems(response.data.problems);
        }
      } catch (err) {
        console.error('Failed to fetch problems:', err);
      }
    };
    fetchProblems();
  }, []);

  // 2. Handle Initial Problem Selection (Guest vs. User Top Pick)
  useEffect(() => {
    // Wait for authentication state to resolve
    if (authLoading) return;

    const performInitialSelection = async () => {
      // Avoid double-selection if already done for this session/user
      if (initialSelectDone) return;

      if (!user) {
        // GUEST: Default to Two Sum (Index 0 in baseline list)
        console.log("[ProblemContext] Guest mode: Defaulting to Two Sum");
        selectProblem("1");
        setInitialSelectDone(true);
      } else {
        // LOGGED IN: Prioritize Top Recommendation
        try {
          console.log(`[ProblemContext] User ${user.id} logged in. Fetching top pick...`);
          const response = await axios.get(`http://localhost:5001/api/users/${user.id}/recommendations`);

          if (response.data && response.data.length > 0) {
            const topPickId = response.data[0].id;
            console.log(`[ProblemContext] Auto-selecting top pick: ${topPickId}`);
            selectProblem(topPickId);
            setInitialSelectDone(true);
          } else {
            console.log("[ProblemContext] No recommendations yet. Defaulting to Two Sum.");
            selectProblem("1");
            setInitialSelectDone(true);
          }
        } catch (err) {
          console.error("[ProblemContext] Failed to fetch top pick, falling back:", err);
          selectProblem("1");
          setInitialSelectDone(true);
        }
      }
    };

    performInitialSelection();
  }, [user?.id, authLoading, initialSelectDone]);

  const nextMCQ = () => {
    setCurrentMCQIndex(prev => Math.min(prev + 1, mcqQuestions.length - 1));
  };

  const resetMCQ = () => {
    setCurrentMCQIndex(0);
  };

  const selectProblem = async (id: string) => {
    // Check if we already have the full details 
    // We check for description AND that optimalSolution is not the placeholder string
    const existing = allProblems.find(p => p.id === id);

    if (existing &&
      existing.description &&
      Array.isArray(existing.optimalSolution)) {
      setCurrentProblem(existing);
      setCurrentMCQIndex(0);
      return;
    }

    // Fetch full details
    try {
      const response = await axios.get(`http://localhost:5001/api/problems/${id}`);
      const fullProblem = response.data;

      setCurrentProblem(fullProblem);
      setCurrentMCQIndex(0);

      // Update the list with full details (optional optimization)
      setAllProblems(prev => prev.map(p => p.id === id ? fullProblem : p));

    } catch (err) {
      console.error("Error fetching problem details:", err);
    }
  };

  const fetchProblem = async (slug: string) => {
    // Legacy or specific fetch by slug if needed
    // For now, let's assume we use selectProblem by ID mostly
    // But if we need to fetch by slug from LeetCode (not DB):
    // The backend /api/leetcode/:slug is still there.
    // But we probably want to search our DB by slug first?
    // For now, let's keep the old logic but point to our new backend if possible?
    // We are now on port 5001 (Node).
    // The legacy Python fetch on port 8000 has been deprecated.
    // API /api/problems?search=... could find it.

    try {
      // Attempt to find in our DB first
      const response = await axios.get(`http://localhost:5001/api/problems?search=${slug}`);
      if (response.data.problems && response.data.problems.length > 0) {
        selectProblem(response.data.problems[0].id);
      } else {
        alert("Problem not found in database.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ProblemContext.Provider value={{
      currentProblem,
      problems: allProblems,
      allProblems,
      mcqQuestions,
      currentMCQIndex,
      setCurrentProblem,
      nextMCQ,
      resetMCQ,
      selectProblem,
      fetchProblem
    }}>
      {children}
    </ProblemContext.Provider>
  );
}

export function useProblem() {
  const context = useContext(ProblemContext);
  if (context === undefined) {
    throw new Error('useProblem must be used within a ProblemProvider');
  }
  return context;
}