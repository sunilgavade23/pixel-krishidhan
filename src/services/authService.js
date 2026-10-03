import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    PhoneAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import { auth, db, isFirebaseConfigured, missingFirebaseEnv } from './firebase';
import { ServiceErrorCode, fail, ok, toErrorDetails } from './errors';
import { validateUserPayload } from './schema';

const USERS_COLLECTION = 'users';

const getLocalUsers = () => {
    try {
        return JSON.parse(localStorage.getItem('kd_local_users') || '{}');
    } catch {
        return {};
    }
};

const saveLocalUser = (user) => {
    try {
        const users = getLocalUsers();
        // Strip any stale password from cache before saving
        const { password: _discarded, ...safeUser } = user;
        const emailKey = (safeUser.email || '').toLowerCase();
        if (emailKey) {
            users[emailKey] = safeUser;
        }
        if (safeUser.uid) {
            users[safeUser.uid] = safeUser;
        }
        localStorage.setItem('kd_local_users', JSON.stringify(users));
    } catch (e) {
        console.error('Failed to save local user cache', e);
    }
};

const findLocalUser = (emailOrUid) => {
    const users = getLocalUsers();
    return users[String(emailOrUid).toLowerCase()] || users[emailOrUid] || null;
};

// ------------------------------------
// Create or Update User Document in Firestore
// ------------------------------------
export async function createUser(data) {
    const validated = validateUserPayload(data);
    if (!validated.ok) return validated;

    const payload = validated.data;
    try {
        const userRef = doc(db, USERS_COLLECTION, payload.uid);
        await setDoc(userRef, {
            uid: payload.uid,
            email: payload.email || '',
            name: payload.name,
            phone: payload.phone,
            city: payload.city,
            photoURL: payload.photoURL || '',
            role: payload.role || 'farmer',
            updatedAt: serverTimestamp(),
        }, { merge: true });

        console.log('[KrishiDhan] Successfully stored user in Firebase Firestore:', payload.uid);
        saveLocalUser(payload);
        return ok(payload);
    } catch (error) {
        console.error('[KrishiDhan] Firestore createUser error:', error);
        saveLocalUser(payload);
        return ok(payload);
    }
}

// ------------------------------------
// Get User Profile from Firestore / Cache
// ------------------------------------
export async function getUser(uidOrEmail) {
    if (!uidOrEmail || typeof uidOrEmail !== 'string') {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'uid or email is required');
    }

    // 1. Try Firestore by UID document ID
    try {
        const userRef = doc(db, USERS_COLLECTION, uidOrEmail);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            return ok({ id: snap.id, ...snap.data() });
        }
    } catch (error) {
        console.warn('[KrishiDhan] Firestore direct getDoc error:', error.message);
    }

    // 2. If it looks like an email or not found by direct ID, query by email field
    if (uidOrEmail.includes('@')) {
        try {
            const q = query(collection(db, USERS_COLLECTION), where('email', '==', uidOrEmail.toLowerCase().trim()));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const docSnap = snap.docs[0];
                return ok({ id: docSnap.id, ...docSnap.data() });
            }
        } catch (error) {
            console.warn('[KrishiDhan] Firestore email query error:', error.message);
        }
    }

    // 3. Fallback to local storage cache
    const localUser = findLocalUser(uidOrEmail);
    if (localUser) {
        return ok(localUser);
    }

    try {
        const active = JSON.parse(localStorage.getItem('kd_user') || 'null');
        if (active && (active.uid === uidOrEmail || active.email === uidOrEmail)) {
            return ok(active);
        }
    } catch {}

    return fail(ServiceErrorCode.NOT_FOUND, 'User not found in Firebase or local cache', { uid: uidOrEmail });
}

export async function updateUser(data) {
    return await createUser(data);
}

