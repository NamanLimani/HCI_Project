import { useState } from 'react'
import verifiedIcon from '../assets/icons/verified-mark.svg'
import exclamationIcon from '../assets/icons/exclamation-mark.svg'
import xIcon from '../assets/icons/x-mark.svg'

export default function ClaimCard({ claim, onViewDetails }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusConfig = {
    verified: {
      icon: verifiedIcon,
      label: 'Verified',
      badgeClass: 'bg-verified-bg text-verified',
      borderClass: 'border-l-verified',
      confidenceClass: 'bg-verified-bg text-verified'
    },
    questionable: {
      icon: exclamationIcon,
      label: 'Questionable',
      badgeClass: 'bg-questionable-bg text-questionable',
      borderClass: 'border-l-questionable',
      confidenceClass: 'bg-questionable-bg text-questionable'
    },
    disputed: {
      icon: xIcon,
      label: 'Disputed',
      badgeClass: 'bg-disputed-bg text-disputed',
      borderClass: 'border-l-disputed',
      confidenceClass: 'bg-disputed-bg text-disputed'
    }
  }

  const config = statusConfig[claim.status] || statusConfig.verified

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className={`bg-white rounded-[10px] p-3.5 mb-2.5 border-l-[3px] ${config.borderClass} shadow-sm hover:shadow-md hover:translate-x-0.5 transition-all cursor-pointer ${isExpanded ? 'scale-[1.02]' : ''}`}
    >
      <div className="flex justify-between items-center mb-2.5 gap-2">
        <span className={`text-[11px] px-2 py-1 rounded font-semibold flex items-center gap-1 ${config.badgeClass}`}>
          <img src={config.icon} alt={config.label} width="12" height="12" />
          {config.label}
        </span>
        {claim.confidence && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${config.confidenceClass}`}>
            {claim.confidence}
          </span>
        )}
      </div>

      <p className="text-[13px] leading-6 text-gray-800 mb-2.5 px-0.5">
        {claim.text}
      </p>

      <div className="flex justify-between items-center">
        <span className="text-[11px] text-gray-600 font-medium">
          {claim.sources}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails?.(claim)
          }}
          className="text-primary text-xs font-medium px-2 py-1 rounded hover:bg-blue-50 transition-all"
        >
          View Details →
        </button>
      </div>
    </div>
  )
}
