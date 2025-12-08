import verifiedIcon from '../assets/icons/verified-mark.svg'
import exclamationIcon from '../assets/icons/exclamation-mark.svg'
import xIcon from '../assets/icons/x-mark.svg'

export default function ClaimCard({ claim }) {
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
      className={`bg-white rounded-[14px] p-3.5 mb-2.5 border-l-[3px] ${config.borderClass} shadow-sm hover:shadow-md transition-all`}
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
      </div>
    </div>
  )
}