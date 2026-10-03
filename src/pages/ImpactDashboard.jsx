import React, { useEffect, useMemo, useState } from 'react';
import MobileLayout from '../components/MobileLayout';
import { getImpactMetrics } from '../services';

const ImpactDashboard = ({ t }) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadMetrics = async () => {
        setLoading(true);
        setError('');
        const result = await getImpactMetrics();
        setLoading(false);

        if (!result.ok) {
            setError(result.message || 'Failed to load dashboard');
            return;
        }

        setMetrics(result.data);
    };

    useEffect(() => {
        let active = true;

        const initialLoad = async () => {
            const result = await getImpactMetrics();
            if (!active) return;

            setLoading(false);

            if (!result.ok) {
                setError(result.message || 'Failed to load dashboard');
                return;
            }

            setMetrics(result.data);
        };

        initialLoad();

        return () => {
            active = false;
        };
    }, []);

    const cards = useMemo(() => {
        if (!metrics) return [];
        return [
            { label: 'Total Users', value: metrics.totalUsers },
            { label: 'Total Listings', value: metrics.totalListings },
            { label: 'Active Listings', value: metrics.activeListings },
            { label: 'Rent Listings', value: metrics.rentListings },
            { label: 'Sell Listings', value: metrics.sellListings },
            { label: 'Total Requests', value: metrics.totalRequests },
            { label: 'Pending Requests', value: metrics.pendingRequests },
            { label: 'Approved Requests', value: metrics.approvedRequests },
            { label: 'Completed Requests', value: metrics.completedRequests },
            { label: 'Successful Bookings', value: metrics.successfulBookings },
            { label: 'Requests (7 Days)', value: metrics.requestsLast7Days },
            { label: 'Avg Rent / Day (Rs)', value: metrics.avgRentPricePerDay },
            { label: 'Unique Cities', value: metrics.uniqueCities },
            { label: 'Unique Owners', value: metrics.uniqueOwners },
        ];
    }, [metrics]);

    return (
        <MobileLayout t={t}>
            <div className="pb-6">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h1 className="text-2xl font-black text-gray-800">Impact Dashboard</h1>
                    <button
                        onClick={loadMetrics}
                        className="text-xs font-bold text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100"
                    >
                        Refresh
                    </button>
                </div>

                <p className="text-gray-500 text-sm mb-4 px-2">
                    Live metrics from Firestore collections: users, listings, requests.
                </p>

                {loading && <p className="px-2 text-sm text-gray-500">{t('loading') || 'Loading...'}</p>}
                {!loading && error && <p className="px-2 text-sm text-red-500">{error}</p>}

                {!loading && !error && (
                    <div className="grid grid-cols-2 gap-3 px-2">
                        {cards.map((card) => (
                            <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                                <p className="text-[11px] text-gray-500 font-bold uppercase leading-tight">{card.label}</p>
                                <p className="text-2xl font-black text-gray-800 mt-2">{card.value}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MobileLayout>
    );
};

export default ImpactDashboard;
