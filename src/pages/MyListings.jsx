import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Trash2, Package } from 'lucide-react';
import MobileLayout from '../components/MobileLayout';
import { deleteListing, getListings } from '../services';

const MyListings = ({ t }) => {
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState('');

    const loadListings = async () => {
        const uid = localStorage.getItem('kd_uid');
        if (!uid) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError('');
        const result = await getListings({ ownerId: uid });
        setLoading(false);

        if (!result.ok) {
            setError(result.message || 'Failed to load listings');
            return;
        }

        setListings(result.data || []);
    };

    useEffect(() => {
        loadListings();
    }, []);

    const handleDelete = async (listingId) => {
        const uid = localStorage.getItem('kd_uid');
        if (!uid) {
            navigate('/login');
            return;
        }

        const confirmed = window.confirm('Delete this listing?');
        if (!confirmed) return;

        setDeletingId(listingId);
        const result = await deleteListing({ listingId, actorId: uid });
        setDeletingId('');

        if (!result.ok) {
            setError(result.message || 'Failed to delete listing');
            return;
        }

        setListings((prev) => prev.filter((item) => item.id !== listingId));
    };

    return (
        <MobileLayout t={t}>
            <div className="pb-6">
                <div className="flex items-center gap-3 mb-4 px-1">
                    <button onClick={() => navigate('/profile')} className="p-2 bg-white rounded-full shadow-sm border">
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="text-xl font-black text-gray-800">My Listings</h1>
                </div>

                {loading && <p className="text-sm text-gray-500 px-1">{t('loading') || 'Loading...'}</p>}
                {!loading && error && <p className="text-sm text-red-500 px-1">{error}</p>}

                {!loading && !error && (
                    <div className="space-y-3 px-1">
                        {listings.length > 0 ? (
                            listings.map((item) => (
                                <div key={item.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex gap-3">
                                    <img
                                        src={item.images?.[0] || 'https://placehold.co/120x120?text=No+Image'}
                                        alt={item.title}
                                        className="w-16 h-16 rounded-xl object-cover bg-gray-100"
                                    />
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800 text-sm">{item.title}</p>
                                        <p className="text-[11px] text-gray-500 mt-1">{item.city}</p>
                                        <p className="text-[11px] text-green-700 font-black mt-1">
                                            Rs {item.listingType === 'rent' ? item.pricePerDay : item.sellPrice}
                                        </p>
                                        <div className="mt-2 flex gap-2">
                                            <button
                                                onClick={() => navigate(`/equipment/${item.id}`)}
                                                className="text-[10px] px-2 py-1 rounded-md bg-blue-600 text-white font-bold flex items-center gap-1"
                                            >
                                                <Eye size={12} />
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                disabled={deletingId === item.id}
                                                className="text-[10px] px-2 py-1 rounded-md bg-red-600 text-white font-bold flex items-center gap-1 disabled:opacity-60"
                                            >
                                                <Trash2 size={12} />
                                                {deletingId === item.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 opacity-60">
                                <Package size={40} className="text-gray-400 mb-2" />
                                <p className="text-sm font-bold text-gray-600">No listings yet</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MobileLayout>
    );
};

export default MyListings;

