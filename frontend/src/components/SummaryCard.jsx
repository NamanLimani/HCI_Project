import verifiedIcon from '../assets/icons/verified-mark.svg'
import exclamationIcon from '../assets/icons/exclamation-mark.svg'
import xIcon from '../assets/icons/x-mark.svg'

export default function SummaryCard({ stats, onStatClick }) {
  const { verified = 4, questionable = 2, disputed = 1 } = stats;
  const total = verified + questionable + disputed;

  return (
    <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-gray-900">Analysis Summary</h2>
        <span className="text-[11px] px-2 py-1 bg-verified-bg text-verified rounded font-medium">
          Page Analyzed
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-3">
        <button
          onClick={() => onStatClick?.('verified')}
          className="flex items-center gap-2 p-3 rounded-lg bg-verified-bg hover:-translate-y-0.5 transition-transform cursor-pointer"
        >
          <img src={verifiedIcon} alt="Verified" width="20" height="20" />
          <div className="flex flex-col">
            <div className="text-[22px] font-bold leading-none mb-0.5 text-verified">{verified}</div>
            <div className="text-[11px] text-gray-600 font-medium">Verified</div>
          </div>
        </button>
        
        <button
          onClick={() => onStatClick?.('questionable')}
          className="flex items-center gap-2 p-3 rounded-lg bg-questionable-bg hover:-translate-y-0.5 transition-transform cursor-pointer"
        >
          <img src={exclamationIcon} alt="Questionable" width="20" height="20" />
          <div className="flex flex-col">
            <div className="text-[22px] font-bold leading-none mb-0.5 text-questionable">{questionable}</div>
            <div className="text-[11px] text-gray-600 font-medium">Questionable</div>
          </div>
        </button>
        
        <button
          onClick={() => onStatClick?.('disputed')}
          className="flex items-center gap-2 p-3 rounded-lg bg-disputed-bg hover:-translate-y-0.5 transition-transform cursor-pointer"
        >
          <img src={xIcon} alt="Disputed" width="20" height="20" />
          <div className="flex flex-col">
            <div className="text-[22px] font-bold leading-none mb-0.5 text-disputed">{disputed}</div>
            <div className="text-[11px] text-gray-600 font-medium">Disputed</div>
          </div>
        </button>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-200 text-xs text-gray-600">
        <span className="font-medium">{total} Claims Analyzed</span>
        <span className="text-gray-400">2 min ago</span>
      </div>
    </div>
  )
}
