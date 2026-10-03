import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingBag, User, MapPin, Plus } from 'lucide-react';

const MobileLayout = ({ children, t, hideHeaderLocation = false }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? "text-[#166534] scale-110" : "text-gray-400";

    const locationLabel = (() => {
        try {
            const liveCity = localStorage.getItem('kd_live_city');
            if (liveCity) return liveCity;

            const coords = JSON.parse(localStorage.getItem('kd_user_coords') || 'null');
            if (coords?.lat && coords?.lng) {
                return `${Number(coords.lat).toFixed(2)}, ${Number(coords.lng).toFixed(2)}`;
            }
        } catch {
            // no-op
        }
        return 'Location';
    })();

    return (
        <div className="bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-50 via-white to-green-50 min-h-screen max-w-md mx-auto shadow-2xl overflow-x-hidden relative">
            {/* Header section remains unchanged */}
            <header className="fixed top-0 max-w-md w-full bg-white/90 backdrop-blur-xl z-40 px-5 py-4 flex justify-between items-center border-b border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="w-12"></div>

                <div className="flex flex-col items-center">
                    <img
                        src="/logo.jpeg"
                        alt="KrishiDhan Logo"
                        className="h-11 object-contain drop-shadow-sm animate-float"
                    />
                </div>

                <div className="w-12 flex justify-end">
                    {!hideHeaderLocation && (
                        <div className="flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded-2xl border border-green-100/50">
                            <MapPin size={10} className="text-green-700" />
                            <span className="text-[9px] font-black text-green-800 uppercase tracking-tight truncate max-w-14">{locationLabel}</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Main content: Increased padding bottom to pb-40 for scrollable action buttons */}
            <main className="pt-20 pb-40 px-4 bg-transparent">
                <div key={location.pathname} className="animate-page-enter">
                    {children}
                </div>
            </main>

            {/* Floating Navigation Bar Section */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] z-50">
                <nav className="bg-white/90 backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] px-2 py-3 flex items-center justify-around relative">
                    {/* Home Button */}
                    <button onClick={() => navigate('/home')} className={`flex flex-col items-center gap-1 transition-all duration-300 active:scale-90 ${isActive('/home')}`}>
                        <div className={`p-2 rounded-xl relative ${location.pathname === '/home' ? 'bg-green-50 animate-nav-pop' : ''}`}>
                            <Home size={22} strokeWidth={location.pathname === '/home' ? 2.5 : 2} />
                            {location.pathname === '/home' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-glow-pulse"></div>}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tighter">{t('home')}</span>
                    </button>

                    {/* Categories Button */}
                    <button onClick={() => navigate('/categories')} className={`flex flex-col items-center gap-1 transition-all duration-300 active:scale-90 ${isActive('/categories')}`}>
                        <div className={`p-2 rounded-xl relative ${location.pathname === '/categories' ? 'bg-green-50 animate-nav-pop' : ''}`}>
                            <Grid size={22} strokeWidth={location.pathname === '/categories' ? 2.5 : 2} />
                            {location.pathname === '/categories' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-glow-pulse"></div>}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tighter">{t('category')}</span>
                    </button>

                    {/* Central Plus Button */}
                    {/* Central Plus Button */}
                    <div className="relative">
                        {/* Main Post Button - Highlighted */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                            <div className="animate-heartbeat">
                                <button onClick={() => navigate('/post-choice')} className="bg-gradient-to-br from-[#166534] to-[#22c55e] text-white p-4 rounded-full shadow-[0_8px_25px_rgba(22,101,52,0.5)] active:scale-125 transition-transform flex items-center justify-center border-4 border-[#F8FAFC] group">
                                    <Plus size={32} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                        <div className="w-12 h-8"></div>
                    </div>

                    {/* Orders Button */}
                    <button onClick={() => navigate('/my-orders')} className={`flex flex-col items-center gap-1 transition-all duration-300 active:scale-90 ${isActive('/my-orders')}`}>
                        <div className={`p-2 rounded-xl relative ${location.pathname === '/my-orders' ? 'bg-green-50 animate-nav-pop' : ''}`}>
                            <ShoppingBag size={22} strokeWidth={location.pathname === '/my-orders' ? 2.5 : 2} />
                            {location.pathname === '/my-orders' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-glow-pulse"></div>}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tighter">{t('orders')}</span>
                    </button>

                    {/* Profile Button */}
                    <button onClick={() => navigate('/profile')} className={`flex flex-col items-center gap-1 transition-all duration-300 active:scale-90 ${isActive('/profile')}`}>
                        <div className={`p-2 rounded-xl relative ${location.pathname === '/profile' ? 'bg-green-50 animate-nav-pop' : ''}`}>
                            <User size={22} strokeWidth={location.pathname === '/profile' ? 2.5 : 2} />
                            {location.pathname === '/profile' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-glow-pulse"></div>}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-tighter">{t('profile')}</span>
                    </button>
                </nav>
            </div>
        </div>
    );
};

export default MobileLayout;
