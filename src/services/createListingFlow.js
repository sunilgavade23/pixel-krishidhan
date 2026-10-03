import { uploadImages } from "./cloudinaryService";
import { createListing } from "./listingService";

const DEFAULT_CATEGORY_IMAGES = {
    tractor: "https://res.cloudinary.com/x87qpk4t/image/upload/v1790883204/hq00hoxtzdng2uucfgke.png",
    harvester: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=800",
    rotar: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=800",
    default: "https://res.cloudinary.com/x87qpk4t/image/upload/v1790883204/hq00hoxtzdng2uucfgke.png"
};

export async function createListingWithImages(arg1, arg2) {
    // Support both signatures: ({ listingData, files }) or (formData, files)
    let payload = arg1;
    let files = arg2;

    if (arg1 && typeof arg1 === 'object' && 'listingData' in arg1) {
        payload = arg1.listingData;
        files = arg1.files || arg2;
    }

    let imageUrls = [];

    // Upload files to Cloudinary if provided
    if (files && files.length > 0) {
        const uploadResult = await uploadImages(files);
        if (uploadResult?.ok && Array.isArray(uploadResult?.data)) {
            imageUrls = uploadResult.data;
        } else if (Array.isArray(uploadResult)) {
            imageUrls = uploadResult;
        }
    }

    // Preserve existing images if present in payload
    if (imageUrls.length === 0 && Array.isArray(payload?.images) && payload.images.length > 0) {
        imageUrls = payload.images;
    }

    // Fallback to high-quality category default image if no image was uploaded
    if (imageUrls.length === 0) {
        const fallback = DEFAULT_CATEGORY_IMAGES[payload?.category] || DEFAULT_CATEGORY_IMAGES.default;
        imageUrls = [fallback];
    }

    const listingData = {
        ...payload,
        images: imageUrls
    };

    return await createListing(listingData);
}

// Alias for backward compatibility
export const createListingFlow = createListingWithImages;