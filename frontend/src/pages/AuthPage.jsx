import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import HotelLogo from '../components/HotelLogo';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Building, 
  MapPin, 
  Sparkles,
  KeyRound,
  AlertCircle
} from 'lucide-react';

export default function AuthPage({ initialRole }) {
  const { addToast } = useToast();
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const getRoleFromPath = () => {
    if (initialRole) return initialRole;
    const p = routerLocation.pathname.toLowerCase();
    if (p.includes('hotel')) return 'hotel';
    if (p.includes('admin')) return 'admin';
    return 'customer';
  };

  const [role, setRole] = useState(getRoleFromPath);

  // Authentication Mode: 'login' | 'register' | 'otp_verify' | 'register_success' | 'forgot_password'
  const queryParams = new URLSearchParams(routerLocation.search);
  const isSignupQuery = queryParams.get('mode') === 'signup' || queryParams.get('signup') === 'true';
  const [authMode, setAuthMode] = useState(isSignupQuery ? 'register' : 'login');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Login Form Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Customer Register Form Fields
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // OTP Verification State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const [otpTargetIdentifier, setOtpTargetIdentifier] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [debugOtpCode, setDebugOtpCode] = useState('');
  const timerRef = useRef(null);

  // Forgot Password State
  const [fpStep, setFpStep] = useState(1); // 1: enter identifier, 2: enter otp & new pwd, 3: success
  const [fpIdentifier, setFpIdentifier] = useState('');
  const [fpOtpDigits, setFpOtpDigits] = useState(['', '', '', '', '', '']);
  const fpOtpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [showFpPassword, setShowFpPassword] = useState(false);

  // Hotel registration specific state
  const [hotelStep, setHotelStep] = useState(1);
  const [hotelName, setHotelName] = useState('');
  const [hotelEmail, setHotelEmail] = useState('');
  const [hotelPassword, setHotelPassword] = useState('');
  const [hotelLocation, setHotelLocation] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [rooms, setRooms] = useState([{ room_type: 'Single', quantity: 10, price_per_night: 2000 }]);
  const [photos] = useState(['https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop']);

  // Success screen auto-redirect countdown
  const [successCountdown, setSuccessCountdown] = useState(3);

  // Synchronize on route changes
  useEffect(() => {
    const current = getRoleFromPath();
    setRole(current);
    const qp = new URLSearchParams(routerLocation.search);
    const wantsSignup = qp.get('mode') === 'signup' || qp.get('signup') === 'true';
    setAuthMode(wantsSignup ? 'register' : 'login');
    setError('');
    setHotelStep(1);
  }, [routerLocation.pathname, routerLocation.search, initialRole]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (authMode === 'otp_verify' || (authMode === 'forgot_password' && fpStep === 2)) {
      setCanResendOtp(false);
      setOtpTimer(60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [authMode, fpStep]);

  // Auto-redirect timer on successful registration
  useEffect(() => {
    let interval = null;
    if (authMode === 'register_success') {
      setSuccessCountdown(3);
      interval = setInterval(() => {
        setSuccessCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setAuthMode('login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authMode]);

  // Handle OTP 6-box input changes
  const handleOtpChange = (index, value, isFp = false) => {
    const cleanVal = value.replace(/[^0-9]/g, '').slice(-1);
    const currentDigits = isFp ? [...fpOtpDigits] : [...otpDigits];
    const refs = isFp ? fpOtpRefs : otpRefs;

    currentDigits[index] = cleanVal;
    if (isFp) setFpOtpDigits(currentDigits);
    else setOtpDigits(currentDigits);

    // Auto-focus next box if digit typed
    if (cleanVal && index < 5) {
      refs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e, isFp = false) => {
    const currentDigits = isFp ? fpOtpDigits : otpDigits;
    const refs = isFp ? fpOtpRefs : otpRefs;

    if (e.key === 'Backspace' && !currentDigits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e, isFp = false) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
      if (isFp) {
        setFpOtpDigits(newDigits);
        const nextIndex = Math.min(pastedData.length, 5);
        fpOtpRefs[nextIndex].current?.focus();
      } else {
        setOtpDigits(newDigits);
        const nextIndex = Math.min(pastedData.length, 5);
        otpRefs[nextIndex].current?.focus();
      }
    }
  };

  // Quick fill debug OTP helper
  const handleAutoFillOtp = (code, isFp = false) => {
    if (!code) return;
    const digits = code.slice(0, 6).split('');
    if (isFp) {
      setFpOtpDigits(digits);
      fpOtpRefs[5].current?.focus();
    } else {
      setOtpDigits(digits);
      otpRefs[5].current?.focus();
    }
  };

  // -------------------------------------------------------------
  // Customer Registration Flow Step 1: Validate Details & Send OTP
  // -------------------------------------------------------------
  const handleCustomerRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = regFullName.trim();
    const cleanEmail = regEmail.trim();
    const cleanPhone = regPhone.trim();

    if (!cleanName) {
      setError('Please enter your Full Name.');
      return;
    }
    if (cleanName.length < 2) {
      setError('Please enter a valid Full Name (at least 2 characters).');
      return;
    }

    if (!cleanEmail) {
      setError('Please enter your Email Address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!cleanPhone) {
      setError('Please enter your Mobile Number.');
      return;
    }
    const phoneDigits = cleanPhone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!regPassword) {
      setError('Please create a password.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!regConfirmPassword) {
      setError('Please confirm your password.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setIsLoading(true);
    try {
      // Dispatch OTP to user's email / mobile number
      const otpRes = await api.sendOtp({
        email: cleanEmail,
        phone: cleanPhone,
        identifier: cleanEmail,
        purpose: 'registration'
      });

      setOtpTargetIdentifier(cleanPhone ? `${cleanEmail} / ${cleanPhone}` : cleanEmail);
      if (otpRes.otp_debug) {
        setDebugOtpCode(otpRes.otp_debug);
      }
      addToast(`Verification code sent to ${cleanEmail} and ${cleanPhone}`, 'success');
      setOtpDigits(['', '', '', '', '', '']);
      setAuthMode('otp_verify');
      setTimeout(() => otpRefs[0].current?.focus(), 150);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Registration Flow Step 2: Verify OTP & Create Account / Start Onboarding
  // -------------------------------------------------------------
  const handleVerifyOtpAndCreateAccount = async (e) => {
    e.preventDefault();
    setError('');

    const fullOtp = otpDigits.join('').trim();
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify OTP
      await api.verifyOtp({
        email: regEmail.trim(),
        phone: regPhone.trim(),
        identifier: regEmail.trim(),
        otp: fullOtp,
        purpose: 'registration'
      });

      if (role === 'hotel') {
        // Hotel Partner Registration: Save credentials & route straight to Hotel Onboarding
        const partnerData = {
          name: regFullName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          password: regPassword,
          role: 'hotel'
        };
        sessionStorage.setItem('hotel_partner_signup', JSON.stringify(partnerData));
        
        // Initialize or update onboarding draft
        const draft = {
          manager_name: regFullName.trim(),
          manager_phone: regPhone.trim(),
          contact_number: regPhone.trim(),
          email: regEmail.trim(),
          password: regPassword
        };
        localStorage.setItem('hotel_onboarding_draft', JSON.stringify(draft));

        addToast('Hotel Partner account verified! Starting property onboarding...', 'success');
        navigate('/hotel/onboarding');
        return;
      }

      // 2. Customer: Create User Account
      await api.registerUser({
        full_name: regFullName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        role: 'customer'
      });

      // Pre-populate login identifier with the registered email
      setLoginIdentifier(regEmail.trim());
      addToast('Account created successfully!', 'success');
      setAuthMode('register_success');
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Registration OTP
  const handleResendOtp = async () => {
    if (!canResendOtp || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const otpRes = await api.sendOtp({
        email: regEmail.trim(),
        phone: regPhone.trim(),
        identifier: regEmail.trim(),
        purpose: 'registration'
      });
      if (otpRes.otp_debug) {
        setDebugOtpCode(otpRes.otp_debug);
      }
      addToast('A new 6-digit code has been sent!', 'info');
      setOtpDigits(['', '', '', '', '', '']);
      setCanResendOtp(false);
      setOtpTimer(60);
      otpRefs[0].current?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Login Flow: Email OR Mobile Number + Password -> Redirect
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const identifier = loginIdentifier.trim();
    if (!identifier) {
      setError('Please enter your Email Address or Mobile Number.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      let loggedUser;
      if (role === 'hotel') {
        const hotelData = await api.loginHotel(identifier, loginPassword);
        loggedUser = login(identifier, loginPassword, 'hotel', hotelData.user, hotelData.access_token);
        loggedUser.hotelId = hotelData.user.id.toString();
        loggedUser.name = hotelData.user.name;
        
        const hStatus = hotelData.user.status || 'PENDING';
        if (hStatus === 'APPROVED') {
          addToast(`Welcome back, ${loggedUser.name}!`, 'success');
          navigate('/hotel');
        } else if (hStatus === 'DRAFT') {
          addToast('Resuming your hotel onboarding draft...', 'info');
          navigate('/hotel/onboarding');
        } else {
          addToast(`Hotel Status: ${hStatus}`, 'info');
          navigate('/hotel/status', {
            state: {
              hotelId: hotelData.user.id,
              status: hStatus,
              hotelName: hotelData.user.name,
              rejection_reason: hotelData.user.rejection_reason
            }
          });
        }
      } else if (role === 'admin') {
        const adminData = await api.loginAdmin(identifier, loginPassword);
        loggedUser = login(identifier, loginPassword, 'admin', adminData.user, adminData.access_token);
        addToast('Admin authenticated successfully.', 'success');
        navigate('/admin');
      } else {
        // Customer login with Email or Mobile Number
        const userData = await api.loginUser(identifier, loginPassword);
        loggedUser = login(identifier, loginPassword, 'customer', userData.user, userData.access_token);
        addToast(`Welcome back, ${loggedUser.name || 'Traveler'}!`, 'success');
        // Redirect customer directly to User Dashboard
        navigate('/customer');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please check your Email/Mobile and Password.');
    } finally {
      setIsLoading(false);
    }
  };


  // -------------------------------------------------------------
  // Forgot Password Flow
  // -------------------------------------------------------------
  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setError('');
    const id = fpIdentifier.trim();
    if (!id) {
      setError('Please enter your registered Email or Mobile Number.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.sendOtp({
        identifier: id,
        email: id.includes('@') ? id : undefined,
        phone: !id.includes('@') ? id : undefined,
        purpose: 'forgot_password'
      });
      if (res.otp_debug) {
        setDebugOtpCode(res.otp_debug);
      }
      addToast('Reset OTP sent to your registered address.', 'success');
      setFpStep(2);
      setTimeout(() => fpOtpRefs[0].current?.focus(), 150);
    } catch (err) {
      setError(err.message || 'Could not send reset code. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    const fullOtp = fpOtpDigits.join('').trim();
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    if (!fpNewPassword || fpNewPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword({
        identifier: fpIdentifier.trim(),
        otp: fullOtp,
        new_password: fpNewPassword
      });
      addToast('Password reset successfully! Please sign in.', 'success');
      setLoginIdentifier(fpIdentifier.trim());
      setLoginPassword('');
      setAuthMode('login');
      setFpStep(1);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please verify your OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Hotel Multi-step Registration
  const handleHotelRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (hotelStep === 1) {
      if (!hotelName.trim() || !hotelEmail.trim() || !hotelPassword || !hotelLocation.trim() || !hotelAddress.trim()) {
        setError('Please fill in all basic property details.');
        return;
      }
      setHotelStep(2);
      return;
    }

    setIsLoading(true);
    try {
      await api.registerHotel({
        name: hotelName.trim(),
        location: hotelLocation.trim(),
        address: hotelAddress.trim(),
        email: hotelEmail.trim(),
        password: hotelPassword,
        photos,
        rooms
      });
      addToast('Hotel registered successfully! Awaiting approval.', 'success');
      setAuthMode('login');
      setHotelStep(1);
    } catch (err) {
      setError(err.message || 'Failed to register hotel.');
    } finally {
      setIsLoading(false);
    }
  };

  // Banner Content based on Role & Auth Mode
  const bannerImage = role === 'hotel'
    ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop'
    : role === 'admin'
    ? 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1400&auto=format&fit=crop'
    : authMode === 'login'
    ? 'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop'
    : 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop';

  return (
    <div className={`auth-layout ${role}`}>
      <div className="auth-overlay" />

      {/* 2-Column Split Authentication Card */}
      <div className="auth-split-card">
        {/* Left Photo Column */}
        <div 
          className="auth-split-banner"
          style={{ backgroundImage: `url(${bannerImage})` }}
        >
          {/* Top Banner Text */}
          <div className="auth-banner-top">
            {role === 'customer' ? (
              authMode === 'login' ? (
                <>
                  <h2 className="auth-banner-heading">Good to<br />See You Again</h2>
                  <p className="auth-banner-sub">Continue your stay journey with HostIQ</p>
                </>
              ) : authMode === 'otp_verify' ? (
                <>
                  <h2 className="auth-banner-heading">Security<br />Verification</h2>
                  <p className="auth-banner-sub">Protecting your bookings & traveler profile</p>
                </>
              ) : authMode === 'register_success' ? (
                <>
                  <h2 className="auth-banner-heading">You're All<br />Set!</h2>
                  <p className="auth-banner-sub">Unlock exclusive hotel bids and savings</p>
                </>
              ) : (
                <>
                  <h2 className="auth-banner-heading">Join HostIQ</h2>
                  <p className="auth-banner-sub">Smarter hotel bookings with live negotiation</p>
                </>
              )
            ) : role === 'hotel' ? (
              <>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(16, 185, 129, 0.22)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  color: '#34D399',
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 14,
                  backdropFilter: 'blur(8px)'
                }}>
                  🏨 Verified Partner Network
                </div>
                <h2 className="auth-banner-heading">Direct Bookings.<br />Zero Commission.</h2>
                <p className="auth-banner-sub">Connect directly with travelers seeking stays in your city and negotiate live rates.</p>
              </>
            ) : (
              <>
                <h2 className="auth-banner-heading">Administrator<br />Command</h2>
                <p className="auth-banner-sub">Platform governance, verification & intelligence</p>
              </>
            )}
          </div>

          {/* Bottom Banner Feature Highlights */}
          <div className="auth-banner-bottom">
            {role === 'customer' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.86rem', color: 'rgba(255,255,255,0.95)' }}>
                  <ShieldCheck size={18} color="#EA580C" />
                  <span>Instant verified registration</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.86rem', color: 'rgba(255,255,255,0.95)' }}>
                  <Sparkles size={18} color="#EA580C" />
                  <span>Direct price bidding with hotels</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.86rem', color: 'rgba(255,255,255,0.95)' }}>
                  <CheckCircle2 size={18} color="#EA580C" />
                  <span>Zero spam, 100% verified properties</span>
                </div>
              </div>
            ) : role === 'hotel' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.86rem', color: 'rgba(255,255,255,0.95)' }}>
                  <CheckCircle2 size={18} color="#10B981" />
                  <span><strong>Direct Guest Leads</strong> (0% commission cuts)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.86rem', color: 'rgba(255,255,255,0.95)' }}>
                  <Sparkles size={18} color="#10B981" />
                  <span><strong>Dynamic Price Bidding</strong> with live travelers</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.86rem', color: 'rgba(255,255,255,0.95)' }}>
                  <Building size={18} color="#10B981" />
                  <span><strong>Room Calendar & Availability</strong> Sync</span>
                </div>
                <div style={{
                  marginTop: 8,
                  paddingTop: 10,
                  borderTop: '1px solid rgba(255,255,255,0.15)',
                  fontSize: '0.76rem',
                  color: 'rgba(255,255,255,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span>⭐ 4.9/5 Partner Satisfaction</span>
                  <span>•</span>
                  <span>⚡ Instant Lead Alerts</span>
                </div>
              </div>
            ) : (
              <div className="auth-banner-quote">
                Empowering India's finest hospitality networks with live traveler demand.
              </div>
            )}
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="auth-split-panel">
          {/* Header with Brand Logo, Title & Subtitle */}
          <div className="auth-form-header">
            <HotelLogo size="default" />

            {role === 'customer' && authMode === 'login' && (
              <>
                <h1 className="auth-form-title">Customer Sign In</h1>
                <p className="auth-form-subtitle">Enter your email or mobile number to access your dashboard</p>
              </>
            )}

            {role === 'customer' && authMode === 'register' && (
              <>
                <h1 className="auth-form-title">Create an Account</h1>
                <p className="auth-form-subtitle">Register to discover verified hotels and negotiate live rates</p>
              </>
            )}

            {role === 'customer' && authMode === 'otp_verify' && (
              <>
                <h1 className="auth-form-title">Verify OTP</h1>
                <p className="auth-form-subtitle">
                  Enter the 6-digit verification code sent to <br />
                  <strong style={{ color: '#0F172A' }}>{otpTargetIdentifier}</strong>
                </p>
              </>
            )}

            {role === 'customer' && authMode === 'register_success' && (
              <>
                <h1 className="auth-form-title" style={{ color: '#16A34A' }}>Registration Complete!</h1>
                <p className="auth-form-subtitle">Your account is ready. Redirecting to Sign In...</p>
              </>
            )}

            {role === 'customer' && authMode === 'forgot_password' && (
              <>
                <h1 className="auth-form-title">Reset Password</h1>
                <p className="auth-form-subtitle">
                  {fpStep === 1 ? 'Enter your registered email or mobile to get a reset code' : 'Enter OTP code and your new password'}
                </p>
              </>
            )}

            {role === 'hotel' && (
              <>
                <h1 className="auth-form-title">{authMode === 'login' ? 'Hotel Partner Sign In' : 'Register Your Hotel'}</h1>
                <p className="auth-form-subtitle">
                  {authMode === 'login' ? 'Access your verified leads and room inventory dashboard' : 'List your hotel to start receiving direct traveler requests'}
                </p>
              </>
            )}

            {role === 'admin' && (
              <>
                <h1 className="auth-form-title">Administrator Portal</h1>
                <p className="auth-form-subtitle">Sign in to manage platform users, hotels, and transactions</p>
              </>
            )}
          </div>

          {/* Hotel Demo Auto-fill Helper */}
          {role === 'hotel' && authMode === 'login' && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <button
                type="button"
                className="hotel-demo-chip"
                onClick={() => {
                  setLoginIdentifier('cognitbotz@hotel.com');
                  setLoginPassword('password123');
                  setError('');
                }}
              >
                <span>⚡</span>
                <span>Demo Fill: <strong>cognitbotz@hotel.com</strong></span>
              </button>
            </div>
          )}

          {/* Error Message Alert */}
          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#B91C1C',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: '0.82rem',
              marginBottom: 16,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. LOGIN VIEW (Customer, Hotel Partner, Admin)            */}
          {/* ========================================================= */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              {/* Email / Mobile Number Input */}
              <div className="auth-input-group">
                <label className="auth-input-label">
                  {role === 'admin' ? 'Admin Email' : 'Email Address or Mobile Number'}
                </label>
                <div className="auth-input-wrap">
                  <div className="auth-input-icon">
                    <User size={18} />
                  </div>
                  <input 
                    type="text"
                    className="auth-input-field"
                    placeholder={role === 'hotel' ? 'manager@hotel.com or 9876543210' : role === 'admin' ? 'admin@gmail.com' : 'you@example.com or 9876543210'}
                    value={loginIdentifier}
                    onChange={(e) => { setLoginIdentifier(e.target.value); setError(''); }}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="auth-input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label className="auth-input-label" style={{ margin: 0 }}>Password</label>
                  {role !== 'admin' && (
                    <button 
                      type="button" 
                      className="auth-forgot-link"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => {
                        setFpIdentifier(loginIdentifier);
                        setFpStep(1);
                        setAuthMode('forgot_password');
                        setError('');
                      }}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="auth-input-wrap">
                  <div className="auth-input-icon">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showLoginPassword ? 'text' : 'password'}
                    className="auth-input-field"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setError(''); }}
                    autoComplete="current-password"
                    required
                  />
                  <button 
                    type="button" 
                    className="auth-toggle-pwd"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button 
                type="submit" 
                className="auth-submit-btn" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : role === 'hotel' ? 'Sign In to Partner Portal →' : role === 'admin' ? 'Sign In to Admin Command' : 'Sign In to Dashboard'}
              </button>

              {/* Hotel Onboarding Promo Callout */}
              {role === 'hotel' && (
                <div className="hotel-onboard-promo">
                  <div>
                    <div className="hotel-onboard-promo-title">🏢 New Hotelier?</div>
                    <div className="hotel-onboard-promo-sub">List your property & receive direct guest leads</div>
                  </div>
                  <button
                    type="button"
                    className="hotel-onboard-promo-btn"
                    onClick={() => navigate('/hotel/onboarding')}
                  >
                    Register Hotel 🚀
                  </button>
                </div>
              )}
            </form>
          )}

          {/* ========================================================= */}
          {/* 2. REGISTRATION VIEW (Customer & Hotel Partner)           */}
          {/* ========================================================= */}
          {authMode === 'register' && role !== 'admin' && (
            <form onSubmit={handleCustomerRegisterSubmit}>
              {/* Full Name / Manager Name */}
              <div className="auth-input-group">
                <label className="auth-input-label">
                  {role === 'hotel' ? 'Manager / Partner Full Name' : 'Full Name'}
                </label>
                <div className="auth-input-wrap">
                  <div className="auth-input-icon">
                    <User size={18} />
                  </div>
                  <input 
                    type="text"
                    className="auth-input-field"
                    placeholder={role === 'hotel' ? 'Enter hotel owner/manager name' : 'Enter your full name'}
                    value={regFullName}
                    onChange={(e) => { setRegFullName(e.target.value); setError(''); }}
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="auth-input-group">
                <label className="auth-input-label">Email Address</label>
                <div className="auth-input-wrap">
                  <div className="auth-input-icon">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email"
                    className="auth-input-field"
                    placeholder={role === 'hotel' ? 'manager@hotel.com' : 'name@example.com'}
                    value={regEmail}
                    onChange={(e) => { setRegEmail(e.target.value); setError(''); }}
                    required
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="auth-input-group">
                <label className="auth-input-label">Mobile Number</label>
                <div className="auth-input-wrap">
                  <div className="auth-input-icon">
                    <Phone size={18} />
                  </div>
                  <input 
                    type="tel"
                    className="auth-input-field"
                    placeholder="10-digit mobile number (e.g. 9876543210)"
                    value={regPhone}
                    onChange={(e) => { setRegPhone(e.target.value); setError(''); }}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-input-group">
                <label className="auth-input-label">Password</label>
                <div className="auth-input-wrap">
                  <div className="auth-input-icon">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showRegPassword ? 'text' : 'password'}
                    className="auth-input-field"
                    placeholder="Create a secure password (min. 6 characters)"
                    value={regPassword}
                    onChange={(e) => { setRegPassword(e.target.value); setError(''); }}
                    required
                  />
                  <button 
                    type="button" 
                    className="auth-toggle-pwd"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    title={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="auth-input-group">
                <label className="auth-input-label">Confirm Password</label>
                <div className="auth-input-wrap">
                  <div className="auth-input-icon">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    className="auth-input-field"
                    placeholder="Re-enter password to confirm"
                    value={regConfirmPassword}
                    onChange={(e) => { setRegConfirmPassword(e.target.value); setError(''); }}
                    required
                  />
                  <button 
                    type="button" 
                    className="auth-toggle-pwd"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    title={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Terms and conditions */}
              <label className="auth-terms-checkbox" style={{ marginTop: 6, marginBottom: 16 }}>
                <input 
                  type="checkbox" 
                  checked={agreeTerms} 
                  onChange={(e) => setAgreeTerms(e.target.checked)} 
                />
                <span>
                  I agree to the <a href="#terms" onClick={(e) => e.preventDefault()}>Terms & Conditions</a> and <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
                </span>
              </label>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="auth-submit-btn" 
                disabled={isLoading}
              >
                {isLoading ? 'Sending Verification Code...' : role === 'hotel' ? 'Verify OTP & Start Onboarding' : 'Send OTP & Continue'}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* 3. OTP VERIFICATION VIEW (Customer & Hotel Partner)        */}
          {/* ========================================================= */}
          {authMode === 'otp_verify' && (
            <form onSubmit={handleVerifyOtpAndCreateAccount}>
              {/* Back / Edit Details Link */}
              <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 0
                  }}
                >
                  <ArrowLeft size={15} /> Back to details
                </button>

                <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                  {role === 'hotel' ? 'Step 1: Account Verification' : 'Step 2 of 2'}
                </span>
              </div>

              {/* Demo Helper Pill */}
              {debugOtpCode && (
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                  color: '#166534'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <KeyRound size={16} />
                    <span>Demo OTP: <strong>{debugOtpCode}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoFillOtp(debugOtpCode, false)}
                    style={{
                      background: '#16A34A',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {/* 6 Digit Input Boxes */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                margin: '20px 0 24px'
              }}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value, false)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e, false)}
                    onPaste={(e) => handleOtpPaste(e, false)}
                    style={{
                      width: 46,
                      height: 52,
                      textAlign: 'center',
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      borderRadius: 12,
                      border: digit ? '2px solid #EA580C' : '1.5px solid #CBD5E1',
                      background: digit ? '#FFF' : '#F8FAFC',
                      color: '#0F172A',
                      outline: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  />
                ))}
              </div>

              {/* Resend OTP Timer & Button */}
              <div style={{
                textAlign: 'center',
                fontSize: '0.84rem',
                color: '#64748B',
                marginBottom: 20
              }}>
                {canResendOtp ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EA580C',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <RotateCcw size={14} /> Resend OTP Code
                  </button>
                ) : (
                  <span>Resend code in <strong style={{ color: '#0F172A' }}>{otpTimer}s</strong></span>
                )}
              </div>

              {/* Verify & Create Account Button */}
              <button 
                type="submit" 
                className="auth-submit-btn" 
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : role === 'hotel' ? 'Verify OTP & Launch Onboarding Wizard' : 'Verify OTP & Create Account'}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* 4. REGISTRATION SUCCESS VIEW (Customer)                   */}
          {/* ========================================================= */}
          {role === 'customer' && authMode === 'register_success' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px rgba(22, 163, 74, 0.2)'
              }}>
                <CheckCircle2 size={40} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
                Account Verified & Created!
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: 1.5, marginBottom: 20 }}>
                Welcome to HostIQ, <strong>{regFullName}</strong>. Your mobile and email have been verified. You can now sign in and explore hotel deals.
              </p>

              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => setAuthMode('login')}
              >
                Proceed to Sign In ({successCountdown}s)
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. FORGOT PASSWORD VIEW                                   */}
          {/* ========================================================= */}
          {authMode === 'forgot_password' && (
            <div>
              {fpStep === 1 ? (
                <form onSubmit={handleForgotPasswordRequest}>
                  <div className="auth-input-group">
                    <label className="auth-input-label">Registered Email or Mobile</label>
                    <div className="auth-input-wrap">
                      <div className="auth-input-icon"><User size={18} /></div>
                      <input 
                        type="text" 
                        className="auth-input-field" 
                        placeholder="Enter email or 10-digit mobile" 
                        value={fpIdentifier} 
                        onChange={(e) => { setFpIdentifier(e.target.value); setError(''); }}
                        required 
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                    {isLoading ? 'Sending OTP...' : 'Send Password Reset Code'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      ← Back to Login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotPasswordReset}>
                  {debugOtpCode && (
                    <div style={{
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: 10,
                      padding: '8px 12px',
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                      color: '#166534'
                    }}>
                      <span>Demo Reset OTP: <strong>{debugOtpCode}</strong></span>
                      <button
                        type="button"
                        onClick={() => handleAutoFillOtp(debugOtpCode, true)}
                        style={{ background: '#16A34A', color: '#FFF', border: 'none', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  {/* 6 Digit Input Boxes */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '14px 0 16px' }}>
                    {fpOtpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={fpOtpRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value, true)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e, true)}
                        onPaste={(e) => handleOtpPaste(e, true)}
                        style={{
                          width: 44,
                          height: 48,
                          textAlign: 'center',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          borderRadius: 10,
                          border: digit ? '2px solid #EA580C' : '1.5px solid #CBD5E1',
                          background: digit ? '#FFF' : '#F8FAFC',
                          color: '#0F172A',
                          outline: 'none'
                        }}
                      />
                    ))}
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-input-label">New Password</label>
                    <div className="auth-input-wrap">
                      <div className="auth-input-icon"><Lock size={18} /></div>
                      <input 
                        type={showFpPassword ? 'text' : 'password'}
                        className="auth-input-field" 
                        placeholder="Create new password (min. 6 chars)" 
                        value={fpNewPassword} 
                        onChange={(e) => { setFpNewPassword(e.target.value); setError(''); }}
                        required 
                      />
                      <button 
                        type="button" 
                        className="auth-toggle-pwd" 
                        onClick={() => setShowFpPassword(!showFpPassword)}
                      >
                        {showFpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-input-label">Confirm New Password</label>
                    <div className="auth-input-wrap">
                      <div className="auth-input-icon"><Lock size={18} /></div>
                      <input 
                        type={showFpPassword ? 'text' : 'password'}
                        className="auth-input-field" 
                        placeholder="Re-enter new password" 
                        value={fpConfirmPassword} 
                        onChange={(e) => { setFpConfirmPassword(e.target.value); setError(''); }}
                        required 
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                    {isLoading ? 'Resetting Password...' : 'Save New Password & Log In'}
                  </button>
                </form>
              )}
            </div>
          )}


          {/* ========================================================= */}
          {/* Bottom Switcher: Sign In <-> Sign Up                      */}
          {/* ========================================================= */}
          {role !== 'admin' && authMode !== 'register_success' && (
            <div className="auth-footer-switch" style={{ marginTop: 18 }}>
              <span>
                {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
              </span>
              <button 
                type="button" 
                className="auth-footer-switch-btn"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setError('');
                  setHotelStep(1);
                  setFpStep(1);
                }}
              >
                {authMode === 'login' ? 'Register / Sign Up' : 'Sign In'}
              </button>
            </div>
          )}

          {/* Portal Switcher (Hotel Partner vs Customer) */}
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #F1F5F9', textAlign: 'center', fontSize: '0.78rem', color: '#94A3B8' }}>
            {role === 'customer' ? (
              <span>Are you a hotel partner? <a href="/hotel_login" onClick={(e) => { e.preventDefault(); navigate('/hotel_login'); }} style={{ color: '#EA580C', fontWeight: 700, textDecoration: 'none' }}>Hotel Partner Login →</a></span>
            ) : (
              <span>Looking to book a stay? <a href="/customer_login" onClick={(e) => { e.preventDefault(); navigate('/customer_login'); }} style={{ color: '#EA580C', fontWeight: 700, textDecoration: 'none' }}>← Customer / Traveler Login</a></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
