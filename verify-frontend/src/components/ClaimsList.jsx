import { Download } from 'lucide-react'
import ClaimCard from './ClaimCard'
import { exportAnalysisToPDF } from '../utils/pdfExport'

export default function ClaimsList({ claims, filter, onShowFullAnalysis, fullAnalysis, articleUrl }) {
  const filteredClaims = filter 
    ? claims.filter(claim => claim.status === filter)
    : claims

  const handleExportPDF = () => {
    if (fullAnalysis) {
      exportAnalysisToPDF(fullAnalysis, articleUrl || 'Unknown URL');
    }
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 pl-1">
        Claims Breakdown
      </h3>
      
      {filteredClaims.map((claim, index) => (
        <ClaimCard 
          key={index} 
          claim={claim}
          onShowFullAnalysis={onShowFullAnalysis}
        />
      ))}

      {filteredClaims.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No claims found
        </div>
      )}

      {filteredClaims.length > 0 && fullAnalysis && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleExportPDF}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover transition-colors"
          >
            <Download size={16} />
            Export Full Analysis
          </button>
        </div>
      )}
    </div>
  )
}

