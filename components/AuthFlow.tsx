
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { auth } from '../firebase';
import { FirebaseService } from '../services/db';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

interface AuthFlowProps {
  onAuthenticated: (user: User) => void;
  logoUrl?: string | null;
}

type AuthStep = 'welcome' | 'signup' | 'login' | 'forgot-password';

const AuthFlow: React.FC<authflowprops> = ({ onAuthenticated, logoUrl }) => {
  const [step, setStep] = useState<authstep>('welcome');
  const [role, setRole] = useState<userrole>(UserRole.TENANT);
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
      const profile = await FirebaseService.getUserByPhone(userCredential.user.email || userCredential.user.uid);
      
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

  if (step === 'welcome') {
    return (
      <div classname="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div classname="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-4xl mb-6 shadow-xl relative overflow-hidden">
          {logoUrl ? (
            <img src="{logoUrl}" alt="Logo" classname="w-full h-full object-cover"/>
          ) : (
            <i classname="fas fa-house-chimney"></i>
          )}
          <div classname="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-[10px]">
            <i classname="fas fa-shield-alt"></i>
          </div>
        </div>
        <h1 classname="text-3xl font-black text-slate-900 mb-2 tracking-tight">Masqani Poa</h1>
        <p classname="text-slate-500 mb-8 max-w-xs text-sm font-medium">Connecting landlords and tenants with <span classname="text-blue-600 font-bold">Secure Marketplace</span> technology.</p>
        
        <div classname="space-y-4 w-full max-w-xs">
          <button onclick="{()" ==""> { setRole(UserRole.TENANT); setStep('signup'); }}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
          >
            <i classname="fas fa-user"></i> Join as Tenant
          </button>
          <button onclick="{()" ==""> { setRole(UserRole.LANDLORD); setStep('signup'); }}
            className="w-full py-4 border-2 border-slate-100 text-slate-700 font-bold rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
          >
            <i classname="fas fa-user-tie"></i> Join as Landlord
          </button>
          
          <div classname="pt-4">
            <button onclick="{()" ==""> setStep('login')}
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
      <div classname="min-h-screen bg-white p-6 animate-in slide-in-from-right duration-500 overflow-y-auto">
        <button onclick="{()" ==""> setStep('welcome')} className="mb-6 text-slate-400 p-2 active:scale-90 transition-transform"><i classname="fas fa-arrow-left text-xl"></i></button>
        <div classname="space-y-1 mb-8">
          <h2 classname="text-3xl font-black text-slate-900 tracking-tight">{role === UserRole.TENANT ? 'Tenant' : 'Landlord'} Sign Up</h2>
          <p classname="text-xs text-slate-400 font-bold uppercase tracking-widest">Create a secure housing account</p>
          {role === UserRole.LANDLORD && (
             <div classname="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-[9px] font-black text-amber-600 uppercase tracking-widest">
               <i classname="fas fa-certificate"></i> Agency Privileges Enabled
             </div>
          )}
        </div>

        <form onsubmit="{handleSignup}" classname="space-y-4">
          <div classname="space-y-1">
            <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name (Two Names)</label>
            <input required="" type="text" placeholder="e.g. John Mweru" classname="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-black" value="{signupData.fullName}" onchange="{e" ==""> setSignupData({...signupData, fullName: e.target.value})}
            />
          </div>
          
          <div classname="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div classname="space-y-1">
              <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div classname="relative">
                <span classname="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">+254</span>
                <input required="" type="tel" placeholder="712345678" classname="w-full pl-16 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" value="{signupData.phone}" onchange="{e" ==""> setSignupData({...signupData, phone: e.target.value})}
                />
              </div>
            </div>
            <div classname="space-y-1">
              <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input required="" type="email" placeholder="name@example.com" classname="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-black" value="{signupData.email}" onchange="{e" ==""> setSignupData({...signupData, email: e.target.value})}
              />
            </div>
          </div>

          <div classname="space-y-1">
            <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
            <div classname="relative">
              <input required="" type="{showPassword" ?="" "text"="" :="" "password"}="" placeholder="••••••••" classname="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-black" value="{signupData.password}" onchange="{e" ==""> setSignupData({...signupData, password: e.target.value})}
              />
              <button type="button" onclick="{()" ==""> setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <i classname="{`fas" ${showpassword="" ?="" 'fa-eye-slash'="" :="" 'fa-eye'}`}=""></i>
              </button>
            </div>
          </div>

          <div classname="space-y-1">
            <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
            <div classname="relative">
              <input required="" type="{showConfirmPassword" ?="" "text"="" :="" "password"}="" placeholder="••••••••" classname="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-black" value="{signupData.confirmPassword}" onchange="{e" ==""> setSignupData({...signupData, confirmPassword: e.target.value})}
              />
              <button type="button" onclick="{()" ==""> setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <i classname="{`fas" ${showconfirmpassword="" ?="" 'fa-eye-slash'="" :="" 'fa-eye'}`}=""></i>
              </button>
            </div>
          </div>

          <button type="submit" disabled="{isLoading}" classname="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest mt-4">
            {isLoading ? <i classname="fas fa-circle-notch animate-spin"></i> : `Join as ${role}`}
          </button>
          
          <div classname="text-center pt-4">
            <button type="button" onclick="{()" ==""> setStep('login')}
              className="text-slate-400 font-bold text-[10px] uppercase tracking-widest"
            >
              Have an account? <span classname="text-blue-600">Login Instead</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'login') {
    return (
      <div classname="min-h-screen bg-white p-6 animate-in slide-in-from-left duration-500 flex flex-col justify-center">
        <button onclick="{()" ==""> setStep('welcome')} className="absolute top-6 left-6 text-slate-400 p-2 active:scale-90 transition-transform"><i classname="fas fa-arrow-left text-xl"></i></button>
        
        <div classname="max-w-sm w-full mx-auto space-y-8">
          <div classname="space-y-1">
            <h2 classname="text-3xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
            <p classname="text-xs text-slate-400 font-bold uppercase tracking-widest">Secure access to Masqani Poa</p>
          </div>

          <form onsubmit="{handleLogin}" classname="space-y-5">
            <div classname="space-y-1">
              <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input required="" type="email" placeholder="name@email.com" classname="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-black" value="{loginData.identifier}" onchange="{e" ==""> setLoginData({...loginData, identifier: e.target.value})}
              />
            </div>

            <div classname="space-y-1">
              <div classname="flex justify-between items-center px-1">
                <label classname="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <button type="button" onclick="{handleForgotPassword}" classname="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  Forgot Password?
                </button>
              </div>
              <div classname="relative">
                <input required="" type="{showPassword" ?="" "text"="" :="" "password"}="" placeholder="••••••••" classname="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-black" value="{loginData.password}" onchange="{e" ==""> setLoginData({...loginData, password: e.target.value})}
                />
                <button type="button" onclick="{()" ==""> setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <i classname="{`fas" ${showpassword="" ?="" 'fa-eye-slash'="" :="" 'fa-eye'}`}=""></i>
                </button>
              </div>
            </div>

            <button type="submit" disabled="{isLoading}" classname="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest mt-4">
              {isLoading ? <i classname="fas fa-circle-notch animate-spin"></i> : 'Secure Login'}
            </button>
            
            <div classname="text-center pt-2">
              <button type="button" onclick="{()" ==""> setStep('signup')}
                className="text-slate-400 font-bold text-[10px] uppercase tracking-widest"
              >
                No account yet? <span classname="text-blue-600">Register Now</span>
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
