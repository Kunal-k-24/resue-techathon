import React, { useState } from 'react';
import { X, Mail, Lock, User, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('civilian');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });
        if (signUpError) throw signUpError;

        if (signUpData.user) {
          // Manual profile creation to bypass failing DB triggers
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: signUpData.user.id,
            full_name: fullName,
            email: email,
            role: role,
            status: role === 'volunteer' ? 'pending' : 'active',
          });
          if (profileError) {
            console.warn('Profile creation warning (Manual):', profileError);
            // We don't throw here to allow the user to stay logged in
          }
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 max-w-md w-full shadow-2xl animate-scale-in relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {isLogin ? 'Welcome Back' : 'Join RescueSync'}
          </h2>
          <p className="text-slate-400 font-medium">
            {isLogin ? 'Sign in to continue your mission.' : 'Create your account to start helping.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-3">
            <Shield className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-red-500 transition-colors" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold placeholder:text-slate-300"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {['civilian', 'volunteer', 'rescue-team'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r as UserRole)}
                      className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                        role === r
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105'
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {r.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-red-500 transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold placeholder:text-slate-300"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-red-500 transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold placeholder:text-slate-300"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-8 text-center text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
