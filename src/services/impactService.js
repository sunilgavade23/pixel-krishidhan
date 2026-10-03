import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { ServiceErrorCode, fail, ok, toErrorDetails } from './errors';

const USERS_COLLECTION = 'users';
const LISTINGS_COLLECTION = 'listings';
const REQUESTS_COLLECTION = 'requests';

const toMillis = (value) => {
    if (!value) return 0;
    if (typeof value?.toMillis === 'function') return value.toMillis();
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export async function getImpactMetrics() {
    try {
        const [usersSnap, listingsSnap, requestsSnap] = await Promise.all([
            getDocs(collection(db, USERS_COLLECTION)),
            getDocs(collection(db, LISTINGS_COLLECTION)),
            getDocs(collection(db, REQUESTS_COLLECTION)),
        ]);

        const users = usersSnap.docs.map((docSnap) => docSnap.data());
        const listings = listingsSnap.docs.map((docSnap) => docSnap.data());
        const requests = requestsSnap.docs.map((docSnap) => docSnap.data());

        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

        const activeListings = listings.filter((item) => item.isAvailable === true);
        const rentListings = listings.filter((item) => item.listingType === 'rent');
        const sellListings = listings.filter((item) => item.listingType === 'sell');

        const pendingRequests = requests.filter((item) => item.status === 'pending');
        const approvedRequests = requests.filter((item) => item.status === 'approved' || item.status === 'accepted');
        const completedRequests = requests.filter((item) => item.status === 'completed');
        const recentRequests = requests.filter((item) => toMillis(item.createdAt) >= sevenDaysAgo);

        const uniqueCities = new Set(
            listings
                .map((item) => String(item.city || '').trim())
                .filter(Boolean)
        );

        const rentPrices = rentListings
            .map((item) => Number(item.pricePerDay))
            .filter((value) => Number.isFinite(value) && value > 0);
        const avgRentPricePerDay = rentPrices.length
            ? Math.round(rentPrices.reduce((sum, value) => sum + value, 0) / rentPrices.length)
            : 0;

        const uniqueOwners = new Set(
            listings
                .map((item) => String(item.ownerId || '').trim())
                .filter(Boolean)
        );

        return ok({
            totalUsers: users.length,
            totalListings: listings.length,
            activeListings: activeListings.length,
            rentListings: rentListings.length,
            sellListings: sellListings.length,
            totalRequests: requests.length,
            pendingRequests: pendingRequests.length,
            approvedRequests: approvedRequests.length,
            completedRequests: completedRequests.length,
            successfulBookings: approvedRequests.length + completedRequests.length,
            requestsLast7Days: recentRequests.length,
            avgRentPricePerDay,
            uniqueCities: uniqueCities.size,
            uniqueOwners: uniqueOwners.size,
        });
    } catch (error) {
        return fail(ServiceErrorCode.FIRESTORE_ERROR, 'Failed to load impact metrics', toErrorDetails(error));
    }
}
