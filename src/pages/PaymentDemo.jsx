import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CreditCard, IndianRupee, Landmark, Smartphone } from 'lucide-react';
import MobileLayout from '../components/MobileLayout';
import { updatePaymentStatus } from '../services';

const PAYMENT_METHODS = [
    { id: 'upi', label: 'UPI', icon: Smartphone },
    { id: 'card', label: 'Card', icon: CreditCard },
    { id: 'netbanking', label: 'Net Banking', icon: Landmark },
];

const PaymentDemo = ({ t }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedMethod, setSelectedMethod] = useState('upi');
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState('');
    const [paymentDone, setPaymentDone] = useState(false);

    const order = useMemo(() => {
        const state = location.state || {};
        return {
            requestId: state.requestId || '',
            title: state.title || 'Equipment Request',
            amount: Number(state.amount || 0),
            type: state.type || 'Rent',
            date: state.date || '',
        };
    }, [location.state]);

    const handleDemoPay = async () => {
        if (!order.requestId) {
            setMessage('Missing request details. Please pay from My Orders.');
            return;
        }

        const uid = localStorage.getItem('kd_uid');
        if (!uid) {
            navigate('/login');
            return;
        }

        setProcessing(true);
        setMessage('');

        setTimeout(async () => {
            const result = await updatePaymentStatus({
                requestId: order.requestId || order.id, // Support both if needed
                actorId: uid,
                paymentStatus: 'paid',
                listingId: order.listingId,
                orderType: order.type,
            });

            setProcessing(false);
            if (!result.ok) {
                setMessage(result.message || 'Failed to update payment');
                return;
            }
            setPaymentDone(true);
            setTimeout(() => {
                navigate('/my-orders');
            }, 2500);
        }, 1200);
    };

    return (
        <MobileLayout t={t}>
            <div className="pb-8">
                {paymentDone ? (
                    <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-in zoom-in duration-300">
                        <div className="bg-green-100 p-6 rounded-full mb-5 animate-bounce">
                            <CheckCircle2 size={56} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800">Payment Successful!</h2>
                        <p className="text-green-700 font-bold text-lg mt-2">✅ Order Completed</p>
                        <p className="text-gray-400 text-xs mt-3">Redirecting to My Orders...</p>
                    </div>
                ) : (
                <>
                <div className="flex items-center gap-3 mb-6 pt-2">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm border">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-black text-gray-800">Payment</h1>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                    <p className="text-[11px] text-gray-400 uppercase font-bold mb-2">Order Summary</p>
                    <p className="font-black text-gray-800">{order.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{order.type} {order.date ? `| ${order.date}` : ''}</p>
                    <div className="mt-3 flex items-center gap-2 text-green-700">
                        <IndianRupee size={16} />
                        <span className="text-2xl font-black">{order.amount}</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
                    <p className="text-[11px] text-gray-400 uppercase font-bold mb-3">Payment Method</p>
                    <div className="space-y-2">
                        {PAYMENT_METHODS.map((method) => {
                            const Icon = method.icon;
                            const active = selectedMethod === method.id;
                            return (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setSelectedMethod(method.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${active ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white'}`}
                                >
                                    <Icon size={18} className={active ? 'text-green-700' : 'text-gray-500'} />
                                    <span className={`font-bold text-sm ${active ? 'text-green-700' : 'text-gray-700'}`}>{method.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-xs text-yellow-800 mb-4">
                    Demo mode: no real payment will be charged.
                </div>

                {message && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                        <p className="text-red-800 font-bold text-sm">Error updating order:</p>
                        <p className="text-red-600 text-xs mt-1 font-mono">{message}</p>
                    </div>
                )}

                <button
                    onClick={handleDemoPay}
                    disabled={processing}
                    className="w-full bg-green-700 text-white py-4 rounded-2xl font-black disabled:opacity-60"
                >
                    {processing ? 'Processing...' : 'Pay Now (Demo)'}
                </button>
                </>
                )}
            </div>
        </MobileLayout>
    );
};

export default PaymentDemo;
