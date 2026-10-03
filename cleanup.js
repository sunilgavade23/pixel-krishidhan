import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

// Load env vars
const env = fs.readFileSync(".env", "utf8");
const config = {};
env.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) {
        config[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
    }
});

const firebaseConfig = {
    apiKey: config.VITE_FIREBASE_API_KEY,
    authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: config.VITE_FIREBASE_PROJECT_ID,
    storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: config.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanUp() {
    console.log("Fetching listings...");
    const listingsSnap = await getDocs(collection(db, "listings"));
    let deleted = 0;
    
    for (const docSnap of listingsSnap.docs) {
        const data = docSnap.data();
        if (!data.title) {
            console.log(`Deleting listing ${docSnap.id} (no title)`);
            await deleteDoc(doc(db, "listings", docSnap.id));
            deleted++;
        }
    }
    console.log(`Deleted ${deleted} empty listings.`);

    console.log("\nFetching requests...");
    const requestsSnap = await getDocs(collection(db, "requests"));
    requestsSnap.forEach(snap => {
        const data = snap.data();
        console.log(`Request ${snap.id}: status=${data.status}, paymentStatus=${data.paymentStatus}`);
    });
    
    process.exit(0);
}

cleanUp().catch(console.error);
