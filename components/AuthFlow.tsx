import React, { useState } from 'react';
import { UserRole, User, AuthStep } from '../types';
import { auth, googleProvider, functions } from '../firebase';
import { FirebaseService } from '../services/db';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { LoggerService } from '../services/logger';
import { SanitizerService } from '../services/sanitizer';

interface AuthFlowProps {
  onAuthenticated: (user: User) => void;
  logoUrl?: string | null;
}

const AuthFlow: React.FC<AuthFlowProps> = ({ onAuthenticated, logoUrl }) => {
  const [step, setStep] = useState<AuthStep>('welcome');
  const [role, setRole] = useState<UserRole>(UserRole.TENANT);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Auto-render reCAPTCHA checkbox
  React.useEffect(() => {
    const grecaptcha = (window as any).grecaptcha;
    if ((step === 'login' || step === 'signup') && grecaptcha?.enterprise) {
      grecaptcha.enterprise.ready(() => {
        const container = document.getElementById('recaptcha-container');
        if (container && container.innerHTML === '') {
          grecaptcha.enterprise.render('recaptcha-container', {
            sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
            callback: (token: string) => setCaptchaToken(token),
            'expired-callback': () => setCaptchaToken(null)
          });
        }
      });
    }
  }, [step]);

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
    identifier: '',
    password: ''
  });

  const validateCaptcha = async (action: string): Promise<boolean> => {
    const isLocalDev = import.meta.env.DEV;
    if (isLocalDev) return true;

    if (!captchaToken) {
      alert("Please complete the 'I'm not a robot' verification 🛡️");
      return false;
    }

    try {
      const verifyRecaptcha = httpsCallable(functions, 'verifyRecaptcha');
      const recaptchaResult = await verifyRecaptcha({ token: captchaToken, action }) as any;
      
      if (!recaptchaResult.data?.valid || recaptchaResult.data?.score < 0.5) {
        alert("Security check failed (Risk score too low). Please refresh and try again.");
        return false;
      }
      return true;
    } catch (err: any) {
      console.error("reCAPTCHA validation error:", err);
      console.warn(`Verification service unavailable. Proceeding with ${action} fallback.`);
      return true; // Graceful fallback
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);

      // Try to get profile using getUserProfile (checks both collections)
      let profile = await FirebaseService.getUserProfile(result.user.email || result.user.uid);

      if (profile) {
        console.log("Existing profile restored for:", profile.email, "as", profile.role);
        onAuthenticated(profile);
      } else {
        const userEmail = result.user.email || "";
        console.log("No existing profile found. Creating new profile for:", userEmail, "as", role);

        // Create basic profile for first-time Google users using the SELECTED role
        const newUser: User = {
          id: result.user.uid,
          name: result.user.displayName || "User",
          email: userEmail,
          phone: result.user.phoneNumber || "",
          role: role, // Use the role currently selected in the UI
          unlockedListings: [],
          favorites: [],
          savedSearches: [],
          isEncrypted: true
        };

        await FirebaseService.saveUserProfile(newUser);
        alert(`Social account successfully linked as a ${role}! 🛡️\nEmail: ${userEmail}`);
        onAuthenticated(newUser);
      }
      
      await LoggerService.logAuthAttempt(result.user.email || 'google_auth', true);
    } catch (error: any) {
      console.error("Google Login failed:", error);
      alert(`Google Login failed: ${error.message}`);
      await LoggerService.logAuthAttempt('google_auth', false, error.code || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = SanitizerService.sanitizeText(signupData.fullName, 100);
    const cleanPhone = SanitizerService.sanitizeText(signupData.phone, 20);
    const cleanEmail = SanitizerService.sanitizeText(signupData.email, 150);
    const { password, confirmPassword } = signupData;

    if (!cleanName || cleanName.length < 2) { alert('Please enter a valid Full Name'); return; }
    if (!SanitizerService.isValidPhone(cleanPhone)) { alert('Please enter a valid Phone Number'); return; }
    if (!SanitizerService.isValidEmail(cleanEmail)) { alert('Please enter a valid Email Address'); return; }
    if (!password) { alert('Please enter your Secure Password'); return; }
    if (!confirmPassword) { alert('Please enter your Confirm Password'); return; }

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    setIsLoading(true);

    const isCaptchaValid = await validateCaptcha('signup');
    if (!isCaptchaValid) {
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      await updateProfile(userCredential.user, { displayName: cleanName });

      const newUser: User = {
        id: userCredential.user.uid,
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        role: role,
        unlockedListings: [],
        favorites: [],
        savedSearches: [],
        isEncrypted: true
      };

      // CRITICAL: Ensure database entry is created BEFORE showing user as logged in
      try {
        await FirebaseService.saveUserProfile(newUser);
        console.log("User profile created in Firestore successfully.");
      } catch (dbError: any) {
        console.error("Database profile creation failed during signup:", dbError);
        // We might want to warn the user but let them in, or block them. 
        // Given the requirement "always be the protocol", we should probably make sure it's known.
        alert("Account created, but there was an issue setting up your profile. Please try logging in again.");
      }

      setIsLoading(false);
      await LoggerService.logAuthAttempt(cleanEmail, true);
      onAuthenticated(newUser); // Log in directly after signup
    } catch (error: any) {
      setIsLoading(false);
      console.error("Signup failed:", error);
      alert(`Signup failed: ${error.message}`);
      await LoggerService.logAuthAttempt(cleanEmail, false, error.code || error.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.identifier || !loginData.password) {
      alert('Please enter your credentials');
      return;
    }

    setIsLoading(true);

    const isCaptchaValid = await validateCaptcha('login');
    if (!isCaptchaValid) {
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginData.identifier, loginData.password);
      const profile = await FirebaseService.getUserProfile(userCredential.user.email || userCredential.user.uid);

      if (profile) {
        onAuthenticated(profile);
      } else {
        // Fallback for missing profile
        const newUser: User = {
          id: userCredential.user.uid,
          name: userCredential.user.displayName || "User",
          phone: "",
          email: userCredential.user.email || "",
          role: role,
          unlockedListings: [],
          favorites: [],
          savedSearches: [],
          isEncrypted: true
        };
        onAuthenticated(newUser);
      }
      await LoggerService.logAuthAttempt(loginData.identifier, true);
    } catch (error: any) {
      setIsLoading(false);
      console.error("Login failed:", error);
      
      let errorMsg = error.message;
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMsg = 'Incorrect email or password.';
      } else if (error.code === 'auth/too-many-requests') {
         errorMsg = 'Too many failed login attempts. Please try again later.';
      }
      
      alert(`Login failed: ${errorMsg}`);
      await LoggerService.logAuthAttempt(loginData.identifier, false, error.code || error.message);
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt("Please enter your email to receive a reset link:");
    if (!email) return;

    try {
      await sendPasswordResetEmail(auth, email);
      alert('Reset link sent to your email.');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const renderRoleToggle = () => (
    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl mb-6 w-full max-w-xs mx-auto">
      <button
        type="button"
        onClick={() => setRole(UserRole.TENANT)}
        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === UserRole.TENANT ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
      >
        <i className="fas fa-user mr-2"></i> Tenant
      </button>
      <button
        type="button"
        onClick={() => setRole(UserRole.LANDLORD)}
        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === UserRole.LANDLORD ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'}`}
      >
        <i className="fas fa-user-tie mr-2"></i> Landlord
      </button>
    </div>
  );

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-32 h-32 flex items-center justify-center relative overflow-hidden mb-6">
          <img src={logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Masqani Poa</h1>
        <p className="text-slate-500 mb-8 max-w-xs text-sm font-medium">Connecting landlords and tenants with <span className="text-blue-600 font-bold">Secure Marketplace</span> technology.</p>

        {renderRoleToggle()}

        <div className="space-y-4 w-full max-w-xs">
          <button onClick={() => setStep('signup')}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
          >
            Create Account
          </button>

          <button onClick={handleGoogleLogin} disabled={isLoading}
            className="w-full py-4 border-2 border-slate-100 text-slate-700 font-bold rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
          >
            {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <><i className="fab fa-google text-red-500"></i> Google Login</>}
          </button>

          <div className="pt-4">
            <button onClick={() => setStep('login')}
              className="text-blue-600 font-black text-[10px] uppercase tracking-widest"
            >
              Already have an account? Log In
            </button>
          </div>
          <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-[0.2em] mt-8">Build v3.1 - 2026.03.11 Public Market</p>
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

        {renderRoleToggle()}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input required type="text" placeholder="e.g. John Mweru" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-black" value={signupData.fullName} onChange={e => setSignupData({ ...signupData, fullName: e.target.value })} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
            <input required type="tel" placeholder="07xxxxxxxx" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-black" value={signupData.phone} onChange={e => setSignupData({ ...signupData, phone: e.target.value })} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <input required type="email" placeholder="name@example.com" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-black" value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} />
          </div>

          <div className="space-y-1 text-slate-900">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
            <input required type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-black" value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} />
          </div>

          <div className="space-y-1 text-slate-900">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
            <input required type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-black" value={signupData.confirmPassword} onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })} />
          </div>

          <div id="recaptcha-container" className="my-2 flex justify-center scale-90 sm:scale-100"></div>
          <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 mb-4">Build v3.1 - 2026.03.11 Public Market</p>
          <button type="submit" disabled={isLoading} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest mt-4">
            {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : `Join as ${role}`}
          </button>
          
          <div className="pt-4 text-center">
            <button type="button" onClick={() => setStep('login')}
              className="text-blue-600 font-black text-[10px] uppercase tracking-widest"
            >
              Already have an account? Log In
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
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Secure access to Masqani Poa</p>
          </div>

          {renderRoleToggle()}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input required type="email" placeholder="name@email.com" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-black" value={loginData.identifier} onChange={e => setLoginData({ ...loginData, identifier: e.target.value })} />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <button type="button" onClick={handleForgotPassword} className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  Forgot?
                </button>
              </div>
              <input required type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm text-black" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
            </div>

            <div id="recaptcha-container" className="my-2 flex justify-center scale-90 sm:scale-100"></div>

            <button type="submit" disabled={isLoading} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest mt-4">
              {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Secure Login'}
            </button>
            <button type="button" onClick={handleGoogleLogin} disabled={isLoading}
              className="w-full py-4 border-2 border-slate-100 text-slate-700 font-bold rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 text-sm uppercase tracking-widest mt-2"
            >
              {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <><i className="fab fa-google text-red-500"></i> Google Login</>}
            </button>
          </form>
          <p className="text-[8px] text-center text-slate-400 font-bold uppercase tracking-[0.2em] mt-8">Build v3.1 - 2026.03.11 Public Market</p>
        </div>
      </div>
    );
  }

  return null;
};

// Helper for translation (t is passed from props usually, but here we can define a fallback or use key)
const t = (key: string) => key;

export default AuthFlow;
