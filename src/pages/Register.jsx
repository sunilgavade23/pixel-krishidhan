import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { registerWithEmail } from '../services';

const Register = ({ t }) => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        city: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError(t('passwords_not_match') || 'Passwords do not match');
            return;
        }

        setLoading(true);
        const result = await registerWithEmail({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            phone: formData.phone,
            city: formData.city,
            photoURL: '',
            role: 'farmer',
        });
        setLoading(false);

        if (!result.ok) {
            setError(result.message || 'Registration failed');
            return;
        }

        setSuccessMsg(t('alert_success') || 'Registration Successful! Redirecting to Login...');
        setTimeout(() => {
            navigate('/login');
        }, 1200);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-6 py-10 font-sans">
            <div className="w-full max-w-sm">

                <div className="text-center mb-8">
                    <img
                        src="/logo.jpeg"
                        alt="KrishiDhan Logo"
                        className="w-32 mx-auto mb-4 object-contain"
                    />
                    <h2 className="text-2xl font-black text-gray-800">{t('register')}</h2>
                    <p className="text-gray-400 text-sm mt-1">Join the KrishiDhan marketplace</p>
                </div>

                {successMsg && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 text-xs rounded-2xl flex items-center gap-3 font-bold shadow-sm animate-in fade-in zoom-in-95 duration-200">
                        <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                        <span>{successMsg}</span>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-2xl flex items-center gap-3 font-bold shadow-sm animate-in fade-in zoom-in-95 duration-200">
                        <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleRegister}>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('full_name')}</label>
                        <input
                            type="text"
                            name="name"
                            className="w-full border-b py-2 outline-none focus:border-green-700 font-medium transition-colors"
                            placeholder="John Doe"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('email_address')}</label>
                        <input
                            type="email"
                            name="email"
                            className="w-full border-b py-2 outline-none focus:border-green-700 font-medium transition-colors"
                            placeholder="name@example.com"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('mobile_label') || t('phone_label') || 'Phone'}</label>
                        <input
                            type="tel"
                            name="phone"
                            className="w-full border-b py-2 outline-none focus:border-green-700 font-medium transition-colors"
                            placeholder="9876543210"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('city_village') || t('city_label') || 'City'}</label>
                        <input
                            type="text"
                            name="city"
                            className="w-full border-b py-2 outline-none focus:border-green-700 font-medium transition-colors"
                            placeholder="Kolhapur"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('password')}</label>
                        <input
                            type="password"
                            name="password"
                            className="w-full border-b py-2 outline-none focus:border-green-700 font-medium transition-colors"
                            placeholder="........"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t('confirm_password')}</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="w-full border-b py-2 outline-none focus:border-green-700 font-medium transition-colors"
                            placeholder="........"
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-700 text-white font-black py-4 rounded-xl mt-4 shadow-lg active:scale-95 transition-all disabled:opacity-60"
                    >
                        {loading ? (t('loading') || 'Loading...') : t('register').toUpperCase()}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500">
                    Already have an account? <Link to="/login" className="text-green-700 font-bold hover:underline ml-1">{t('login')}</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
