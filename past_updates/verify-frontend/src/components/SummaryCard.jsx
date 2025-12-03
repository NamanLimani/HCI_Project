import verifiedIcon from '../assets/icons/verified-mark.svg'
import exclamationIcon from '../assets/icons/exclamation-mark.svg'
import xIcon from '../assets/icons/x-mark.svg'

export default function SummaryCard({ stats, onStatClick }) {
  const { verified = 0, questionable = 0, disputed = 0 } = stats;
  const total = verified + questionable + disputed;

  return (
    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-gray-900">Analysis Summary</h2>
        <span className="text-[11px] px-2 py-1 bg-verified-bg text-gray-700 rounded font-medium">
          Page Analyzed
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-3">
        <button
          onClick={() => onStatClick?.('Verified')}
          className="flex flex-col items-center p-3 rounded-lg bg-verified-bg hover:-translate-y-0.5 transition-transform cursor-pointer"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <img src={verifiedIcon} alt="Verified" width="18" height="18" />
            <div className="text-[20px] font-bold leading-none text-verified">{verified}</div>
          </div>
          <div className="text-[11px] text-gray-600 font-medium">Verified</div>
        </button>
        
        <button
          onClick={() => onStatClick?.('Questionable')}
          className="flex flex-col items-center p-3 rounded-lg bg-questionable-bg hover:-translate-y-0.5 transition-transform cursor-pointer"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <img src={exclamationIcon} alt="Questionable" width="18" height="18" />
            <div className="text-[20px] font-bold leading-none text-questionable">{questionable}</div>
          </div>
          <div className="text-[11px] text-gray-600 font-medium">Questionable</div>
        </button>
        
        <button
          onClick={() => onStatClick?.('Disputed')}
          className="flex flex-col items-center p-3 rounded-lg bg-disputed-bg hover:-translate-y-0.5 transition-transform cursor-pointer"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <img src={xIcon} alt="Disputed" width="15" height="15" />
            <div className="text-[20px] font-bold leading-none text-disputed">{disputed}</div>
          </div>
          <div className="text-[11px] text-gray-600 font-medium">Disputed</div>
        </button>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-200 text-xs text-gray-600">
        <span className="font-medium">{total} Claims Analyzed</span>
      </div>
    </div>
  )
}

