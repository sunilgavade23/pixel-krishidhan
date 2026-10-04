import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const submitSupportTicket = async (ticketData) => {
    try {
        if (!db) throw new Error("Firebase is not initialized");

        const docRef = await addDoc(collection(db, 'support_tickets'), {
            ...ticketData,
            status: 'Open',
            createdAt: serverTimestamp()
        });

        return { ok: true, id: docRef.id };
    } catch (error) {
        console.error("Error submitting support ticket:", error);
        return { ok: false, message: error.message };
    }
};
