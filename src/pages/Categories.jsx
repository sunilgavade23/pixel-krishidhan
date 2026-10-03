import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tractor, Sprout, Hammer, Truck, Shovel, Wind, RotateCcw } from 'lucide-react';
import MobileLayout from '../components/MobileLayout';

const CATEGORY_LABELS_BY_LANG = {
    en: {
        tractor: 'Tractor',
        harvester: 'Harvester',
        tools: 'Farming Tools',
        blower: 'Blower',
        trolly: 'Trolly',
        sowing_machine: 'Sowing Machine',
        thresing_machine: 'Thresing Machine',
        rotar: 'Rotar',
        aerial_digital_agri_tech: 'Aerial & Digital Agriculture Tech',
        advanced_harvesting_machinery: 'Advanced Harvesting Machinery',
        precision_land_preparation_planting: 'Precision Land Preparation & Planting Machines',
        orchard_high_value_crop_equipment: 'Orchard & High-Value Crop Equipment',
        post_harvest_processing_infrastructure: 'Post-Harvest & Processing Infrastructure',
    },
    hi: {
        tractor: 'ट्रैक्टर',
        harvester: 'हार्वेस्टर',
        tools: 'कृषि उपकरण',
        blower: 'ब्लोअर',
        trolly: 'ट्रॉली',
        sowing_machine: 'बुवाई मशीन',
        thresing_machine: 'थ्रेसिंग मशीन',
        rotar: 'रोटर',
    },
    mr: {
        tractor: 'ट्रॅक्टर',
        harvester: 'हार्वेस्टर',
        tools: 'शेतीची अवजारे',
        blower: 'ब्लोअर',
        trolly: 'ट्रॉली',
        sowing_machine: 'पेरणी यंत्र',
        thresing_machine: 'थ्रेशिंग मशीन',
        rotar: 'रोटर',
    },
};

const Categories = ({ t }) => {
    const navigate = useNavigate();
    const lang = localStorage.getItem('kd_lang') || 'en';
    const labels = CATEGORY_LABELS_BY_LANG[lang] || CATEGORY_LABELS_BY_LANG.en;

    // Keep keys aligned with backend category values.
    const categories = [
        { id: 1, key: 'tractor', icon: <Tractor size={28} />, color: 'bg-orange-50 text-orange-600 border-orange-100' },
        { id: 2, key: 'harvester', icon: <Truck size={28} />, color: 'bg-green-50 text-green-600 border-green-100' },
        { id: 3, key: 'tools', icon: <Hammer size={28} />, color: 'bg-blue-50 text-blue-600 border-blue-100' },
        { id: 4, key: 'blower', icon: <Wind size={28} />, color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
        { id: 5, key: 'trolly', icon: <Truck size={28} />, color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
        { id: 6, key: 'sowing_machine', icon: <Sprout size={28} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        { id: 7, key: 'thresing_machine', icon: <Shovel size={28} />, color: 'bg-purple-50 text-purple-600 border-purple-100' },
        { id: 8, key: 'rotar', icon: <RotateCcw size={28} />, color: 'bg-lime-50 text-lime-700 border-lime-100' },
        { id: 9, key: 'aerial_digital_agri_tech', icon: <Wind size={28} />, color: 'bg-sky-50 text-sky-600 border-sky-100' },
        { id: 10, key: 'advanced_harvesting_machinery', icon: <Truck size={28} />, color: 'bg-teal-50 text-teal-600 border-teal-100' },
        { id: 11, key: 'precision_land_preparation_planting', icon: <Shovel size={28} />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
        { id: 12, key: 'orchard_high_value_crop_equipment', icon: <Sprout size={28} />, color: 'bg-rose-50 text-rose-600 border-rose-100' },
        { id: 13, key: 'post_harvest_processing_infrastructure', icon: <Hammer size={28} />, color: 'bg-amber-50 text-amber-600 border-amber-100' },
    ];

    return (
        <MobileLayout t={t}>
            <div className="pb-6">
                {/* Section Header */}
                <div className="flex justify-between items-end mb-6 px-1">
                    <div>
                        <h2 className="text-xl font-black text-gray-800">{t('category')}</h2>
                        <p className="text-xs text-gray-400 font-medium mt-1">{t('explore_by_type') || 'Explore equipment by type'}</p>
                    </div>
                </div>

                {/* Grid Layout for Categories */}
                <div className="grid grid-cols-2 gap-4">
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            onClick={() => navigate(`/home?category=${encodeURIComponent(cat.key)}`)}
                            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all flex flex-col items-center text-center group"
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 border ${cat.color} group-hover:scale-110 transition-transform`}>
                                {cat.icon}
                            </div>
                            <h3 className="font-bold text-gray-800 text-sm">{labels[cat.key] || cat.key}</h3>
                            <p className="text-[10px] text-gray-400 font-bold mt-1 bg-gray-50 px-2 py-0.5 rounded-full">
                                {t('live_items') || 'Live Items'}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </MobileLayout>
    );
};

export default Categories;
