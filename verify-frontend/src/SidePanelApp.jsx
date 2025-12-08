import { useEffect, useState } from 'react';
import FullAnalysisPage from './FullAnalysisPage.jsx';

export default function SidePanelApp() {
  const [claim, setClaim] = useState(null);

  useEffect(() => {
    chrome.storage.local.get(['selectedClaim'], (data) => {
      if (data?.selectedClaim) {
        setClaim(data.selectedClaim);
      }
    });

    const handleChange = (changes, area) => {
      if (area === 'local' && changes.selectedClaim) {
        setClaim(changes.selectedClaim.newValue || null);
      }
    };
    chrome.storage.onChanged.addListener(handleChange);
    return () => chrome.storage.onChanged.removeListener(handleChange);
  }, []);

  const handleBack = () => {
    setClaim(null);
    chrome.storage.local.remove(['selectedClaim']);
  };

  if (!claim) {
    return (
      <div className="min-h-screen w-full p-4 text-sm text-gray-700">
        <p className="mb-2 font-semibold">No claim selected.</p>
        <p className="text-gray-600">Hover a highlighted claim and click it to load here.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto scrollbar-thin p-4">
      <FullAnalysisPage claim={claim} onBack={handleBack} />
    </div>
  );
}

