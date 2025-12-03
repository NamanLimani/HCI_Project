import { useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, Globe, ChevronDown, ChevronUp } from 'lucide-react';

const getReputationStyles = (reputation) => {
  const rep = (reputation || 'unknown').toLowerCase();

  switch (rep) {
    case 'high':
      return { Icon: ShieldCheck, color: 'text-verified' };
    case 'mixed':
      return { Icon: ShieldAlert, color: 'text-questionable' };
    case 'low':
      return { Icon: ShieldX, color: 'text-disputed' };
    default:
      return { Icon: ShieldQuestion, color: 'text-gray-500' };
  }
};

const getBiasStyles = (bias) => {
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
  return 'bg-slate-200 text-slate-700';
};

function SiteAnalysis({ siteAnalysis }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!siteAnalysis) return null;

  const { Icon, color } = getReputationStyles(siteAnalysis.reputation);
  const biasStyles = getBiasStyles(siteAnalysis.politicalBias);

  return (
    <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base text-gray-900">
          Site Reputation
        </h2>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-medium text-gray-600">Domain</span>
          <span className="text-[11px] font-bold text-primary flex items-center gap-1">
            <Globe size={12} /> {siteAnalysis.domain || 'N/A'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[11px] font-medium text-gray-600">Reputation</span>
          <span className="text-[11px] font-semibold text-gray-900">{siteAnalysis.reputation || 'Unknown'}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-medium text-gray-600">Political Bias</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${biasStyles}`}>
            {siteAnalysis.politicalBias || 'N/A'} ({siteAnalysis.biasContext || 'N/A'})
          </span>
        </div>
      </div>

      {siteAnalysis.explanation && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] text-primary font-medium mt-3 hover:text-primary-hover transition-colors"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isExpanded ? 'Hide' : 'Show'} Details
          </button>
          
          {isExpanded && (
            <p className="text-[11px] text-gray-600 border-t border-gray-200 pt-3 mt-2">
              {siteAnalysis.explanation}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default SiteAnalysis;