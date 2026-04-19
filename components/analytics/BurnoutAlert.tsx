"use client";

interface BurnoutRisk {
  level: "low" | "medium" | "high";
  reason: string;
}

interface BurnoutAlertProps {
  burnoutRisk: BurnoutRisk;
}

export default function BurnoutAlert({ burnoutRisk }: BurnoutAlertProps) {
  if (burnoutRisk.level === "low") return null;

  const isHigh = burnoutRisk.level === "high";

  return (
    <div
      className={`rounded-2xl p-5 flex items-start gap-4 border ${
        isHigh
          ? "bg-red-50 border-red-100 text-red-900"
          : "bg-amber-50 border-amber-100 text-amber-900"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
          isHigh ? "bg-red-100" : "bg-amber-100"
        }`}
      >
        <svg
          className={`w-5 h-5 ${isHigh ? "text-red-600" : "text-amber-600"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <div>
        <h4 className="font-black text-sm leading-none mb-1">
          {isHigh ? "⚠️ High Burnout Risk Detected" : "Moderate Productivity Decline"}
        </h4>
        <p className={`text-sm ${isHigh ? "text-red-700" : "text-amber-700"}`}>{burnoutRisk.reason}</p>
        <p className={`text-xs mt-2 font-medium ${isHigh ? "text-red-500" : "text-amber-500"}`}>
          Consider reducing task load or taking breaks to maintain sustainable productivity.
        </p>
      </div>
    </div>
  );
}
