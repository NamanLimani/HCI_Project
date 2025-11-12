import React from 'react';
import { Smile, Frown, Meh, Annoyed } from 'lucide-react';

const getBiasIcon = (bias) => {
  switch (bias) {
    case 'Objective':
      return <Smile className="w-8 h-8 text-verified" />;
    case 'Biased':
      return <Meh className="w-8 h-8 text-questionable" />;
    case 'Strongly Biased':
      return <Frown className="w-8 h-8 text-disputed" />;
    default:
      return <Annoyed className="w-8 h-8 text-muted-foreground" />;
  }
};

function SentimentAnalysis({ sentiment }) {
  if (!sentiment) return null;

  return (
    <div className="p-4 bg-card rounded-lg shadow-md border border-slate-200 h-full">
      <h2 className="font-display text-lg font-bold text-card-foreground mb-3">
        Article Tone
      </h2>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {getBiasIcon(sentiment.bias)}
        </div>
        <div>
          {/* FIX: Changed from text-2xl to text-xl to prevent overflow
          */}
          <div className="font-sans text-sm font-bold text-card-foreground">
            {sentiment.bias}
          </div>
          <div className="font-sans text-sm text-muted-foreground">
            Overall Sentiment: {sentiment.sentiment}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SentimentAnalysis;