import { Smile, Frown, Meh, Annoyed } from 'lucide-react';

const getBiasIcon = (bias) => {
  switch (bias) {
    case 'Objective':
      return <Smile className="w-7 h-7 text-verified" />;
    case 'Biased':
      return <Meh className="w-7 h-7 text-questionable" />;
    case 'Strongly Biased':
      return <Frown className="w-7 h-7 text-disputed" />;
    default:
      return <Annoyed className="w-7 h-7 text-gray-500" />;
  }
};

function SentimentAnalysis({ sentiment }) {
  if (!sentiment) return null;

  return (
    <div className="p-3.5 bg-white rounded-lg shadow-sm border border-gray-200 h-full">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">
        Article Tone
      </h2>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getBiasIcon(sentiment.bias)}
        </div>
        <div>
          <div className="text-[11px] font-bold text-gray-900">
            {sentiment.bias}
          </div>
          <div className="text-[10px] text-gray-600">
            Sentiment: {sentiment.sentiment}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SentimentAnalysis;