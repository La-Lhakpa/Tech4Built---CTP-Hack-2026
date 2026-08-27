"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Copy, RotateCcw, TrendingDown, Minus, Plus, Sparkles } from "lucide-react";
import type { Obligation } from "@/lib/types";

interface Props {
  value: number;
  onChange: (value: number) => void;
  obligations?: Obligation[];
  onPerDayChange?: (availabilityPerDay: Record<string, number>) => void;
}

export default function AvailabilityHoursInput({
  value,
  onChange,
  obligations = [],
  onPerDayChange,
}: Props) {
  const [mode, setMode] = useState<"simple" | "detailed">("simple");
  const [detailedHours, setDetailedHours] = useState<Record<string, number>>({});

  const { days } = useMemo(() => {
    if (obligations.length === 0) {
      return { days: [] };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = obligations.map((o) => new Date(`${o.dueDate}T00:00:00`));
    const latest = new Date(Math.max(...dates.map((d) => d.getTime())));
    if (latest < today) latest.setTime(today.getTime());

    const dayArray: string[] = [];
    const current = new Date(today);
    while (current.toISOString().split("T")[0] <= latest.toISOString().split("T")[0]) {
      dayArray.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return { days: dayArray };
  }, [obligations]);

  const update = (next: number) => {
    const clamped = Math.max(0.5, Math.min(12, Math.round(next * 2) / 2));
    onChange(clamped);
  };

  const handleSwitchToDetailed = () => {
    if (Object.keys(detailedHours).length === 0) {
      const initialized = days.reduce(
        (acc, date) => {
          acc[date] = value;
          return acc;
        },
        {} as Record<string, number>,
      );
      setDetailedHours(initialized);
    }
    setMode("detailed");
  };

  const handleDetailedChange = (date: string, newValue: number) => {
    const updated = { ...detailedHours, [date]: Math.max(0.5, newValue) };
    setDetailedHours(updated);
    onPerDayChange?.(updated);
  };

  const handleCopyPrevious = (index: number) => {
    if (index > 0) {
      const prevDate = days[index - 1];
      const prevValue = detailedHours[prevDate] ?? value;
      handleDetailedChange(days[index], prevValue);
    }
  };

  const handleResetToSimple = () => {
    const reset = days.reduce(
      (acc, date) => {
        acc[date] = value;
        return acc;
      },
      {} as Record<string, number>,
    );
    setDetailedHours(reset);
  };

  const totalAvailable = days.reduce((sum, date) => {
    const hours = mode === "detailed" ? detailedHours[date] ?? value : value;
    return sum + hours;
  }, 0);

  if (mode === "simple") {
    return (
      <aside className="relative overflow-hidden rounded-[1.8rem] bg-[#183229] p-7 text-white shadow-[0_22px_60px_rgba(19,45,36,0.18)] sm:p-9">
        <div className="capacity-orb" aria-hidden="true" />
        <div className="relative">
          <div className="mb-12 flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
              <Sparkles size={14} /> Daily capacity
            </span>
            <span className="text-sm text-[#a8c5ba]">Adjust anytime</span>
          </div>
          <p className="text-sm text-[#a8c5ba]">How much can you study each day?</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold tracking-[-0.06em]">{value}</span>
              <span className="pb-2 text-[#a8c5ba]">hours</span>
            </div>
            <div className="flex gap-2">
              <button
                className="stepper"
                onClick={() => update(value - 0.5)}
                aria-label="Decrease daily hours"
              >
                <Minus size={18} />
              </button>
              <button
                className="stepper"
                onClick={() => update(value + 0.5)}
                aria-label="Increase daily hours"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          <input
            className="capacity-range mt-8 w-full"
            type="range"
            min="0.5"
            max="12"
            step="0.5"
            value={value}
            onChange={(e) => update(Number(e.target.value))}
            aria-label="Daily available hours"
          />
          <div className="mt-2 flex justify-between text-xs text-[#799b8f]">
            <span>0.5h</span>
            <span>12h</span>
          </div>

          {days.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleSwitchToDetailed}
                className="mt-6 flex w-full items-center justify-between gap-2 border-t border-white/10 pt-5 text-xs font-bold text-[#b9e668] transition hover:text-white"
              >
                <span>Customize per day (work, classes, etc.)</span>
                <ChevronDown size={14} />
              </button>
            </>
          )}

          <p className="mt-6 border-t border-white/10 pt-5 text-sm leading-6 text-[#c7d7d1]">
            Be realistic—include classes, meals, sleep, and time to recharge.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-[1.8rem] border border-[#cfd8d1] bg-white p-7 sm:p-9">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingDown size={16} className="text-[#205340]" />
          <span className="font-bold text-[#174f3f]">Customize your study time</span>
        </div>
        <button
          type="button"
          onClick={() => setMode("simple")}
          className="text-xs font-bold text-[#205340] transition hover:underline"
        >
          ← Simple mode
        </button>
      </div>

      <p className="mb-4 text-xs text-[#68766f]">
        Plan window: {days.length} days ({new Date(`${days[0]}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
        {new Date(`${days[days.length - 1]}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })})
      </p>

      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleResetToSimple}
          className="inline-flex items-center gap-1 rounded-lg bg-[#e1eee7] px-2 py-1 text-xs font-bold text-[#205340] transition hover:bg-[#d1e0d8]"
        >
          <RotateCcw size={12} /> Reset all to {value}h
        </button>
        <div className="rounded-lg bg-[#e1eee7] px-3 py-2">
          <p className="text-xs font-bold text-[#205340]">{totalAvailable}h total</p>
        </div>
      </div>

      <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-[#cfd8d1] p-3">
        {days.map((date, index) => {
          const dayOfWeek = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
            weekday: "short",
          });
          const dayLabel = new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          const hours = detailedHours[date] ?? value;

          return (
            <div key={date} className="flex items-center gap-2">
              <div className="w-14 text-xs font-bold text-[#68766f]">
                {dayOfWeek}
                <br />
                {dayLabel}
              </div>
              <input
                type="number"
                value={hours}
                onChange={(e) => handleDetailedChange(date, Number(e.target.value))}
                min="0.5"
                step="0.5"
                max="12"
                className="w-16 rounded-lg border border-[#cfd8d1] bg-white px-2 py-1 text-sm font-bold text-[#174f3f] outline-none focus:border-[#174f3f]"
              />
              <span className="text-xs text-[#68766f]">h</span>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleCopyPrevious(index)}
                  className="ml-auto rounded-lg bg-[#f0f3ef] p-1 transition hover:bg-[#e0e5e0]"
                  title="Copy previous day's value"
                >
                  <Copy size={12} className="text-[#68766f]" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-[#68766f]">💡 Tip: Use the copy button to quickly set similar days, or drag the day inputs to adjust multiple at once.</p>
    </aside>
  );
}
