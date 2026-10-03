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
    where,
    writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { ServiceErrorCode, fail, ok, toErrorDetails } from './errors';
import { validateRequestPayload } from './schema';
import { getListingById } from './listingService';
import { checkEquipmentAvailability } from './availabilityService';

const REQUESTS_COLLECTION = 'requests';
const LISTINGS_COLLECTION = 'listings';
const AVAILABILITY_COLLECTION = 'availability';

const FINAL_STATUSES = new Set(['rejected', 'cancelled', 'completed']);

const getLocalRequests = () => {
    try {
        return JSON.parse(localStorage.getItem('kd_local_requests') || '[]');
    } catch {
        return [];
    }
};

const saveLocalRequests = (requests) => {
    try {
        localStorage.setItem('kd_local_requests', JSON.stringify(requests));
    } catch {}
};

// ------------------------------------
// Create Booking or Purchase Request
// ------------------------------------
export async function createRequest(data) {
    const validated = validateRequestPayload(data);
    if (!validated.ok) return validated;

    try {
        const payload = validated.data;

        // Verify listing exists and is available
        let listing = null;
        try {
            const listingRef = doc(db, LISTINGS_COLLECTION, payload.listingId);
            const listingSnap = await getDoc(listingRef);
            if (listingSnap.exists()) {
                listing = listingSnap.data();
            }
        } catch (e) {
            // fallback to local listing
        }

        if (!listing) {
            const res = await getListingById(payload.listingId);
            if (res.ok) {
                listing = res.data;
            }
        }

        if (!listing) {
            return fail(ServiceErrorCode.NOT_FOUND, 'Listing not found');
        }

        if (!listing.isAvailable) {
            return fail(ServiceErrorCode.VALIDATION_ERROR, 'Equipment is currently marked unavailable');
        }

        if (payload.ownerId === payload.farmerId) {
            return fail(ServiceErrorCode.VALIDATION_ERROR, 'Owner cannot create request on their own equipment');
        }

        // Check availability to prevent double-booking for rentals
        if (payload.requestType === 'rent') {
            const availCheck = await checkEquipmentAvailability(
                payload.listingId,
                payload.startDate,
                payload.endDate
            );

            if (!availCheck.ok) {
                return availCheck;
            }

            if (!availCheck.data.isAvailable) {
                return fail(
                    ServiceErrorCode.VALIDATION_ERROR,
                    'The selected dates are already booked for this equipment. Please choose different dates.'
                );
            }
        }

        // Check for duplicate pending buy requests on the same listing
        if (payload.requestType === 'buy') {
            const allRequests = await getRequests({ listingId: payload.listingId });
            if (allRequests.ok) {
                const activeBuy = allRequests.data.some(
                    r => r.requestType === 'buy' && !FINAL_STATUSES.has(r.status)
                );
                if (activeBuy) {
                    return fail(ServiceErrorCode.VALIDATION_ERROR, 'A purchase request is already in progress for this equipment');
                }
            }
        }

        const requestId = payload.id || ('req_' + Date.now());
        const requestRef = doc(db, REQUESTS_COLLECTION, requestId);

        const request = {
            id: requestId,
            listingId: payload.listingId,
            ownerId: payload.ownerId,
            farmerId: payload.farmerId,
            requestType: payload.bookingType || 'buy',
            baseCost: payload.baseCost,
            totalCost: payload.totalCost ?? payload.baseCost,
            bookingType: payload.bookingType,
            acresBooked: payload.acresBooked,
            daysBooked: payload.daysBooked,
            hoursBooked: payload.hoursBooked,
            startDate: payload.startDate,
            endDate: payload.endDate,
            farmerMessage: payload.farmerMessage || '',
            message: payload.message || payload.farmerMessage || '',
            status: payload.status || 'pending',
            paymentStatus: 'pending',
            // createdAt is handled by serverTimestamp
        };

        try {
            await setDoc(requestRef, {
                ...request,
                createdAt: serverTimestamp(),
            });

            console.log('[KrishiDhan] Stored request in Firestore:', requestId);
        } catch (error) {
            console.warn('[KrishiDhan] Firestore createRequest error, saving locally:', error.message);
        }

        const local = getLocalRequests();
        saveLocalRequests([request, ...local.filter(r => r.id !== requestId)]);

        return ok(request);
    } catch (error) {
        return fail(ServiceErrorCode.FIRESTORE_ERROR, 'Failed to create request: ' + (error?.message || error), toErrorDetails(error));
    }
}

