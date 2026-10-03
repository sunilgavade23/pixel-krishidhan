import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, List, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/MobileLayout';

const Schemes = ({ t }) => {
    const navigate = useNavigate();
    // १. View Mode स्टेट पुन्हा जोडली
    const [viewMode, setViewMode] = useState('list');

    const centralSchemes = [
        { id: 1, key: 'pm_kisan', desc: 'Pradhan Mantri Kisan Samman Nidhi', img: '/schemes-logos/pm_kisan.jpeg', url: 'https://pmkisan.gov.in/' },
        { id: 2, key: 'pmfby', desc: 'Pradhan Mantri Fasal Bima Yojana', img: '/schemes-logos/pmfby.jpeg', url: 'https://pmfby.gov.in/' },
        { id: 4, key: 'kcc', desc: 'Kisan Credit Card Scheme', img: '/schemes-logos/kcc.jpeg', url: 'https://kcc.pmkisan.gov.in/' },
        { id: 6, key: 'shc', desc: 'Soil Health Card Scheme', img: '/schemes-logos/shc.jpeg', url: 'https://soilhealth.dac.gov.in/' },
        { id: 7, key: 'pkvy', desc: 'Organic Farming (PKVY)', img: '/schemes-logos/pkvy.jpeg', url: 'https://pgsindia-ncof.dac.gov.in/' },
        { id: 8, key: 'enam', desc: 'National Agriculture Market', img: '/schemes-logos/enam.jpeg', url: 'https://www.enam.gov.in/' },
        { id: 9, key: 'pmaasha', desc: 'PM Annadata Aay SanraksHan Abhiyan', img: '/schemes-logos/pmaasha.jpeg', url: 'https://agriwelfare.gov.in/en/Aasha' },
        { id: 10, key: 'drone_didi', desc: 'Namo Drone Didi Scheme', img: '/schemes-logos/drone_didi.jpeg', url: 'https://lakhpatididi.gov.in/power_to_empower/namo-drone-didi/' },
        { id: 11, key: 'aif', desc: 'Agriculture Infrastructure Fund', img: '/schemes-logos/aif.jpeg', url: 'https://agriinfra.dac.gov.in/' },
        { id: 12, key: 'rkvy', desc: 'Rashtriya Krishi Vikas Yojana', img: '/schemes-logos/rkvy.jpeg', url: 'https://rkvy.nic.in/' },
        { id: 13, key: 'kisan_portal', desc: 'Kisan Suvidha Portal', img: '/schemes-logos/kisan_portal.jpeg', url: 'https://kisansuvidha.gov.in/' },
        { id: 14, key: 'pmkmy', desc: 'PM Kisan Maandhan Yojana', img: '/schemes-logos/pmkmy.jpeg', url: 'https://maandhan.in/' },
        { id: 15, key: 'pmksy', desc: 'PM Krishi Sinchayee Yojana', img: '/schemes-logos/pmksy.jpeg', url: 'https://pmksy.gov.in/' },
    ];

    const maharashtraSchemes = [
        { id: 101, key: 'namo_shetkari', desc: 'Namo Shetkari Sanman Nidhi', img: '/schemes-logos/namo_shetkari.png', url: 'https://nsmny.mahait.org/' },
        { id: 102, key: 'magel_tyala', desc: 'Magel Tyala Shettale Scheme', img: '/schemes-logos/magel_tyala.jpeg', url: 'https://mahadbt.maharashtra.gov.in/' },
        { id: 103, key: 'ambedkar_yojana', desc: 'Ambedkar Krushi Swavalamban', img: '/schemes-logos/ambedkar_yojana.jpeg', url: 'https://mahadbt.maharashtra.gov.in/' },
        { id: 104, key: 'shivaji_maharaj', desc: 'CSM Shetkari Sanman Yojana', img: '/schemes-logos/shivaji_maharaj.jpeg', url: 'https://csmssy.in/' },
        { id: 105, key: 'mahadbt', desc: 'MahaDBT Farmer Subsidies', img: '/schemes-logos/mahadbt.jpeg', url: 'https://mahadbt.maharashtra.gov.in/' },
        { id: 106, key: 'munde_vima', desc: 'Gopinath Munde Shetkari Vima', img: '/schemes-logos/munde_vima.jpeg', url: 'https://mahadbt.maharashtra.gov.in/' },
        { id: 107, key: 'sharad_pawar', desc: 'Sharad Pawar Gram Samridhi', img: '/schemes-logos/sharad_pawar.jpeg', url: 'https://egs.maharashtra.gov.in/' },
        { id: 108, key: 'fundkar_orchard', desc: 'Bhausaheb Fundkar Horticulture', img: '/schemes-logos/fundkar_orchard.jpeg', url: 'https://mahadbt.maharashtra.gov.in/' },
        { id: 109, key: 'pocra', desc: 'Nanaji Deshmukh Krishi Sanjivani', img: '/schemes-logos/pocra.jpeg', url: 'https://mahapocra.gov.in/' },
        { id: 110, key: 'pashudhan', desc: 'Mukhyamantri Pashudhan Sanvardhan', img: '/schemes-logos/pashudhan.jpeg', url: 'https://ahd.maharashtra.gov.in/' },
    ];

    const SchemeCard = ({ scheme }) => (
        <a href={scheme.url} target="_blank" rel="noopener noreferrer" className={`bg-white border border-green-50 shadow-sm rounded-2xl overflow-hidden active:scale-95 transition-transform ${viewMode === 'list' ? 'flex p-3 gap-3 items-center' : 'flex flex-col p-3 text-center'}`}>
            <img
                src={scheme.img}
                alt={t(scheme.key)}
                className={`${viewMode === 'list' ? 'w-14 h-14' : 'w-16 h-16 mx-auto mb-2'} rounded-xl object-contain bg-gray-50 border border-gray-100`}
            />
            <div className={`flex-1 ${viewMode === 'list' ? 'text-left' : 'text-center'}`}>
                <h3 className="font-bold text-gray-800 text-xs leading-tight">{t(scheme.key)}</h3>
                {viewMode === 'list' && <p className="text-[9px] text-gray-400 mt-1 line-clamp-1">{scheme.desc}</p>}
                <span className={`inline-flex items-center gap-1 mt-2 text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded ${viewMode === 'grid' ? 'mx-auto' : ''}`}>
                    {t('apply_online')} <ExternalLink size={10} />
                </span>
            </div>
        </a>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-20">
            <MobileLayout t={t}>
                {/* २. वरच्या कोपऱ्यात Grid/List स्विच पुन्हा जोडले */}
                <div className="flex items-center justify-between mb-6 pt-2">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm border border-green-100 active:scale-90">
                            <ArrowLeft size={20} className="text-green-700" />
                        </button>
                        <h1 className="text-xl font-black text-gray-800">{t('govt_schemes')}</h1>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-green-50">
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-green-600 text-white' : 'text-gray-400'}`}><List size={18} /></button>
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'text-gray-400'}`}><LayoutGrid size={18} /></button>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-1 border-l-4 border-orange-500 pl-3">{t('state_schemes')}</h2>
                    <div className={viewMode === 'list' ? 'space-y-3 px-1' : 'grid grid-cols-2 gap-3 px-1'}>
                        {maharashtraSchemes.map(s => <SchemeCard key={s.id} scheme={s} />)}
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-1 border-l-4 border-blue-500 pl-3">{t('central_schemes')}</h2>
                    <div className={viewMode === 'list' ? 'space-y-3 px-1' : 'grid grid-cols-2 gap-3 px-1'}>
                        {centralSchemes.map(s => <SchemeCard key={s.id} scheme={s} />)}
                    </div>
                </div>
            </MobileLayout>
        </div>
    );
};

export default Schemes;