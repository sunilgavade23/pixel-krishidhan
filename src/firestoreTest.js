import { collection, getDocs } from "firebase/firestore";
import { db } from "./services/firebase.js";



export async function firestoreTest() {
    try {
        const snapshot = await getDocs(collection(db, "test"));
        console.log("✅ Firestore connected", snapshot.size);
    } catch (err) {
        console.error("❌ Firestore error:", err);
    }
}
