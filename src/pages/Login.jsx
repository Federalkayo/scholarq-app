import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [mode, setMode] = useState('signIn'); // 'signIn' | 'reset'
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState(''); // '' | 'sending' | 'sent' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError('Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetStatus('sending');
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetStatus('sent');
    } catch (err) {
      setResetStatus('error');
    }
  };

  return (
    <div class="min-h-screen flex bg-surface">
      {/* Left: brand panel */}
      <div class="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-2xl relative overflow-hidden">
        <div class="absolute inset-0 opacity-[0.06] pointer-events-none select-none">
          <span class="material-symbols-outlined absolute text-white" style={{ fontSize: '180px', top: '8%', left: '65%', transform: 'rotate(-8deg)' }}>school</span>
          <span class="material-symbols-outlined absolute text-white" style={{ fontSize: '120px', top: '55%', left: '10%', transform: 'rotate(10deg)' }}>menu_book</span>
          <span class="material-symbols-outlined absolute text-white" style={{ fontSize: '90px', top: '75%', left: '68%', transform: 'rotate(-4deg)' }}>calendar_today</span>
        </div>

        <div class="relative z-10">
          <div class="flex items-center gap-sm">
            <div class="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center font-display-md text-white">
              S
            </div>
            <span class="font-display-md text-white text-xl font-bold">Scholarq</span>
          </div>
        </div>

        <div class="relative z-10">
          <h1 class="font-display-lg text-white text-4xl font-bold leading-tight mb-md max-w-md">
            Students, attendance, fees, and reports.{' '}
            <span class="italic font-normal text-white/90">One dashboard.</span>
          </h1>
          <p class="text-white/70 text-body-md max-w-sm">
            Everything your front office and teachers need to run the school day — in one place, built for how schools actually work.
          </p>
        </div>

        <div class="relative z-10 text-white/50 text-label-sm">
          © {new Date().getFullYear()} Scholarq
        </div>
      </div>

      {/* Right: login / reset form */}
      <div class="flex-1 flex items-center justify-center p-lg">
        {mode === 'signIn' ? (
          <form onSubmit={handleSubmit} class="w-full max-w-sm">
            <div class="lg:hidden flex items-center gap-sm mb-xl">
              <div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-display-md text-white">
                S
              </div>
              <span class="font-display-md text-primary text-xl font-bold">Scholarq</span>
            </div>

            <h2 class="font-display-lg text-display-lg text-on-surface mb-xs">Welcome back</h2>
            <p class="text-on-surface-variant text-body-md mb-xl">
              Sign in to your school's admin dashboard.
            </p>

            {error && (
              <div class="bg-error-container text-error text-label-md px-md py-sm rounded-lg mb-md flex items-center gap-xs">
                <span class="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            <label class="block font-label-md text-on-surface-variant mb-xs">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="you@yourschool.edu"
              class="w-full border border-outline-variant rounded-lg px-md py-3 mb-md outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface-container-lowest text-on-surface transition-all"
            />

            <div class="flex items-center justify-between mb-xs">
              <label class="block font-label-md text-on-surface-variant">Password</label>
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setResetEmail(email);
                  setResetStatus('');
                }}
                class="text-label-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div class="relative mb-lg">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                class="w-full border border-outline-variant rounded-lg px-md py-3 pr-11 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface-container-lowest text-on-surface transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                tabIndex={-1}
              >
                <span class="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              class="w-full bg-primary text-white py-3 rounded-lg font-label-md font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-xs group"
            >
              {loading ? (
                <>
                  <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <span class="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">
                    arrow_forward
                  </span>
                </>
              )}
            </button>

            <div class="flex items-center justify-center gap-xs mt-md text-on-surface-variant text-label-sm">
              <span class="material-symbols-outlined text-[16px] text-secondary">lock</span>
              Secure login — your data stays encrypted in transit
            </div>

            <p class="text-center text-on-surface-variant text-label-sm mt-xl">
              Trouble signing in? Contact your school administrator.
            </p>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} class="w-full max-w-sm">
            <div class="lg:hidden flex items-center gap-sm mb-xl">
              <div class="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-display-md text-white">
                S
              </div>
              <span class="font-display-md text-primary text-xl font-bold">Scholarq</span>
            </div>

            <button
              type="button"
              onClick={() => setMode('signIn')}
              class="flex items-center gap-xs text-label-md text-on-surface-variant hover:text-on-surface mb-lg"
            >
              <span class="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to sign in
            </button>

            <h2 class="font-display-lg text-display-lg text-on-surface mb-xs">Reset your password</h2>
            <p class="text-on-surface-variant text-body-md mb-xl">
              Enter your email and we'll send you a link to reset your password.
            </p>

            {resetStatus === 'sent' ? (
              <div class="bg-secondary-container text-on-secondary-container text-label-md px-md py-md rounded-lg flex items-start gap-xs">
                <span class="material-symbols-outlined text-[20px]">check_circle</span>
                <span>
                  If an account exists for <strong>{resetEmail}</strong>, a reset link is on its way. Check your inbox (and spam folder).
                </span>
              </div>
            ) : (
              <>
                {resetStatus === 'error' && (
                  <div class="bg-error-container text-error text-label-md px-md py-sm rounded-lg mb-md flex items-center gap-xs">
                    <span class="material-symbols-outlined text-[18px]">error</span>
                    Something went wrong. Please check the email and try again.
                  </div>
                )}

                <label class="block font-label-md text-on-surface-variant mb-xs">Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="you@yourschool.edu"
                  class="w-full border border-outline-variant rounded-lg px-md py-3 mb-lg outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface-container-lowest text-on-surface transition-all"
                />

                <button
                  type="submit"
                  disabled={resetStatus === 'sending'}
                  class="w-full bg-primary text-white py-3 rounded-lg font-label-md font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-xs"
                >
                  {resetStatus === 'sending' ? (
                    <>
                      <span class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}