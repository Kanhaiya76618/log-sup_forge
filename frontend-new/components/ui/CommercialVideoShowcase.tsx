'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, 
  Sparkles, ShieldCheck, Film, Upload, CheckCircle2, 
  Layers, ArrowRight, Activity, Radio, Cpu
} from 'lucide-react'

interface Chapter {
  time: string
  title: string
  description: string
  tag: string
}

const chapters: Chapter[] = [
  {
    time: '00:00',
    title: 'AIS Satellite Ingestion & Anomaly Detection',
    description: 'Ingesting 1,842 active transponders & Open-Meteo wave swell radar along the Mumbai-Yokohama corridor.',
    tag: 'RADAR STREAM'
  },
  {
    time: '00:35',
    title: 'ExtraTrees ML Disruption Prediction',
    description: 'Trained ExtraTrees classifier detects 82% disruption probability and flags 21.1% vessel speed decay.',
    tag: 'ML INFERENCE'
  },
  {
    time: '01:10',
    title: 'Google OR-Tools CP-SAT Combinatorial Solver',
    description: 'Pareto multi-objective solver evaluates 3 viable recovery routes, saving $42,000 USD in demurrage.',
    tag: 'OR-TOOLS SOLVER'
  },
  {
    time: '01:45',
    title: '500-Iteration Digital Twin & Automated EDI 214',
    description: 'Monte Carlo simulation confirms 94.6% on-time confidence and generates automated harbor master notice.',
    tag: 'AUTONOMOUS DISPATCH'
  }
]

