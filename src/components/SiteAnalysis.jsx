// import React from 'react';

// // Helper to get the right color for the reputation
// const getReputationColor = (reputation) => {
//   if (reputation === 'Low') return 'bg-concerned-coral';
//   if (reputation === 'Mixed') return 'bg-hello-yellow';
//   if (reputation === 'High') return 'bg-trusted-leaf';
//   return 'bg-gray-400'; // Unknown
// };

// function SiteAnalysis({ siteAnalysis }) {
//   if (!siteAnalysis) return null;

//   return (
//     <div className="mb-6 p-4 bg-white rounded-lg shadow-md border border-gray-200">
//       <h2 className="font-display text-xl font-bold text-dark-text mb-3">
//         Site Reputation: {siteAnalysis.domain}
//       </h2>
//       <div className="flex justify-between items-center mb-2">
//         <span className="font-sans font-semibold text-dark-text">Reputation</span>
//         <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${getReputationColor(siteAnalysis.reputation)}`}>
//           {siteAnalysis.reputation}
//         </span>
//       </div>
//       <div className="flex justify-between items-center mb-3">
//         <span className="font-sans font-semibold text-dark-text">Political Bias</span>
//         {/* NEW: We now combine the bias and its context */}
//         <span className="font-sans font-semibold text-gray-700">
//           {siteAnalysis.politicalBias} ({siteAnalysis.biasContext})
//         </span>
//       </div>
//       <p className="font-sans text-sm text-gray-600 border-t border-gray-200 pt-3">
//         {siteAnalysis.explanation}
//       </p>
//     </div>
//   );
// }

// export default SiteAnalysis;



import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, Globe } from 'lucide-react';

// Helper to get the right color for the reputation
const getReputationStyles = (reputation) => {
  // THE FIX IS HERE:
  // We provide a default value 'unknown' if 'reputation' is undefined or null.
  // This prevents the .toLowerCase() function from crashing.
  const rep = (reputation || 'unknown');

  switch (rep) {
    case 'high':
      return { Icon: ShieldCheck, color: 'text-verified' };
    case 'mixed':
      return { Icon: ShieldAlert, color: 'text-questionable' };
    case 'low':
      return { Icon: ShieldX, color: 'text-disputed' };
    default:
      return { Icon: ShieldQuestion, color: 'text-muted-foreground' };
  }
};

// Helper to get the right style for the bias
const getBiasStyles = (bias) => {
  // Also make this one case-insensitive to be safe
  const b = (bias || 'n/a').toLowerCase();
  
  if (b === 'left' || b === 'center-left') {
    return 'bg-blue-600 text-white';
  }
  if (b === 'right' || b === 'center-right') {
    return 'bg-red-600 text-white';
  }
  if (b === 'non-partisan' || b === 'center') {
    return 'bg-slate-600 text-white';
  }
  // Default for 'N/A' or 'Unknown'
  return 'bg-slate-200 text-slate-700';
};

function SiteAnalysis({ siteAnalysis }) {
  // This guard handles if the whole object is missing
  if (!siteAnalysis) return null;

  // This call is now safe, even if siteAnalysis.reputation is undefined
  const { Icon, color } = getReputationStyles(siteAnalysis.reputation);
  const biasStyles = getBiasStyles(siteAnalysis.politicalBias);

  return (
    <div className="mb-4 p-4 bg-card rounded-lg shadow-md border border-slate-200 animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl font-bold text-card-foreground">
          Site Reputation
        </h2>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      
      <div className="space-y-2">
        {/* Domain Row */}
        <div className="flex justify-between items-center">
          <span className="font-sans font-semibold text-muted-foreground">Domain</span>
          <span className="font-sans font-bold text-primary flex items-center gap-1">
            <Globe size={14} /> {siteAnalysis.domain || 'N/A'}
          </span>
        </div>

        {/* Reputation Row */}
        <div className="flex justify-between items-center">
          <span className="font-sans font-semibold text-muted-foreground">Reputation</span>
          <span className="font-sans font-semibold text-card-foreground">{siteAnalysis.reputation || 'Unknown'}</span>
        </div>
        
        {/* Political Bias Row */}
        <div className="flex justify-between items-center">
          <span className="font-sans font-semibold text-muted-foreground">Political Bias</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${biasStyles}`}>
            {siteAnalysis.politicalBias || 'N/A'} ({siteAnalysis.biasContext || 'N/A'})
          </span>
        </div>
      </div>

      <p className="font-sans text-sm text-muted-foreground border-t border-slate-200 pt-3 mt-3">
        {siteAnalysis.explanation || 'No explanation provided.'}
      </p>
    </div>
  );
}

export default SiteAnalysis;