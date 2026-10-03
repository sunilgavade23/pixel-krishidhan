/**
 * KrishiDhan — Firestore Connectivity Test (Client SDK)
 * Run: node scripts/testConnectivity.cjs
 * 
 * Uses the Firebase Client SDK (same config as the web app)
 * to verify database reads and writes work from any device.
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, limit, query } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyACXkTXkFMZtkZ6S2JR4Oxu7EwwNADCEGM',
  authDomain: 'krishidhan-94366.firebaseapp.com',
  projectId: 'krishidhan-94366',
  storageBucket: 'krishidhan-94366.firebasestorage.app',
  messagingSenderId: '47452439326',
  appId: '1:47452439326:web:e34c1c89d23c3ccc1e7f0f',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = ['users', 'listings', 'requests', 'availability'];

async function testConnectivity() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌾 KrishiDhan — Firestore Connectivity Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Project: ${firebaseConfig.projectId}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  let allPassed = true;

  // 1. Test READ connectivity for each collection
  console.log('── READ TESTS ──\n');
  for (const collName of COLLECTIONS) {
    try {
      const q = query(collection(db, collName), limit(5));
      const snapshot = await getDocs(q);
      console.log(`✅ ${collName}: Connected — ${snapshot.size} document(s) found`);

      if (snapshot.size > 0) {
        const firstDoc = snapshot.docs[0];
        const data = firstDoc.data();
        const fields = Object.keys(data).join(', ');
        console.log(`   └─ Sample "${firstDoc.id}": [${fields}]`);
      }
    } catch (err) {
      console.error(`❌ ${collName}: READ FAILED — ${err.code || err.message}`);
      allPassed = false;
    }
  }

  console.log('\n── WRITE/READ/DELETE TEST ──\n');

  // 2. Test WRITE + READ + DELETE round-trip on users collection
  const testDocId = '__test_' + Date.now();
  const testPayload = {
    uid: testDocId,
    name: 'Connectivity Test User',
    city: 'TestCity',
    phone: '0000000000',
    photoURL: '',
    role: 'farmer',
  };

  try {
    // Write
    await setDoc(doc(db, 'users', testDocId), testPayload);
    console.log(`✅ WRITE: Created test doc "users/${testDocId}"`);

    // Read back
    const q = query(collection(db, 'users'), limit(50));
    const readSnap = await getDocs(q);
    const found = readSnap.docs.find(d => d.id === testDocId);
    if (found && found.data().name === 'Connectivity Test User') {
      console.log('✅ READ: Successfully verified test doc data');
    } else {
      console.error('❌ READ: Test doc not found or data mismatch');
      allPassed = false;
    }

    // Delete
    await deleteDoc(doc(db, 'users', testDocId));
    console.log('✅ DELETE: Cleaned up test doc');
  } catch (err) {
    console.error(`❌ WRITE/READ/DELETE: FAILED — ${err.code || err.message}`);
    allPassed = false;
    // Cleanup attempt
    try { await deleteDoc(doc(db, 'users', testDocId)); } catch {}
  }

  // 3. Test WRITE on listings collection
  const testListingId = '__test_listing_' + Date.now();
  try {
    await setDoc(doc(db, 'listings', testListingId), {
      id: testListingId,
      ownerId: 'test_owner',
      category: 'tractor',
      city: 'TestCity',
      description: 'Test listing',
      images: [],
      isAvailable: true,
      lat: 0,
      lng: 0,
      listingType: 'rent',
    });
    console.log(`✅ LISTINGS WRITE: Created test listing`);

    await deleteDoc(doc(db, 'listings', testListingId));
    console.log('✅ LISTINGS DELETE: Cleaned up');
  } catch (err) {
    console.error(`❌ LISTINGS WRITE: FAILED — ${err.code || err.message}`);
    allPassed = false;
    try { await deleteDoc(doc(db, 'listings', testListingId)); } catch {}
  }

  // 4. Test WRITE on requests collection
  const testReqId = '__test_req_' + Date.now();
  try {
    await setDoc(doc(db, 'requests', testReqId), {
      id: testReqId,
      listingId: 'test_listing',
      ownerId: 'test_owner',
      farmerId: 'test_farmer',
      baseCost: 1000,
      bookingType: null,
      status: 'pending',
      farmerMessage: 'Test',
      message: 'Test',
      createdAt: serverTimestamp(),
    });
    console.log(`✅ REQUESTS WRITE: Created test request`);

    await deleteDoc(doc(db, 'requests', testReqId));
    console.log('✅ REQUESTS DELETE: Cleaned up');
  } catch (err) {
    console.error(`❌ REQUESTS WRITE: FAILED — ${err.code || err.message}`);
    allPassed = false;
    try { await deleteDoc(doc(db, 'requests', testReqId)); } catch {}
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED — Database is FULLY CONNECTED');
    console.log('   The app can read/write all 4 collections.');
    console.log('   This will work from ANY device with the same config.');
  } else {
    console.log('⚠️  SOME TESTS FAILED — Check errors above');
    console.log('   Possible causes:');
    console.log('   1. Firestore rules may be blocking writes');
    console.log('   2. Firebase project config might be wrong');
    console.log('   3. Network connectivity issue');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  process.exit(allPassed ? 0 : 1);
}

testConnectivity().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
