import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, RefreshCw, Navigation, ChevronRight } from 'lucide-react';
import { getListings, getUser } from '../services';

const NEARBY_RADIUS_KM = 10;

const toRad = (value) => (value * Math.PI) / 180;

const haversineKm = (lat1, lon1, lat2, lon2) => {
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
};

const NearbyTractors = ({ t, userCoords, locationStatus }) => {
    const navigate = useNavigate();
    const [nearbyItems, setNearbyItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [ownerNames, setOwnerNames] = useState({});

    const fetchNearbyEquipment = async () => {
        if (!userCoords?.lat || !userCoords?.lng) return;

        setLoading(true);
        setError('');

        try {
            const result = await getListings({ isAvailable: true });

            if (!result.ok) {
                setError(result.message || 'Failed to load nearby equipment');
                setLoading(false);
                return;
            }

            const allListings = result.data || [];

            // Filter: must have valid coords, must be available, ALL categories
            const nearby = allListings
                .filter((item) => {
                    // Must have a valid title and images
                    if (!item.title || !item.title.trim()) return false;
                    if (!item.images || item.images.length === 0) return false;

                    // Must have valid coordinates (not 0,0)
                    const lat = Number(item.lat);
                    const lng = Number(item.lng);
                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
                    if (lat === 0 && lng === 0) return false;

                    return true;
                })
                .map((item) => {
                    const distanceKm = haversineKm(
                        Number(userCoords.lat),
                        Number(userCoords.lng),
                        Number(item.lat),
                        Number(item.lng)
                    );
                    return { ...item, distanceKm };
                })
                .filter((item) => item.distanceKm <= NEARBY_RADIUS_KM)
                .sort((a, b) => a.distanceKm - b.distanceKm);

            setNearbyItems(nearby);

            // Fetch owner names for the nearby items
            const uniqueOwnerIds = [...new Set(nearby.map((t) => t.ownerId).filter(Boolean))];
            const names = {};
            await Promise.all(
                uniqueOwnerIds.map(async (ownerId) => {
                    try {
                        const userResult = await getUser(ownerId);
                        if (userResult.ok && userResult.data?.name) {
                            names[ownerId] = userResult.data.name;
                        }
                    } catch {
                        // silently skip
                    }
                })
            );
            setOwnerNames(names);
        } catch (err) {
            setError('Something went wrong. Please try again.');
            console.warn('[KrishiDhan] NearbyEquipment error:', err);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchNearbyEquipment();
    }, [userCoords?.lat, userCoords?.lng]);

    // Don't render at all if location hasn't been determined yet (idle state)
    if (locationStatus === 'idle' && !userCoords) return null;

    // Location permission denied
    if (locationStatus === 'denied' && !userCoords) {
        return (
            <div className="mb-8 px-1">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                    <h3 className="text-lg font-black text-gray-900">🚜 {t('nearby_equipment') || 'Equipment Near You'}</h3>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
                    <Navigation size={32} className="text-amber-500 mx-auto mb-3" />
                    <p className="text-sm font-bold text-amber-800 mb-1">
                        {t('location_required') || 'Location permission is required to find nearby equipment.'}
                    </p>
                    <p className="text-xs text-amber-600">
                        {t('enable_location_hint') || 'Please enable location access in your browser settings.'}
                    </p>
                </div>
            </div>
        );
    }

    // Still loading location
    if (locationStatus === 'loading' && !userCoords) {
        return (
            <div className="mb-8 px-1">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                    <h3 className="text-lg font-black text-gray-900">🚜 {t('nearby_equipment') || 'Equipment Near You'}</h3>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="w-10 h-10 bg-green-200 rounded-full mb-3 animate-bounce" />
                        <p className="text-sm font-bold text-green-800">
                            {t('detecting_location') || 'Detecting your location...'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-8 px-1">
            {/* Section Header */}
            <div className="flex justify-between items-end mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                    <div>
                        <h3 className="text-lg font-black text-gray-900 leading-tight">
                            🚜 {t('nearby_equipment') || 'Equipment Near You'}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <MapPin size={10} className="text-green-600" />
                            <span className="text-[10px] font-bold text-green-700">
                                {t('within_radius') || `Within ${NEARBY_RADIUS_KM} km`}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 text-center">
                    <div className="animate-spin w-8 h-8 border-3 border-green-200 border-t-green-600 rounded-full mx-auto mb-3" />
                    <p className="text-sm font-bold text-green-800">
                        {t('finding_equipment') || 'Finding equipment near you...'}
                    </p>
                </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
                    <p className="text-sm font-bold text-red-700 mb-3">{error}</p>
                    <button
                        onClick={fetchNearbyEquipment}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform"
                    >
                        <RefreshCw size={14} /> {t('try_again') || 'Try Again'}
                    </button>
                </div>
            )}

            {/* No Results */}
            {!loading && !error && nearbyItems.length === 0 && userCoords && (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-3">🚜</div>
                    <p className="text-sm font-bold text-gray-600 mb-1">
                        {t('no_equipment_nearby') || `No equipment found within ${NEARBY_RADIUS_KM} km.`}
                    </p>
                    <p className="text-xs text-gray-400 mb-3">
                        {t('try_again_later') || 'New equipment may be added soon. Check back later!'}
                    </p>
                    <button
                        onClick={fetchNearbyEquipment}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform"
                    >
                        <RefreshCw size={14} /> {t('try_again') || 'Try Again'}
                    </button>
                </div>
            )}

            {/* Results */}
            {!loading && !error && nearbyItems.length > 0 && (
                <>
                    <div className="mb-3">
                        <span className="text-xs font-black text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                            📍 {nearbyItems.length} {nearbyItems.length === 1
                                ? (t('equipment_singular') || 'equipment')
                                : (t('equipment_plural') || 'equipment listings')} {t('within_10km') || `within ${NEARBY_RADIUS_KM} km`}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {nearbyItems.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => navigate(`/equipment/${item.id}`)}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex active:scale-[0.98] transition-all cursor-pointer group"
                            >
                                {/* Image */}
                                <div className="w-28 h-28 flex-shrink-0 relative overflow-hidden">
                                    <img
                                        src={item.images?.[0] || 'https://placehold.co/200x200?text=Equipment'}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase text-white ${item.listingType === 'rent' ? 'bg-green-600' : 'bg-orange-500'}`}>
                                        {item.listingType === 'rent' ? (t('rent_badge') || 'RENT') : (t('sell_badge') || 'SELL')}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                    <div>
                                        <h4 className="text-sm font-black text-gray-900 truncate leading-tight">
                                            {item.title}
                                        </h4>
                                        {ownerNames[item.ownerId] && (
                                            <p className="text-[10px] text-gray-500 font-semibold mt-0.5 truncate">
                                                {ownerNames[item.ownerId]}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div>
                                            <div className="flex items-center gap-1 text-[10px] text-green-700 font-bold mb-0.5">
                                                <MapPin size={10} />
                                                <span>{item.distanceKm.toFixed(1)} km away</span>
                                            </div>
                                            <div className="flex items-baseline gap-0.5">
                                                <span className="text-green-700 font-black text-sm">
                                                    ₹{item.listingType === 'rent' ? item.pricePerDay : item.sellPrice}
                                                </span>
                                                {item.listingType === 'rent' && (
                                                    <span className="text-[9px] text-gray-400 font-bold">
                                                        /{item.priceUnit || 'day'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 rounded-xl border border-green-100 group-active:bg-green-600 group-active:text-white transition-colors">
                                            <span className="text-[10px] font-black text-green-700 group-active:text-white">
                                                {t('view_service') || 'View'}
                                            </span>
                                            <ChevronRight size={12} className="text-green-600 group-active:text-white" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default NearbyTractors;
