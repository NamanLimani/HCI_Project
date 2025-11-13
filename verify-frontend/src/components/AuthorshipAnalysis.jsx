import { User, Cpu } from 'lucide-react';

function DonutChart({ percentage }) {
  const size = 50;
  const strokeWidth = 6;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color = percentage > 75 ? 'text-disputed' : (percentage > 40 ? 'text-questionable' : 'text-verified');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        className="text-gray-200"
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
        className="font-bold text-[10px]"
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
    <div className="p-3.5 bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">
        AI Authorship
      </h2>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <DonutChart percentage={authorship.probability_ai_generated} />
        </div>
        <div>
          <div className={`text-[11px] font-bold ${color}`}>
            {authorship.authorship}
          </div>
          <Icon className={`w-5 h-5 ${color} mt-1`} />
        </div>
      </div>
    </div>
  );
}

export default AuthorshipAnalysis;