import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

const getStatusStyles = (status) => {
  switch (status) {
    case 'Verified':
      return {
        Icon: CheckCircle2,
        color: 'text-verified',
        borderColor: 'border-verified',
      };
    case 'Disputed':
      return {
        Icon: XCircle,
        color: 'text-disputed',
        borderColor: 'border-disputed',
      };
    default: // Questionable
      return {
        Icon: AlertTriangle,
        color: 'text-questionable',
        borderColor: 'border-questionable',
      };
  }
};

function ClaimCard({ claim }) {
  const { Icon, color, borderColor } = getStatusStyles(claim.status);

  return (
    <div className={`p-3 bg-card rounded-lg shadow-sm border-l-4 ${borderColor}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${color}`} />
        <div>
          <h3 className="font-sans font-medium text-card-foreground">
            {claim.claim}
          </h3>
          <div className="text-sm mt-2">
            {claim.sourceUrl ? (
              <a 
                href={claim.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-sans font-semibold text-primary hover:underline flex items-center gap-1"
              >
                {claim.source} <ExternalLink size={12} />
              </a>
            ) : (
              <span className="font-sans font-semibold text-muted-foreground">{claim.source}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClaimCard;