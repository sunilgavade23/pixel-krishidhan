import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Note: To run this script, use: `node scripts/seed.js <email> <password>`
// This script will authenticate as the provided user and seed a sample listing and request.

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function seedData(email, password) {
    if (!email || !password) {
        console.error("Usage: node scripts/seed.js <email> <password>");
        process.exit(1);
    }

    try {
        console.log(`Authenticating as ${email}...`);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        console.log(`Authenticated successfully! UID: ${uid}`);

        // Seed Listing
        const listingId = `seed_listing_${Date.now()}`;
        const listingRef = doc(db, 'listings', listingId);
        await setDoc(listingRef, {
            id: listingId,
            ownerId: uid,
            category: "Tractor",
            city: "Pune",
            description: "Sample Tractor for rent",
            images: ["https://example.com/image.png"],
            isAvailable: true,
            lat: 18.5204,
            lng: 73.8567,
            listingType: "rent"
        });
        console.log(`Created listing: ${listingId}`);

        // Seed Request
        const requestId = `seed_request_${Date.now()}`;
        const requestRef = doc(db, 'requests', requestId);
        await setDoc(requestRef, {
            id: requestId,
            listingId: listingId,
            ownerId: uid,
            farmerId: uid, // User is both owner and farmer for this seed
            baseCost: 5000,
            bookingType: "day",
            acresBooked: null,
            daysBooked: 2,
            hoursBooked: null,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            farmerMessage: "I need this tractor for plowing.",
            message: "I need this tractor for plowing.",
            status: "pending",
            createdAt: serverTimestamp()
        });
        console.log(`Created request: ${requestId}`);

        console.log("Seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
seedData(args[0], args[1]);