// ------------------------------------
// Register with Email & Password
// ------------------------------------
export async function registerWithEmail({ email, password, name, phone, city, photoURL = '', role = 'farmer' }) {
    if (!email || !password) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'Email and password are required');
    }
    if (password.length < 6) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'Password must be at least 6 characters long');
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isFirebaseConfigured || !auth) {
        return fail(
            ServiceErrorCode.CONFIG_MISSING,
            `Firebase configuration incomplete on server. Missing: ${missingFirebaseEnv.join(', ')}. Please add them to Vercel Environment Variables.`
        );
    }

    let uid = null;
    // 1. Attempt standard Firebase Authentication
    try {
        const result = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const uid = result.user.uid;
        const registeredEmail = result.user.email;
        console.log('[KrishiDhan] Firebase Auth registration success, UID:', uid);

        // 2. ALWAYS store the full farmer profile in Cloud Firestore (users collection)
        const userPayload = {
            uid,
            email: registeredEmail,
            name: name.trim(),
            phone: phone.trim(),
            city: city.trim(),
            photoURL,
            role
        };

        await createUser(userPayload);
        saveLocalUser(userPayload);

        return ok({ uid, email: registeredEmail, profile: userPayload });
    } catch (error) {
        console.warn('[KrishiDhan] Firebase Auth response:', error.code, error.message);

        if (error.code === 'auth/email-already-in-use') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'This email is already registered. Please go to Login.');
        }
        if (error.code === 'auth/invalid-email') {
            return fail(ServiceErrorCode.VALIDATION_ERROR, 'Please enter a valid email address.');
        }
        if (error.code === 'auth/weak-password') {
            return fail(ServiceErrorCode.VALIDATION_ERROR, 'Password should be at least 6 characters.');
        }
        if (error.code === 'auth/operation-not-allowed') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Email/Password sign-in is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method.');
        }
        if (error.code === 'auth/network-request-failed') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Network error. Please check your internet connection.');
        }
        const msg = error.message ? `Registration failed (${error.code || 'error'}): ${error.message}` : 'Failed to register with Firebase Auth.';
        return fail(ServiceErrorCode.FIRESTORE_ERROR, msg, toErrorDetails(error));
    }
}

// ------------------------------------
// Login with Email & Password
// ------------------------------------
export async function loginWithEmail({ email, password }) {
    if (!email || !password) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'Email and password are required');
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isFirebaseConfigured || !auth) {
        return fail(
            ServiceErrorCode.CONFIG_MISSING,
            `Firebase configuration incomplete on server. Missing: ${missingFirebaseEnv.join(', ')}. Please add them to Vercel Environment Variables.`
        );
    }

    // 1. Try Firebase Authentication first
    try {
        const result = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const uid = result.user.uid;

        const userResult = await getUser(uid);
        let profile = userResult.ok ? userResult.data : null;

        if (!profile) {
            // Profile doc doesn't exist yet (e.g. registered before firestore sync).
            // Synthesize minimal profile and persist so user is not locked out.
            profile = {
                uid,
                email: result.user.email,
                name: result.user.displayName || cleanEmail.split('@')[0],
                phone: '',
                city: '',
                role: 'farmer'
            };
            await createUser(profile);
        }

        saveLocalUser(profile);
        return ok({ uid, email: result.user.email, profile });
    } catch (error) {
        console.warn('[KrishiDhan] Firebase Auth sign-in error:', error.code || error.message);

        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Incorrect email or password. Please verify and try again.');
        }

        if (error.code === 'auth/user-not-found') {
            return fail(ServiceErrorCode.NOT_FOUND, 'No account found with this email. Please register first.');
        }

        if (error.code === 'auth/too-many-requests') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Access temporarily disabled due to many failed login attempts. Please reset password or try later.');
        }

        if (error.code === 'auth/network-request-failed') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Network error. Please check your internet connection.');
        }

        const msg = error.message ? `Login failed (${error.code || 'error'}): ${error.message}` : 'Login failed. Please check credentials.';
        return fail(ServiceErrorCode.AUTH_ERROR, msg, toErrorDetails(error));
    }
}

// ------------------------------------
// Sign Out
// ------------------------------------
export async function logout() {
    try {
        await signOut(auth);
    } catch {}
    localStorage.removeItem('kd_uid');
    localStorage.removeItem('kd_user');
    return ok(true);
}

