"use client";

import { ArrowLeft, BrainCircuit, CalendarCheck2, Clock3, Sparkles, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import type { StudyPlan } from "@/lib/types";

export default function PlanDisplay({ plan }: { plan: StudyPlan | null }) {
  if (!plan) return <div className="surface-card mx-auto max-w-xl p-10 text-center"><CalendarCheck2 className="mx-auto text-[#2d6a55]" size={38} /><h2 className="mt-5 text-2xl font-bold">Your plan is waiting</h2><p className="mt-3 text-[#68766f]">Review your risk radar, then ask Gemini to build your day-by-day schedule.</p><Link className="secondary-button mt-7 inline-flex" to="/dashboard"><ArrowLeft size={17} /> Go to risk radar</Link></div>;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <section className="rounded-[1.8rem] bg-[#183229] p-7 text-white sm:p-8">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b9e668] text-[#183229]"><Sparkles size={21} /></div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#9db9af]">Gemini strategy</p>
          <h2 className="mt-3 text-2xl font-bold leading-tight">{plan.overview}</h2>
          <div className="mt-7 border-t border-white/10 pt-6"><div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#dbe8e3]"><BrainCircuit size={17} /> Why this order?</div><p className="text-sm leading-6 text-[#a8c5ba]">{plan.reasoning}</p></div>
        </section>
        <Link className="secondary-button w-full justify-center" to="/dashboard"><ArrowLeft size={17} /> Back to risk radar</Link>
      </aside>

      <section className="space-y-4">
        {plan.days.map((day, index) => (
          <article key={day.date} className="surface-card overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e9e4] px-6 py-5 sm:px-7">
              <div className="flex items-center gap-4"><div className="plan-index">{String(index + 1).padStart(2, "0")}</div><div><h3 className="font-bold">{day.label}</h3><p className="mt-0.5 text-xs text-[#7b8981]">{new Date(`${day.date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p></div></div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf3ef] px-3 py-1.5 text-xs font-bold text-[#315f4f]"><Clock3 size={14} /> {day.totalHours} hours</span>
            </header>
            <div className="p-6 sm:p-7">
              {day.tasks.length ? <div className="space-y-3">{day.tasks.map((task) => <div key={`${day.date}-${task.obligationId}`} className="plan-task"><div className="min-w-0 flex-1"><p className="font-bold">{task.title}</p><p className="mt-1 text-sm text-[#68766f]">{task.course}</p><p className="mt-3 text-sm leading-6 text-[#526158]">{task.note}</p></div><span className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-bold shadow-sm">{task.hours}h</span></div>)}</div> : <div className="rounded-2xl border border-dashed border-[#cfd8d1] p-7 text-center text-sm text-[#68766f]">Recovery and catch-up day. Leave this space open.</div>}
              {day.warning && <div className="mt-4 flex gap-2 rounded-xl bg-[#fff1d6] px-4 py-3 text-sm text-[#79520c]"><TriangleAlert className="mt-0.5 shrink-0" size={16} /><span>{day.warning}</span></div>}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
