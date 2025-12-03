import { useState, useEffect } from 'react';
import Loader from './components/Loader';
import Header from './components/Header';
import SummaryCard from './components/SummaryCard';
import ClaimsList from './components/ClaimsList';
import SiteAnalysis from './components/SiteAnalysis';
import SentimentAnalysis from './components/SentimentAnalysis';
import AuthorshipAnalysis from './components/AuthorshipAnalysis';
// Import our highlighter functions
import { highlightClaimsOnPage, clearHighlightsOnPage } from './utils/highlighter';

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [showResults, setShowResults] = useState(false); // For animation
  const [filter, setFilter] = useState(null);

  // Get the active tab once when the component loads
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setActiveTab(tabs[0]);
    });
  }, []);

  // This function injects our highlighter onto the page
  const runHighlight = (claims) => {
    if (!activeTab) return;
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: highlightClaimsOnPage,
      args: [claims],
    });
  };

  // This function clears the highlights
  const runClearHighlights = () => {
    if (!activeTab) return;
    
    // Clear the analysis from our panel
    setAnalysis(null);
    setError(null);
    setShowResults(false);
    setFilter(null);
    
    // Run the clear function on the page
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: clearHighlightsOnPage,
    });
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
  };

  const handleStatClick = (status) => {
    setFilter(filter === status ? null : status);
  };

  // This function gets the text and calls the backend
  const handleVerifyClick = async () => {
    if (!activeTab) {
      setError("Could not find active tab.");
      return;
    }
    
    setIsLoading(true);
    setAnalysis(null);
    setError(null);
    setShowResults(false);

    // 1. Get the page text
    let results;
    try {
      results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => document.body.innerText,
      });
    } catch (e) {
      setError(`Failed to access page content. Try reloading the page. Error: ${e.message}`);
      setIsLoading(false);
      return;
    }

    const articleText = results[0].result;
    if (!articleText || articleText.length < 100) {
      setError("No article text found on this page.");
      setIsLoading(false);
      return;
    }

    // 2. Send text and URL to our backend
    try {
      const response = await fetch('http://localhost:3001/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleText: articleText,
          articleUrl: activeTab.url
        }),
      });

      if (!response.ok) {
        // This will now catch the 401 error
        const errData = await response.json();
        throw new Error(`Backend error: ${response.status} ${errData.error || response.statusText}`);
      }

      const data = await response.json();
      setAnalysis(data);
      setShowResults(true); // Trigger animation
      setFilter(null); // Reset filter
      
      // Once analysis is done, highlight the claims!
      if (data.results) {
        runHighlight(data.results);
      }

    } catch (e) {
      setError(`Analysis failed. Is your backend server running? Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats for summary card
  const stats = analysis ? {
    verified: analysis.results.filter(c => c.status === 'Verified').length,
    questionable: analysis.results.filter(c => c.status === 'Questionable').length,
    disputed: analysis.results.filter(c => c.status === 'Disputed').length
  } : { verified: 0, questionable: 0, disputed: 0 };

  return (
    <div className="min-h-screen w-full overflow-y-auto scrollbar-thin p-4">
      <Header onSettingsClick={handleSettingsClick} />

      {/* Main button row */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleVerifyClick}
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-lg text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover hover:-translate-y-px hover:shadow-lg hover:shadow-blue-200 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Page'}
        </button>
        <button
          onClick={runClearHighlights}
          disabled={isLoading}
          className="px-4 py-3 rounded-lg text-[13px] font-semibold bg-white text-gray-700 border-[1.5px] border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50"
          title="Clear highlights from page"
        >
          Clear
        </button>
      </div>

      {/* This is where we show our results */}
      <div>
        {isLoading && <Loader />}
        {error && (
          <div className="p-4 rounded-lg bg-disputed-bg text-disputed border border-disputed">
            <p className="font-medium">{error}</p>
          </div>
        )}
        
        {/* This div applies the animation */}
        {analysis && showResults && (
          <div className="animate-fade-in-up" style={{ animationFillMode: 'forwards', opacity: 0 }}>
            <SummaryCard stats={stats} onStatClick={handleStatClick} />
            
            <SiteAnalysis siteAnalysis={analysis.siteAnalysis} />
            
            {/* Dashboard layout */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <SentimentAnalysis sentiment={analysis.sentiment} />
              <AuthorshipAnalysis authorship={analysis.authorship} />
            </div>

            <ClaimsList 
              claims={analysis.results} 
              filter={filter}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;