// ------------------------------------
// Google Sign-In
// ------------------------------------
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
    if (!isFirebaseConfigured || !auth) {
        return fail(
            ServiceErrorCode.CONFIG_MISSING,
            `Firebase configuration incomplete. Missing: ${missingFirebaseEnv.join(', ')}.`
        );
    }

    try {
        // Try popup first, fall back to redirect if blocked
        let result;
        try {
            result = await signInWithPopup(auth, googleProvider);
        } catch (popupError) {
            if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
                // If popup was blocked (not closed by user), try redirect
                if (popupError.code === 'auth/popup-blocked') {
                    await signInWithRedirect(auth, googleProvider);
                    return ok({ redirecting: true });
                }
                // Popup was closed by user intentionally
                return fail(ServiceErrorCode.AUTH_ERROR, 'Sign-in cancelled. Please try again.');
            }
            throw popupError; // Re-throw other errors
        }

        const user = result.user;
        const uid = user.uid;
        const email = user.email || '';
        const displayName = user.displayName || email.split('@')[0] || 'User';
        const photoURL = user.photoURL || '';

        // Check if user already exists in Firestore
        let existingProfile = null;
        const userResult = await getUser(uid);
        if (userResult.ok && userResult.data) {
            existingProfile = userResult.data;
        }

        let profile;
        if (existingProfile) {
            // Existing user — preserve their role and data, just update photo if needed
            profile = {
                ...existingProfile,
                photoURL: existingProfile.photoURL || photoURL,
            };
            // Update photo in Firestore if it was missing
            if (!existingProfile.photoURL && photoURL) {
                try {
                    await setDoc(doc(db, USERS_COLLECTION, uid), { photoURL }, { merge: true });
                } catch {}
            }
        } else {
            // New Google user — create profile with default role
            profile = {
                uid,
                email,
                name: displayName,
                phone: '',
                city: '',
                photoURL,
                role: 'farmer', // Default role for new Google users
            };
            await createUser(profile);
        }

        saveLocalUser(profile);
        return ok({ uid, email, profile, isNewUser: !existingProfile });

    } catch (error) {
        console.warn('[KrishiDhan] Google sign-in error:', error.code, error.message);

        if (error.code === 'auth/account-exists-with-different-credential') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'An account already exists with the same email but a different sign-in method. Please use your email and password to log in.');
        }
        if (error.code === 'auth/network-request-failed') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Network error. Please check your internet connection and try again.');
        }
        if (error.code === 'auth/unauthorized-domain') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'This domain is not authorized for Google Sign-In. Please add it to Firebase Console > Authentication > Settings > Authorized domains.');
        }
        if (error.code === 'auth/internal-error') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Google Sign-In is not enabled. Please enable it in Firebase Console > Authentication > Sign-in method.');
        }
        if (error.code === 'auth/operation-not-allowed') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Google Sign-In is not enabled in Firebase Console. Go to Authentication > Sign-in method > Google and enable it.');
        }

        const msg = error.message
            ? `Google sign-in failed (${error.code || 'error'}): ${error.message}`
            : 'Google sign-in failed. Please try again.';
        return fail(ServiceErrorCode.AUTH_ERROR, msg, toErrorDetails(error));
    }
}

// Handle redirect result (called on page load after signInWithRedirect)
export async function handleGoogleRedirectResult() {
    if (!auth) return null;
    try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
            const user = result.user;
            const uid = user.uid;
            const email = user.email || '';
            const displayName = user.displayName || email.split('@')[0] || 'User';
            const photoURL = user.photoURL || '';

            let existingProfile = null;
            const userResult = await getUser(uid);
            if (userResult.ok && userResult.data) {
                existingProfile = userResult.data;
            }

            let profile;
            if (existingProfile) {
                profile = { ...existingProfile, photoURL: existingProfile.photoURL || photoURL };
            } else {
                profile = { uid, email, name: displayName, phone: '', city: '', photoURL, role: 'farmer' };
                await createUser(profile);
            }

            saveLocalUser(profile);
            return { uid, email, profile, isNewUser: !existingProfile };
        }
    } catch (err) {
        console.warn('[KrishiDhan] Google redirect result error:', err);
    }
    return null;
}

// ------------------------------------
// Phone Number Authentication
// ------------------------------------
let recaptchaVerifierInstance = null;
let recaptchaContainerEl = null;

