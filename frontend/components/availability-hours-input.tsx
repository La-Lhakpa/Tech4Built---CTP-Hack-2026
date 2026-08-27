"use client";

import { Minus, Plus, Sparkles } from "lucide-react";

interface Props { value: number; onChange: (value: number) => void; }

export default function AvailabilityHoursInput({ value, onChange }: Props) {
  const update = (next: number) => onChange(Math.max(0.5, Math.min(12, Math.round(next * 2) / 2)));
  return (
    <aside className="relative overflow-hidden rounded-[1.8rem] bg-[#183229] p-7 text-white shadow-[0_22px_60px_rgba(19,45,36,0.18)] sm:p-9">
      <div className="capacity-orb" aria-hidden="true" />
      <div className="relative">
        <div className="mb-12 flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold"><Sparkles size={14} /> Daily capacity</span>
          <span className="text-sm text-[#a8c5ba]">Adjust anytime</span>
        </div>
        <p className="text-sm text-[#a8c5ba]">How much can you study each day?</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-end gap-2"><span className="text-6xl font-bold tracking-[-0.06em]">{value}</span><span className="pb-2 text-[#a8c5ba]">hours</span></div>
          <div className="flex gap-2">
            <button className="stepper" onClick={() => update(value - 0.5)} aria-label="Decrease daily hours"><Minus size={18} /></button>
            <button className="stepper" onClick={() => update(value + 0.5)} aria-label="Increase daily hours"><Plus size={18} /></button>
          </div>
        </div>
        <input className="capacity-range mt-8 w-full" type="range" min="0.5" max="12" step="0.5" value={value} onChange={(e) => update(Number(e.target.value))} aria-label="Daily available hours" />
        <div className="mt-2 flex justify-between text-xs text-[#799b8f]"><span>0.5h</span><span>12h</span></div>
        <p className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-[#c7d7d1]">Be realistic—include classes, meals, sleep, and time to recharge.</p>
      </div>
    </aside>
  );
}
