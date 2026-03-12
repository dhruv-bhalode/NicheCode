import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserPreferences {
    theme: 'vs-dark' | 'light';
    fontSize: number;
    submitKeyBinding: string;
    isStaticColor: boolean;
}

interface UserPreferencesContextType extends UserPreferences {
    setTheme: (theme: 'vs-dark' | 'light') => void;
    setFontSize: (size: number) => void;
    setSubmitKeyBinding: (binding: string) => void;
    setIsStaticColor: (isStatic: boolean) => void;
}

const defaultPreferences: UserPreferences = {
    theme: 'vs-dark',
    fontSize: 14,
    submitKeyBinding: 'Shift+Enter',
    isStaticColor: false,
};

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export const useUserPreferences = () => {
    const context = useContext(UserPreferencesContext);
    if (!context) {
        throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
    }
    return context;
};

interface UserPreferencesProviderProps {
    children: ReactNode;
}

export const UserPreferencesProvider: React.FC<UserPreferencesProviderProps> = ({ children }) => {
    const [preferences, setPreferences] = useState<UserPreferences>(() => {
        const saved = localStorage.getItem('userPreferences');
        return saved ? JSON.parse(saved) : defaultPreferences;
    });

    useEffect(() => {
        localStorage.setItem('userPreferences', JSON.stringify(preferences));

        // Apply global theme classes
        if (preferences.theme === 'vs-dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [preferences]);

    const setTheme = (theme: 'vs-dark' | 'light') => {
        setPreferences(prev => ({ ...prev, theme }));
    };

    const setFontSize = (fontSize: number) => {
        setPreferences(prev => ({ ...prev, fontSize }));
    };

    const setSubmitKeyBinding = (submitKeyBinding: string) => {
        setPreferences(prev => ({ ...prev, submitKeyBinding }));
    };

    const setIsStaticColor = (isStaticColor: boolean) => {
        setPreferences(prev => ({ ...prev, isStaticColor }));
    };

    return (
        <UserPreferencesContext.Provider
            value={{
                ...preferences,
                setTheme,
                setFontSize,
                setSubmitKeyBinding,
                setIsStaticColor,
            }}
        >
            {children}
        </UserPreferencesContext.Provider>
    );
};
