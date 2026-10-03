import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SplashScreen = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Route by session after 3 seconds.
        const timer = setTimeout(() => {
            const uid = localStorage.getItem('kd_uid');
            navigate(uid ? '/home' : '/login');
        }, 3000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <div
                onClick={() => {
                    const uid = localStorage.getItem('kd_uid');
                    navigate(uid ? '/home' : '/login');
                }}
                className="cursor-pointer flex flex-col items-center"
            >
                {/* Official Brand Logo - Enlarged and using local path */}
                <img
                    src="/logo.jpeg"
                    alt="KrishiDhan Logo"
                    className="w-80 h-auto animate-pulse"
                />
            </div>
        </div>
    );
};

export default SplashScreen;
