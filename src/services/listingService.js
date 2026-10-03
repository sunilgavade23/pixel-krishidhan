import { db } from "./firebase";
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    serverTimestamp,
    getDocs,
    getDoc,
    deleteDoc
} from "firebase/firestore";
import { validateListingPayload } from "./schema";

const LISTINGS_COLLECTION = "listings";

const getLocalListings = () => {
    try {
        return JSON.parse(localStorage.getItem('kd_local_listings') || '[]');
    } catch {
        return [];
    }
};

const saveLocalListings = (listings) => {
    try {
        localStorage.setItem('kd_local_listings', JSON.stringify(listings));
    } catch {}
};

// ------------------------------------
// Create Listing in Firestore
// ------------------------------------
export async function createListing(data) {
    const validated = validateListingPayload(data);
    const listingPayload = validated.ok ? validated.data : data;

    const newId = listingPayload.id || ('listing_' + Date.now());
    const newListing = {
        ...listingPayload,
        id: newId,
        createdAt: new Date().toISOString(),
        isAvailable: typeof listingPayload.isAvailable === 'boolean' ? listingPayload.isAvailable : true,
    };

    try {
        const listingDocRef = doc(db, LISTINGS_COLLECTION, newId);
        await setDoc(listingDocRef, {
            ...newListing,
            createdAt: serverTimestamp(),
        }, { merge: true });

        console.log('[KrishiDhan] Successfully stored listing in Firebase Firestore:', newId);
    } catch (err) {
        console.error('[KrishiDhan] Firestore createListing error:', err);
    }

    const current = getLocalListings();
    saveLocalListings([newListing, ...current.filter(l => l.id !== newId)]);

    return {
        ok: true,
        id: newId,
        data: newListing
    };
}

// ------------------------------------
// Get All Listings from Firestore (with filtering)
// ------------------------------------
export async function getListings(filters = {}) {
    let remoteListings = [];

    try {
        const snapshot = await getDocs(
            collection(db, LISTINGS_COLLECTION)
        );
        remoteListings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (err) {
        console.warn('[KrishiDhan] Firestore getListings error, using local fallback:', err.message);
    }

    const localListings = getLocalListings();
    const map = new Map();
    // Prioritize remote Firestore documents over stale local cache
    [...localListings, ...remoteListings].forEach(item => {
        if (item?.id) map.set(item.id, item);
    });

    let result = Array.from(map.values());

    if (filters?.ownerId) {
        result = result.filter(item => item.ownerId === filters.ownerId);
    }
    if (filters?.category) {
        result = result.filter(item => item.category === filters.category);
    }
    if (filters?.listingType) {
        const type = String(filters.listingType).toLowerCase();
        result = result.filter(item => {
            const itemType = String(item.listingType || '').toLowerCase();
            if (type === 'sell' || type === 'sale') {
                return itemType === 'sell' || itemType === 'sale';
            }
            return itemType === type;
        });
    }
    if (filters?.city) {
        const cityLower = String(filters.city).toLowerCase();
        result = result.filter(item => String(item.city || '').toLowerCase().includes(cityLower));
    }
    if (typeof filters?.isAvailable === 'boolean') {
        result = result.filter(item => item.isAvailable === filters.isAvailable);
    }

    return {
        ok: true,
        data: result
    };
}

// ------------------------------------
// Get Single Listing by ID
// ------------------------------------
export async function getListingById(id) {
    if (!id) {
        return {
            ok: false,
            message: "Listing ID required"
        };
    }

    try {
        const snapshot = await getDoc(
            doc(db, LISTINGS_COLLECTION, id)
        );

        if (snapshot.exists()) {
            return {
                ok: true,
                data: {
                    id: snapshot.id,
                    ...snapshot.data()
                }
            };
        }
    } catch (err) {
        console.warn('[KrishiDhan] Firestore getListingById error:', err.message);
    }

    const local = getLocalListings().find(item => item.id === id);
    if (local) {
        return {
            ok: true,
            data: local
        };
    }

    return {
        ok: false,
        message: "Listing not found"
    };
}

// ------------------------------------
// Update Listing in Firestore
// ------------------------------------
export async function updateListing(id, updates) {
    if (!id) {
        return {
            ok: false,
            message: "Listing ID is required"
        };
    }

    try {
        const listingDocRef = doc(db, LISTINGS_COLLECTION, id);
        await updateDoc(listingDocRef, {
            ...updates,
            updatedAt: serverTimestamp(),
        });
        console.log('[KrishiDhan] Successfully updated listing in Firestore:', id);
    } catch (err) {
        console.warn('[KrishiDhan] Firestore updateListing error:', err.message);
    }

    const local = getLocalListings().map(item => item.id === id ? { ...item, ...updates } : item);
    saveLocalListings(local);

    return {
        ok: true,
        id,
        data: updates
    };
}

// ------------------------------------
// Delete Listing from Firestore
// ------------------------------------
export async function deleteListing(payload) {
    const id = typeof payload === 'string' ? payload : (payload?.listingId || payload?.id);

    if (!id) {
        return {
            ok: false,
            message: "Listing ID is required"
        };
    }

    try {
        await deleteDoc(
            doc(db, LISTINGS_COLLECTION, id)
        );
        console.log('[KrishiDhan] Successfully deleted listing from Firestore:', id);
    } catch (err) {
        console.warn('[KrishiDhan] Firestore deleteListing error:', err.message);
    }

    const local = getLocalListings().filter(item => item.id !== id);
    saveLocalListings(local);

    return {
        ok: true
    };
}