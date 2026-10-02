import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      toast.success('Welcome back to VEDANCO AI!');
      navigate('/app/dashboard');
    } catch (err) {
      toast.error(err?.message || (typeof err === 'string' ? err : 'Invalid email or password'));
    } finally {
      setIsLoading(false);
    }
  };

  const autofillDemo = (role = 'demo') => {
    if (role === 'admin') {
      setEmail('admin@vedanco.ai');
      setPassword('adminpassword123');
      toast.info('Filled Super Admin credentials');
    } else {
      setEmail('demo@vedanco.ai');
      setPassword('password123');
      toast.info('Filled Demo Account credentials');
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
        <h2 className="text-2xl font-bold tracking-tight text-white">Sign in to your account</h2>
        <p className="mt-2 text-xs text-gray-400">
          Or{' '}
          <Link to="/signup" className="font-semibold text-emerald-400 hover:underline">
            create a new organization in 2 minutes
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-3xl border border-emerald-500/25 shadow-2xl">
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition"
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
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#08080a] border border-emerald-950/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full py-3 shadow-glow"
              >
                Sign In <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>

          {/* Quick Demo Autofill Buttons */}
          <div className="mt-6 pt-6 border-t border-emerald-950/60">
            <span className="text-[11px] font-semibold text-gray-400 block mb-2 text-center uppercase tracking-wider">
              Quick One-Click Test Logins
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => autofillDemo('demo')}
                className="px-3 py-2 rounded-xl bg-[#121215] hover:bg-[#18181d] border border-emerald-950/80 text-xs font-medium text-gray-200 transition text-center"
              >
                Demo Account
              </button>
              <button
                type="button"
                onClick={() => autofillDemo('admin')}
                className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-medium text-amber-300 transition text-center"
              >
                Super Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
