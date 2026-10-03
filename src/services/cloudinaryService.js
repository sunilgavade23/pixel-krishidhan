import { ServiceErrorCode, fail, ok, toErrorDetails } from './errors';

const sanitizeEnv = (value) =>
    String(value || '')
        .trim()
        .replace(/^["'<\s]+/, '')
        .replace(/["'>\s]+$/, '');

const CLOUD_NAME = sanitizeEnv(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
const UPLOAD_PRESET = sanitizeEnv(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
const UPLOAD_FOLDER = import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER || 'krishidhan/listings';

export async function uploadImages(files) {
    const input = Array.from(files || []);

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        return fail(ServiceErrorCode.CONFIG_MISSING, 'Missing Cloudinary config in VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET');
    }

    if (input.length === 0) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'At least one file is required');
    }

    try {
        const uploads = await Promise.all(
            input.map(async (file) => {
                const body = new FormData();
                body.append('file', file);
                body.append('upload_preset', UPLOAD_PRESET);
                body.append('folder', UPLOAD_FOLDER);

                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                    method: 'POST',
                    body,
                });

                if (!response.ok) {
                    let raw = await response.text();
                    try {
                        const parsed = JSON.parse(raw);
                        const apiMessage = parsed?.error?.message;
                        if (apiMessage) {
                            raw = apiMessage;
                        }
                    } catch {
                        // Keep raw text if response is not JSON.
                    }

                    throw new Error(`Cloudinary upload failed (${response.status}): ${raw}`);
                }

                const data = await response.json();
                if (!data?.secure_url) {
                    throw new Error('Cloudinary response missing secure_url');
                }

                return data.secure_url;
            })
        );

        return ok(uploads);
    } catch (error) {
        return fail(ServiceErrorCode.UPLOAD_ERROR, 'Failed to upload images', toErrorDetails(error));
    }
}