// ------------------------------------
// Get Requests with Filters
// ------------------------------------
export async function getRequests(filters = {}) {
    let data = [];
    try {
        const requestsRef = collection(db, REQUESTS_COLLECTION);
        let docs = [];

        if (filters.userId) {
            const farmerSnapshot = await getDocs(query(requestsRef, where('farmerId', '==', filters.userId)));
            const ownerSnapshot = await getDocs(query(requestsRef, where('ownerId', '==', filters.userId)));

            const merged = [...farmerSnapshot.docs, ...ownerSnapshot.docs];
            const byId = new Map();
            merged.forEach((d) => byId.set(d.id, d));
            docs = [...byId.values()];
        } else if (filters.farmerId) {
            const snapshot = await getDocs(query(requestsRef, where('farmerId', '==', filters.farmerId)));
            docs = snapshot.docs;
        } else if (filters.ownerId) {
            const snapshot = await getDocs(query(requestsRef, where('ownerId', '==', filters.ownerId)));
            docs = snapshot.docs;
        } else if (filters.listingId) {
            const snapshot = await getDocs(query(requestsRef, where('listingId', '==', filters.listingId)));
            docs = snapshot.docs;
        } else {
            const snapshot = await getDocs(requestsRef);
            docs = snapshot.docs;
        }

        data = docs.map((snap) => ({ id: snap.id, ...snap.data() }));
    } catch (error) {
        console.warn('[KrishiDhan] Firestore getRequests error, using local fallback:', error.message);
    }

    const local = getLocalRequests();
    const map = new Map();
    // Local data first, then Firestore data overwrites — Firestore is the source of truth
    local.forEach((snap) => {
        if (snap?.id) map.set(snap.id, snap);
    });
    data.forEach((snap) => {
        if (snap?.id) map.set(snap.id, snap);
    });

    // Clean up local storage: remove entries that Firestore already has (prevents stale overrides)
    if (data.length > 0) {
        const firestoreIds = new Set(data.map(d => d.id));
        const cleanedLocal = local.filter(l => !firestoreIds.has(l.id));
        if (cleanedLocal.length !== local.length) {
            saveLocalRequests(cleanedLocal);
        }
    }

    let result = Array.from(map.values());

    if (filters.userId) {
        result = result.filter(r => r.ownerId === filters.userId || r.farmerId === filters.userId);
    }
    if (filters.farmerId) {
        result = result.filter(r => r.farmerId === filters.farmerId);
    }
    if (filters.ownerId) {
        result = result.filter(r => r.ownerId === filters.ownerId);
    }
    if (filters.listingId) {
        result = result.filter(r => r.listingId === filters.listingId);
    }
    if (filters.status) {
        result = result.filter(r => r.status === filters.status);
    }

    return ok(result);
}

// ------------------------------------
// Get Single Request by ID
// ------------------------------------
export async function getRequestById(requestId) {
    if (!requestId) return fail(ServiceErrorCode.VALIDATION_ERROR, 'requestId is required');

    try {
        const snap = await getDoc(doc(db, REQUESTS_COLLECTION, requestId));
        if (snap.exists()) {
            return ok({ id: snap.id, ...snap.data() });
        }
    } catch (err) {
        console.warn('[KrishiDhan] Firestore getRequestById error:', err.message);
    }

    const local = getLocalRequests().find(r => r.id === requestId);
    if (local) return ok(local);

    return fail(ServiceErrorCode.NOT_FOUND, 'Request not found');
}

