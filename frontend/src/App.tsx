import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useApp } from "./context/AppContext";
import { useEngine } from "./hooks/useEngine";
import DisruptionFeed from "./components/DisruptionFeed";
import ReasoningTrace from "./components/ReasoningTrace";
import PlanCard from "./components/PlanCard";
import ApprovalGate from "./components/ApprovalGate";
import AuditTrail from "./components/AuditTrail";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import { Toaster } from "react-hot-toast";
import { LayoutDashboard, FileSpreadsheet, BarChart3, AlertCircle, RadioTower } from "lucide-react";

function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: "/",          label: "Control Center", icon: LayoutDashboard },
    { path: "/audit",     label: "Audit Ledger",   icon: FileSpreadsheet },
    { path: "/analytics", label: "Engine Metrics", icon: BarChart3 },
  ];

  return (
    <nav className="flex items-center gap-2 bg-white/60 p-1.5 rounded-xl border border-cream-deep/60">
      {navItems.map(({ path, label, icon: Icon }) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all duration-200 ${
              isActive ? "bg-ink text-cream shadow-sm" : "text-ink-soft hover:bg-cream/40"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function CommandCenterView({ onScan }: { onScan: () => Promise<void> }) {
  const [scanning, setScanning] = useState(false);

  const scan = async () => {
    setScanning(true);
    try {
      await onScan();
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={scan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-bold bg-ink text-cream hover:bg-ink-soft transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-sm"
        >
          {scanning ? (
            <span className="w-3.5 h-3.5 border-2 border-cream border-t-transparent rounded-full animate-spin" />
          ) : (
            <RadioTower className="w-3.5 h-3.5" />
          )}
          Scan Signals Now
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <DisruptionFeed />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReasoningTrace />
            <div className="space-y-6">
              <ApprovalGate />
            </div>
          </div>
        </div>
      </div>

      <PlanCard />
    </div>
  );
}

export default function App() {
  const { state } = useApp();
  const { runTick } = useEngine();

  return (
    <div className="min-h-screen bg-cream selection:bg-sakura/30 relative pb-16">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {/* Decorative SVG */}
      <div className="absolute top-0 right-0 w-96 h-96 opacity-10 pointer-events-none z-0">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="80" cy="40" r="30" fill="#d62828" />
          <path d="M10 90 L50 30 L90 90 Z" fill="#16224a" />
        </svg>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 gap-4 border-b border-cream-deep/60 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red text-white p-1 rounded font-bold font-serif text-sm select-none">
                FF
              </span>
              <h1 className="font-serif text-2xl font-bold text-ink">
                FlowForge{" "}
                <em className="font-normal italic text-red">Control Center</em>
              </h1>
            </div>
            <p className="text-xs text-ink-soft font-mono mt-0.5">
              Autonomous Exception Handling · Society 5.0 Just-In-Time Spine
            </p>
          </div>
          <Navigation />
        </header>

        {state.conn === "offline" && (
          <div className="bg-red/10 border border-red/20 text-red p-4 rounded-2xl flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Backend Unreachable</h4>
              <p className="text-xs text-ink-soft mt-0.5">
                Could not reach the FlowForge API (set VITE_API, default http://localhost:8000).
                Start it with{" "}
                <code className="font-mono bg-cream px-1 rounded">
                  uvicorn flowforge.api.app:app --reload
                </code>{" "}
                — the dashboard retries automatically.
              </p>
            </div>
          </div>
        )}

        {state.conn === "mock" && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 p-3 rounded-2xl mb-6 text-xs font-mono">
            USE_MOCK is on — showing synthetic contract-shaped data, not the live engine.
          </div>
        )}

        <Routes>
          <Route path="/"          element={<CommandCenterView onScan={runTick} />} />
          <Route path="/audit"     element={<AuditTrail />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
        </Routes>
      </div>
    </div>
  );
}
