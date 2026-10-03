import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, ShieldCheck, Trash2 } from 'lucide-react';
import MobileLayout from '../components/MobileLayout';
import {
    createRequest,
    deleteListing,
    getAllowedRentUnits,
    getListingById,
    getRentRateByCategory,
    getUser,
    isOwnerPricedRentCategory,
    LOGISTICS_RATE_PER_KM,
    PLATFORM_FEE_RATE,
} from '../services';

const DAY_MS = 24 * 60 * 60 * 1000;
const getCurrentLang = () => localStorage.getItem('kd_lang') || 'en';
const formatCategoryLabel = (value) =>
    String(value || '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
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

const MODE_LABELS_BY_LANG = {
    en: {
        day: 'By Day',
        hour: 'By Hour',
        acre: 'By Acre',
        distance: 'By Distance (km)',
        liter: 'By Liter',
        kg: 'By Kg',
        ton: 'By Ton',
        quintal: 'By Quintal',
    },
    hi: {
        day: 'दिन के अनुसार',
        hour: 'घंटे के अनुसार',
        acre: 'एकड़ के अनुसार',
        distance: 'किलोमीटर के अनुसार',
        liter: 'लीटर के अनुसार',
        kg: 'किलो के अनुसार',
        ton: 'टन के अनुसार',
        quintal: 'क्विंटल के अनुसार',
    },
    mr: {
        day: 'दिवसाला',
        hour: 'तासाला',
        acre: 'एकराला',
        distance: 'किलोमीटरनुसार',
        liter: 'लिटरनुसार',
        kg: 'किलोनुसार',
        ton: 'टननुसार',
        quintal: 'क्विंटलनुसार',
    },
};

const EquipmentDetails = ({ t }) => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [item, setItem] = useState(null);
    const [ownerName, setOwnerName] = useState('Owner');
    const [ownerPhone, setOwnerPhone] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [userCoords] = useState(() => {
        try {
            const raw = localStorage.getItem('kd_user_coords');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    const [bookingMode, setBookingMode] = useState('day');
    const [dayStartDate, setDayStartDate] = useState('');
    const [dayEndDate, setDayEndDate] = useState('');
    const [hourDate, setHourDate] = useState('');
    const [hourStartTime, setHourStartTime] = useState('');
    const [hourCount, setHourCount] = useState(1);
    const [unitDate, setUnitDate] = useState('');
    const [unitCount, setUnitCount] = useState(1);
    const [requestMessage, setRequestMessage] = useState('');

    const currentUid = localStorage.getItem('kd_uid') || '';
    const isOwner = !!item && currentUid === item.ownerId;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const result = await getListingById(id);
            setLoading(false);

            if (!result.ok) {
                setError(result.message || 'Listing not found');
                return;
            }

            setItem(result.data);

            if (result.data?.ownerId) {
                const owner = await getUser(result.data.ownerId);
                if (owner.ok) {
                    setOwnerName(owner.data?.name || 'Owner');
                    setOwnerPhone(owner.data?.phone || '');
                }
            }
        };

        load();
    }, [id]);

    const rateCard = getRentRateByCategory(item?.category);
    const availableBookingModes = item?.listingType === 'rent' ? getAllowedRentUnits(item?.category) : [];
    const isOwnerPricedRent = isOwnerPricedRentCategory(item?.category);
    const listingDistanceKm = useMemo(() => {
        if (!userCoords || !item) return 0;
        const hasUser = Number.isFinite(Number(userCoords.lat)) && Number.isFinite(Number(userCoords.lng));
        const hasListing = Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng));
        if (!hasUser || !hasListing) return 0;
        return haversineKm(
            Number(userCoords.lat),
            Number(userCoords.lng),
            Number(item.lat),
            Number(item.lng)
        );
    }, [userCoords, item]);

    useEffect(() => {
        if (availableBookingModes.length > 0) {
            setBookingMode((prev) => (availableBookingModes.includes(prev) ? prev : availableBookingModes[0]));
        }
    }, [item?.id, availableBookingModes]);

    const getRateForMode = (mode) => {
        if (!item) return 0;
        const modeRate = Number(rateCard?.[mode]);
        const listingRate = Number(item?.pricePerDay);
        if (mode === item?.priceUnit && Number.isFinite(listingRate) && listingRate > 0) {
            return listingRate;
        }
        if (Number.isFinite(modeRate) && modeRate > 0) {
            return modeRate;
        }
        if (mode === 'day' && Number.isFinite(Number(rateCard?.hour))) {
            return Math.round(Number(rateCard.hour) * 8);
        }
        return 0;
    };

    const computed = useMemo(() => {
        if (!item || item.listingType !== 'rent') {
            const amount = Number(item?.sellPrice) || 0;
            return {
                bookingType: null,
                quantity: 0,
                selectedRate: 0,
                startDate: null,
                endDate: null,
                hoursBooked: null,
                daysBooked: null,
                acresBooked: null,
                extraMessage: '',
                baseCost: amount,
                travelCost: 0,
                platformFee: 0,
                totalCost: amount,
            };
        }

        if (bookingMode === 'day') {
            const dayRate = getRateForMode('day');
            const start = dayStartDate ? new Date(dayStartDate) : null;
            const end = dayEndDate ? new Date(dayEndDate) : null;
            const validRange = start && end && end >= start;
            const days = validRange ? Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1 : 0;
            const baseCost = days * dayRate;
            const travelCost = isOwnerPricedRent ? Math.round(listingDistanceKm * LOGISTICS_RATE_PER_KM) : 0;
            const platformFee = Math.round((baseCost + travelCost) * PLATFORM_FEE_RATE);
            return {
                bookingType: 'day',
                quantity: days,
                selectedRate: dayRate,
                startDate: dayStartDate || null,
                endDate: dayEndDate || null,
                hoursBooked: null,
                daysBooked: days || null,
                acresBooked: null,
                extraMessage: '',
                baseCost,
                travelCost,
                platformFee,
                totalCost: baseCost + travelCost + platformFee,
            };
        }

        if (bookingMode === 'hour') {
            const hourlyRate = getRateForMode('hour');
            const hours = Number(hourCount) > 0 ? Number(hourCount) : 0;
            const baseCost = hours * hourlyRate;
            const travelCost = isOwnerPricedRent ? Math.round(listingDistanceKm * LOGISTICS_RATE_PER_KM) : 0;
            const platformFee = Math.round((baseCost + travelCost) * PLATFORM_FEE_RATE);
            return {
                bookingType: 'hour',
                quantity: hours,
                selectedRate: hourlyRate,
                startDate: hourDate || null,
                endDate: hourDate || null,
                hoursBooked: hours || null,
                daysBooked: null,
                acresBooked: null,
                extraMessage: hourStartTime ? `Start time: ${hourStartTime}` : '',
                baseCost,
                travelCost,
                platformFee,
                totalCost: baseCost + travelCost + platformFee,
            };
        }

        const selectedRate = getRateForMode(bookingMode);
        const quantity = Number(unitCount) > 0 ? Number(unitCount) : 0;
        const baseCost = quantity * selectedRate;
        const travelCost = isOwnerPricedRent ? Math.round(listingDistanceKm * LOGISTICS_RATE_PER_KM) : 0;
        const platformFee = Math.round((baseCost + travelCost) * PLATFORM_FEE_RATE);
        return {
            bookingType: bookingMode,
            quantity,
            selectedRate,
            startDate: unitDate || null,
            endDate: unitDate || null,
            hoursBooked: null,
            daysBooked: null,
            acresBooked: bookingMode === 'acre' ? quantity || null : null,
            extraMessage: '',
            baseCost,
            travelCost,
            platformFee,
            totalCost: baseCost + travelCost + platformFee,
        };
    }, [item, bookingMode, dayStartDate, dayEndDate, hourDate, hourStartTime, hourCount, unitDate, unitCount, rateCard, isOwnerPricedRent, listingDistanceKm]);

    const currentLang = getCurrentLang();
    const modeLabels = MODE_LABELS_BY_LANG[currentLang] || MODE_LABELS_BY_LANG.en;
    const categoryLabels = CATEGORY_LABELS_BY_LANG[currentLang] || CATEGORY_LABELS_BY_LANG.en;
    const localizedCategory = categoryLabels[String(item?.category || '').toLowerCase()] || formatCategoryLabel(item?.category);

    const getWhatsAppPhone = (phone) => {
        const digits = String(phone || '').replace(/\D/g, '');
        if (!digits) return '';
        if (digits.length === 10) return `91${digits}`;
        return digits;
    };

    const handleWhatsAppBooking = () => {
        if (!item) return;

        const whatsappPhone = getWhatsAppPhone(ownerPhone);
        if (!whatsappPhone) {
            setError('Owner phone is not available for WhatsApp.');
            return;
        }

        const renter = JSON.parse(localStorage.getItem('kd_user') || '{}');
        const renterName = renter?.name || 'Customer';
        const text = item.listingType === 'rent'
            ? `Hello, I want to book ${item.title}. Type: ${computed.bookingType}, Qty: ${computed.quantity}, Total: Rs ${computed.totalCost}. My name is ${renterName}.`
            : `Hello, I want to buy ${item.title}. My name is ${renterName}.`;
        const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleDeleteListing = async () => {
        if (!item || !isOwner) return;
        const confirmed = window.confirm('Delete this listing? This action cannot be undone.');
        if (!confirmed) return;

        setDeleting(true);
        const result = await deleteListing({ listingId: item.id, actorId: currentUid });
        setDeleting(false);

        if (!result.ok) {
            setError(result.message || 'Failed to delete listing');
            return;
        }

        navigate('/home');
    };

    const validateRentInputs = () => {
        if (bookingMode === 'day') {
            if (!dayStartDate || !dayEndDate) return 'Please select start and end date.';
            if (new Date(dayEndDate) < new Date(dayStartDate)) return 'End date cannot be before start date.';
            if (computed.quantity <= 0) return 'Please select a valid day range.';
            return '';
        }
        if (bookingMode === 'hour') {
            if (!hourDate) return 'Please select booking date.';
            if (!hourStartTime) return 'Please select start time.';
            if (!Number.isFinite(Number(hourCount)) || Number(hourCount) <= 0) return 'Please enter valid hours.';
            return '';
        }
        if (!unitDate) return 'Please select booking date.';
        if (!Number.isFinite(Number(unitCount)) || Number(unitCount) <= 0) return `Please enter valid ${bookingMode || 'quantity'}.`;
        return '';
    };

    const handleCreateRequest = async () => {
        if (!item) return;

        const currentUserId = localStorage.getItem('kd_uid');
        if (!currentUserId) {
            navigate('/login');
            return;
        }
        if (currentUserId === item.ownerId) {
            setError('You cannot request your own listing.');
            return;
        }

        if (item.listingType === 'rent') {
            const validationMessage = validateRentInputs();
            if (validationMessage) {
                setError(validationMessage);
                return;
            }
        }

        setError('');
        setSuccess('');
        setSubmitting(true);

        const bookingSummary = item.listingType === 'rent'
            ? `Type:${computed.bookingType}, Qty:${computed.quantity}, DistanceKm:${listingDistanceKm.toFixed(1)}, Base:${computed.baseCost}, Logistics:${computed.travelCost}, Platform:${computed.platformFee}, Total:${computed.totalCost}`
            : '';
        const result = await createRequest({
            listingId: item.id,
            ownerId: item.ownerId,
            farmerId: currentUserId,
            requestType: item.listingType === 'rent' ? 'rent' : 'buy',
            bookingType: item.listingType === 'rent' ? computed.bookingType : null,
            startDate: item.listingType === 'rent' ? computed.startDate : null,
            endDate: item.listingType === 'rent' ? computed.endDate : null,
            hoursBooked: item.listingType === 'rent' ? (computed.bookingType === 'hour' ? computed.quantity : null) : null,
            daysBooked: item.listingType === 'rent' ? computed.daysBooked : null,
            acresBooked: item.listingType === 'rent' ? computed.acresBooked : null,
            baseCost: item.listingType === 'rent' ? computed.baseCost : Number(item.sellPrice) || 0,
            travelCost: item.listingType === 'rent' ? computed.travelCost : 0,
            platformFee: item.listingType === 'rent' ? computed.platformFee : 0,
            totalCost: item.listingType === 'rent' ? computed.totalCost : Number(item.sellPrice) || 0,
            farmerMessage: [requestMessage, computed.extraMessage].filter(Boolean).join(' | '),
            message: [requestMessage, computed.extraMessage, bookingSummary].filter(Boolean).join(' | '),
            paymentStatus: 'pending',
            status: 'pending',
        });
        setSubmitting(false);

        if (!result.ok) {
            setError(result.message || 'Failed to create request');
            return;
        }

        setSuccess(item.listingType === 'rent'
            ? 'Booking request sent. Wait for owner approval in My Orders.'
            : 'Purchase request sent. Wait for owner approval in My Orders.');
    };

    if (loading) {
        return (
            <MobileLayout t={t}>
                <div className="p-4 text-sm text-gray-500">{t('loading') || 'Loading...'}</div>
            </MobileLayout>
        );
    }

    if (error && !item) {
        return (
            <MobileLayout t={t}>
                <div className="p-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm mb-4 border">
                        <ArrowLeft size={20} />
                    </button>
                    <p className="text-sm text-red-500">{error}</p>
                </div>
            </MobileLayout>
        );
    }

    const primaryMode = availableBookingModes[0];
    const displayPrice = item.listingType === 'rent' ? getRateForMode(primaryMode) : item.sellPrice;

    return (
        <MobileLayout t={t}>
            <div className="pb-24">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm border">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="font-bold text-gray-800 truncate">{item.title}</h2>
                </div>

                <div className="relative w-full h-64 bg-gray-200 rounded-3xl overflow-hidden mb-6 shadow-md">
                    <img src={item.images?.[0] || 'https://placehold.co/600x400?text=No+Image'} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase text-white ${item.listingType === 'rent' ? 'bg-blue-600' : 'bg-red-500'}`}>
                            {item.listingType === 'rent' ? t('rent_badge') : t('sell_badge')}
                        </span>
                    </div>
                </div>

                <div className="px-2 mb-6 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800">{item.title}</h1>
                        <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                            <MapPin size={14} />
                            <span>{item.city}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-green-700">Rs {displayPrice}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                            {item.listingType === 'rent' ? `/ ${primaryMode || 'unit'}` : t('price_on_sale')}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                            {ownerName.charAt(0)}
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">Owner</p>
                            <p className="font-bold text-gray-800 text-sm">{ownerName}</p>
                        </div>
                    </div>
                    {isOwner && (
                        <button
                            onClick={handleDeleteListing}
                            disabled={deleting}
                            className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-100 font-bold disabled:opacity-60 flex items-center gap-1"
                        >
                            <Trash2 size={14} />
                            {deleting ? t('deleting') : t('delete_listing')}
                        </button>
                    )}
                </div>

                <div className="px-2 mb-6">
                    <h3 className="font-black text-gray-800 mb-2 uppercase text-xs tracking-widest">{t('description')}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>

                <div className="px-2 mb-8">
                    <h3 className="font-black text-gray-800 mb-3 uppercase text-xs tracking-widest">{t('specifications')}</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {[`${t('category_label')}: ${localizedCategory}`, `${t('location_label')}: ${item.city}`].map((spec, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 p-3 rounded-xl font-medium">
                                <ShieldCheck size={16} className="text-green-600" />
                                {spec}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-2 mb-32">
                    {item.listingType === 'rent' && (
                        <>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 mb-3">
                                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">{t('booking_type')}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {availableBookingModes.map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setBookingMode(mode)}
                                            className={`p-2 rounded-lg text-xs font-bold border ${bookingMode === mode ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 text-gray-700 border-gray-200'}`}
                                        >
                                            {modeLabels[mode] || mode}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {bookingMode === 'day' && (
                                <div className="bg-white p-4 rounded-xl border border-gray-100 mb-3">
                                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase">{modeLabels.day}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="date" value={dayStartDate} onChange={(e) => setDayStartDate(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                                        <input type="date" value={dayEndDate} onChange={(e) => setDayEndDate(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                                    </div>
                                </div>
                            )}

                            {bookingMode === 'hour' && (
                                <div className="bg-white p-4 rounded-xl border border-gray-100 mb-3">
                                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase">{modeLabels.hour}</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input type="date" value={hourDate} onChange={(e) => setHourDate(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                                        <input type="time" value={hourStartTime} onChange={(e) => setHourStartTime(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                                        <input type="number" min="1" value={hourCount} onChange={(e) => setHourCount(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm" placeholder="Hours" />
                                    </div>
                                </div>
                            )}

                            {bookingMode !== 'day' && bookingMode !== 'hour' && (
                                <div className="bg-white p-4 rounded-xl border border-gray-100 mb-3">
                                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase">{modeLabels[bookingMode] || bookingMode}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="date" value={unitDate} onChange={(e) => setUnitDate(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                                        <input type="number" min="1" value={unitCount} onChange={(e) => setUnitCount(e.target.value)} className="w-full border border-gray-200 rounded-lg p-2 text-sm" placeholder={modeLabels[bookingMode] || 'Quantity'} />
                                    </div>
                                </div>
                            )}

                            <div className="bg-white p-4 rounded-xl border border-gray-100 mb-3">
                                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">{t('fare_estimate')}</p>
                                <div className="text-[11px] text-gray-600 space-y-1">
                                    <p>{t('rate')}: Rs {computed.selectedRate}/{computed.bookingType || '-'}</p>
                                    <p>{t('quantity')}: {computed.quantity || 0}</p>
                                    <p>{t('base_cost')}: Rs {computed.baseCost}</p>
                                    {isOwnerPricedRent && <p>Logistics ({listingDistanceKm.toFixed(1)} km): Rs {computed.travelCost}</p>}
                                    <p>{t('platform_fee')}: Rs {computed.platformFee}</p>
                                    <p className="font-bold text-green-700">{t('estimated_total')}: Rs {computed.totalCost}</p>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="bg-white p-4 rounded-xl border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase">{t('message_optional')}</p>
                        <textarea
                            value={requestMessage}
                            onChange={(e) => setRequestMessage(e.target.value)}
                            rows="3"
                            className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                            placeholder={t('add_request_note')}
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                    {success && <p className="text-green-600 text-xs mt-2">{success}</p>}
                </div>

                {!isOwner && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 px-6 flex items-center gap-3 z-50">
                        <div className="flex-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase leading-none">{t('total_estimate')}</p>
                            <p className="text-xl font-black text-gray-800">Rs {item.listingType === 'rent' ? computed.totalCost : displayPrice}</p>
                        </div>
                        <button onClick={handleWhatsAppBooking} className="flex-[1.1] bg-[#25D366] text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all">
                            {t('whatsapp_owner')}
                        </button>
                        <button onClick={handleCreateRequest} disabled={submitting} className="flex-[1.5] bg-green-700 text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all disabled:opacity-60">
                            {submitting ? (t('loading') || 'Loading...') : item.listingType === 'rent' ? t('book_now') : t('buy_now')}
                        </button>
                    </div>
                )}
            </div>
        </MobileLayout>
    );
};

export default EquipmentDetails;