export default function CommercialVideoShowcase() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [activeChapter, setActiveChapter] = useState(0)
  const [progress, setProgress] = useState(15)
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [inputUrl, setInputUrl] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let interval: any
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false)
            return 0
          }
          const next = prev + 1
          if (next >= 75) setActiveChapter(3)
          else if (next >= 50) setActiveChapter(2)
          else if (next >= 25) setActiveChapter(1)
          else setActiveChapter(0)
          return next
        })
      }, 300)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(() => {})
      }
    }
    setIsPlaying(!isPlaying)
  }

  const handleSelectChapter = (index: number) => {
    setActiveChapter(index)
    const chapterProgress = [0, 25, 50, 75][index]
    setProgress(chapterProgress)
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = (chapterProgress / 100) * videoRef.current.duration
    }
  }

  const handleSaveVideoUrl = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputUrl.trim()) {
      setCustomVideoUrl(inputUrl.trim())
      setShowUploadModal(false)
      setIsPlaying(true)
    }
  }

  return (
    <div className="rounded-[28px] border border-[#d2d2d7] bg-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,.06)] space-y-6">
      
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#f0f0f2] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flow-label text-[#087ef5]">OFFICIAL COMMERCIAL PRODUCT DEMONSTRATION</span>
            <span className="flow-badge bg-[#e8f8ed] text-[#34c759]">HACKATHON VERIFIED DEMO</span>
          </div>
          <h3 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-[#1d1d1f]">
            FlowForge Autonomous Maritime Disruption OS in Action
          </h3>
          <p className="text-xs text-[#6e6e73]">
            Watch how 9 autonomous decision agents predict, simulate, and resolve trade bottlenecks in under 42ms.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 rounded-xl border border-[#d2d2d7] bg-[#fafaf9] px-4 py-2 text-xs font-bold text-[#1d1d1f] hover:bg-white transition shadow-sm self-start sm:self-center"
        >
          <Film className="size-3.5 text-[#087ef5]" /> Attach / Update Video
        </button>
      </div>

      {/* Video Container Frame */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#d2d2d7] bg-[#111114] shadow-inner flex flex-col justify-between group">
        
        {/* Custom Video / Fallback Interactive Simulation Reel */}
        {customVideoUrl ? (
          <video
            ref={videoRef}
            src={customVideoUrl}
            className="absolute inset-0 size-full object-cover"
            playsInline
            muted={isMuted}
            loop
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <div className="absolute inset-0 size-full flex flex-col justify-center items-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1d2432] via-[#12141a] to-[#0c0d11]">
            
            {/* Background Radar Rings */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <div className="size-[480px] rounded-full border border-[#087ef5] animate-ping duration-1000" />
              <div className="size-[320px] rounded-full border border-[#087ef5]/60 absolute" />
              <div className="size-[160px] rounded-full border border-[#087ef5]/40 absolute" />
            </div>

            {/* Interactive Scene Overlay */}
            <div className="relative z-10 max-w-xl text-center space-y-4">
              <span className="flow-badge bg-[#087ef5]/20 text-[#087ef5] border border-[#087ef5]/40">
                STAGE 0{activeChapter + 1} · {chapters[activeChapter].tag}
              </span>
              
              <h4 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
                {chapters[activeChapter].title}
              </h4>
              
              <p className="text-xs sm:text-sm text-[#a1a1aa] leading-relaxed max-w-lg mx-auto">
                {chapters[activeChapter].description}
              </p>

              {/* Big Play Button Overlay */}
              {!isPlaying && (
                <button
                  onClick={handleTogglePlay}
                  className="mt-4 inline-flex items-center gap-3 rounded-full bg-[#087ef5] px-6 py-3.5 text-xs font-bold text-white shadow-xl hover:bg-[#076ecf] transition active:scale-95"
                >
                  <Play className="size-4 fill-white" /> Start Interactive System Demo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Video Control Bar Overlay */}
        <div className="relative z-20 mt-auto bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-5 flex flex-col gap-3">
          
          {/* Timeline Scrubber */}
          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden cursor-pointer">
            <div 
              className="bg-[#087ef5] h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleTogglePlay}
                className="size-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/30 transition"
              >
                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 fill-white ml-0.5" />}
              </button>

              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="size-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/30 transition"
              >
                {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>

              <span className="font-mono text-[11px] text-white/80">
                {chapters[activeChapter].time} / 02:30
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/60 hidden sm:inline font-mono">
                FLOWFORGE 4K COMMERCIAL EDITION
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Selection Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {chapters.map((ch, idx) => {
          const isSelected = activeChapter === idx
          return (
            <div
              key={ch.title}
              onClick={() => handleSelectChapter(idx)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                isSelected 
                  ? 'border-[#087ef5] bg-[#f0f7ff] shadow-md ring-2 ring-[#087ef5]/15' 
                  : 'border-[#e5e5e7] bg-[#fafaf9] hover:bg-white hover:border-[#d2d2d7]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#087ef5]">{ch.time}</span>
                <span className="flow-badge bg-white border text-[#6e6e73] text-[9px]">
                  {ch.tag}
                </span>
              </div>
              <h5 className="mt-2 text-xs font-bold text-[#1d1d1f] line-clamp-1">{ch.title}</h5>
              <p className="mt-1 text-[11px] text-[#6e6e73] line-clamp-2 leading-relaxed">{ch.description}</p>
            </div>
          )
        })}
      </div>

      {/* Upload / Link Video Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-[#d2d2d7] bg-white p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#f0f0f2] pb-3">
              <div>
                <p className="flow-label text-[#087ef5]">COMMERCIAL VIDEO SETTINGS</p>
                <h4 className="text-lg font-bold text-[#1d1d1f]">Attach Hackathon Video Demo</h4>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="rounded-full p-2 text-[#86868b] hover:bg-[#f5f5f7]"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Place your edited video file as <strong className="text-[#1d1d1f] font-mono">/public/demo-video.mp4</strong> or paste a direct hosted MP4 / Cloud storage video URL below.
            </p>

            <form onSubmit={handleSaveVideoUrl} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1d1d1f]">Video MP4 URL / Path</label>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="/demo-video.mp4 or https://..."
                  className="w-full rounded-xl border border-[#d2d2d7] bg-[#fafaf9] px-4 py-2.5 text-xs text-[#1d1d1f] outline-none focus:border-[#087ef5]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f0f0f2]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#6e6e73] hover:bg-[#f5f5f7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-[#087ef5] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#076ecf]"
                >
                  Save & Play Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
