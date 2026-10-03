import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Banknote, CalendarClock } from 'lucide-react';
import MobileLayout from '../components/MobileLayout';

const PostChoice = ({ t }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
            <MobileLayout t={t}>
                {/* Header Section */}
                <div className="flex items-center gap-3 mb-10 pt-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white rounded-full shadow-sm border border-green-100 active:scale-90 transition-transform"
                    >
                        <ArrowLeft size={20} className="text-green-700" />
                    </button>
                    <h1 className="text-xl font-black text-gray-800">
                        {t('post_ad')}
                    </h1>
                </div>

                <div className="flex flex-col gap-6">
                    {/* Option: Rent - Using proper translation key */}
                    <button
                        onClick={() => navigate('/post-equipment?type=rent')}
                        className="group relative overflow-hidden bg-green-600 rounded-3xl p-12 text-center shadow-xl active:scale-98 transition-all"
                    >
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <CalendarClock size={44} className="text-white" />
                            <h2 className="text-4xl font-black text-white uppercase tracking-widest">
                                {t('rent')}
                            </h2>
                        </div>
                    </button>

                    {/* Option: Sell - Using proper translation key */}
                    <button
                        onClick={() => navigate('/post-equipment?type=sell')}
                        className="group relative overflow-hidden bg-orange-500 rounded-3xl p-12 text-center shadow-xl active:scale-98 transition-all"
                    >
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <Banknote size={44} className="text-white" />
                            <h2 className="text-4xl font-black text-white uppercase tracking-widest">
                                {t('sell')}
                            </h2>
                        </div>
                    </button>
                </div>
            </MobileLayout>
        </div>
    );
};

export default PostChoice;