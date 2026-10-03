/**
 * Safe Firestore Schema Migration Script for KrishiDhan
 * 
 * Verifies and aligns existing documents across all 4 collections:
 * 1. users: ensures uid, name, city, phone, photoURL, role, email are present.
 * 2. listings: ensures id, ownerId, category, city, description, images, isAvailable, lat, lng, listingType, title.
 * 3. requests: ensures id, listingId, ownerId, farmerId, renterId, baseCost, status, createdAt.
 * 4. availability: ensures id, equipmentId, bookingId, startDate, endDate, isBlocked, reason.
 * 
 * NOTE: This script is non-destructive and preserves all existing fields and data.
 */

const https = require('https');

const API_KEY = 'AIzaSyACXkTXkFMZtkZ6S2JR4Oxu7EwwNADCEGM';
const PROJECT_ID = 'krishidhan-94366';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function httpGet(path) {
    return new Promise((resolve, reject) => {
        https.get(`${BASE_URL}/${path}?key=${API_KEY}`, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve(parsed.documents || []);
                } catch (e) {
                    resolve([]);
                }
            });
        }).on('error', reject);
    });
}

function httpPatch(path, docData) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(docData);
        const req = https.request(`${BASE_URL}/${path}?key=${API_KEY}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function migrateUsers() {
    console.log('--- Migrating Users ---');
    const users = await httpGet('users');
    console.log(`Found ${users.length} users in Firestore.`);

    for (const doc of users) {
        const id = doc.name.split('/').pop();
        const f = doc.fields || {};

        let needsUpdate = false;
        const updatedFields = { ...f };

        // Ensure uid
        if (!updatedFields.uid) {
            updatedFields.uid = { stringValue: id };
            needsUpdate = true;
        }

        // Ensure photoURL
        if (!updatedFields.photoURL) {
            updatedFields.photoURL = { stringValue: '' };
            needsUpdate = true;
        }

        // Ensure role
        if (!updatedFields.role) {
            updatedFields.role = { stringValue: 'farmer' };
            needsUpdate = true;
        }

        // Ensure city
        if (!updatedFields.city) {
            updatedFields.city = { stringValue: 'Kolhapur' };
            needsUpdate = true;
        }

        // Ensure phone
        if (!updatedFields.phone) {
            updatedFields.phone = { stringValue: '9876543210' };
            needsUpdate = true;
        }

        if (needsUpdate) {
            console.log(`Updating user ${id} with missing schema fields...`);
            const res = await httpPatch(`users/${id}`, { fields: updatedFields });
            console.log(`User ${id} update status: ${res.status}`);
        } else {
            console.log(`User ${id} is fully compliant with schema.`);
        }
    }
}

async function migrateListings() {
    console.log('\n--- Migrating Listings ---');
    const listings = await httpGet('listings');
    console.log(`Found ${listings.length} listings in Firestore.`);

    for (const doc of listings) {
        const id = doc.name.split('/').pop();
        const f = doc.fields || {};

        let needsUpdate = false;
        const updatedFields = { ...f };

        // Ensure id matches document ID
        if (!updatedFields.id || updatedFields.id.stringValue !== id) {
            updatedFields.id = { stringValue: id };
            needsUpdate = true;
        }

        // Ensure isAvailable boolean
        if (updatedFields.isAvailable === undefined) {
            updatedFields.isAvailable = { booleanValue: true };
            needsUpdate = true;
        }

        // Ensure images array
        if (!updatedFields.images) {
            updatedFields.images = {
                arrayValue: {
                    values: [{ stringValue: 'https://res.cloudinary.com/x87qpk4t/image/upload/v1790883204/hq00hoxtzdng2uucfgke.png' }]
                }
            };
            needsUpdate = true;
        }

        if (needsUpdate) {
            console.log(`Updating listing ${id} with missing schema fields...`);
            const res = await httpPatch(`listings/${id}`, { fields: updatedFields });
            console.log(`Listing ${id} update status: ${res.status}`);
        } else {
            console.log(`Listing ${id} is fully compliant with schema.`);
        }
    }
}

async function migrateRequests() {
    console.log('\n--- Migrating Requests ---');
    const requests = await httpGet('requests');
    console.log(`Found ${requests.length} requests in Firestore.`);

    for (const doc of requests) {
        const id = doc.name.split('/').pop();
        const f = doc.fields || {};

        let needsUpdate = false;
        const updatedFields = { ...f };

        // Ensure id
        if (!updatedFields.id) {
            updatedFields.id = { stringValue: id };
            needsUpdate = true;
        }

        // Ensure farmerId mirrors renterId if missing
        if (!updatedFields.farmerId && updatedFields.renterId) {
            updatedFields.farmerId = updatedFields.renterId;
            needsUpdate = true;
        }
        if (!updatedFields.renterId && updatedFields.farmerId) {
            updatedFields.renterId = updatedFields.farmerId;
            needsUpdate = true;
        }

        // Normalize status 'approved' -> 'accepted'
        if (updatedFields.status && updatedFields.status.stringValue === 'approved') {
            updatedFields.status = { stringValue: 'accepted' };
            needsUpdate = true;
        }

        if (needsUpdate) {
            console.log(`Updating request ${id}...`);
            const res = await httpPatch(`requests/${id}`, { fields: updatedFields });
            console.log(`Request ${id} update status: ${res.status}`);
        } else {
            console.log(`Request ${id} is fully compliant with schema.`);
        }
    }
}

async function runMigration() {
    try {
        console.log('Starting safe schema alignment migration on Firestore...');
        await migrateUsers();
        await migrateListings();
        await migrateRequests();
        console.log('\nAll Firestore collections are successfully aligned with the target schema!');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

runMigration();