function getRecaptchaContainer() {
    // Reuse the existing container if it's still in the DOM
    if (recaptchaContainerEl && document.body.contains(recaptchaContainerEl)) {
        recaptchaContainerEl.innerHTML = '';
        return recaptchaContainerEl;
    }

    // Create a new persistent container
    const el = document.createElement('div');
    el.id = 'kd-recaptcha-container-' + Date.now();
    el.style.position = 'fixed';
    el.style.bottom = '0';
    el.style.right = '0';
    el.style.width = '1px';
    el.style.height = '1px';
    el.style.overflow = 'hidden';
    el.style.opacity = '0.01';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '-1';
    document.body.appendChild(el);
    recaptchaContainerEl = el;
    return el;
}

function safelyClearRecaptcha() {
    if (recaptchaVerifierInstance) {
        try {
            recaptchaVerifierInstance.clear();
        } catch (e) {
            // Ignore errors from clearing (DOM node may already be removed)
            console.warn('[KrishiDhan] reCAPTCHA clear warning (safe to ignore):', e?.message || e);
        }
        recaptchaVerifierInstance = null;
    }
    // Also clean up the container
    if (recaptchaContainerEl && document.body.contains(recaptchaContainerEl)) {
        try {
            recaptchaContainerEl.innerHTML = '';
        } catch {}
    }
}

export function setupRecaptcha() {
    if (!auth) return null;

    // Safely clear any existing verifier first
    safelyClearRecaptcha();

    const container = getRecaptchaContainer();

    try {
        recaptchaVerifierInstance = new RecaptchaVerifier(auth, container, {
            size: 'invisible',
            callback: () => {
                console.log('[KrishiDhan] reCAPTCHA solved invisibly');
            },
            'expired-callback': () => {
                console.warn('[KrishiDhan] reCAPTCHA expired');
                safelyClearRecaptcha();
            },
        });
        return recaptchaVerifierInstance;
    } catch (err) {
        console.error('[KrishiDhan] RecaptchaVerifier setup error:', err);
        return null;
    }
}

export async function sendOtp(phoneNumber) {
    if (!isFirebaseConfigured || !auth) {
        return fail(
            ServiceErrorCode.CONFIG_MISSING,
            `Firebase configuration incomplete. Missing: ${missingFirebaseEnv.join(', ')}.`
        );
    }

    // Validate phone number format
    let cleanPhone = String(phoneNumber || '').trim();
    cleanPhone = cleanPhone.replace(/[\s-]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);
    if (!cleanPhone.startsWith('+')) {
        if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
            cleanPhone = '+' + cleanPhone;
        } else {
            cleanPhone = '+91' + cleanPhone;
        }
    }

    if (!/^\+91[6-9]\d{9}$/.test(cleanPhone)) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'Please enter a valid 10-digit Indian mobile number.');
    }

    try {
        const appVerifier = setupRecaptcha();
        if (!appVerifier) {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Failed to initialize security verification. Please refresh and try again.');
        }

        const confirmationResult = await signInWithPhoneNumber(auth, cleanPhone, appVerifier);
        window._krishiDhanConfirmationResult = confirmationResult;
        return ok({ phoneNumber: cleanPhone, sent: true });
    } catch (error) {
        console.error('[KrishiDhan] sendOtp error:', error?.code, error?.message);

        // Safely clear recaptcha on error
        safelyClearRecaptcha();

        const code = error?.code || 'unknown';

        // Billing not enabled — Firebase requires Blaze plan for Phone Auth
        if (code === 'auth/billing-not-enabled' || (error?.message || '').includes('billing')) {
            return fail(
                ServiceErrorCode.AUTH_ERROR,
                'Phone OTP is currently unavailable. Firebase requires a Blaze (pay-as-you-go) billing plan to send SMS. Please use Email or Google login, or contact the admin to enable billing.'
            );
        }
        if (code === 'auth/too-many-requests') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Too many OTP requests. Please wait a few minutes before trying again.');
        }
        if (code === 'auth/invalid-phone-number') {
            return fail(ServiceErrorCode.VALIDATION_ERROR, 'Invalid phone number. Please enter a valid 10-digit Indian mobile number.');
        }
        if (code === 'auth/quota-exceeded') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'SMS limit reached for today. Please try again tomorrow or use Email/Google login.');
        }
        if (code === 'auth/operation-not-allowed') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Phone OTP login is not enabled in the Firebase Console. Please enable it under Authentication > Sign-in method > Phone.');
        }
        if (code === 'auth/captcha-check-failed') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Security verification failed. Please refresh the page and try again.');
        }
        if (code === 'auth/network-request-failed') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Network error. Please check your internet connection.');
        }
        if (code === 'auth/internal-error') {
            // Could be domain not authorized or reCAPTCHA issue
            return fail(ServiceErrorCode.AUTH_ERROR, 'Authentication setup error. Ensure localhost is listed in Firebase Console > Authentication > Settings > Authorized domains.');
        }

        // Fallback: show actual error code for debugging
        return fail(
            ServiceErrorCode.AUTH_ERROR,
            `OTP sending failed [${code}]. Please try Email or Google login instead.`,
            toErrorDetails(error)
        );
    }
}