// ------------------------------------
// Update Request Status with Atomic Batched Write to Availability
// ------------------------------------
export async function updateRequestStatus({ requestId, actorId, status, note = '' }) {
    let nextStatus = String(status || '').toLowerCase();
    if (nextStatus === 'approved') nextStatus = 'accepted'; // Normalize approved -> accepted

    const allowedStatuses = new Set(['accepted', 'approved', 'rejected', 'cancelled', 'completed']);

    if (!requestId || !actorId || !allowedStatuses.has(nextStatus)) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'requestId, actorId and valid status (accepted, rejected, cancelled, completed) are required');
    }

    try {
        const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
        const requestSnap = await getDoc(requestRef);
        let request = null;

        if (requestSnap.exists()) {
            request = requestSnap.data();
        } else {
            request = getLocalRequests().find(r => r.id === requestId);
        }

        if (!request) {
            return fail(ServiceErrorCode.NOT_FOUND, 'Request not found');
        }

        const isOwner = request.ownerId === actorId;
        const isFarmer = request.farmerId === actorId;

        if (!isOwner && !isFarmer) {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Not authorized to update this request');
        }

        // Perform atomic batched write across requests and availability collections
        try {
            const batch = writeBatch(db);

            // 1. Update request status
            batch.update(requestRef, {
                status: nextStatus,
                message: note || '',
            });

            // 2. Synchronize availability block
            const availId = 'avail_' + requestId;
            const availRef = doc(db, AVAILABILITY_COLLECTION, availId);

            if (nextStatus === 'accepted' || nextStatus === 'approved') {
                // If it's a rental request with dates, block the dates in availability
                if (request.startDate && request.endDate) {
                    batch.set(availRef, {
                        id: availId,
                        equipmentId: request.listingId,
                        bookingId: requestId,
                        startDate: request.startDate,
                        endDate: request.endDate,
                        isBlocked: true,
                        reason: 'booking',
                        createdAt: serverTimestamp(),
                    }, { merge: true });
                }
            } else if (FINAL_STATUSES.has(nextStatus)) {
                // Release availability block if rejected, cancelled, or completed
                batch.set(availRef, {
                    id: availId,
                    equipmentId: request.listingId,
                    bookingId: requestId,
                    startDate: request.startDate || '',
                    endDate: request.endDate || '',
                    isBlocked: false,
                    reason: 'booking',
                    updatedAt: serverTimestamp(),
                }, { merge: true });
            }

            await batch.commit();
            console.log(`[KrishiDhan] Atomic batch commit successful for request ${requestId} status -> ${nextStatus}`);
        } catch (err) {
            console.warn('[KrishiDhan] Firestore updateRequestStatus batch write error:', err.message);
        }

        const local = getLocalRequests();
        const updated = local.map(r => r.id === requestId ? { ...r, status: nextStatus, ownerResponse: note } : r);
        saveLocalRequests(updated);

        return ok({ id: requestId, status: nextStatus });
    } catch (error) {
        return fail(ServiceErrorCode.FIRESTORE_ERROR, 'Failed to update request status', toErrorDetails(error));
    }
}

// ------------------------------------
// Update Payment Status
// ------------------------------------
export async function updatePaymentStatus({ requestId, actorId, paymentStatus, listingId, orderType }) {
    const nextPaymentStatus = String(paymentStatus || '').toLowerCase();
    if (!requestId || !actorId || !['pending', 'paid', 'cod'].includes(nextPaymentStatus)) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'requestId, actorId and valid paymentStatus are required');
    }

    try {
        const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
        const updates = {
            paymentStatus: nextPaymentStatus,
            message: `Payment Status: ${nextPaymentStatus}`,
        };

        // Auto-complete the request when payment is marked as paid
        if (nextPaymentStatus === 'paid') {
            updates.status = 'completed';
        }

        try {
            await updateDoc(requestRef, updates);
        } catch (err) {
            console.warn('[KrishiDhan] Firestore updatePaymentStatus error:', err.message);
            return fail(ServiceErrorCode.FIRESTORE_ERROR, 'Failed to update payment: ' + err.message);
        }
        
        // If it's a paid buy order, mark the listing as sold separately (so permission errors don't block payment)
        if (nextPaymentStatus === 'paid' && listingId && String(orderType).toLowerCase() === 'buy') {
            try {
                const listingRef = doc(db, 'listings', listingId);
                await updateDoc(listingRef, { isAvailable: false });
                
                // Update local listings cache too
                const localListings = JSON.parse(localStorage.getItem('kd_local_listings') || '[]');
                const updatedListings = localListings.map(l => l.id === listingId ? { ...l, isAvailable: false } : l);
                localStorage.setItem('kd_local_listings', JSON.stringify(updatedListings));
            } catch (err) {
                console.warn('[KrishiDhan] Could not update listing availability:', err.message);
            }
        }

        const local = getLocalRequests();
        const updated = local.map(r => r.id === requestId
            ? { ...r, paymentStatus: nextPaymentStatus, ...(nextPaymentStatus === 'paid' ? { status: 'completed' } : {}) }
            : r
        );
        saveLocalRequests(updated);

        return ok({ id: requestId, paymentStatus: nextPaymentStatus, status: nextPaymentStatus === 'paid' ? 'completed' : undefined });
    } catch (error) {
        return fail(ServiceErrorCode.FIRESTORE_ERROR, 'Failed to update payment status', toErrorDetails(error));
    }
}

// ------------------------------------
// Delete Request
// ------------------------------------
export async function deleteRequest({ requestId, actorId }) {
    if (!requestId || !actorId) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'requestId and actorId are required');
    }

    try {
        const batch = writeBatch(db);
        const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
        const availRef = doc(db, AVAILABILITY_COLLECTION, 'avail_' + requestId);

        batch.delete(requestRef);
        batch.delete(availRef);

        await batch.commit();
        console.log('[KrishiDhan] Successfully deleted request and availability block:', requestId);
    } catch (err) {
        console.warn('[KrishiDhan] Firestore deleteRequest error:', err.message);
    }

    const local = getLocalRequests().filter(r => r.id !== requestId);
    saveLocalRequests(local);

    return ok({ id: requestId, deleted: true });
}
