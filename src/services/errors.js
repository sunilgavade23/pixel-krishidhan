export const ServiceErrorCode = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    CONFIG_MISSING: 'CONFIG_MISSING',
    AUTH_ERROR: 'AUTH_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    FIRESTORE_ERROR: 'FIRESTORE_ERROR',
    UPLOAD_ERROR: 'UPLOAD_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

export const ok = (data) => ({ ok: true, data });

export const fail = (code, message, details = null) => ({
    ok: false,
    code,
    message,
    details,
});

export const toErrorDetails = (error) => ({
    name: error?.name || 'Error',
    message: error?.message || 'Unknown error',
    code: error?.code || null,
});