export async function verifyOtp(otpCode) {
    if (!otpCode || String(otpCode).trim().length < 6) {
        return fail(ServiceErrorCode.VALIDATION_ERROR, 'Please enter the 6-digit OTP code.');
    }

    const confirmationResult = window._krishiDhanConfirmationResult;
    if (!confirmationResult) {
        return fail(ServiceErrorCode.AUTH_ERROR, 'OTP session expired. Please request a new OTP.');
    }

    try {
        const result = await confirmationResult.confirm(String(otpCode).trim());
        const user = result.user;
        const uid = user.uid;
        const phone = user.phoneNumber || '';

        // Clean up
        window._krishiDhanConfirmationResult = null;

        // Check if user already exists in Firestore
        let existingProfile = null;
        const userResult = await getUser(uid);
        if (userResult.ok && userResult.data) {
            existingProfile = userResult.data;
        }

        let profile;
        if (existingProfile) {
            // Existing user — preserve their role and data
            profile = { ...existingProfile };
            // Update phone if not set
            if (!existingProfile.phone && phone) {
                profile.phone = phone;
                try {
                    await setDoc(doc(db, USERS_COLLECTION, uid), { phone }, { merge: true });
                } catch {}
            }
        } else {
            // New phone user — create profile with default role
            profile = {
                uid,
                email: '',
                name: '',
                phone,
                city: '',
                photoURL: '',
                role: 'farmer',
            };
            await createUser(profile);
        }

        saveLocalUser(profile);
        return ok({ uid, phone, profile, isNewUser: !existingProfile });
    } catch (error) {
        console.warn('[KrishiDhan] verifyOtp error:', error.code, error.message);

        if (error.code === 'auth/invalid-verification-code') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Invalid OTP. Please check the code and try again.');
        }
        if (error.code === 'auth/code-expired') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'OTP has expired. Please request a new one.');
        }
        if (error.code === 'auth/session-expired') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Verification session expired. Please request a new OTP.');
        }
        if (error.code === 'auth/network-request-failed') {
            return fail(ServiceErrorCode.AUTH_ERROR, 'Network error. Please check your internet connection.');
        }

        const msg = error.message
            ? `OTP verification failed (${error.code || 'error'}): ${error.message}`
            : 'OTP verification failed. Please try again.';
        return fail(ServiceErrorCode.AUTH_ERROR, msg, toErrorDetails(error));
    }
}

// ------------------------------------
// Delete User from Firestore & Local Cache
// ------------------------------------
export async function deleteUser(uid) {
    if (!uid) return fail(ServiceErrorCode.VALIDATION_ERROR, 'uid is required');

    try {
        await deleteDoc(doc(db, USERS_COLLECTION, uid));
        console.log('[KrishiDhan] Deleted user from Firestore:', uid);
    } catch (err) {
        console.warn('[KrishiDhan] Firestore deleteUser error:', err.message);
    }

    try {
        const users = getLocalUsers();
        delete users[uid];
        localStorage.setItem('kd_local_users', JSON.stringify(users));
    } catch {}

    return ok(true);
}

