
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { auth, googleProvider } from '../firebase';
import { FirebaseService } from '../services/db';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

interface AuthFlowProps {
  onAuthenticated: (user: User) => void;
}

type AuthStep = 'welcome' | 'signup' | 'login' | 'forgot-password';

const AuthFlow: React.FC<AuthFlowProps> = ({ onAuthenticated }) => {
  const [step, setStep] = useState<AuthStep>('welcome');
  const [role, setRole] = useState<UserRole>(UserRole.TENANT);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      // 1. Create real Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Update display name in Auth profile
      await updateProfile(userCredential.user, { displayName: fullName });

      // 3. Create Firestore Profile immediately to persist role
      const newUser: User = {
        id: userCredential.user.uid,
        name: fullName,
        phone: phone,
        email: email,
        role: role, // Persistent choice
        unlockedListings: [],
        favorites: [],
        savedSearches: [],
        isEncrypted: true
      };

      await FirebaseService.saveUserProfile(newUser);

      setIsLoading(false);
      setStep('login');
      alert(`Account created successfully as a ${role}! Please log in to access your dashboard.`);
    } catch (error: any) {
      setIsLoading(false);
      console.error("Signup failed:", error);
      alert(`Signup failed: ${error.message}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.identifier || !loginData.password) {
      alert('Please enter your credentials');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Firebase Auth login
      const userCredential = await signInWithEmailAndPassword(auth, loginData.identifier, loginData.password);

      // 2. Fetch the actual profile from Firestore to get the real Role
      const profile = await FirebaseService.getUserProfile(userCredential.user.email || userCredential.user.uid);

      if (profile) {
        onAuthenticated(profile);
      } else {
        // Fallback for missing profile
        const newUser: User = {
          id: userCredential.user.uid,
          name: userCredential.user.displayName || "User",
          phone: "0700000000",
          email: userCredential.user.email || "",
          role: role, // Fallback to current UI selection if no DB record found
          unlockedListings: [],
          favorites: [],
          savedSearches: [],
          isEncrypted: true
        };
        onAuthenticated(newUser);
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error("Login failed:", error);
      alert(`Login failed: ${error.message}. Please check your email and password.`);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = prompt("Please enter your email to receive a reset link:");
    if (!email) return;

    try {
      await sendPasswordResetEmail(auth, email);
      alert('Reset link sent to your email.');
      setStep('login');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    console.log("Initiating Google Sign-In popup...");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google Sign-In successful:", result.user.email);

      // Try to find user profile in any collection
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
          phone: result.user.phoneNumber || "", // Google might provide this
          email: userEmail,
          role: role, // This is the role selected via the UI toggle
          unlockedListings: [],
          favorites: [],
          savedSearches: [],
          isEncrypted: true
        };

        // Save to the appropriate collection (landlords or tenants)
        await FirebaseService.saveUserProfile(newUser);
        profile = newUser;

        alert(`Successfully signed in as a ${role}. Your profile has been created using your Google account: ${userEmail}`);
        onAuthenticated(profile);
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error("Google login failed with error code:", error.code);
      console.error("Full error object:", error);

      if (error.code === 'auth/popup-closed-by-user') {
        console.warn("User closed the popup before finishing.");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("CRITICAL: This domain is not authorized in Firebase. Please add 'kimana-housing-space.vercel.app' to Authorized Domains in Firebase Console.");
      } else {
        alert(`Google Sign-In failed: ${error.message} (${error.code})`);
      }
    }
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
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Masqani Poa</h1>
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
          {role === UserRole.LANDLORD && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-[9px] font-black text-amber-600 uppercase tracking-widest">
              <i className="fas fa-certificate"></i> Agency Privileges Enabled
            </div>
          )}
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
            {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : `Join as ${role}`}
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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {role === UserRole.LANDLORD ? 'Landlord Portal' : 'Tenant Portal'}
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
              {role === UserRole.LANDLORD ? <><i className="fas fa-user-tie text-blue-600"></i> Secure Landlord Access</> : <><i className="fas fa-user text-blue-600"></i> Secure Tenant Access</>}
            </p>
          </div>

          {/* Role Toggle on Login Screen */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole(UserRole.TENANT)}
              className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === UserRole.TENANT ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              Tenant
            </button>
            <button
              type="button"
              onClick={() => setRole(UserRole.LANDLORD)}
              className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === UserRole.LANDLORD ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              Landlord
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input
                required
                type="email"
                placeholder="name@email.com"
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
                  onClick={handleForgotPassword}
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
              {isLoading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Secure Login'}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-300 bg-white px-4">Or continue with</div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 border-2 border-slate-100 rounded-2xl font-bold flex items-center justify-center gap-3 text-sm active:scale-95 transition-all text-slate-700"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Google
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

  return null;
};

export default AuthFlow;
