import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import OnboardingModal from './OnboardingModal';

interface OnboardingGuardianProps {
    children: React.ReactNode;
}

const OnboardingGuardian: React.FC<OnboardingGuardianProps> = ({ children }) => {
    const { user, loading } = useAuth();
    // Use an internal state to track if we should BE in onboarding mode.
    // This prevents the modal from unmounting as soon as 'user.isOnboarded' becomes true.
    const [forceOnboarding, setForceOnboarding] = useState(false);

    useEffect(() => {
        // Trigger onboarding ONLY if:
        // 1. User is not onboarded
        // 2. User has NO activity history (truly first-time)
        const hasActivity = user?.recentActivity && user.recentActivity.length > 0;

        if (!loading && user && !user.isOnboarded && !hasActivity) {
            setForceOnboarding(true);
        }
    }, [user, loading]);

    const handleOnboardingComplete = () => {
        setForceOnboarding(false);
        // Refresh to ensure all data is consistent across all contexts
        window.location.reload();
    };

    if (loading) {
        return null;
    }

    // If we are in onboarding mode, show the modal even if user.isOnboarded has flipped 
    // to true (this allows the Success screen animation to finish in the modal)
    if (forceOnboarding && user) {
        return <OnboardingModal userId={user.id} onComplete={handleOnboardingComplete} />;
    }

    return <>{children}</>;
};

export default OnboardingGuardian;
