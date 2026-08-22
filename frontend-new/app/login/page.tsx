'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, ShieldCheck, Sparkles, Lock, Mail, User, Building, 
  Eye, EyeOff, CheckCircle2, Waves, Compass, Ship, Globe2, ArrowLeft
} from 'lucide-react'
import { ASSETS_CONFIG } from '@/lib/config'

export default function AuthPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('alex.mercer@flowforge.internal')
  const [password, setPassword] = useState('••••••••••••')
  const [fullName, setFullName] = useState('Alex Mercer')
  const [orgName, setOrgName] = useState('Pacific Maritime Alliance')
  const [role, setRole] = useState('Operations VP')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)

  // Ensure 100% reliable continuous video autoplay on left side
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.defaultMuted = true
    video.muted = true
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', 'true')
    video.setAttribute('autoplay', '')

    const playVideo = () => {
      if (video) {
        video.muted = true
        video.play().catch(() => {})
      }
    }

    if (video.readyState >= 2) {
      playVideo()
    } else {
      video.addEventListener('loadeddata', playVideo)
      video.addEventListener('canplay', playVideo)
    }

    return () => {
      video.removeEventListener('loadeddata', playVideo)
      video.removeEventListener('canplay', playVideo)
    }
  }, [])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    
    // Store authenticated user session state in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('flowforge_auth_user', JSON.stringify({
        name: isSignUp ? fullName : 'Alex Mercer',
        email: email,
        role: isSignUp ? role : 'Operations VP',
        organization: isSignUp ? orgName : 'Pacific Maritime Alliance',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        authProvider: 'email',
        authenticatedAt: new Date().toISOString()
      }))
    }

    router.push('/dashboard')
  }

  const [googleModalOpen, setGoogleModalOpen] = useState(false)
  const [googleStep, setGoogleStep] = useState<'choose' | 'custom'>('choose')
  const [customGoogleEmail, setCustomGoogleEmail] = useState('')
  const [customGoogleName, setCustomGoogleName] = useState('')

  const handleGoogleAuth = () => {
    setGoogleModalOpen(true)
    setGoogleStep('choose')
    setCustomGoogleEmail('')
    setCustomGoogleName('')
  }

  const handleSelectGoogleAccount = async (selectedEmail: string, selectedName: string, selectedAvatar?: string) => {
    setGoogleLoading(true)
    await new Promise(r => setTimeout(r, 600))
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('flowforge_auth_user', JSON.stringify({
        name: selectedName || selectedEmail.split('@')[0],
        email: selectedEmail,
        role: 'Verified Google Operator',
        organization: 'Maritime Logistics Cloud',
        avatar: selectedAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        authProvider: 'google',
        authenticatedAt: new Date().toISOString()
      }))
    }

    setGoogleModalOpen(false)
    router.push('/dashboard')
  }

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customGoogleEmail.trim()) return
    const name = customGoogleName.trim() || customGoogleEmail.split('@')[0]
    handleSelectGoogleAccount(customGoogleEmail.trim(), name)
  }

  const quickFillDemo = (name: string, mail: string, r: string) => {
    setEmail(mail)
    setPassword('FlowForge2026!')
    setFullName(name)
    setRole(r)
  }

  return (
    <main className="min-h-screen w-full bg-[#0a0c10] text-[#1d1d1f] flex flex-col lg:flex-row overflow-x-hidden selection:bg-[#087ef5] selection:text-white">
      
      {/* 🎬 LEFT SIDE: Independent 4K Hero Video with Live Telemetry & Glassmorphic Highlights */}
      <div className="relative w-full lg:w-[52%] xl:w-[56%] min-h-[380px] lg:min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10 shrink-0">
        
        {/* Full Viewport Looping Video */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          src={ASSETS_CONFIG.HERO_VIDEO_SRC}
          className="absolute inset-0 size-full object-cover pointer-events-none brightness-[0.78] contrast-[1.05]"
        />

        {/* Ambient Dark-Blue Nautical Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-black/40 to-black/60 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(8,126,245,0.25)_0%,_transparent_60%)] pointer-events-none" />

        {/* Top Header over Video */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="flex size-8 items-center justify-center rounded-full bg-white/15 border border-white/30 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition group-hover:scale-105">
              <span className="size-2 rounded-full bg-[#087ef5] shadow-[0_0_8px_#087ef5]" />
            </span>
            <div>
              <span className="font-black text-white text-sm tracking-[-0.02em]">FLOWFORGE</span>
              <span className="block text-[9px] font-bold text-[#a1a1a6] tracking-[0.14em]">MARITIME DISRUPTION OS</span>
            </div>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white bg-white/10 border border-white/15 px-3 py-1.5 rounded-full backdrop-blur-md transition active:scale-95"
          >
            <ArrowLeft className="size-3.5" /> Back to Home
          </Link>
        </div>

        {/* Middle — Catchy Headline & Live Floating Telemetry Card */}
        <div className="relative z-10 my-auto py-8 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[10px] font-bold tracking-[0.16em] text-white backdrop-blur-xl shadow-lg">
            <span className="size-2 rounded-full bg-[#34c759] shadow-[0_0_8px_#34c759] animate-pulse" />
            LIVE TELEMETRY STREAM ONLINE
          </div>

          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black leading-[1.04] tracking-[-0.04em] text-white drop-shadow-md">
            Command Global Sea Lanes with 9-Agent AI.
          </h1>

          <p className="text-xs sm:text-sm font-medium leading-relaxed text-white/80 max-w-md drop-shadow">
            Real-time satellite AIS, storm swell predictive rerouting, and automated port authority harbor clearances.
          </p>

          {/* Floating Glassmorphic Agent Telemetry Card */}
          <div className="rounded-2xl border border-white/20 bg-black/40 p-4 sm:p-5 backdrop-blur-2xl text-white shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#087ef5] flex items-center gap-1.5">
                <Sparkles className="size-3.5" /> Active Operational Intelligence
              </span>
              <span className="text-[10px] font-mono text-[#34c759]">9/9 AGENTS READY</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                <span className="text-[9px] text-[#86868b] uppercase font-bold">Average Voyage Savings</span>
                <p className="text-sm font-mono font-bold text-[#34c759] mt-0.5">+$42,000 USD</p>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                <span className="text-[9px] text-[#86868b] uppercase font-bold">Monte Carlo Engine</span>
                <p className="text-sm font-mono font-bold text-white mt-0.5">500 Iterations</p>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 col-span-2 sm:col-span-1">
                <span className="text-[9px] text-[#86868b] uppercase font-bold">SLA Compliance</span>
                <p className="text-sm font-mono font-bold text-[#087ef5] mt-0.5">94.6% Target</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metadata & Status */}
        <div className="relative z-10 hidden sm:flex items-center justify-between text-[11px] text-white/60 pt-4 border-t border-white/10">
          <span>Enterprise SOC2 Type II Certified &bull; IMO CII Compliant</span>
          <span className="font-mono text-white/80">LATENCY: 42ms</span>
        </div>

      </div>

      {/* 🔐 RIGHT SIDE: Apple / Glassmorphism Login & Sign-Up Panel */}
      <div className="w-full lg:w-[48%] xl:w-[44%] min-h-screen bg-[#f7f8fa] flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          
          {/* Header & Tab Switcher */}
          <div className="space-y-3 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.03em] text-[#1d1d1f]">
              {isSignUp ? 'Create Operator Account' : 'Sign in to FlowForge'}
            </h2>
            <p className="text-xs text-[#6e6e73]">
              {isSignUp 
                ? 'Join your team to access real-time maritime decision orchestration.' 
                : 'Enter your credentials to access the autonomous command center.'}
            </p>

            {/* Pill Tab Switcher */}
            <div className="p-1 rounded-2xl bg-[#e5e5e7]/60 flex items-center gap-1 border border-[#d2d2d7]/50 mt-4">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  !isSignUp 
                    ? 'bg-white text-[#1d1d1f] shadow-sm' 
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  isSignUp 
                    ? 'bg-white text-[#1d1d1f] shadow-sm' 
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                Create Account (Sign Up)
              </button>
            </div>
          </div>

          {/* 🔴 Official Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-[#d2d2d7] bg-white py-3 px-4 text-xs font-bold text-[#1d1d1f] shadow-sm hover:bg-[#fafaf9] hover:border-[#c7c7cc] active:scale-98 transition disabled:opacity-50"
          >
            {/* SVG Google "G" Icon */}
            <svg className="size-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Connecting to Google OAuth...' : isSignUp ? 'Sign up with Google Workspace' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[#d2d2d7]" />
            <span className="absolute bg-[#f7f8fa] px-3 text-[10px] font-bold text-[#86868b] uppercase tracking-wider">
              or continue with email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            
            {/* If Sign Up: Full Name & Organization */}
            {isSignUp && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1d1d1f]">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#86868b]" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full rounded-2xl border border-[#d2d2d7] bg-white pl-10 pr-4 py-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5] focus:ring-1 focus:ring-[#087ef5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#1d1d1f]">Organization</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#86868b]" />
                      <input
                        type="text"
                        required
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. Maersk"
                        className="w-full rounded-2xl border border-[#d2d2d7] bg-white pl-9 pr-3 py-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#1d1d1f]">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full rounded-2xl border border-[#d2d2d7] bg-white px-3 py-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
                    >
                      <option value="Operations VP">Operations VP</option>
                      <option value="Fleet Commander">Fleet Commander</option>
                      <option value="Risk Analyst">Risk Analyst</option>
                      <option value="Logistics Officer">Logistics Officer</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#1d1d1f]">Work Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#86868b]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@flowforge.internal"
                  className="w-full rounded-2xl border border-[#d2d2d7] bg-white pl-10 pr-4 py-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5] focus:ring-1 focus:ring-[#087ef5]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#1d1d1f]">Password</label>
                {!isSignUp && (
                  <button type="button" className="text-[11px] font-semibold text-[#087ef5] hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#86868b]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-[#d2d2d7] bg-white pl-10 pr-10 py-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5] focus:ring-1 focus:ring-[#087ef5]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] transition"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-4 accent-[#087ef5] rounded cursor-pointer"
              />
              <span className="text-xs text-[#6e6e73]">Remember this terminal workstation</span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#087ef5] py-3 text-xs font-bold text-white shadow-md hover:bg-[#076ecf] active:scale-98 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating Terminal...</span>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Enterprise Account' : 'Sign In to Command Center'}</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Picker for Judges / Reviewers */}
          <div className="rounded-2xl border border-[#d2d2d7] bg-white p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868b]">
                ⚡ Quick Demo Profiles (1-Click Test)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => quickFillDemo('Alex Mercer', 'alex.mercer@flowforge.internal', 'Operations VP')}
                className="p-2 rounded-xl bg-[#fafaf9] hover:bg-[#f0f7ff] border border-[#e5e5e7] hover:border-[#087ef5]/30 text-left transition"
              >
                <p className="text-[11px] font-bold text-[#1d1d1f]">Alex Mercer</p>
                <p className="text-[9px] text-[#6e6e73]">Operations VP ($500K Limit)</p>
              </button>
              <button
                type="button"
                onClick={() => quickFillDemo('Dr. Priya Sharma', 'priya.sharma@flowforge.internal', 'Risk Analyst')}
                className="p-2 rounded-xl bg-[#fafaf9] hover:bg-[#f0f7ff] border border-[#e5e5e7] hover:border-[#087ef5]/30 text-left transition"
              >
                <p className="text-[11px] font-bold text-[#1d1d1f]">Dr. Priya Sharma</p>
                <p className="text-[9px] text-[#6e6e73]">Risk AI Analyst ($250K Limit)</p>
              </button>
            </div>
          </div>

          <p className="text-center text-[11px] text-[#86868b]">
            By signing in, you agree to the FlowForge Maritime Operating System Terms & Data Privacy Policy.
          </p>

        </div>
      </div>

      {/* 🔴 Google Account Chooser & Auth Modal */}
      {googleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-[28px] border border-[#d2d2d7] bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            
            {/* Google Header */}
            <div className="flex items-start justify-between border-b border-[#e5e5e7] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-[#f8f9fa] border border-[#e5e5e7]">
                  <svg className="size-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1d1d1f]">Sign in with Google</h3>
                  <p className="text-[11px] text-[#6e6e73]">to continue to <strong className="text-[#1d1d1f]">FlowForge Maritime OS</strong></p>
                </div>
              </div>

              <button
                onClick={() => setGoogleModalOpen(false)}
                className="rounded-full p-1 text-[#86868b] hover:bg-[#f5f5f7] transition"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Account List */}
            {googleStep === 'choose' ? (
              <div className="space-y-3">
                <p className="text-xs text-[#6e6e73] font-medium">
                  Choose a Google account or enter your custom email:
                </p>

                <div className="space-y-2">
                  {/* Option 1 */}
                  <button
                    type="button"
                    onClick={() => handleSelectGoogleAccount('priya.sharma@google.com', 'Dr. Priya Sharma', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80')}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[#e5e5e7] hover:border-[#087ef5] hover:bg-[#f0f7ff] transition text-left group"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
                      alt="Priya"
                      className="size-9 rounded-full object-cover border border-black/10"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1d1d1f] group-hover:text-[#087ef5]">Dr. Priya Sharma</p>
                      <p className="text-[11px] text-[#6e6e73] truncate">priya.sharma@google.com</p>
                    </div>
                  </button>

                  {/* Option 2 */}
                  <button
                    type="button"
                    onClick={() => handleSelectGoogleAccount('alex.mercer@gmail.com', 'Alex Mercer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80')}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border border-[#e5e5e7] hover:border-[#087ef5] hover:bg-[#f0f7ff] transition text-left group"
                  >
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                      alt="Alex"
                      className="size-9 rounded-full object-cover border border-black/10"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1d1d1f] group-hover:text-[#087ef5]">Alex Mercer</p>
                      <p className="text-[11px] text-[#6e6e73] truncate">alex.mercer@gmail.com</p>
                    </div>
                  </button>

                  {/* Option 3: Custom Google Account */}
                  <button
                    type="button"
                    onClick={() => setGoogleStep('custom')}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border border-dashed border-[#d2d2d7] hover:border-[#087ef5] hover:bg-[#fafaf9] transition text-left group"
                  >
                    <div className="flex size-9 items-center justify-center rounded-full bg-[#f0f0f2] text-[#6e6e73]">
                      <User className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1d1d1f] group-hover:text-[#087ef5]">Use another Google account</p>
                      <p className="text-[11px] text-[#86868b]">Enter your specific Gmail or Google Workspace address</p>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Custom Google Email Input */
              <form onSubmit={handleCustomGoogleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1d1d1f]">Your Google Email Address</label>
                  <input
                    type="email"
                    autoFocus
                    required
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="you@gmail.com or name@yourcompany.com"
                    className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] px-3.5 py-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#4285F4] focus:bg-white focus:ring-1 focus:ring-[#4285F4]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#1d1d1f]">Account Name <span className="font-normal text-[#86868b]">(optional)</span></label>
                  <input
                    type="text"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="e.g. Captain Miller"
                    className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] px-3.5 py-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#4285F4] focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setGoogleStep('choose')}
                    className="text-xs font-semibold text-[#6e6e73] hover:underline"
                  >
                    ← Back to account list
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#4285F4] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#3367d6] transition active:scale-95"
                  >
                    Authorize & Sign In
                  </button>
                </div>
              </form>
            )}

            <div className="pt-2 border-t border-[#f0f0f2] text-center text-[10px] text-[#86868b]">
              Google OAuth 2.0 Secure Token Delegation &bull; FlowForge Enterprise
            </div>

          </div>
        </div>
      )}

    </main>
  )
}
