import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import verifiedIcon from './assets/icons/verified-mark.svg';
import exclamationIcon from './assets/icons/exclamation-mark.svg';
import xIcon from './assets/icons/x-mark.svg';

export default function FullAnalysisPage({ claim, onBack }) {
  const [isSearching, setIsSearching] = useState(false);
  const [additionalSources, setAdditionalSources] = useState([]);
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

  const handleLookForAdditionalSources = async () => {
    if (!claim) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/additional-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim: claim.claim,
          currentSource: claim.source,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      setAdditionalSources(data.sources || []);
    } catch (e) {
      setError(`Failed to fetch additional sources: ${e.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  if (!claim) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Results
        </button>
      </div>

      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">Full Claim Analysis</h1>
      </div>

      {/* Main Content */}
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
          <p className="text-sm text-gray-800 leading-relaxed mb-4">
            {claim.claim}
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="font-semibold text-gray-700 block mb-1">Status</span>
              <span className="text-gray-900">{claim.status}</span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="font-semibold text-gray-700 block mb-1">Source</span>
              <span className="text-gray-900">{claim.source}</span>
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
              <a
                href={claim.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary-hover transition-colors text-xs"
              >
                Visit Original Source →
              </a>
            </div>
          )}
        </div>

        {/* Additional Research Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-3">Additional Research</h2>
          <p className="text-xs text-gray-600 mb-4">
            Search for more sources and cross-references to verify this claim from multiple perspectives.
          </p>

          <button
            onClick={handleLookForAdditionalSources}
            disabled={isSearching}
            className="px-4 py-2 rounded-lg font-semibold bg-primary text-white hover:bg-primary-hover transition-all disabled:bg-slate-400 disabled:cursor-not-allowed text-xs"
          >
            {isSearching ? 'Searching...' : 'Look for Additional Sources'}
          </button>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-disputed-bg text-disputed border border-disputed">
              <p className="font-medium text-xs">{error}</p>
            </div>
          )}

          {additionalSources.length > 0 && (
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Additional Sources Found</h3>
              {additionalSources.map((source, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1 text-xs">{source.title}</h4>
                      <p className="text-xs text-gray-700 mb-2">{source.summary}</p>
                      <div className="flex items-center gap-3 text-[10px] text-gray-600">
                        <span className="font-medium">{source.source}</span>
                        {source.date && <span>{source.date}</span>}
                      </div>
                    </div>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 px-2.5 py-1 rounded bg-primary text-white text-[10px] font-medium hover:bg-primary-hover transition-colors"
                      >
                        Visit
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

