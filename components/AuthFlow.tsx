import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  updateProfile
} from 'firebase/auth';
import { FirebaseService } from '../services/db';

interface AuthFlowProps {
  onAuthenticated: (user: User) => void;
}

type AuthStep = 'welcome' | 'signup' | 'login' | 'verify-otp' | 'forgot-password';

const AuthFlow: React.FC<AuthFlowProps> = ({ onAuthenticated }) => {
  const [step, setStep] = useState<AuthStep>('welcome');
  const [role, setRole] = useState<UserRole>(UserRole.TENANT);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Sign up form data
  const [signupData, setSignupData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Login form data
  const [loginData, setLoginData] = useState({
    identifier: '', // Phone or Email
    password: ''
  });

  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) return (window as any).recaptchaVerifier;
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': () => { }
    });
    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { fullName, phone, email, password, confirmPassword } = signupData;

    if (!fullName || !phone || !email || !password || !confirmPassword) {
      alert('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: fullName });

      const newUser: User = {
        id: firebaseUser.uid,
        name: fullName,
        phone: phone.startsWith('+') ? phone : `+254${phone.replace(/^0+/, '')}`,
        email: email,
        role: role,
        unlockedListings: [],
        isEncrypted: true
      };

      await FirebaseService.saveUserProfile(newUser);
      onAuthenticated(newUser);
    } catch (error: any) {
      alert(error.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { identifier, password } = loginData;
    if (!identifier || !password) {
      alert('Please enter your credentials');
      return;
    }

    setIsLoading(true);
    try {
      // Check if identifier is email or phone
      if (identifier.includes('@')) {
        const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
        const profile = await FirebaseService.getUserById(userCredential.user.uid);
        if (profile) onAuthenticated(profile);
        else throw new Error("Profile not found");
      } else {
        // Prepare for Phone Login if no password provided (or handle as phone+password if your system supports it)
        // For now, we assume if it's not email, it's a phone number for OTP
        await handleSendOtp();
      }
    } catch (error: any) {
      alert(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const phoneNum = loginData.identifier.startsWith('+') ? loginData.identifier : `+254${loginData.identifier.replace(/^0+/, '')}`;
    setIsLoading(true);
    try {
      const verifier = setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, phoneNum, verifier);
      setConfirmationResult(result);
      setStep('verify-otp');
    } catch (error: any) {
      alert(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || !verificationCode) return;

    setIsLoading(true);
    try {
      const userCredential = await confirmationResult.confirm(verificationCode);
      const firebaseUser = userCredential.user;

      let profile = await FirebaseService.getUserById(firebaseUser.uid);
      if (!profile) {
        // If first time login via phone, create a basic profile
        profile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Guest User',
          phone: firebaseUser.phoneNumber || loginData.identifier,
          email: firebaseUser.email || '',
          role: role,
          unlockedListings: [],
          isEncrypted: true
        };
        await FirebaseService.saveUserProfile(profile);
      }
      onAuthenticated(profile);
    } catch (error: any) {
      alert(error.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Reset link functionality coming soon via Firebase!');
    setStep('login');
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-4xl mb-6 shadow-xl relative">
          <i className="fas fa-house-chimney"></i>
          <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-[10px]">
            <i className="fas fa-shield-alt"></i>
          </div>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Kimana Space</h1>
        <p className="text-slate-500 mb-8 max-w-xs text-sm font-medium">Connecting landlords and tenants with <span className="text-blue-600 font-bold">Secure Marketplace</span> technology.</p>

        <div className="space-y-4 w-full max-w-xs">
          <button
            onClick={() => { setRole(UserRole.TENANT); setStep('signup'); }}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
          >
            <i className="fas fa-user"></i> Join as Tenant
          </button>
          <button
            onClick={() => { setRole(UserRole.LANDLORD); setStep('signup'); }}
            className="w-full py-4 border-2 border-slate-100 text-slate-700 font-bold rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
          >
            <i className="fas fa-user-tie"></i> Join as Landlord
          </button>

          <div className="pt-4">
            <button
              onClick={() => setStep('login')}
              className="text-blue-600 font-black text-[10px] uppercase tracking-widest"
            >
              Already have an account? Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'signup') {
    return (
      <div className="min-h-screen bg-white p-6 animate-in slide-in-from-right duration-500 overflow-y-auto">
        <button onClick={() => setStep('welcome')} className="mb-6 text-slate-400 p-2 active:scale-90 transition-transform"><i className="fas fa-arrow-left text-xl"></i></button>
        <div className="space-y-1 mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{role === UserRole.TENANT ? 'Tenant' : 'Landlord'} Sign Up</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Create a secure housing account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name (Two Names)</label>
            <input
              required
              type="text"
              placeholder="e.g. John Mweru"
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
              value={signupData.fullName}
              onChange={e => setSignupData({ ...signupData, fullName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">+254</span>
                <input
                  required
                  type="tel"
                  placeholder="712345678"
                  className="w-full pl-16 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                  value={signupData.phone}
                  onChange={e => setSignupData({ ...signupData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input
                required
                type="email"
                placeholder="name@example.com"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                value={signupData.email}
                onChange={e => setSignupData({ ...signupData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                value={signupData.password}
                onChange={e => setSignupData({ ...signupData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
            <div className="relative">
              <input
                required
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                value={signupData.confirmPassword}
                onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest mt-4"
          >
            {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Create Account'}
          </button>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => setStep('login')}
              className="text-slate-400 font-bold text-[10px] uppercase tracking-widest"
            >
              Have an account? <span className="text-blue-600">Login Instead</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-white p-6 animate-in slide-in-from-left duration-500 flex flex-col justify-center">
        <button onClick={() => setStep('welcome')} className="absolute top-6 left-6 text-slate-400 p-2 active:scale-90 transition-transform"><i className="fas fa-arrow-left text-xl"></i></button>

        <div className="max-w-sm w-full mx-auto space-y-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Secure access to Kimana Space</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div id="recaptcha-container"></div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone or Email</label>
              <input
                required
                type="text"
                placeholder="e.g. 0712345678 or name@email.com"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                value={loginData.identifier}
                onChange={e => setLoginData({ ...loginData, identifier: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <button
                  type="button"
                  onClick={() => setStep('forgot-password')}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                  value={loginData.password}
                  onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest mt-4"
            >
              {isLoading ? (
                <i className="fas fa-circle-notch animate-spin"></i>
              ) : (
                loginData.identifier.includes('@') ? 'Secure Login' : 'Send OTP Code'
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep('signup')}
                className="text-slate-400 font-bold text-[10px] uppercase tracking-widest"
              >
                No account yet? <span className="text-blue-600">Register Now</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'verify-otp') {
    return (
      <div className="min-h-screen bg-white p-6 animate-in slide-in-from-right duration-500 flex flex-col justify-center">
        <div className="max-w-sm w-full mx-auto space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Verify Identity</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Enter the 6-digit code sent to your phone</p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <input
              required
              type="text"
              maxLength={6}
              placeholder="123456"
              className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-center text-2xl font-black tracking-[0.5em] outline-none focus:ring-2 focus:ring-blue-500"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
            >
              {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={() => setStep('login')}
              className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest"
            >
              Change Phone Number
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'forgot-password') {
    return (
      <div className="min-h-screen bg-white p-6 animate-in zoom-in duration-500 flex flex-col justify-center">
        <div className="max-w-sm w-full mx-auto space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-inner">
              <i className="fas fa-key"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h2>
            <p className="text-xs text-slate-500 font-medium px-4">Enter your registered email or phone number to receive a reset link.</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone or Email</label>
              <input
                required
                type="text"
                placeholder="e.g. 0712345678"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
            >
              Send Reset Link
            </button>

            <button
              type="button"
              onClick={() => setStep('login')}
              className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthFlow;
