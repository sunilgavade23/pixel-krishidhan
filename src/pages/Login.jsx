import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Phone, ArrowLeft, RefreshCw } from 'lucide-react';
import { loginWithEmail, signInWithGoogle, handleGoogleRedirectResult, sendOtp, verifyOtp } from '../services';

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
);

const Login = ({ t }) => {
    const navigate = useNavigate();
    // Login mode: 'email' or 'phone'
    const [loginMode, setLoginMode] = useState('email');

    // Email state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Phone state
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [resendTimer, setResendTimer] = useState(0);
    const otpInputRefs = useRef([]);

    // Common state
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Handle Google redirect result on page load
    useEffect(() => {
        const checkRedirect = async () => {
            const result = await handleGoogleRedirectResult();
            if (result && result.uid) {
                localStorage.setItem('kd_uid', result.uid);
                localStorage.setItem('kd_user', JSON.stringify(result.profile || {}));
                setSuccessMsg('Google Sign-In Successful! Welcome...');
                setTimeout(() => navigate('/home'), 800);
            }
        };
        checkRedirect();
    }, [navigate]);

    // Resend timer countdown
    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => {
            setResendTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleLogin = async () => {
        setError('');
        setSuccessMsg('');
        setLoading(true);

        const result = await loginWithEmail({ email, password });
        setLoading(false);

        if (!result.ok) {
            setError(result.message || 'Login failed');
            return;
        }

        localStorage.setItem('kd_uid', result.data.uid);
        localStorage.setItem('kd_user', JSON.stringify(result.data.profile || {}));
        setSuccessMsg(t('login_success') || 'Login Successful! Welcome to KrishiDhan...');
        
        setTimeout(() => {
            navigate('/home');
        }, 800);
    };

    const handleGoogleLogin = async () => {
        setError('');
        setSuccessMsg('');
        setGoogleLoading(true);

        const result = await signInWithGoogle();
        setGoogleLoading(false);

        if (!result.ok) {
            setError(result.message || 'Google sign-in failed');
            return;
        }

        if (result.data?.redirecting) {
            setSuccessMsg('Redirecting to Google Sign-In...');
            return;
        }

        localStorage.setItem('kd_uid', result.data.uid);
        localStorage.setItem('kd_user', JSON.stringify(result.data.profile || {}));

        if (result.data.isNewUser) {
            setSuccessMsg('Account created! Welcome to KrishiDhan...');
        } else {
            setSuccessMsg('Welcome back! Signing you in...');
        }

        setTimeout(() => {
            navigate('/home');
        }, 800);
    };

    const handleSendOtp = async () => {
        setError('');
        setSuccessMsg('');
        setLoading(true);

        const result = await sendOtp(phoneNumber);
        setLoading(false);

        if (!result.ok) {
            setError(result.message || 'Failed to send OTP');
            return;
        }

        setOtpSent(true);
        setResendTimer(60);
        setSuccessMsg(`OTP sent to +91 ${phoneNumber.replace(/^\+?91/, '')}`);

        // Focus first OTP input
        setTimeout(() => {
            otpInputRefs.current[0]?.focus();
        }, 100);
    };

    const handleOtpChange = (index, value) => {
        // Only allow single digit
        const digit = value.replace(/\D/g, '').slice(-1);
        const newOtp = [...otpCode];
        newOtp[index] = digit;
        setOtpCode(newOtp);

        // Auto-focus next input
        if (digit && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            const newOtp = pasted.split('');
            setOtpCode(newOtp);
            otpInputRefs.current[5]?.focus();
            e.preventDefault();
        }
    };

    const handleVerifyOtp = async () => {
        setError('');
        setSuccessMsg('');
        const code = otpCode.join('');

        if (code.length < 6) {
            setError('Please enter the complete 6-digit OTP.');
            return;
        }

        setLoading(true);
        const result = await verifyOtp(code);
        setLoading(false);

        if (!result.ok) {
            setError(result.message || 'OTP verification failed');
            return;
        }

        localStorage.setItem('kd_uid', result.data.uid);
        localStorage.setItem('kd_user', JSON.stringify(result.data.profile || {}));

        if (result.data.isNewUser) {
            setSuccessMsg('Account created! Welcome to KrishiDhan...');
        } else {
            setSuccessMsg('Welcome back! Signing you in...');
        }

        setTimeout(() => {
            navigate('/home');
        }, 800);
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setOtpCode(['', '', '', '', '', '']);
        await handleSendOtp();
    };

    const resetPhoneFlow = () => {
        setOtpSent(false);
        setOtpCode(['', '', '', '', '', '']);
        setResendTimer(0);
        setError('');
        setSuccessMsg('');
    };

    const switchMode = (mode) => {
        setLoginMode(mode);
        setError('');
        setSuccessMsg('');
        resetPhoneFlow();
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
            <img
                src="/logo.jpeg"
                alt="KrishiDhan Logo"
                className="w-48 mb-8 object-contain mx-auto"
            />

            <div className="w-full max-w-sm">
                <div className="flex border-b mb-8">
                    <button className="flex-1 pb-2 border-b-2 border-green-700 font-bold text-green-700">{t('login')}</button>
                    <Link to="/register" className="flex-1 pb-2 text-gray-400 text-center font-medium">{t('register')}</Link>
                </div>

                {/* Login method tabs */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                    <button
                        onClick={() => switchMode('email')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${loginMode === 'email' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
                    >
                        ✉️ Email
                    </button>
                    <button
                        onClick={() => switchMode('phone')}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${loginMode === 'phone' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}
                    >
                        📱 Phone OTP
                    </button>
                </div>

                <div className="space-y-5">
                    {successMsg && (
                        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs rounded-2xl flex items-center gap-3 font-bold shadow-sm animate-in fade-in zoom-in-95 duration-200">
                            <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-2xl flex items-center gap-3 font-bold shadow-sm animate-in fade-in zoom-in-95 duration-200">
                            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ===== EMAIL LOGIN ===== */}
                    {loginMode === 'email' && (
                        <>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase ml-1">{t('email_address')}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="contact@gmail.com"
                                    className="w-full border-b py-3 outline-none focus:border-green-700 transition-colors font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase ml-1">{t('password')}</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="........"
                                        className="w-full border-b py-3 pr-10 outline-none focus:border-green-700 transition-colors font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-700"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleLogin}
                                disabled={loading || googleLoading}
                                className="w-full bg-green-700 text-white py-4 rounded-xl font-black shadow-lg hover:bg-green-800 active:scale-95 transition-all disabled:opacity-60"
                            >
                                {loading ? (t('loading') || 'Loading...') : t('login').toUpperCase()}
                            </button>
                        </>
                    )}

                    {/* ===== PHONE LOGIN ===== */}
                    {loginMode === 'phone' && !otpSent && (
                        <>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase ml-1">
                                    {t('mobile_label') || 'Mobile Number'}
                                </label>
                                <div className="flex items-center border-b py-3 gap-2">
                                    <span className="text-sm font-bold text-gray-600 flex-shrink-0">🇮🇳 +91</span>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="9876543210"
                                        maxLength={10}
                                        className="flex-1 outline-none font-medium text-gray-800 tracking-wider"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1.5 ml-1">
                                    We'll send a 6-digit OTP to verify your number
                                </p>
                            </div>

                            <button
                                onClick={handleSendOtp}
                                disabled={loading || phoneNumber.length < 10}
                                className="w-full bg-green-700 text-white py-4 rounded-xl font-black shadow-lg hover:bg-green-800 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Sending OTP...</span>
                                    </>
                                ) : (
                                    <>
                                        <Phone size={18} />
                                        <span>SEND OTP</span>
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {/* ===== OTP VERIFICATION ===== */}
                    {loginMode === 'phone' && otpSent && (
                        <>
                            <div>
                                <button
                                    onClick={resetPhoneFlow}
                                    className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-4 hover:text-green-700 transition-colors"
                                >
                                    <ArrowLeft size={14} />
                                    Change number
                                </button>

                                <label className="text-xs font-bold text-gray-400 uppercase ml-1">
                                    Enter 6-digit OTP
                                </label>
                                <p className="text-[10px] text-gray-500 mt-0.5 ml-1 mb-3">
                                    Sent to +91 {phoneNumber}
                                </p>

                                {/* OTP Input Boxes */}
                                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                                    {otpCode.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => (otpInputRefs.current[index] = el)}
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className="w-11 h-13 text-center text-xl font-black border-2 border-gray-200 rounded-xl outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all"
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleVerifyOtp}
                                disabled={loading || otpCode.join('').length < 6}
                                className="w-full bg-green-700 text-white py-4 rounded-xl font-black shadow-lg hover:bg-green-800 active:scale-95 transition-all disabled:opacity-60"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Verifying...
                                    </span>
                                ) : (
                                    'VERIFY OTP'
                                )}
                            </button>

                            {/* Resend OTP */}
                            <div className="text-center">
                                {resendTimer > 0 ? (
                                    <p className="text-xs text-gray-400">
                                        Resend OTP in <span className="font-bold text-green-700">{resendTimer}s</span>
                                    </p>
                                ) : (
                                    <button
                                        onClick={handleResendOtp}
                                        disabled={loading}
                                        className="text-xs font-bold text-green-700 flex items-center gap-1 mx-auto hover:underline disabled:opacity-50"
                                    >
                                        <RefreshCw size={12} />
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {/* ===== DIVIDER ===== */}
                    <div className="relative flex py-1 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink mx-4 text-gray-400 text-sm">Or</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    {/* ===== GOOGLE LOGIN ===== */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={googleLoading || loading}
                        className="w-full border-2 border-gray-200 py-3.5 rounded-xl flex items-center justify-center gap-3 font-bold text-gray-700 bg-white hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
                    >
                        {googleLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin" />
                                <span>Signing in...</span>
                            </>
                        ) : (
                            <>
                                <GoogleIcon />
                                <span>Continue with Google</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
