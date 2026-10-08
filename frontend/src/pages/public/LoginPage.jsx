import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bot,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Building2,
  Shield,
  Eye,
  EyeOff,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { GoogleSignInButton } from '../../components/common/GoogleSignInButton';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const initialRoleParam = searchParams.get('role');
  const isSwitchRequested = searchParams.get('switch') === 'true';

  const [activeTab, setActiveTab] = useState(
    initialRoleParam === 'admin' ? 'admin' : 'client'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login, logout, user, isAuthenticated, isAdmin, defaultDashboardPath } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // If user requests explicit role via query param, sync active tab
  useEffect(() => {
    if (initialRoleParam === 'admin') {
      setActiveTab('admin');
    } else if (initialRoleParam === 'client') {
      setActiveTab('client');
    }
  }, [initialRoleParam]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    try {
      setIsLoading(true);
      const res = await login(email, password);
      toast.success('Welcome back to VEDANCO AI!');
      const assignedRole =
        res?.role ||
        res?.user?.role ||
        (activeTab === 'admin' || email.toLowerCase().includes('admin')
          ? 'admin'
          : 'client');
      const targetPath = assignedRole === 'admin' ? '/admin/dashboard' : '/client/dashboard';
      navigate(targetPath, { replace: true });
    } catch (err) {
      toast.error(err?.message || (typeof err === 'string' ? err : 'Invalid email or password'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (roleToUse) => {
    const role = roleToUse || activeTab;
    const targetEmail = role === 'admin' ? 'admin@vedanco.ai' : 'demo@vedanco.ai';
    const targetPass = 'password123';
    setEmail(targetEmail);
    setPassword(targetPass);
    try {
      setIsLoading(true);
      const res = await login(targetEmail, targetPass);
      const assignedRole = res?.role || res?.user?.role || role;
      toast.success(
        `Logged in as ${assignedRole === 'admin' ? 'Super Admin' : 'Client Workspace'}`
      );
      const targetPath = assignedRole === 'admin' ? '/admin/dashboard' : '/client/dashboard';
      navigate(targetPath, { replace: true });
    } catch (err) {
      toast.error(err?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-3 group mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-black font-bold shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
            <Bot className="w-6 h-6 text-black" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            VEDANCO <span className="text-emerald-400">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          {activeTab === 'admin' ? 'Super Admin Control Center' : 'Client Workspace Portal'}
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          {activeTab === 'admin'
            ? 'Sign in to platform telemetry, multi-tenant accounts & appointments master register'
            : 'Sign in to configure AI phone receptionists, view live calls & manage appointments'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        {/* Active Session Notice if already authenticated */}
        {isAuthenticated && user && (
          <div className="mb-4 p-4 rounded-2xl bg-[#0d1612] border border-emerald-500/30 text-xs shadow-lg animate-in fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">
                  Active Session: <span className="text-emerald-400">{user.name || user.email}</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Role: <span className="text-amber-300 font-semibold uppercase">{user.role || (isAdmin ? 'Admin' : 'Client')}</span>
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => navigate(defaultDashboardPath || (isAdmin ? '/admin/dashboard' : '/client/dashboard'))}
                  >
                    Open Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    icon={LogOut}
                    onClick={() => {
                      logout();
                      toast.info('Logged out. You can now sign in with another account.');
                    }}
                  >
                    Switch Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="glass-panel py-7 px-6 sm:px-8 rounded-3xl border border-emerald-500/25 shadow-2xl">
          {/* TWO DEDICATED ROLE TABS: CLIENT WORKSPACE vs SUPER ADMIN */}
          <div className="grid grid-cols-2 p-1 bg-[#09090b] rounded-2xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('client');
                setEmail('');
                setPassword('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition ${
                activeTab === 'client'
                  ? 'bg-emerald-500 text-black shadow-md font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Client Workspace</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setEmail('');
                setPassword('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-md font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Super Admin</span>
            </button>
          </div>

          {/* GOOGLE SIGN IN BUTTON FOR ACTIVE ROLE */}
          <div className="mb-5">
            <GoogleSignInButton
              label={
                activeTab === 'admin'
                  ? 'Continue as Super Admin with Google'
                  : 'Continue as Client with Google'
              }
              defaultRole={activeTab}
              onSuccess={(res) => {
                const targetRole = res?.role || res?.user?.role || activeTab;
                const dest = targetRole === 'admin' ? '/admin/dashboard' : '/client/dashboard';
                navigate(dest, { replace: true });
              }}
            />
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-[#0c0c0e] px-3 text-gray-400">
                  Or sign in with {activeTab === 'admin' ? 'admin credentials' : 'email'}
                </span>
              </div>
            </div>
          </div>

          {/* EMAIL & PASSWORD LOGIN FORM */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                {activeTab === 'admin' ? 'Admin Email / Username' : 'Work Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    activeTab === 'admin' ? 'admin@vedanco.ai' : 'name@company.com'
                  }
                  className="w-full bg-[#08080a] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-300">Password</label>
                <a href="#" className="text-[11px] text-emerald-400 hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#08080a] border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant={activeTab === 'admin' ? 'secondary' : 'primary'}
                size="lg"
                isLoading={isLoading}
                className={`w-full py-3 shadow-glow font-bold ${
                  activeTab === 'admin' ? 'bg-amber-500 text-black hover:bg-amber-400' : ''
                }`}
              >
                Sign In to {activeTab === 'admin' ? 'Super Admin Dashboard' : 'Client Workspace'}
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>

          {/* Quick Autofill Buttons for Testing */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <span className="text-[10px] font-bold text-gray-400 block mb-2.5 text-center uppercase tracking-wider">
              Quick 1-Click Role Login
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('client');
                  handleQuickLogin('client');
                }}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-center flex items-center justify-center gap-1.5 ${
                  activeTab === 'client'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#121215] hover:bg-[#18181d] border-slate-800 text-gray-300'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Client Demo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  handleQuickLogin('admin');
                }}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-center flex items-center justify-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-[#121215] hover:bg-[#18181d] border-slate-800 text-gray-300'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Need a new workspace?{' '}
          <Link to="/signup" className="text-emerald-400 font-medium hover:underline">
            Register new business account
          </Link>
        </p>
      </div>
    </div>
  );
};
