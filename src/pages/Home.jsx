import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, X, ChevronRight, Bell, MapPin } from 'lucide-react';
import MobileLayout from '../components/MobileLayout';
import NearbyTractors from '../components/NearbyTractors';
import { getListings, getRequests, getUser } from '../services';

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

const Home = ({ t }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [locationError, setLocationError] = useState('');
    const [locationStatus, setLocationStatus] = useState('idle');
    const [liveCity, setLiveCity] = useState(() => localStorage.getItem('kd_live_city') || '');
    const [userCoords, setUserCoords] = useState(() => {
        try {
            const raw = localStorage.getItem('kd_user_coords');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [userName, setUserName] = useState(() => {
        try {
            const user = JSON.parse(localStorage.getItem('kd_user') || '{}');
            return user?.name || '';
        } catch {
            return '';
        }
    });

    const schemes = [
        { id: 1, name: 'pm_kisan', img: '/schemes-logos/pm_kisan.jpeg', url: 'https://pmkisan.gov.in/' },
        { id: 2, name: 'pmfby', img: '/schemes-logos/pmfby.jpeg', url: 'https://pmfby.gov.in/' },
        { id: 3, name: 'kcc', img: '/schemes-logos/kcc.jpeg', url: 'https://kcc.pmkisan.gov.in/' },
        { id: 4, name: 'namo_shetkari', img: '/schemes-logos/namo_shetkari.png', url: 'https://nsmny.mahait.org/' },
        { id: 5, name: 'magel_tyala', img: '/schemes-logos/magel_tyala.jpeg', url: 'https://mahadbt.maharashtra.gov.in/' },
        { id: 6, name: 'mahadbt', img: '/schemes-logos/mahadbt.jpeg', url: 'https://mahadbt.maharashtra.gov.in/' },
    ];

    useEffect(() => {
        const loadUser = async () => {
            const uid = localStorage.getItem('kd_uid');
            if (!uid) return;

            const userResult = await getUser(uid);
            if (!userResult.ok) return;
            const resolvedName = userResult.data?.name || '';
            setUserName(resolvedName);
            if (resolvedName) {
                try {
                    const existing = JSON.parse(localStorage.getItem('kd_user') || '{}');
                    localStorage.setItem('kd_user', JSON.stringify({ ...existing, ...userResult.data, name: resolvedName }));
                } catch {
                    // no-op
                }
            }
        };

        loadUser();
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const result = await getListings({ isAvailable: true });
            setLoading(false);

            if (!result.ok) {
                setError(result.message || 'Failed to load listings');
                return;
            }

            setListings(result.data || []);
        };

        load();
    }, []);

    useEffect(() => {
        const loadNotifications = async () => {
            const uid = localStorage.getItem('kd_uid');
            if (!uid) return;

            const result = await getRequests({ userId: uid });
            if (!result.ok) return;

            const list = (result.data || []).map((request) => {
                const role = request.ownerId === uid ? 'owner' : 'farmer';
                const status = String(request.status || '').toLowerCase();
                const paymentStatus = String(request.paymentStatus || 'pending').toLowerCase();
                let title = 'Booking update';
                let body = `Request ${request.id}`;

                if (role === 'owner' && status === 'pending') {
                    title = 'New request';
                    body = 'A farmer has sent a new booking request.';
                } else if (role === 'farmer' && status === 'approved' && paymentStatus !== 'paid') {
                    title = 'Request approved';
                    body = 'Owner approved your request. Complete payment from My Orders.';
                } else if (role === 'farmer' && status === 'completed') {
                    title = 'Service completed';
                    body = 'Your booking has been marked completed.';
                } else if (role === 'farmer' && status === 'rejected') {
                    title = 'Request rejected';
                    body = 'Owner rejected your request.';
                } else if (role === 'farmer' && status === 'pending') {
                    title = 'Request pending';
                    body = 'Waiting for owner approval.';
                } else if (role === 'owner' && status === 'approved' && paymentStatus !== 'paid') {
                    title = 'Waiting payment';
                    body = 'Approved request is waiting for farmer payment.';
                }

                return {
                    id: request.id,
                    createdAt: request.createdAt?.toDate ? request.createdAt.toDate() : null,
                    title,
                    body,
                };
            })
                .sort((a, b) => {
                    const aTime = a.createdAt ? a.createdAt.getTime() : 0;
                    const bTime = b.createdAt ? b.createdAt.getTime() : 0;
                    return bTime - aTime;
                })
                .slice(0, 20);

            setNotifications(list);

            const seenIds = new Set(JSON.parse(localStorage.getItem('kd_seen_notification_ids') || '[]'));
            const unread = list.filter((item) => !seenIds.has(item.id)).length;
            setUnreadCount(unread);
        };

        loadNotifications();
    }, []);

    useEffect(() => {
        if (!isNotificationsOpen) return;
        const ids = notifications.map((n) => n.id);
        localStorage.setItem('kd_seen_notification_ids', JSON.stringify(ids));
        setUnreadCount(0);
    }, [isNotificationsOpen, notifications]);

    const categoryFilter = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return (params.get('category') || '').trim().toLowerCase();
    }, [location.search]);

    const detectCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported on this device.');
            setLocationStatus('unsupported');
            return;
        }

        setLocationError('');
        setLocationStatus('loading');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setUserCoords(coords);
                localStorage.setItem('kd_user_coords', JSON.stringify(coords));
                setLocationStatus('granted');
            },
            (geoError) => {
                setLocationError(geoError?.message || 'Unable to access location');
                setLocationStatus('denied');
                // Clear cached coordinates if explicitly denied to avoid showing stale distances
                setUserCoords(null);
                localStorage.removeItem('kd_user_coords');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    useEffect(() => {
        if (!navigator.geolocation) return;
        detectCurrentLocation();
    }, []);

    useEffect(() => {
        const resolveCityFromCoords = async () => {
            if (!userCoords?.lat || !userCoords?.lng) return;
            try {
                const endpoint = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(userCoords.lat)}&lon=${encodeURIComponent(userCoords.lng)}`;
                const response = await fetch(endpoint, {
                    headers: {
                        Accept: 'application/json',
                    },
                });
                if (!response.ok) return;
                const data = await response.json();
                const address = data?.address || {};
                const detectedCity =
                    address.city ||
                    address.town ||
                    address.village ||
                    address.county ||
                    '';

                if (detectedCity) {
                    setLiveCity(detectedCity);
                    localStorage.setItem('kd_live_city', detectedCity);
                }
            } catch {
                // keep existing fallback location text
            }
        };

        resolveCityFromCoords();
    }, [userCoords]);

    const locationLabel = useMemo(() => {
        if (liveCity) return liveCity;
        try {
            const user = JSON.parse(localStorage.getItem('kd_user') || '{}');
            if (user?.city) return user.city;
        } catch {
            // no-op
        }
        if (userCoords?.lat && userCoords?.lng) {
            return `${Number(userCoords.lat).toFixed(2)}, ${Number(userCoords.lng).toFixed(2)}`;
        }
        return t('city_village_name') || 'Location';
    }, [liveCity, userCoords, t]);

    const filteredListings = useMemo(() => {
        let prepared = listings
            .filter((item) => item.title && item.title.trim().length > 0 && item.images && item.images.length > 0)
            .map((item) => {
            const validCoords = Number.isFinite(Number(item?.lat)) && Number.isFinite(Number(item?.lng));
            // Exclude items with 0,0 coordinates as invalid
            const isRealCoords = validCoords && !(Number(item.lat) === 0 && Number(item.lng) === 0);
            if (!userCoords || !isRealCoords) {
                return { ...item, distanceKm: null };
            }

            const distanceKm = haversineKm(
                Number(userCoords.lat),
                Number(userCoords.lng),
                Number(item.lat),
                Number(item.lng)
            );

            return { ...item, distanceKm };
        });

        // 10 KM radius filter: only show equipment within 10km when location is available
        if (userCoords) {
            prepared = prepared.filter((item) => {
                // If we couldn't calculate distance (missing coords), exclude from nearby
                if (item.distanceKm === null) return false;
                return item.distanceKm <= 10;
            });
        }

        if (categoryFilter) {
            prepared = prepared.filter((item) => String(item.category || '').toLowerCase() === categoryFilter);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            prepared = prepared.filter((item) =>
                [item.title, item.category, item.city]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q))
            );
        }

        if (userCoords) {
            prepared = prepared.sort((a, b) => {
                const aDistance = Number.isFinite(a.distanceKm) ? a.distanceKm : Number.POSITIVE_INFINITY;
                const bDistance = Number.isFinite(b.distanceKm) ? b.distanceKm : Number.POSITIVE_INFINITY;
                return aDistance - bDistance;
            });
        }

        return prepared;
    }, [listings, searchQuery, userCoords, categoryFilter]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            <MobileLayout t={t}>
                <div className="pt-4 pb-6 px-1 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 leading-tight">
                            {t('greeting_prefix') || 'Hello'}, <span className="text-green-600">{userName || t('user_greeting') || 'Farmer'}</span>
                        </h2>
                    </div>
                    <button onClick={() => setIsNotificationsOpen((prev) => !prev)} className="relative p-2.5 bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-90 transition-transform">
                        <Bell size={20} className="text-gray-700" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[9px] rounded-full border-2 border-white flex items-center justify-center font-bold">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                {isNotificationsOpen && (
                    <div className="mb-4 bg-white border border-gray-100 rounded-2xl shadow-sm p-3">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-black text-gray-700 uppercase">Notifications</p>
                            <button onClick={() => setIsNotificationsOpen(false)} className="text-[10px] font-bold text-gray-500">Close</button>
                        </div>
                        {notifications.length === 0 ? (
                            <p className="text-xs text-gray-500">No notifications yet.</p>
                        ) : (
                            <div className="space-y-2 max-h-44 overflow-y-auto">
                                {notifications.map((note) => (
                                    <button
                                        key={note.id}
                                        type="button"
                                        onClick={() => navigate('/my-orders')}
                                        className="w-full text-left p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <p className="text-xs font-bold text-gray-800">{note.title}</p>
                                        <p className="text-[11px] text-gray-500 mt-0.5">{note.body}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="mb-6 px-1">
                    <div
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-4 bg-white/80 backdrop-blur-md p-4 rounded-[24px] border border-white shadow-xl shadow-green-900/5 active:bg-green-50 transition-all cursor-pointer group"
                    >
                        <div className="p-2 bg-green-100 rounded-xl group-active:bg-green-600 group-active:text-white transition-colors">
                            <Search size={20} className="text-green-700 group-active:text-inherit" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-extrabold text-gray-800">{t('search_placeholder')}</span>
                            <span className="text-[10px] font-medium text-gray-400">{t('search_subtext') || 'Find tractors or equipment...'}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-2 mb-6 flex items-center gap-2 px-1">
                    <button
                        type="button"
                        onClick={detectCurrentLocation}
                        className="text-xs font-bold text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-100"
                    >
                        {locationStatus === 'loading' ? 'Detecting...' : 'Use Current Location'}
                    </button>
                    {categoryFilter && (
                        <button
                            type="button"
                            onClick={() => navigate('/home')}
                            className="text-xs font-bold text-gray-600 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
                {locationError && <p className="text-[11px] text-red-500 mt-1 px-1">{locationError}</p>}
                {!locationError && locationStatus === 'granted' && (
                    <p className="text-[11px] text-green-700 mt-1 px-1">Location access enabled.</p>
                )}

                <div className="mb-10">
                    <div className="flex justify-between items-end mb-5 px-1">
                        <div>
                            <h3 className="text-[10px] font-black text-green-600 uppercase tracking-[2px] mb-1">
                                {t('govt_schemes_small') || t('govt_schemes') || 'Government Schemes'}
                            </h3>
                            <h4 className="text-lg font-black text-gray-900 leading-none">
                                {t('recommended_for_you') || 'Recommended For You'}
                            </h4>
                        </div>
                        <button
                            onClick={() => navigate('/schemes')}
                            className="px-3 py-1.5 bg-green-50 rounded-full text-[11px] font-extrabold text-green-700 flex items-center gap-1 active:bg-green-100 transition-colors"
                        >
                            {t('view_all')} <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="flex overflow-hidden -mx-4 px-4 no-scrollbar">
                        <div className="flex gap-4 pl-1 animate-scroll-slow pause-animation">
                            {[...schemes, ...schemes].map((scheme, index) => (
                                <a
                                    key={`${scheme.id}-${index}`}
                                    href={scheme.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 flex flex-col items-center w-[84px] group"
                                >
                                    <div className="w-16 h-16 bg-white rounded-3xl border border-gray-50 shadow-sm flex items-center justify-center mb-2.5 overflow-hidden group-active:scale-90 transition-transform p-1">
                                        <img
                                            src={scheme.img}
                                            alt={t(scheme.name)}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-center text-gray-700 leading-tight line-clamp-2 px-1">
                                        {t(scheme.name)}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tractor Services Near You - 10km radius */}
                <NearbyTractors t={t} userCoords={userCoords} locationStatus={locationStatus} />

                <div className="pb-6 px-1">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                        <h3 className="text-lg font-black text-gray-900">{t('recommendations')}</h3>
                    </div>

                    {loading && <p className="text-sm text-gray-500">{t('loading') || 'Loading...'}</p>}
                    {!loading && error && <p className="text-sm text-red-500">{error}</p>}

                    {!loading && !error && (
                        <div className="grid grid-cols-2 gap-4">
                            {filteredListings.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => navigate(`/equipment/${item.id}`)}
                                    className="bg-white rounded-[28px] overflow-hidden border border-gray-50 shadow-md shadow-gray-200/50 active:scale-95 transition-all cursor-pointer group"
                                >
                                    <div className="relative h-36 overflow-hidden">
                                        <img
                                            src={item.images?.[0] || 'https://placehold.co/300x200?text=No+Image'}
                                            alt={item.title}
                                            className={`w-full h-full object-cover transition-transform duration-500 ${item.isAvailable === false ? 'opacity-60 grayscale' : 'group-hover:scale-110'}`}
                                        />
                                        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm text-white ${item.listingType === 'rent' ? 'bg-green-600' : 'bg-orange-500'}`}>
                                            {item.listingType === 'rent' ? t('rent_badge') : t('sell_badge')}
                                        </div>
                                        {item.isAvailable === false && (
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-[1px]">
                                                <div className="bg-red-600/90 text-white font-black px-4 py-1.5 rounded-lg text-sm uppercase tracking-widest -rotate-12 shadow-xl border-2 border-white/50 backdrop-blur-md">
                                                    {t('sold') || 'SOLD'}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-extrabold text-gray-900 text-xs truncate mb-1">{item.title}</h4>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-green-700 font-black text-base">
                                                Rs {item.listingType === 'rent' ? item.pricePerDay : item.sellPrice}
                                            </span>
                                            {item.listingType === 'rent' && (
                                                <span className="text-[10px] font-bold text-gray-400">/{item.priceUnit || 'day'}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                                            <MapPin size={10} />
                                            <span>{item.city}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isSearchOpen && (
                    <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300">
                        <div className="flex items-center gap-3 p-4 border-b">
                            <button onClick={() => setIsSearchOpen(false)} className="p-2.5 bg-gray-100 rounded-2xl active:scale-90 transition-transform">
                                <X size={20} />
                            </button>
                            <input
                                autoFocus
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('search_placeholder')}
                                className="flex-1 bg-gray-50 rounded-2xl px-5 py-3 outline-none font-bold text-gray-800 placeholder:text-gray-400"
                            />
                        </div>
                        <div className="p-4 overflow-y-auto">
                            {searchQuery.trim() ? (
                                filteredListings.length > 0 ? (
                                    <div className="space-y-2">
                                        {filteredListings.slice(0, 30).map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => {
                                                    setIsSearchOpen(false);
                                                    navigate(`/equipment/${item.id}`);
                                                }}
                                                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-gray-100 bg-white text-left"
                                            >
                                                <img
                                                    src={item.images?.[0] || 'https://placehold.co/120x120?text=No+Image'}
                                                    alt={item.title}
                                                    className="w-14 h-14 rounded-xl object-cover bg-gray-100"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-800 truncate">{item.title}</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">{item.city}</p>
                                                    <p className="text-xs font-black text-green-700 mt-1">
                                                        Rs {item.listingType === 'rent' ? item.pricePerDay : item.sellPrice}
                                                    </p>
                                                </div>
                                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${item.listingType === 'rent' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                                    {item.listingType === 'rent' ? 'RENT' : 'SELL'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-sm text-gray-500 font-semibold pt-6">No matching equipment found.</p>
                                )
                            ) : (
                                <p className="text-center text-sm text-gray-400 font-semibold pt-6">
                                    {t('search_modal_text') || 'Type to find equipment...'}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </MobileLayout>
        </div>
    );
};

export default Home;
