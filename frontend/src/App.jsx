import { useState } from 'react'
import Header from './components/Header'
import SummaryCard from './components/SummaryCard'
import ClaimsList from './components/ClaimsList'

const mockClaims = [
  {
    id: 1,
    status: 'verified',
    text: '"OMB withholding funds violated law"',
    sources: '3 Sources',
    confidence: 'High confidence'
  },
  {
    id: 2,
    status: 'verified',
    text: '"California currently uses independent redistricting commission"',
    sources: '4 Sources',
    confidence: 'High confidence'
  },
  {
    id: 3,
    status: 'questionable',
    text: '"New York and Washington use non-partisan commissions"',
    sources: 'No Source found',
    confidence: 'Medium confidence'
  },
  {
    id: 4,
    status: 'disputed',
    text: 'Necessity of partisan gerrymandering as counterweight',
    sources: 'Normative Claim',
    confidence: 'Low confidence'
  }
]

function App() {
  const [filter, setFilter] = useState(null)

  const stats = {
    verified: mockClaims.filter(c => c.status === 'verified').length,
    questionable: mockClaims.filter(c => c.status === 'questionable').length,
    disputed: mockClaims.filter(c => c.status === 'disputed').length
  }

  const handleSettingsClick = () => {
    console.log('Settings clicked')
  }

  const handleStatClick = (status) => {
    setFilter(filter === status ? null : status)
  }

  const handleViewDetails = (claim) => {
    console.log('View details for claim:', claim)
  }

  const handleExport = () => {
    console.log('Export report')
  }

  const handleViewFullAnalysis = () => {
    console.log('View full analysis')
  }

  return (
    <div className="max-w-[380px] max-h-[600px] overflow-y-auto scrollbar-thin p-4">
      <Header onSettingsClick={handleSettingsClick} />
      
      <SummaryCard stats={stats} onStatClick={handleStatClick} />
      
      <ClaimsList 
        claims={mockClaims} 
        onViewDetails={handleViewDetails}
        filter={filter}
      />

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleExport}
          className="flex-1 px-4 py-3 rounded-lg text-[13px] font-semibold bg-white text-primary border-[1.5px] border-primary hover:bg-blue-50 transition-all"
        >
          Export Report
        </button>
        <button
          onClick={handleViewFullAnalysis}
          className="flex-1 px-4 py-3 rounded-lg text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover hover:-translate-y-px hover:shadow-lg hover:shadow-blue-200 transition-all"
        >
          View Full Analysis
        </button>
      </div>
    </div>
  )
}

export default App
