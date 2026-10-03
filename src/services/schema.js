import { ServiceErrorCode, fail } from './errors';

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const asTrimmed = (value) => (typeof value === 'string' ? value.trim() : '');
const asNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
};

// ------------------------------------
// A. Users Collection Schema Validator
// ------------------------------------
export const validateUserPayload = (input) => {
    const payload = {
        uid: asTrimmed(input?.uid),
        name: asTrimmed(input?.name),
        city: asTrimmed(input?.city),
        phone: asTrimmed(input?.phone),
        photoURL: asTrimmed(input?.photoURL) || '',
        role: asTrimmed(input?.role) || 'farmer',
    };

    if (!isNonEmptyString(payload.uid)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'uid is required');
    if (!isNonEmptyString(payload.name)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'name is required');
    if (!isNonEmptyString(payload.phone)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'phone is required');
    if (!isNonEmptyString(payload.city)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'city is required');

    if (!['farmer', 'owner'].includes(payload.role)) {
        payload.role = 'farmer';
    }

    return { ok: true, data: payload };
};

// ------------------------------------
// B. Listings Collection Schema Validator
// ------------------------------------
export const validateListingPayload = (input) => {
    let listingType = asTrimmed(input?.listingType).toLowerCase();
    if (listingType === 'sale') listingType = 'sell'; // Normalize sale -> sell

    const lat = asNumber(input?.lat);
    const lng = asNumber(input?.lng);

    const payload = {
        id: asTrimmed(input?.id),
        ownerId: asTrimmed(input?.ownerId),
        title: asTrimmed(input?.title),
        category: asTrimmed(input?.category),
        city: asTrimmed(input?.city),
        description: asTrimmed(input?.description),
        images: Array.isArray(input?.images) ? input.images.filter(isNonEmptyString) : [],
        isAvailable: typeof input?.isAvailable === 'boolean' ? input.isAvailable : true,
        lat,
        lng,
        listingType,
        pricePerDay: input?.pricePerDay != null ? asNumber(input.pricePerDay) : null,
        priceUnit: input?.priceUnit != null ? asTrimmed(input.priceUnit) : null,
        sellPrice: input?.sellPrice != null ? asNumber(input.sellPrice) : null,
    };

    if (!isNonEmptyString(payload.ownerId)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'ownerId is required');
    if (!isNonEmptyString(payload.description)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'description is required');
    if (!isNonEmptyString(payload.category)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'category is required');
    if (!isNonEmptyString(payload.city)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'city is required');
    if (!Number.isFinite(payload.lat)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'lat must be a number');
    if (!Number.isFinite(payload.lng)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'lng must be a number');

    if (!['rent', 'sell', 'sale'].includes(payload.listingType)) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'listingType must be rent or sale');
    }

    if (!Array.isArray(input?.images)) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'images must be an array');
    }

    return { ok: true, data: payload };
};

// ------------------------------------
// C. Requests Collection Schema Validator
// ------------------------------------
export const validateRequestPayload = (input) => {
    const bookingType = input?.bookingType == null ? null : asTrimmed(input?.bookingType);
    const asOptionalNumber = (value) => (value == null ? null : asNumber(value));

    const payload = {
        id: asTrimmed(input?.id),
        listingId: asTrimmed(input?.listingId),
        ownerId: asTrimmed(input?.ownerId),
        farmerId: asTrimmed(input?.farmerId),
        baseCost: asNumber(input?.baseCost),
        bookingType,
        acresBooked: asOptionalNumber(input?.acresBooked),
        daysBooked: asOptionalNumber(input?.daysBooked),
        hoursBooked: asOptionalNumber(input?.hoursBooked),
        startDate: input?.startDate ?? null,
        endDate: input?.endDate ?? null,
        farmerMessage: asTrimmed(input?.farmerMessage) || '',
        message: asTrimmed(input?.message) || '',
        status: asTrimmed(input?.status).toLowerCase() || 'pending',
    };

    if (!isNonEmptyString(payload.listingId)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'listingId is required');
    if (!isNonEmptyString(payload.ownerId)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'ownerId is required');
    if (!isNonEmptyString(payload.farmerId)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'farmerId is required');
    if (!Number.isFinite(payload.baseCost)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'baseCost must be a number');

    if (!['pending', 'accepted', 'approved', 'rejected', 'completed', 'cancelled'].includes(payload.status)) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'status must be pending, accepted, rejected or completed');
    }

    return { ok: true, data: payload };
};
// ------------------------------------
// D. Availability Collection Schema Validator
// ------------------------------------
export const validateAvailabilityPayload = (input) => {
    const payload = {
        id: asTrimmed(input?.id),
        equipmentId: asTrimmed(input?.equipmentId || input?.listingId),
        bookingId: asTrimmed(input?.bookingId || input?.requestId) || '',
        startDate: asTrimmed(input?.startDate),
        endDate: asTrimmed(input?.endDate),
        isBlocked: typeof input?.isBlocked === 'boolean' ? input.isBlocked : true,
        reason: asTrimmed(input?.reason).toLowerCase() || 'booking',
    };

    if (!isNonEmptyString(payload.equipmentId)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'equipmentId is required');
    if (!isNonEmptyString(payload.startDate)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'startDate is required');
    if (!isNonEmptyString(payload.endDate)) return fail(ServiceErrorCode.VALIDATION_ERROR, 'endDate is required');

    if (!['booking', 'manual'].includes(payload.reason)) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'reason must be "booking" or "manual"');
    }

    return { ok: true, data: payload };
};
