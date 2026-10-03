import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Package, Calendar } from 'lucide-react';
import MobileLayout from '../components/MobileLayout';
import { deleteRequest, getListings, getRequests, updateRequestStatus } from '../services';

const MyOrders = ({ t }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [viewTab, setViewTab] = useState('received');
    const [activeTab, setActiveTab] = useState('active');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState('');
    const [error, setError] = useState('');

    const statusClassName = (status) => {
        const value = String(status || '').toLowerCase();
        if (value === 'pending') return 'text-amber-700 bg-amber-50 border-amber-100';
        if (value === 'approved' || value === 'accepted') return 'text-blue-700 bg-blue-50 border-blue-100';
        if (value === 'completed') return 'text-emerald-700 bg-emerald-50 border-emerald-100';
        if (value === 'cancelled') return 'text-gray-700 bg-gray-100 border-gray-200';
        if (value === 'rejected') return 'text-red-700 bg-red-50 border-red-100';
        return 'text-green-700 bg-green-50 border-green-100';
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            const uid = localStorage.getItem('kd_uid');
            if (!uid) {
                setLoading(false);
                navigate('/login');
                return;
            }

            const [reqResult, listingResult] = await Promise.all([
                getRequests({ userId: uid }),
                getListings({}),
            ]);

            setLoading(false);

            if (!reqResult.ok) {
                setError(reqResult.message || 'Failed to load orders');
                return;
            }

            const listingsById = new Map((listingResult.ok ? listingResult.data : []).map((l) => [l.id, l]));

            const mapped = reqResult.data.map((request) => {
                const listing = listingsById.get(request.listingId) || {};
                const isRent = request.requestType === 'rent';
                const role = request.ownerId === uid ? 'received' : 'sent';

                return {
                    id: request.id,
                    listingId: request.listingId,
                    title: listing.title || (listing.category ? `${listing.category.charAt(0).toUpperCase()}${listing.category.slice(1)}` : request.listingId),
                    type: isRent ? 'Rent' : 'Buy',
                    status: request.status,
                    paymentStatus: request.paymentStatus || 'pending',
                    role,
                    ownerId: request.ownerId,
                    farmerId: request.farmerId,
                    price: request.totalCost ?? request.baseCost ?? (isRent ? listing.pricePerDay : listing.sellPrice) ?? 0,
                    isPaid: (request.paymentStatus || 'pending') === 'paid',
                    date: isRent && request.startDate && request.endDate
                        ? `${request.startDate} - ${request.endDate}`
                        : request.createdAt?.toDate
                            ? request.createdAt.toDate().toLocaleDateString()
                            : 'N/A',
                    image: listing.images?.[0] || 'https://placehold.co/150x150?text=Order'
                };
            });

            setOrders(mapped);
        };

        load();
    }, [navigate, location.key]);

    const reloadOrders = async () => {
        setLoading(true);
        setError('');
        const uid = localStorage.getItem('kd_uid');
        if (!uid) {
            setLoading(false);
            navigate('/login');
            return;
        }

        const [reqResult, listingResult] = await Promise.all([
            getRequests({ userId: uid }),
            getListings({}),
        ]);
        setLoading(false);

        if (!reqResult.ok) {
            setError(reqResult.message || 'Failed to load orders');
            return;
        }

        const listingsById = new Map((listingResult.ok ? listingResult.data : []).map((l) => [l.id, l]));
        const mapped = reqResult.data.map((request) => {
            const listing = listingsById.get(request.listingId) || {};
            const isRent = request.requestType === 'rent';
            return {
                id: request.id,
                listingId: request.listingId,
                title: listing.title || (listing.category ? `${listing.category.charAt(0).toUpperCase()}${listing.category.slice(1)}` : request.listingId),
                type: isRent ? 'Rent' : 'Buy',
                status: request.status,
                paymentStatus: request.paymentStatus || 'pending',
                role: request.ownerId === uid ? 'received' : 'sent',
                ownerId: request.ownerId,
                farmerId: request.farmerId,
                price: request.totalCost ?? request.baseCost ?? (isRent ? listing.pricePerDay : listing.sellPrice) ?? 0,
                isPaid: (request.paymentStatus || 'pending') === 'paid',
                date: isRent && request.startDate && request.endDate
                    ? `${request.startDate} - ${request.endDate}`
                    : request.createdAt?.toDate
                        ? request.createdAt.toDate().toLocaleDateString()
                        : 'N/A',
                image: listing.images?.[0] || 'https://placehold.co/150x150?text=Order'
            };
        });

        setOrders(mapped);
    };

    const handleStatusChange = async (requestId, status) => {
        const uid = localStorage.getItem('kd_uid');
        if (!uid) {
            navigate('/login');
            return;
        }

        setActionLoadingId(requestId);
        const result = await updateRequestStatus({ requestId, actorId: uid, status });
        setActionLoadingId('');

        if (!result.ok) {
            setError(result.message || 'Failed to update request');
            return;
        }

        await reloadOrders();
    };

    const handleDeleteHistory = async (requestId) => {
        const uid = localStorage.getItem('kd_uid');
        if (!uid) {
            navigate('/login');
            return;
        }

        setActionLoadingId(requestId);
        const result = await deleteRequest({ requestId, actorId: uid });
        setActionLoadingId('');

        if (!result.ok) {
            setError(result.message || 'Failed to delete history');
            return;
        }

        await reloadOrders();
    };

    const filteredOrders = useMemo(() => {
        return orders
            .filter((order) => order.role === viewTab)
            .filter((order) =>
                activeTab === 'active'
                    ? ['approved', 'accepted', 'pending'].includes(order.status)
                    : ['completed', 'cancelled', 'rejected'].includes(order.status)
            );
    }, [orders, activeTab, viewTab]);

    return (
        <MobileLayout t={t}>
            <div className="pb-6">
                <h1 className="text-xl font-black text-gray-800 mb-4 px-1">{t('orders')}</h1>

                <div className="flex p-1 bg-gray-200 rounded-xl mb-3 mx-1">
                    <button onClick={() => setViewTab('received')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${viewTab === 'received' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>
                        {t('as_owner')}
                    </button>
                    <button onClick={() => setViewTab('sent')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${viewTab === 'sent' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>
                        {t('as_farmer')}
                    </button>
                </div>
                <p className="text-[11px] text-gray-500 px-1 mb-3">
                    {viewTab === 'received'
                        ? t('viewing_requests')
                        : t('viewing_requests_sent') || 'You are viewing requests you have placed.'}
                </p>

                <div className="flex p-1 bg-gray-200 rounded-xl mb-6 mx-1">
                    <button onClick={() => setActiveTab('active')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'active' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>
                        {t('active_pending')}
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>
                        {t('history')}
                    </button>
                </div>

                {loading && <p className="text-sm text-gray-500 px-1">{t('loading')}</p>}
                {!loading && error && <p className="text-sm text-red-500 px-1">{error}</p>}

                {!loading && !error && (
                    <div className="space-y-4 px-1">
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map((item) => (
                                <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3">
                                    <img src={item.image} alt={item.title} className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-800 text-sm">{item.title}</h3>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${statusClassName(item.status)}`}>{item.status}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1 font-semibold uppercase">{item.type}</p>
                                        <div className="flex justify-between items-end mt-2">
                                            <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1"><Calendar size={12} /> {item.date}</p>
                                            <p className="text-green-700 font-black">रु. {item.price ?? 0}</p>
                                        </div>
                                        <div className="mt-2 flex gap-2">
                                            {item.role === 'received' && item.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusChange(item.id, 'accepted')}
                                                        disabled={actionLoadingId === item.id}
                                                        className="text-[10px] px-2 py-1 rounded-md bg-green-600 text-white font-bold disabled:opacity-60"
                                                    >
                                                        {t('approve')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(item.id, 'rejected')}
                                                        disabled={actionLoadingId === item.id}
                                                        className="text-[10px] px-2 py-1 rounded-md bg-red-500 text-white font-bold disabled:opacity-60"
                                                    >
                                                        {t('reject')}
                                                    </button>
                                                </>
                                            )}
                                            {item.role === 'sent' && item.status === 'pending' && (
                                                <button
                                                    onClick={() => handleStatusChange(item.id, 'cancelled')}
                                                    disabled={actionLoadingId === item.id}
                                                    className="text-[10px] px-2 py-1 rounded-md bg-gray-600 text-white font-bold disabled:opacity-60"
                                                >
                                                    {t('cancel')}
                                                </button>
                                            )}
                                            {item.role === 'sent' && ['approved', 'accepted'].includes(item.status) && !item.isPaid && (
                                                <button
                                                    onClick={() => navigate('/payment', {
                                                        state: {
                                                            requestId: item.id,
                                                            title: item.title,
                                                            amount: item.price ?? 0,
                                                            type: item.type,
                                                            date: item.date,
                                                        }
                                                    })}
                                                    className="text-[10px] px-2 py-1 rounded-md bg-emerald-600 text-white font-bold"
                                                >
                                                    {t('pay_now')}
                                                </button>
                                            )}
                                            {item.role === 'received' && ['approved', 'accepted'].includes(item.status) && item.isPaid && (
                                                <button
                                                    onClick={() => handleStatusChange(item.id, 'completed')}
                                                    disabled={actionLoadingId === item.id}
                                                    className="text-[10px] px-2 py-1 rounded-md bg-blue-600 text-white font-bold disabled:opacity-60"
                                                >
                                                    {t('mark_completed')}
                                                </button>
                                            )}
                                            {activeTab === 'history' && (
                                                <button
                                                    onClick={() => handleDeleteHistory(item.id)}
                                                    disabled={actionLoadingId === item.id}
                                                    className="text-[10px] px-2 py-1 rounded-md bg-red-600 text-white font-bold disabled:opacity-60"
                                                >
                                                    {t('delete_history') || 'Delete History'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 opacity-50">
                                <Package size={40} className="text-gray-400 mb-2" />
                                <p className="text-xs font-bold">{t('no_orders')}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MobileLayout>
    );
};

export default MyOrders;
