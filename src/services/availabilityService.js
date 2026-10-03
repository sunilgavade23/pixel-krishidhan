import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './firebase';
import { ServiceErrorCode, fail, ok, toErrorDetails } from './errors';
import { validateAvailabilityPayload } from './schema';

const AVAILABILITY_COLLECTION = 'availability';

const getLocalAvailability = () => {
    try {
        return JSON.parse(localStorage.getItem('kd_local_availability') || '[]');
    } catch {
        return [];
    }
};

const saveLocalAvailability = (items) => {
    try {
        localStorage.setItem('kd_local_availability', JSON.stringify(items));
    } catch {}
};

const parseDateOnly = (val) => {
    if (!val) return null;
    const str = String(val).split('T')[0];
    const d = new Date(str + 'T00:00:00Z');
    return Number.isNaN(d.getTime()) ? null : d;
};

const datesOverlap = (aStart, aEnd, bStart, bEnd) => {
    return aStart <= bEnd && bStart <= aEnd;
};

// ------------------------------------
// Create Availability Block (booking or manual)
// ------------------------------------
export async function createAvailability(data) {
    const validated = validateAvailabilityPayload(data);
    if (!validated.ok) return validated;

    const payload = validated.data;
    const availabilityId = payload.id || ('avail_' + (payload.bookingId ? payload.bookingId : Date.now()));

    const record = {
        ...payload,
        id: availabilityId,
        createdAt: new Date().toISOString(),
    };

    try {
        const docRef = doc(db, AVAILABILITY_COLLECTION, availabilityId);
        await setDoc(docRef, {
            ...record,
            createdAt: serverTimestamp(),
        }, { merge: true });

        console.log('[KrishiDhan] Stored availability record in Firestore:', availabilityId);
    } catch (error) {
        console.warn('[KrishiDhan] Firestore createAvailability error, saving locally:', error.message);
    }

    const local = getLocalAvailability();
    saveLocalAvailability([record, ...local.filter(i => i.id !== availabilityId)]);

    return ok(record);
}

// ------------------------------------
// Get Availability Records (with filters)
// ------------------------------------
export async function getAvailability(filters = {}) {
    let remoteRecords = [];

    try {
        const availRef = collection(db, AVAILABILITY_COLLECTION);
        let q = availRef;

        if (filters.equipmentId) {
            q = query(availRef, where('equipmentId', '==', filters.equipmentId));
        } else if (filters.bookingId) {
            q = query(availRef, where('bookingId', '==', filters.bookingId));
        }

        const snapshot = await getDocs(q);
        remoteRecords = snapshot.docs.map(snap => ({ id: snap.id, ...snap.data() }));
    } catch (error) {
        console.warn('[KrishiDhan] Firestore getAvailability error, using local fallback:', error.message);
    }

    const local = getLocalAvailability();
    const map = new Map();
    [...local, ...remoteRecords].forEach(item => {
        if (item?.id) map.set(item.id, item);
    });

    let result = Array.from(map.values());

    if (filters.equipmentId) {
        result = result.filter(item => item.equipmentId === filters.equipmentId);
    }
    if (filters.bookingId) {
        result = result.filter(item => item.bookingId === filters.bookingId);
    }
    if (typeof filters.isBlocked === 'boolean') {
        result = result.filter(item => item.isBlocked === filters.isBlocked);
    }

    return ok(result);
}

// ------------------------------------
// Check Equipment Availability (Double-Booking Prevention)
// ------------------------------------
export async function checkEquipmentAvailability(equipmentId, startDateStr, endDateStr, excludeBookingId = null) {
    if (!equipmentId || !startDateStr || !endDateStr) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'equipmentId, startDate and endDate are required');
    }

    const reqStart = parseDateOnly(startDateStr);
    const reqEnd = parseDateOnly(endDateStr);

    if (!reqStart || !reqEnd) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'Invalid date range provided');
    }

    if (reqEnd < reqStart) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'End date cannot be earlier than start date');
    }

    // Query active availability blocks for this equipment
    const blocksResult = await getAvailability({ equipmentId, isBlocked: true });
    const blocks = blocksResult.ok ? blocksResult.data : [];

    const conflictingBlocks = blocks.filter(block => {
        if (excludeBookingId && block.bookingId === excludeBookingId) return false;
        if (!block.isBlocked) return false;

        const blockStart = parseDateOnly(block.startDate);
        const blockEnd = parseDateOnly(block.endDate);
        if (!blockStart || !blockEnd) return false;

        return datesOverlap(reqStart, reqEnd, blockStart, blockEnd);
    });

    const isAvailable = conflictingBlocks.length === 0;

    return ok({
        isAvailable,
        conflictingBlocks,
        message: isAvailable ? 'Equipment is available' : 'Equipment is already booked for these dates'
    });
}

// ------------------------------------
// Update Availability Record
// ------------------------------------
export async function updateAvailability(availabilityId, updates) {
    if (!availabilityId) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'availabilityId is required');
    }

    try {
        const docRef = doc(db, AVAILABILITY_COLLECTION, availabilityId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
        console.log('[KrishiDhan] Updated availability record in Firestore:', availabilityId);
    } catch (error) {
        console.warn('[KrishiDhan] Firestore updateAvailability error:', error.message);
    }

    const local = getLocalAvailability();
    const updated = local.map(item => item.id === availabilityId ? { ...item, ...updates } : item);
    saveLocalAvailability(updated);

    return ok({ id: availabilityId, ...updates });
}

// ------------------------------------
// Release Booking Availability Block (Unblock when rejected/cancelled)
// ------------------------------------
export async function releaseBookingAvailability(bookingId) {
    if (!bookingId) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'bookingId is required');
    }

    const result = await getAvailability({ bookingId });
    if (!result.ok || result.data.length === 0) {
        return ok({ released: 0 });
    }

    for (const block of result.data) {
        await updateAvailability(block.id, { isBlocked: false });
    }

    return ok({ released: result.data.length });
}

// ------------------------------------
// Delete Availability Record
// ------------------------------------
export async function deleteAvailability(availabilityId) {
    if (!availabilityId) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'availabilityId is required');
    }

    try {
        const docRef = doc(db, AVAILABILITY_COLLECTION, availabilityId);
        await deleteDoc(docRef);
        console.log('[KrishiDhan] Deleted availability record from Firestore:', availabilityId);
    } catch (error) {
        console.warn('[KrishiDhan] Firestore deleteAvailability error:', error.message);
    }

    const local = getLocalAvailability().filter(item => item.id !== availabilityId);
    saveLocalAvailability(local);

    return ok({ id: availabilityId, deleted: true });
}
