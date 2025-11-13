import ClaimCard from './ClaimCard'

export default function ClaimsList({ claims, filter }) {
  const filteredClaims = filter 
    ? claims.filter(claim => claim.status === filter)
    : claims

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 pl-1">
        Claims Breakdown
      </h3>
      
      {filteredClaims.map((claim, index) => (
        <ClaimCard 
          key={index} 
          claim={claim}
        />
      ))}

      {filteredClaims.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No claims found
        </div>
      )}
    </div>
  )
}

