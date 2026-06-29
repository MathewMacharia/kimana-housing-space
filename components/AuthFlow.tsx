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
  onClose?: () => void;
}

const AuthFlow: React.FC<AuthFlowProps> = ({ onAuthenticated, logoUrl, onClose }) => {
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

      let profile = await FirebaseService.getUserProfile(result.user.email || result.user.uid);

      if (profile) {
        console.log("Existing profile restored for:", profile.email, "as", profile.role);
        onAuthenticated(profile);
      } else {
        const userEmail = result.user.email || "";
        console.log("No existing profile found. Creating new profile for:", userEmail, "as", role);

        const newUser: User = {
          id: result.user.uid,
          name: result.user.displayName || "User",
          email: userEmail,
          phone: result.user.phoneNumber || "",
          role: role,
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

      try {
        await FirebaseService.saveUserProfile(newUser);
        console.log("User profile created in Firestore successfully.");
      } catch (dbError: any) {
        console.error("Database profile creation failed during signup:", dbError);
        alert("Account created, but there was an issue setting up your profile. Please try logging in again.");
      }

      setIsLoading(false);
      await LoggerService.logAuthAttempt(cleanEmail, true);
      onAuthenticated(newUser);
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
    <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl mb-6 w-full max-w-xs mx-auto border border-slate-200/50 dark:border-slate-800/80">
      <button
        type="button"
        onClick={() => setRole(UserRole.TENANT)}
        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === UserRole.TENANT ? 'bg-white dark:bg-slate-800 text-blue-650 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'}`}
      >
        <i className="fas fa-user mr-2"></i> Tenant
      </button>
      <button
        type="button"
        onClick={() => setRole(UserRole.LANDLORD)}
        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === UserRole.LANDLORD ? 'bg-white dark:bg-slate-800 text-blue-650 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'}`}
      >
        <i className="fas fa-user-tie mr-2"></i> Landlord
      </button>
    </div>
  );

  const renderWelcome = () => (
    <div className="space-y-6">
      <div className="text-center md:text-left space-y-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Get Started</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Join the secure real estate network today.</p>
      </div>

      {renderRoleToggle()}

      <div className="space-y-4">
        <button onClick={() => setStep('signup')}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
        >
          Create Account
        </button>

        <button onClick={handleGoogleLogin} disabled={isLoading}
          className="w-full py-4 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-2xl hover:bg-slate-55 dark:hover:bg-slate-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest bg-transparent"
        >
          {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <><i className="fab fa-google text-red-500"></i> Google Login</>}
        </button>

        <div className="pt-4 text-center">
          <button onClick={() => setStep('login')}
            className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest hover:underline"
          >
            Already have an account? Log In
          </button>
        </div>
      </div>
    </div>
  );

  const renderSignup = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setStep('welcome')} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 flex items-center justify-center active:scale-90 transition-all border border-slate-200/50 dark:border-slate-800">
          <i className="fas fa-arrow-left text-sm"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{role === UserRole.TENANT ? 'Tenant' : 'Landlord'} Sign Up</h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Register a secure account</p>
        </div>
      </div>

      {renderRoleToggle()}

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
          <input required type="text" placeholder="e.g. John Mweru" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold text-sm text-black dark:text-white focus:border-blue-500 transition-colors" value={signupData.fullName} onChange={e => setSignupData({ ...signupData, fullName: e.target.value })} />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
          <input required type="tel" placeholder="07xxxxxxxx" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold text-sm text-black dark:text-white focus:border-blue-500 transition-colors" value={signupData.phone} onChange={e => setSignupData({ ...signupData, phone: e.target.value })} />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
          <input required type="email" placeholder="name@example.com" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold text-sm text-black dark:text-white focus:border-blue-500 transition-colors" value={signupData.email} onChange={e => setSignupData({ ...signupData, email: e.target.value })} />
        </div>

        <div className="space-y-1 relative text-slate-900 dark:text-white">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
          <div className="relative">
            <input required type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold text-sm text-black dark:text-white focus:border-blue-500 transition-colors" value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650 dark:hover:text-white transition-colors">
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>

        <div className="space-y-1 relative text-slate-900 dark:text-white">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
          <div className="relative">
            <input required type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold text-sm text-black dark:text-white focus:border-blue-500 transition-colors" value={signupData.confirmPassword} onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-455 hover:text-slate-655 dark:hover:text-white transition-colors">
              <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>

        <div id="recaptcha-container" className="my-2 flex justify-center scale-90 sm:scale-100"></div>

        <button type="submit" disabled={isLoading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest mt-4">
          {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : `Join as ${role}`}
        </button>
        
        <div className="pt-4 text-center">
          <button type="button" onClick={() => setStep('login')}
            className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest hover:underline"
          >
            Already have an account? Log In
          </button>
        </div>
      </form>
    </div>
  );

  const renderLogin = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setStep('welcome')} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 flex items-center justify-center active:scale-90 transition-all border border-slate-200/50 dark:border-slate-800">
          <i className="fas fa-arrow-left text-sm"></i>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Secure gateway access</p>
        </div>
      </div>

      {renderRoleToggle()}

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
          <input required type="email" placeholder="name@email.com" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold text-sm text-black dark:text-white focus:border-blue-500 transition-colors" value={loginData.identifier} onChange={e => setLoginData({ ...loginData, identifier: e.target.value })} />
        </div>

        <div className="space-y-1 text-slate-900 dark:text-white">
          <div className="flex justify-between items-center px-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Password</label>
            <button type="button" onClick={handleForgotPassword} className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline">
              Forgot?
            </button>
          </div>
          <div className="relative">
            <input required type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold text-sm text-black dark:text-white focus:border-blue-500 transition-colors" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 dark:hover:text-white transition-colors">
              <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>

        <div id="recaptcha-container" className="my-2 flex justify-center scale-90 sm:scale-100"></div>

        <button type="submit" disabled={isLoading} className="w-full py-4.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest mt-4">
          {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Secure Login'}
        </button>
        <button type="button" onClick={handleGoogleLogin} disabled={isLoading}
          className="w-full py-4 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 font-black rounded-2xl hover:bg-slate-55 dark:hover:bg-slate-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest bg-transparent mt-2"
        >
          {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : <><i className="fab fa-google text-red-500"></i> Google Login</>}
        </button>
      </form>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Close button for entire flow */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center active:scale-90 transition-all border border-slate-200/50 dark:border-slate-800 shadow-sm"
        >
          <i className="fas fa-times"></i>
        </button>
      )}

      {/* Left Column: Visual Hero (Desktop Only) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900/90 to-blue-900/60 z-10"></div>
        
        {/* Brand & Slogan */}
        <div className="relative z-20 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
            <img src={logoUrl || "/logo.png"} alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          <span className="font-black text-lg uppercase tracking-widest text-white">Masqani Poa</span>
        </div>

        <div className="relative z-20 space-y-6 max-w-lg my-auto">
          <span className="bg-blue-600/30 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
            Secure Real Estate Marketplace
          </span>
          <h2 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight text-slate-100">
            Find your perfect place, wherever you are.
          </h2>
          <p className="text-slate-350 text-sm leading-relaxed font-medium">
            We connect verified landlords and prospective tenants through secure marketplace technology. Explore premium residential units, commercial spaces, farmlands, and short-stay apartments.
          </p>
        </div>

        <div className="relative z-20 border-t border-white/10 pt-6 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span>Build v3.1 Public Market</span>
          <span>© 2026 Masqani Poa</span>
        </div>
      </div>

      {/* Right Column: Interactive Form Panel */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center p-8 sm:p-12 relative bg-white dark:bg-slate-950 transition-colors shadow-2xl min-h-screen">
        <div className="max-w-md w-full mx-auto space-y-8">
          
          {/* Top Logo / Mobile Brand Header */}
          <div className="md:hidden flex flex-col items-center mb-4">
            <div className="w-16 h-16 flex items-center justify-center relative overflow-hidden mb-3">
              <img src={logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Masqani Poa</h1>
            <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mt-0.5">Secure Housing Portal</p>
          </div>

          {/* Form Step Rendering */}
          {step === 'welcome' && renderWelcome()}
          {step === 'signup' && renderSignup()}
          {step === 'login' && renderLogin()}

        </div>
      </div>
    </div>
  );
};

export default AuthFlow;
