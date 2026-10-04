import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), 'krishi-sadhan-app', '.env') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectListings() {
    try {
        console.log('Fetching listings from Firestore...');
        const listingsRef = collection(db, 'listings');
        const snapshot = await getDocs(listingsRef);
        
        let exactZeros = 0;
        let nullOrMissing = 0;
        let identicalPairs = {};
        
        const listings = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            listings.push({ id: doc.id, ...data });
        });
        
        console.log(`Found ${listings.length} total listings.\n`);
        
        listings.forEach(listing => {
            const lat = listing.lat;
            const lng = listing.lng;
            
            console.log(`Listing: ${listing.id} | Title: ${listing.title} | City: ${listing.city}`);
            console.log(`  -> Coordinates: lat=${lat}, lng=${lng}`);
            
            if (lat === undefined || lng === undefined || lat === null || lng === null) {
                console.log(`  -> [ISSUE] Missing or null coordinates!`);
                nullOrMissing++;
            } else if (Number(lat) === 0 && Number(lng) === 0) {
                console.log(`  -> [ISSUE] Coordinates are exactly 0,0!`);
                exactZeros++;
            } else {
                const coordKey = `${lat},${lng}`;
                if (!identicalPairs[coordKey]) {
                    identicalPairs[coordKey] = [];
                }
                identicalPairs[coordKey].push(listing.id);
            }
            console.log('---');
        });
        
        console.log('\n=== SUMMARY ===');
        console.log(`Total Listings: ${listings.length}`);
        console.log(`Missing/Null Coords: ${nullOrMissing}`);
        console.log(`Exact 0,0 Coords: ${exactZeros}`);
        
        console.log('\nIdentical Coordinate Groups (Likely reused cache):');
        let foundDuplicates = false;
        Object.keys(identicalPairs).forEach(key => {
            if (identicalPairs[key].length > 1) {
                foundDuplicates = true;
                console.log(`Coords ${key} shared by: ${identicalPairs[key].join(', ')}`);
            }
        });
        if (!foundDuplicates) console.log('None found.');
        
    } catch (e) {
        console.error('Error:', e);
    }
}

inspectListings();
