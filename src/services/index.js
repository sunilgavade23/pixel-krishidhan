// Collection A: Users
export {
    createUser,
    getUser,
    updateUser,
    deleteUser,
    registerWithEmail,
    loginWithEmail,
    logout,
    signInWithGoogle,
    handleGoogleRedirectResult,
    sendOtp,
    verifyOtp,
    setupRecaptcha
} from './authService';

// Cloudinary Image Storage
export { uploadImages } from './cloudinaryService';

// Collection B: Listings
export {
    createListing,
    getListings,
    getListingById,
    updateListing,
    deleteListing
} from './listingService';

// Collection C: Requests
export {
    createRequest,
    getRequests,
    getRequestById,
    updateRequestStatus,
    updatePaymentStatus,
    deleteRequest
} from './requestService';

// Collection D: Availability
export {
    createAvailability,
    getAvailability,
    checkEquipmentAvailability,
    updateAvailability,
    deleteAvailability,
    releaseBookingAvailability
} from './availabilityService';

// Listing Creation Flow
export { createListingFlow, createListingWithImages } from './createListingFlow';

// Metrics & Catalog
export { getImpactMetrics } from './impactService';
export {
    getRentRateByCategory,
    getAllowedRentUnits,
    CATEGORY_LABELS,
    RENT_RATE_CARD,
    isOwnerPricedRentCategory,
    LOGISTICS_RATE_PER_KM,
    PLATFORM_FEE_RATE,
} from './rateCard';
export { getEquipmentByCategory, EQUIPMENT_BY_CATEGORY } from './equipmentCatalog';
