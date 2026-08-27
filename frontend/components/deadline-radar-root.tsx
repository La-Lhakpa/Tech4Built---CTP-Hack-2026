"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { HashRouter, Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Activity, ArrowRight, ClipboardPlus, LayoutDashboard, Radar, Sparkles, WandSparkles } from "lucide-react";
import AddObligationForm from "./add-obligation-form";
import AvailabilityHoursInput from "./availability-hours-input";
import CollisionDashboard from "./collision-dashboard";
import PlanDisplay from "./plan-display";
import { analyzeLocally } from "@/lib/planner";
import type { Obligation, StudyPlan } from "@/lib/types";
import { generateStudyPlan } from "@/services/api";

function futureDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const demoObligations: Obligation[] = [
  { id: "demo-1", course: "Computer Science 221", assignmentName: "Data Structures Project", dueDate: futureDate(3), estimatedHours: 7, difficulty: "High", type: "Project" },
  { id: "demo-2", course: "Statistics 201", assignmentName: "Probability Problem Set", dueDate: futureDate(5), estimatedHours: 4, difficulty: "Medium", type: "Assignment" },
  { id: "demo-3", course: "World Literature", assignmentName: "Modernism Essay", dueDate: futureDate(6), estimatedHours: 6, difficulty: "Medium", type: "Assignment" },
];

export default function DeadlineRadarRoot() {
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [availableHours, setAvailableHours] = useState(2);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const analysis = useMemo(() => analyzeLocally({ obligations, availableHoursPerDay: availableHours }), [obligations, availableHours]);

  if (!mounted) {
    return <main className="grid min-h-screen place-items-center bg-[#f6f7f4]"><div className="spinner !border-[#c7d8ce] !border-t-[#174f3f]" aria-label="Loading DeadlineRadar" /></main>;
  }

  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<InputScreen obligations={obligations} availableHours={availableHours} onHoursChange={setAvailableHours} onAdd={(item) => { setObligations((current) => [...current, item]); setPlan(null); }} />} />
          <Route path="/dashboard" element={<DashboardScreen obligations={obligations} analysis={analysis} loading={loading} onRemove={(id) => { setObligations((current) => current.filter((item) => item.id !== id)); setPlan(null); }} onGenerate={async () => { setLoading(true); try { setPlan(await generateStudyPlan({ obligations, availableHoursPerDay: availableHours })); } finally { setLoading(false); } }} />} />
          <Route path="/plan" element={<PlanScreen plan={plan} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const steps = [
    { to: "/", label: "Add Work", short: "Add", icon: ClipboardPlus },
    { to: "/dashboard", label: "Risk Radar", short: "Risk", icon: LayoutDashboard },
    { to: "/plan", label: "My Work Plans", short: "Plan", icon: WandSparkles },
  ];
  return (
    <main className="min-h-screen bg-[#f6f7f4] text-[#17221d]">
      <header className="sticky top-0 z-40 border-b border-[#dfe5df] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link className="flex items-center gap-3" to="/">
            <div className="relative grid h-10 w-10 place-items-center rounded-[0.9rem] bg-[#174f3f] text-white shadow-sm"><Radar size={22} /><span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#b9e668]" /></div>
            <div><p className="text-[1.05rem] font-bold tracking-tight">DeadlineRadar</p><p className="hidden text-[0.68rem] font-medium tracking-wide text-[#77847d] sm:block">PLAN SMARTER · FINISH CALMER</p></div>
          </Link>
          <nav className="flex items-center gap-1 rounded-full bg-[#f0f3ef] p-1" aria-label="Planner steps">
            {steps.map((step, index) => <NavLink key={step.to} end={step.to === "/"} to={step.to} className={({ isActive }) => `nav-step ${isActive ? "nav-step-active" : ""}`}><step.icon size={15} /><span className="hidden sm:inline">{index + 1} · {step.label}</span><span className="sm:hidden">{step.short}</span></NavLink>)}
          </nav>
        </div>
      </header>
      {children}
      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-10 text-xs text-[#7b8981] sm:flex-row sm:items-center sm:justify-between lg:px-8"><p>DeadlineRadar · Built to focus better </p><p>Powered by Gemini API</p></footer>
    </main>
  );
}

function InputScreen({ obligations, availableHours, onHoursChange, onAdd }: { obligations: Obligation[]; availableHours: number; onHoursChange: (value: number) => void; onAdd: (item: Obligation) => void }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="mb-10 max-w-3xl"><Eyebrow icon={<Activity size={14} />}>Step 1 · Map your workload</Eyebrow><h1 className="page-title mt-5">Turn deadline chaos into a plan you can finish.</h1><p className="page-intro">Add each obligation and the time you can realistically study. DeadlineRadar will show whether everything fits before the week gets overwhelming.</p></div>
      <div className="grid items-start gap-6 lg:grid-cols-[1.18fr_0.82fr]">
        <AddObligationForm onAdd={onAdd} />
        <div className="space-y-5"><AvailabilityHoursInput value={availableHours} onChange={onHoursChange} /><div className="surface-card flex items-center justify-between gap-4 p-5"><div><p className="font-bold">{obligations.length} obligations ready</p><p className="mt-1 text-sm text-[#68766f]">Review and remove them on the next screen.</p></div><Link className="round-arrow" to="/dashboard" aria-label="Continue to risk radar"><ArrowRight size={19} /></Link></div></div>
      </div>
    </section>
  );
}

function DashboardScreen({ obligations, analysis, loading, onRemove, onGenerate }: { obligations: Obligation[]; analysis: ReturnType<typeof analyzeLocally>; loading: boolean; onRemove: (id: string) => void; onGenerate: () => Promise<void> }) {
  const navigate = useNavigate();
  async function generate() { await onGenerate(); navigate("/plan"); }
  return <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14"><div className="mb-9"><Eyebrow icon={<Radar size={14} />}>Step 2 · Collision check</Eyebrow><h1 className="page-title mt-5">See the pressure before you feel it.</h1><p className="page-intro">We compared your required work with the hours you have available over the next {analysis.planningDays} days.</p></div><CollisionDashboard obligations={obligations} analysis={analysis} onRemove={onRemove} onGenerate={generate} loading={loading} /></section>;
}

function PlanScreen({ plan }: { plan: StudyPlan | null }) {
  return <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14"><div className="mb-9"><Eyebrow icon={<Sparkles size={14} />}>Step 3 ·Get Your Plan</Eyebrow><h1 className="page-title mt-5">One clear move at a time.</h1><p className="page-intro">A focused daily sequence that respects your capacity, deadlines, and the difficulty of each task.</p></div><PlanDisplay plan={plan} /></section>;
}

function Eyebrow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <p className="inline-flex items-center gap-2 rounded-full bg-[#e1eee7] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#205340]">{icon}{children}</p>;
}
