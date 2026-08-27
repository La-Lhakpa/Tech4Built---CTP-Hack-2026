"use client";

import { AlertTriangle, ArrowRight, BookOpen, CalendarClock, Clock3, Gauge, ShieldCheck, Trash2 } from "lucide-react";
import type { AnalysisResult, Obligation } from "@/lib/types";

interface Props { obligations: Obligation[]; analysis: AnalysisResult; onRemove: (id: string) => void; onGenerate: () => void; loading: boolean; }
const riskStyles = { High: "risk-high", Medium: "risk-medium", Low: "risk-low" } as const;

export default function CollisionDashboard({ obligations, analysis, onRemove, onGenerate, loading }: Props) {
  const RiskIcon = analysis.riskLevel === "High" ? AlertTriangle : analysis.riskLevel === "Medium" ? Gauge : ShieldCheck;
  return (
    <div className="space-y-6">
      <section className={`risk-card ${riskStyles[analysis.riskLevel]}`}>
        <div className="risk-icon"><RiskIcon size={26} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3"><p className="text-xs font-bold uppercase tracking-[0.16em]">{analysis.riskLevel} risk</p><span className="risk-pill">{analysis.utilizationPercent}% capacity used</span></div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{analysis.riskLevel === "High" ? "Your deadlines need attention." : analysis.riskLevel === "Medium" ? "Your week is nearly full." : "Your week has breathing room."}</h2>
          <p className="mt-2 max-w-2xl leading-7 opacity-80">{analysis.message}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric icon={<BookOpen size={18} />} label="Work required" value={`${analysis.totalRequiredHours}h`} note={`${obligations.length} obligations`} />
        <Metric icon={<Clock3 size={18} />} label="Time available" value={`${analysis.totalAvailableHours}h`} note={`${analysis.planningDays} days × daily capacity`} />
        <Metric icon={<CalendarClock size={18} />} label="Schedule gap" value={analysis.deficitHours ? `−${analysis.deficitHours}h` : "+ Room"} note={analysis.deficitHours ? "More work than time" : "Workload fits"} accent={analysis.deficitHours > 0} />
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e7e2] px-6 py-5 sm:px-7">
          <div><h3 className="text-lg font-bold">Upcoming deadlines</h3><p className="mt-1 text-sm text-[#68766f]">Sorted by what’s due first.</p></div>
          <span className="rounded-full bg-[#eff3ef] px-3 py-1.5 text-xs font-bold text-[#53635b]">{obligations.length} total</span>
        </div>
        {obligations.length === 0 ? <div className="px-6 py-14 text-center text-[#68766f]">No obligations yet. Add one from the first screen.</div> : (
          <div className="divide-y divide-[#e9ede9]">
            {[...obligations].sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((item) => (
              <article key={item.id} className="group grid gap-4 px-6 py-5 transition hover:bg-[#fafbf9] sm:grid-cols-[1fr_auto] sm:items-center sm:px-7">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="date-tile"><span>{new Date(`${item.dueDate}T12:00:00`).toLocaleDateString("en-US", { month: "short" })}</span><b>{new Date(`${item.dueDate}T12:00:00`).getDate()}</b></div>
                  <div className="min-w-0"><p className="truncate font-bold">{item.assignmentName}</p><p className="mt-1 truncate text-sm text-[#68766f]">{item.course} · {item.type}</p></div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className={`difficulty difficulty-${item.difficulty.toLowerCase()}`}>{item.difficulty}</span>
                  <span className="min-w-12 text-sm font-bold">{item.estimatedHours}h</span>
                  <button className="icon-button" onClick={() => onRemove(item.id)} aria-label={`Remove ${item.assignmentName}`}><Trash2 size={17} /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end"><button className="primary-button min-w-52" onClick={onGenerate} disabled={!obligations.length || loading}>{loading ? <><span className="spinner" /> Building your plan…</> : <>Build my Gemini plan <ArrowRight size={18} /></>}</button></div>
    </div>
  );
}

function Metric({ icon, label, value, note, accent = false }: { icon: React.ReactNode; label: string; value: string; note: string; accent?: boolean }) {
  return <article className="surface-card p-5 sm:p-6"><div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3ef] text-[#245947]">{icon}</div><p className="text-sm font-semibold text-[#68766f]">{label}</p><p className={`mt-1 text-3xl font-bold tracking-tight ${accent ? "text-[#b33a2f]" : ""}`}>{value}</p><p className="mt-2 text-xs text-[#829087]">{note}</p></article>;
}
