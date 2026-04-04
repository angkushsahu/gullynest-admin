"use client";

import { useState } from "react";

const QUESTIONS = [
  { q: "What would you warn the next tenant about?", required: true },
  { q: "How responsive is the landlord when something breaks?", required: false },
  { q: "What surprised you about this flat after your first month?", required: false },
  { q: "What's great about this flat that photos can't show?", required: false },
  { q: "Describe a typical Sunday morning in this neighbourhood.", required: false },
];

export type SuggestionItem = {
  question: string;
  answer: string;
  honestDisclosure: boolean;
  required: boolean;
};

type Props = {
  value: SuggestionItem[];
  onChange: (items: SuggestionItem[]) => void;
};

export function buildInitialSuggestions(): SuggestionItem[] {
  return QUESTIONS.map((q) => ({
    question: q.q,
    answer: "",
    honestDisclosure: false,
    required: q.required,
  }));
}

export function InsiderAnswers({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState<number | null>(0);

  const update = (index: number, patch: Partial<SuggestionItem>) => {
    const next = value.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  const filledCount = value.filter((v) => v.answer.trim()).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-[#717171]">
        These answers appear as insider knowledge on the listing.{" "}
        <span className="font-semibold text-[#222]">First question is required.</span>{" "}
        {filledCount > 0 && (
          <span className="text-[#008A05]">{filledCount} of {QUESTIONS.length} answered.</span>
        )}
      </p>

      {value.map((item, i) => {
        const isOpen = expanded === i;
        const hasAnswer = item.answer.trim().length > 0;
        return (
          <div
            key={i}
            className={`rounded-xl border transition-colors ${
              isOpen ? "border-[#222]" : hasAnswer ? "border-[#008A05]" : "border-[#DDDDDD]"
            }`}
          >
            {/* Header */}
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                {hasAnswer ? (
                  <span className="w-5 h-5 rounded-full bg-[#008A05] flex items-center justify-center flex-shrink-0">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : (
                  <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${item.required ? "border-accent" : "border-[#DDDDDD]"}`} />
                )}
                <span className="text-[13px] font-medium text-[#222] truncate">
                  {item.question}
                  {item.required && <span className="text-accent ml-1">*</span>}
                </span>
              </div>
              <svg
                className={`ml-3 flex-shrink-0 text-[#717171] transition-transform ${isOpen ? "rotate-180" : ""}`}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Body */}
            {isOpen && (
              <div className="px-4 pb-4 flex flex-col gap-3">
                <textarea
                  className="input resize-none"
                  rows={3}
                  placeholder="Write a genuine answer…"
                  value={item.answer}
                  onChange={(e) => update(i, { answer: e.target.value })}
                />
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.honestDisclosure}
                    onChange={(e) => update(i, { honestDisclosure: e.target.checked })}
                    className="mt-0.5 w-4 h-4 accent-[#222]"
                  />
                  <div>
                    <span className="text-[13px] font-semibold text-[#222]">Mark as honest disclosure</span>
                    <p className="text-[11px] text-[#717171] mt-0.5">
                      Shows an honesty badge on the listing — use when the answer reveals something unflattering but true.
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
