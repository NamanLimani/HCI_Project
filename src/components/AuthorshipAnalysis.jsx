import React from 'react';
import { User, Cpu } from 'lucide-react';

// This is our new Donut Chart component
function DonutChart({ percentage }) {
  const size = 60;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color = percentage > 75 ? 'text-disputed' : (percentage > 40 ? 'text-questionable' : 'text-verified');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        className="text-slate-200"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx={center}
        cy={center}
      />
      <circle
        className={`transform-gpu -rotate-90 origin-center ${color}`}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx={center}
        cy={center}
      />
      <text
        x="50%"
        y="50%"
        className="font-sans font-bold text-xs"
        fill="currentColor"
        dominantBaseline="middle"
        textAnchor="middle"
      >
        {percentage}%
      </text>
    </svg>
  );
}

function AuthorshipAnalysis({ authorship }) {
  if (!authorship) return null;

  const isAI = authorship.authorship === 'Likely AI-Generated';
  const Icon = isAI ? Cpu : User;
  const color = isAI ? 'text-disputed' : 'text-verified';

  return (
    <div className="p-4 bg-card rounded-lg shadow-md border border-slate-200 h-full">
      <h2 className="font-display text-lg font-bold text-card-foreground mb-3">
        AI Authorship
      </h2>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <DonutChart percentage={authorship.probability_ai_generated} />
        </div>
        <div>
          <div className={`font-sans text-xs font-bold ${color}`}>
            {authorship.authorship}
          </div>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

export default AuthorshipAnalysis;