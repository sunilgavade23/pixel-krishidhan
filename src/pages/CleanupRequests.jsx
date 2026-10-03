import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import MobileLayout from '../components/MobileLayout';
import { db } from '../services/firebase';
import { collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';

const CleanupRequests = ({ t }) => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('idle'); // idle | scanning | deleting | done
    const [orphanRequests, setOrphanRequests] = useState([]);
    const [deletedCount, setDeletedCount] = useState(0);
    const [error, setError] = useState('');
    const [log, setLog] = useState([]);

    const addLog = (msg) => setLog((prev) => [...prev, msg]);

    const scanRequests = async () => {
        setStatus('scanning');
        setError('');
        setLog([]);
        setOrphanRequests([]);

        try {
            addLog('Fetching all requests from Firestore...');
            const reqSnapshot = await getDocs(collection(db, 'requests'));
            addLog(`Found ${reqSnapshot.size} total requests.`);

            const orphans = [];

            for (const reqDoc of reqSnapshot.docs) {
                const data = reqDoc.data();
                const listingId = data.listingId || '';

                // Check if the listing exists and has a title
                let hasValidTitle = false;
                if (listingId) {
                    try {
                        const listingSnap = await getDoc(doc(db, 'listings', listingId));
                        if (listingSnap.exists()) {
                            const listingData = listingSnap.data();
                            if (listingData.title && listingData.title.trim().length > 0) {
                                hasValidTitle = true;
                            }
                        }
                    } catch {
                        // listing doesn't exist or can't be read
                    }
                }

                if (!hasValidTitle) {
                    orphans.push({
                        id: reqDoc.id,
                        listingId,
                        status: data.status || 'unknown',
                        farmerId: data.farmerId || '',
                        ownerId: data.ownerId || '',
                    });
                }
            }

            setOrphanRequests(orphans);
            addLog(`Found ${orphans.length} requests with database IDs (no valid listing title).`);
            setStatus(orphans.length > 0 ? 'idle' : 'done');
            if (orphans.length === 0) {
                addLog('✅ No orphan requests found. Everything is clean!');
            }
        } catch (err) {
            setError('Failed to scan: ' + (err.message || err));
            addLog('❌ Error: ' + (err.message || err));
            setStatus('idle');
        }
    };

    const deleteOrphans = async () => {
        if (orphanRequests.length === 0) return;
        setStatus('deleting');
        setError('');
        let deleted = 0;

        for (const req of orphanRequests) {
            try {
                await deleteDoc(doc(db, 'requests', req.id));
                deleted++;
                addLog(`🗑️ Deleted request: ${req.id}`);
            } catch (err) {
                addLog(`⚠️ Could not delete ${req.id}: ${err.message}`);
            }
        }

        // Also clean up local storage requests
        try {
            const localRaw = localStorage.getItem('kd_local_requests');
            if (localRaw) {
                const localRequests = JSON.parse(localRaw);
                const orphanIds = new Set(orphanRequests.map((r) => r.id));
                const cleaned = localRequests.filter((r) => !orphanIds.has(r.id));
                localStorage.setItem('kd_local_requests', JSON.stringify(cleaned));
                addLog(`Cleaned ${localRequests.length - cleaned.length} entries from local storage.`);
            }
        } catch {
            // no-op
        }

        setDeletedCount(deleted);
        setOrphanRequests([]);
        setStatus('done');
        addLog(`✅ Done! Deleted ${deleted} orphan requests.`);
    };

    return (
        <MobileLayout t={t}>
            <div className="pt-2 pb-8">
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm border">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-black text-gray-800">Cleanup Requests</h1>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
                    <div className="flex items-start gap-2">
                        <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-amber-800">What this does:</p>
                            <p className="text-xs text-amber-700 mt-1">
                                Scans all requests and finds ones where the linked equipment listing has no title
                                (showing as database IDs like "listing_17909..."). These orphan requests will be deleted.
                            </p>
                        </div>
                    </div>
                </div>

                {status !== 'done' && orphanRequests.length === 0 && (
                    <button
                        onClick={scanRequests}
                        disabled={status === 'scanning'}
                        className="w-full py-3 bg-green-600 text-white font-bold rounded-2xl active:scale-95 transition-transform disabled:opacity-60 mb-4"
                    >
                        {status === 'scanning' ? 'Scanning...' : '🔍 Scan for Orphan Requests'}
                    </button>
                )}

                {orphanRequests.length > 0 && status === 'idle' && (
                    <div className="mb-4">
                        <p className="text-sm font-bold text-gray-800 mb-3">
                            Found <span className="text-red-600">{orphanRequests.length}</span> orphan requests to delete:
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
                            {orphanRequests.map((req) => (
                                <div key={req.id} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-2.5">
                                    <Trash2 size={14} className="text-red-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-gray-800 truncate">{req.id}</p>
                                        <p className="text-[10px] text-gray-500">Listing: {req.listingId} | Status: {req.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={deleteOrphans}
                            className="w-full py-3 bg-red-600 text-white font-bold rounded-2xl active:scale-95 transition-transform"
                        >
                            🗑️ Delete {orphanRequests.length} Orphan Requests
                        </button>
                    </div>
                )}

                {status === 'deleting' && (
                    <div className="text-center py-6">
                        <div className="animate-spin w-8 h-8 border-3 border-red-200 border-t-red-600 rounded-full mx-auto mb-3" />
                        <p className="text-sm font-bold text-gray-700">Deleting orphan requests...</p>
                    </div>
                )}

                {status === 'done' && deletedCount > 0 && (
                    <div className="text-center py-6">
                        <div className="bg-green-100 p-4 rounded-full inline-block mb-3">
                            <CheckCircle2 size={40} className="text-green-600" />
                        </div>
                        <h3 className="text-lg font-black text-gray-800">Cleanup Complete!</h3>
                        <p className="text-sm text-green-700 font-bold mt-1">
                            Deleted {deletedCount} orphan requests.
                        </p>
                        <button
                            onClick={() => navigate('/my-orders')}
                            className="mt-4 px-6 py-2.5 bg-green-600 text-white text-sm font-bold rounded-2xl"
                        >
                            Go to My Orders
                        </button>
                    </div>
                )}

                {/* Log */}
                {log.length > 0 && (
                    <div className="mt-4 bg-gray-900 rounded-2xl p-4 max-h-52 overflow-y-auto">
                        {log.map((entry, i) => (
                            <p key={i} className="text-[11px] text-green-400 font-mono leading-relaxed">{entry}</p>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                        <p className="text-xs text-red-700 font-bold">{error}</p>
                    </div>
                )}
            </div>
        </MobileLayout>
    );
};

export default CleanupRequests;
