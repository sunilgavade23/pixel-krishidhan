import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, HelpCircle, LogOut, ChevronRight, Edit2, ShoppingBag, Phone, MapPin, PackageOpen } from 'lucide-react';
import MobileLayout from '../components/MobileLayout';
import { getListings, getUser, logout as logoutUser, updateUser, uploadImages } from '../services';

const Profile = ({ t, setLang, currentLang }) => {
    const navigate = useNavigate();

    const [user, setUser] = useState({
        uid: '',
        name: '',
        phone: '',
        city: '',
        photoURL: '',
        role: 'farmer',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [hasListings, setHasListings] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            const uid = localStorage.getItem('kd_uid');
            if (!uid) {
                navigate('/login');
                return;
            }
            const result = await getUser(uid);

            if (result.ok && result.data) {
                const profile = {
                    uid: result.data?.uid || uid,
                    name: result.data?.name || '',
                    phone: result.data?.phone || '',
                    city: result.data?.city || '',
                    photoURL: result.data?.photoURL || '',
                    role: result.data?.role || 'farmer',
                };
                setUser(profile);
                localStorage.setItem('kd_user', JSON.stringify(profile));

                const listingResult = await getListings({ ownerId: uid, limitCount: 1 });
                setHasListings(listingResult.ok && (listingResult.data || []).length > 0);
            } else {
                setMessage(result.message || 'Failed to load profile. Ensure user document exists in Firestore.');
            }
            setLoading(false);
        };

        loadProfile();
    }, [navigate]);

    const onChange = (key, value) => {
        setUser((prev) => ({ ...prev, [key]: value }));
        setMessage('');
    };

    const onPhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSaving(true);
        const upload = await uploadImages([file]);
        setSaving(false);

        if (!upload.ok) {
            setMessage(upload?.details?.message || upload.message || 'Photo upload failed');
            return;
        }

        onChange('photoURL', upload.data[0]);
    };

    const onSave = async () => {
        if (!user.name || !user.phone || !user.city) {
            setMessage('Name, phone and city are required');
            return;
        }

        setSaving(true);
        const result = await updateUser(user);
        setSaving(false);

        if (!result.ok) {
            setMessage(result.message || 'Failed to save profile');
            return;
        }

        localStorage.setItem('kd_user', JSON.stringify(result.data));
        setMessage('Profile updated successfully');
        setIsEditing(false);
    };

    const onLogout = async () => {
        await logoutUser();
        localStorage.removeItem('kd_uid');
        localStorage.removeItem('kd_user');
        navigate('/login');
    };

    return (
        <MobileLayout t={t}>
            <div className="pb-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center mb-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-20 bg-green-50 z-0"></div>

                    <div className="relative z-10">
                        <img
                            src={user.photoURL || 'https://placehold.co/150x150?text=User'}
                            alt="Profile"
                            className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover mb-3"
                        />
                        <label className="absolute bottom-2 right-0 bg-green-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm cursor-pointer">
                            <Edit2 size={12} />
                            <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
                        </label>
                    </div>

                    <div className="relative z-10 w-full">
                        {isEditing ? (
                            <div className="space-y-3">
                                <input
                                    value={user.name}
                                    onChange={(e) => onChange('name', e.target.value)}
                                    className="text-xl font-black text-gray-800 bg-transparent text-center w-full outline-none border-b border-gray-200 pb-1"
                                    placeholder="Name"
                                />
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 font-medium border-b border-gray-200 pb-1">
                                    <Phone size={14} />
                                    <input
                                        value={user.phone}
                                        onChange={(e) => onChange('phone', e.target.value)}
                                        className="bg-transparent text-center outline-none"
                                        placeholder="Phone"
                                    />
                                </div>
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 font-medium border-b border-gray-200 pb-1">
                                    <MapPin size={14} />
                                    <input
                                        value={user.city}
                                        onChange={(e) => onChange('city', e.target.value)}
                                        className="bg-transparent text-center outline-none"
                                        placeholder="City"
                                    />
                                </div>
                                <button
                                    onClick={onSave}
                                    disabled={saving || loading}
                                    className="w-full bg-green-700 text-white text-xs px-4 py-2 rounded-lg font-bold disabled:opacity-60 uppercase"
                                >
                                    {saving ? (t('loading') || 'Loading...') : (t('save_profile') || 'Save Profile')}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <h2 className="text-2xl font-black text-gray-800">{user.name || t('user_name') || 'User Name'}</h2>
                                <p className="text-gray-500 font-medium mt-1 flex items-center gap-1">
                                    <Phone size={14} /> {user.phone || '0000000000'}
                                </p>
                                <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center gap-1">
                                    <MapPin size={12} /> {user.city || 'Location'}
                                </div>
                                <button
                                    onClick={() => {
                                        setIsEditing(true);
                                        setMessage('');
                                    }}
                                    className="mt-3 flex items-center gap-1 text-green-700 text-xs font-black uppercase tracking-wider"
                                >
                                    <Edit2 size={12} /> {t('edit') || 'Edit'}
                                </button>
                            </div>
                        )}
                        {message && <p className="text-[10px] text-gray-500 mt-2">{message}</p>}
                    </div>
                </div>

                <div className="space-y-3 px-1">
                    {(hasListings || user.role === 'owner') && (
                        <button
                            onClick={() => navigate('/my-listings')}
                            className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between active:scale-98 transition-transform"
                        >
                            <div className="flex items-center gap-4">
                                <div className="bg-green-50 p-2.5 rounded-xl text-green-600">
                                    <PackageOpen size={20} />
                                </div>
                                <span className="font-bold text-gray-700">{t('my_listed_tools') || 'My Listings'}</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-300" />
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/my-orders')}
                        className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between active:scale-98 transition-transform"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                                <ShoppingBag size={20} />
                            </div>
                            <span className="font-bold text-gray-700">{t('orders')}</span>
                        </div>
                        <ChevronRight size={20} className="text-gray-300" />
                    </button>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-50 p-2.5 rounded-xl text-orange-600">
                                <Globe size={20} />
                            </div>
                            <span className="font-bold text-gray-700">{t('language')}</span>
                        </div>

                        <div className="flex gap-2 pl-12">
                            {['en', 'hi', 'mr', 'kn'].map((l) => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${currentLang === l ? 'bg-green-700 text-white border-green-700 shadow-md' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                                >
                                    {t(`lang_${l}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between active:scale-98 transition-transform">
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600">
                                <HelpCircle size={20} />
                            </div>
                            <span className="font-bold text-gray-700">{t('help')}</span>
                        </div>
                        <ChevronRight size={20} className="text-gray-300" />
                    </button>

                    <button
                        onClick={onLogout}
                        className="w-full bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 font-bold flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all"
                    >
                        <LogOut size={20} /> {t('logout')}
                    </button>

                    <p className="text-center text-[10px] text-gray-400 mt-6 pb-4">
                        KrishiDhan App v1.0.0
                    </p>
                </div>
            </div>
        </MobileLayout>
    );
};

export default Profile;
