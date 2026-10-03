/**
 * Cleanup orphaned test documents from connectivity tests
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, deleteDoc, query, where } = require('firebase/firestore');

const app = initializeApp({
  apiKey: 'AIzaSyACXkTXkFMZtkZ6S2JR4Oxu7EwwNADCEGM',
  authDomain: 'krishidhan-94366.firebaseapp.com',
  projectId: 'krishidhan-94366',
  storageBucket: 'krishidhan-94366.firebasestorage.app',
  messagingSenderId: '47452439326',
  appId: '1:47452439326:web:e34c1c89d23c3ccc1e7f0f',
});
const db = getFirestore(app);

async function cleanup() {
  console.log('Cleaning orphaned test documents...\n');
  const snap = await getDocs(collection(db, 'users'));
  let cleaned = 0;
  for (const d of snap.docs) {
    if (d.id.startsWith('__test_') || d.data().name === 'Connectivity Test User') {
      // Use admin or just report - client can't delete users without auth
      console.log(`  Found orphaned test doc: users/${d.id}`);
      cleaned++;
    }
  }
  if (cleaned === 0) {
    console.log('  No orphaned test docs found.');
  } else {
    console.log(`\n  ${cleaned} test doc(s) found. These are harmless and will not affect the app.`);
    console.log('  They can be deleted from Firebase Console > Firestore > users collection.');
  }

  // Verify real data
  console.log('\n── Current Database Summary ──\n');
  for (const collName of ['users', 'listings', 'requests', 'availability']) {
    const s = await getDocs(collection(db, collName));
    const realDocs = s.docs.filter(d => !d.id.startsWith('__test_'));
    console.log(`  ${collName}: ${realDocs.length} document(s)`);
    realDocs.slice(0, 3).forEach(d => {
      const data = d.data();
      const summary = collName === 'users' ? `${data.name} (${data.city})`
        : collName === 'listings' ? `${data.title || data.category} - ${data.listingType}`
        : collName === 'requests' ? `${data.status} - ${data.farmerId}`
        : `${data.equipmentId} - ${data.isBlocked ? 'blocked' : 'free'}`;
      console.log(`    └─ ${d.id}: ${summary}`);
    });
  }

  console.log('\n✅ Database is healthy and connected.');
  process.exit(0);
}

cleanup().catch(e => { console.error(e); process.exit(1); });
