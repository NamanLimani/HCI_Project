import { useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import verifiedIcon from './assets/icons/verified-mark.svg';
import exclamationIcon from './assets/icons/exclamation-mark.svg';
import xIcon from './assets/icons/x-mark.svg';

export default function FullAnalysisPage({ claim, onBack }) {
  const [isSearching, setIsSearching] = useState(false);
  const [additionalSources, setAdditionalSources] = useState([]);
  
  // New State for Deep Research
  const [isDeepResearching, setIsDeepResearching] = useState(false);
  const [deepResearchResult, setDeepResearchResult] = useState(null);
  const [deepResearchError, setDeepResearchError] = useState(null);

  const [error, setError] = useState(null);

  const statusConfig = {
    'Verified': {
      icon: verifiedIcon,
      label: 'Verified',
      badgeClass: 'bg-verified-bg text-verified',
      borderClass: 'border-verified',
      bgClass: 'bg-verified-bg',
    },
    'Questionable': {
      icon: exclamationIcon,
      label: 'Questionable',
      badgeClass: 'bg-questionable-bg text-questionable',
      borderClass: 'border-questionable',
      bgClass: 'bg-questionable-bg',
    },
    'Disputed': {
      icon: xIcon,
      label: 'Disputed',
      badgeClass: 'bg-disputed-bg text-disputed',
      borderClass: 'border-disputed',
      bgClass: 'bg-disputed-bg',
    }
  };

  const config = claim ? (statusConfig[claim.status] || statusConfig['Verified']) : statusConfig['Verified'];

  const getScoreColor = (score) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 50) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  // Handler for Additional Sources
  const handleLookForAdditionalSources = async () => {
    if (!claim) return;
    setIsSearching(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/additional-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: claim.claim, currentSource: claim.source }),
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      const data = await response.json();
      setAdditionalSources(data.sources || []);
    } catch (e) {
      setError(`Failed to fetch additional sources: ${e.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // NEW Handler for Deep Research
  const handleDeepResearch = async () => {
    if (!claim) return;
    setIsDeepResearching(true);
    setDeepResearchError(null);
    try {
      const response = await fetch('http://localhost:3001/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: claim.claim }),
      });
      if (!response.ok) throw new Error(`Backend error: ${response.status}`);
      const data = await response.json();
      setDeepResearchResult(data.data);
    } catch (e) {
      setDeepResearchError(`Failed to perform deep research: ${e.message}`);
    } finally {
      setIsDeepResearching(false);
    }
  };

  if (!claim) return null;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Back to Results
        </button>
      </div>

      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">Full Claim Analysis</h1>
      </div>

      <div className="space-y-4">
        {/* Status Badge */}
        <div>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs ${config.badgeClass}`}>
            <img src={config.icon} alt={config.label} width="14" height="14" />
            {config.label}
          </span>
        </div>

        {/* Claim Card */}
        <div className={`bg-white rounded-lg p-4 border-l-4 ${config.borderClass} shadow-sm`}>
          <h2 className="text-base font-bold text-gray-900 mb-3">Claim</h2>
          <p className="text-sm text-gray-800 leading-relaxed mb-4">{claim.claim}</p>
          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="font-semibold text-gray-700 block mb-1">Status</span>
              <span className="text-gray-900">{claim.status}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-gray-700">Source</span>
                {claim.sourceScore && (
                   <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getScoreColor(claim.sourceScore)}`}>
                     {claim.sourceScore}/100
                   </span>
                )}
              </div>
              <span className="text-gray-900 block">{claim.source}</span>
              {claim.sourceReputation && (
                <span className="text-[10px] text-gray-500 mt-1 block">Reputation: {claim.sourceReputation}</span>
              )}
            </div>
          </div>
          {claim.explanation && (
            <div className="mt-3 bg-gray-50 rounded-lg p-3">
              <span className="font-semibold text-gray-700 block mb-2 text-xs">Detailed Explanation</span>
              <p className="text-xs text-gray-900 leading-relaxed">{claim.explanation}</p>
            </div>
          )}
          {claim.sourceUrl && (
            <div className="mt-3">
              <a href={claim.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary-hover transition-colors text-xs">
                Visit Original Source →
              </a>
            </div>
          )}
        </div>

        {/* Additional Sources Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-3">Additional Sources</h2>
          <p className="text-xs text-gray-600 mb-4">
            Find other sources that discuss this claim.
          </p>

          <button
            onClick={handleLookForAdditionalSources}
            disabled={isSearching}
            className="w-full px-4 py-2.5 rounded-full font-semibold bg-primary text-white hover:bg-primary-hover transition-all disabled:bg-slate-400 disabled:cursor-not-allowed text-xs flex justify-center items-center gap-2"
          >
            {isSearching ? 'Searching...' : 'Find Sources'}
          </button>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-disputed-bg text-disputed border border-disputed">
              <p className="font-medium text-xs">{error}</p>
            </div>
          )}

          {additionalSources.length > 0 && (
            <div className="mt-4 space-y-3">
              {additionalSources.map((source, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-xs">{source.title}</h4>
                        {source.sourceScore && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${getScoreColor(source.sourceScore)}`}>
                            {source.sourceScore}/100
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 mb-2">{source.summary}</p>
                      <div className="flex items-center gap-3 text-[10px] text-gray-600">
                        <span className="font-medium">{source.source}</span>
                        {source.sourceReputation && (
                          <span className="text-gray-400">• {source.sourceReputation} Reputation</span>
                        )}
                        {source.date && <span className="text-gray-400">• {source.date}</span>}
                      </div>
                    </div>
                    {source.url && (
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 px-2.5 py-1 rounded bg-primary text-white text-[10px] font-medium hover:bg-primary-hover transition-colors">
                        Visit
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* NEW DEEP RESEARCH SECTION                                                 */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            Deep Research
          </h2>
          <p className="text-xs text-gray-600 mb-4">
            AI-powered investigation into context, history, and scientific consensus.
          </p>

          {!deepResearchResult && (
             <button
              onClick={handleDeepResearch}
              disabled={isDeepResearching}
              className="w-full px-4 py-2.5 rounded-full font-semibold bg-primary text-white hover:bg-primary-hover transition-all disabled:bg-slate-400 disabled:cursor-not-allowed text-xs flex justify-center items-center gap-2"
            >
              {isDeepResearching ? 'Running Deep Dive...' : 'Run Deep Research'}
            </button>
          )}

          {deepResearchError && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
              <p className="font-medium text-xs">{deepResearchError}</p>
            </div>
          )}

          {deepResearchResult && (
            <div className="mt-4 space-y-4 animate-fade-in-up">
              {/* Summary */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <h3 className="text-xs font-bold text-blue-900 mb-2">Executive Summary</h3>
                <p className="text-xs text-blue-800 leading-relaxed">{deepResearchResult.summary}</p>
              </div>

              {/* Consensus */}
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <h3 className="text-xs font-bold text-green-900 mb-1 flex items-center gap-1.5">
                    <CheckCircle size={14} /> General Consensus
                  </h3>
                  <p className="text-xs text-green-800">{deepResearchResult.consensus}</p>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <h3 className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <AlertCircle size={14} /> Counter-Arguments
                  </h3>
                  <p className="text-xs text-amber-800">{deepResearchResult.counter_arguments}</p>
                </div>
              </div>

               {/* Key Points */}
               <div>
                <h3 className="text-xs font-bold text-gray-900 mb-2">Key Investigation Points</h3>
                <ul className="space-y-1.5">
                  {deepResearchResult.key_points.map((point, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Timeline */}
              <div className="pt-2 border-t border-gray-100">
                 <h3 className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                    <Clock size={14} className="text-gray-500" /> Timeline / History
                  </h3>
                 <p className="text-xs text-gray-600 italic">{deepResearchResult.timeline}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}