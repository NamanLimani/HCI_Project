import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import verifiedIcon from '../assets/icons/verified-mark.svg'
import exclamationIcon from '../assets/icons/exclamation-mark.svg'
import xIcon from '../assets/icons/x-mark.svg'

export default function ClaimCard({ claim, onShowFullAnalysis }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusConfig = {
    'Verified': {
      icon: verifiedIcon,
      label: 'Verified',
      badgeClass: 'bg-verified-bg text-verified',
      borderClass: 'border-l-verified',
    },
    'Questionable': {
      icon: exclamationIcon,
      label: 'Questionable',
      badgeClass: 'bg-questionable-bg text-questionable',
      borderClass: 'border-l-questionable',
    },
    'Disputed': {
      icon: xIcon,
      label: 'Disputed',
      badgeClass: 'bg-disputed-bg text-disputed',
      borderClass: 'border-l-disputed',
    }
  }

  const config = statusConfig[claim.status] || statusConfig['Verified']

  return (
    <div
      className={`bg-white rounded-[10px] p-3.5 mb-2.5 border-l-[3px] ${config.borderClass} shadow-sm hover:shadow-md transition-all ${isExpanded ? 'shadow-md' : ''}`}
    >
      <div className="flex justify-between items-center mb-2.5 gap-2">
        <span className={`text-[11px] px-2 py-1 rounded font-semibold flex items-center gap-1 ${config.badgeClass}`}>
          <img src={config.icon} alt={config.label} width="12" height="12" />
          {config.label}
        </span>
      </div>

      <p className="text-[13px] leading-6 text-gray-800 mb-2.5 px-0.5">
        {claim.claim}
      </p>

      <div className="flex justify-between items-center">
        <span className="text-[11px] text-gray-600 font-medium">
          {claim.source}
        </span>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[11px] text-primary font-medium hover:text-primary-hover transition-colors"
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {isExpanded ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 mt-3 pt-3">
          <div className="space-y-2 text-[11px]">
            <div>
              <span className="font-semibold text-gray-700">Status: </span>
              <span className="text-gray-600">{claim.status}</span>
            </div>
            
            <div>
              <span className="font-semibold text-gray-700">Source: </span>
              <span className="text-gray-600">{claim.source}</span>
            </div>
            
            {claim.explanation && (
              <div>
                <span className="font-semibold text-gray-700">Details: </span>
                <span className="text-gray-600">{claim.explanation}</span>
              </div>
            )}
            
            <div className="pt-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onShowFullAnalysis) {
                    onShowFullAnalysis(claim);
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-primary text-white text-[11px] font-medium hover:bg-primary-hover transition-colors"
              >
                View Full Analysis →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}