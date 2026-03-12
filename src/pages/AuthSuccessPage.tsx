import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bot } from 'lucide-react';

const AuthSuccessPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { } = useAuth(); // We'll need a way to set user without password, or just reload

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            // Store token
            localStorage.setItem('token', token);

            // We need to fetch user details using this token
            // Since useAuth doesn't expose a "fetchUser" method directly, 
            // we can reload the page which triggers the AuthProvider's useEffect
            // or we can manually fetch validation endpoint.

            // For now, let's try to reload the app to let AuthProvider handle it
            // checking AuthProvider implementation...

            // AuthProvider checks localStorage.getItem('user').
            // The backend didn't send the user object in URL, only token.
            // We should probably fetch the user profile.

            const fetchUserProfile = async () => {
                try {
                    const response = await fetch('http://localhost:5001/api/auth/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        localStorage.setItem('user', JSON.stringify(data.user));
                        window.location.href = '/'; // Hard reload to ensure context updates
                    } else {
                        navigate('/login?error=auth_failed');
                    }
                } catch (error) {
                    console.error("Failed to fetch profile", error);
                    navigate('/login?error=auth_failed');
                }
            };

            // Wait, we don't have /api/auth/me endpoint in index.js yet?
            // We usually depend on /api/login returning user.
            // If we only have token, we need an endpoint to get user data.
            // Let's implement that briefly in index.js or just use what we have.

            // Workaround: We can decode the token if it has user info, but it usually only has ID.
            // Best practice: Add /api/auth/me

            fetchUserProfile();
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center transition-colors duration-500">
            <div className="flex flex-col items-center animate-pulse">
                <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-600/20">
                    <Bot className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Completing Sign In...</h2>
            </div>
        </div>
    );
};

export default AuthSuccessPage;
