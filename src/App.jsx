import React, { useState, useEffect } from 'react';
import Loader from './components/Loader';
import SiteAnalysis from './components/SiteAnalysis';
import SentimentAnalysis from './components/SentimentAnalysis';
import AuthorshipAnalysis from './components/AuthorshipAnalysis';
import ClaimCard from './components/ClaimCard';
// NEW: Import our highlighter functions
import { highlightClaimsOnPage, clearHighlightsOnPage } from './utils/highlighter';

// New component for the header
function Header() {
  return (
    <div className="mb-4">
      <h1 className="font-display text-3xl font-bold text-primary">
        Verify
      </h1>
      <p className="font-sans text-muted-foreground">
        Your "Information Nutrition Label" for this page.
      </p>
    </div>
  );
}

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [showResults, setShowResults] = useState(false); // For animation

  // Get the active tab once when the component loads
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setActiveTab(tabs[0]);
    });
  }, []);

  // NEW: This function injects our highlighter onto the page
  const runHighlight = (claims) => {
    if (!activeTab) return;
    chrome.scripting.executeScript({
      // THE FIX IS HERE:
      target: { tabId: activeTab.id }, // Was 'activeDab.id'
      func: highlightClaimsOnPage,
      args: [claims], // Pass the claims as an argument
    });
  };

  // NEW: This function clears the highlights
  const runClearHighlights = () => {
    if (!activeTab) return;
    
    // Clear the analysis from our panel
    setAnalysis(null);
    setError(null);
    setShowResults(false); // Hide old results
    
    // Run the clear function on the page
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: clearHighlightsOnPage,
    });
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
      
      // 3. NEW: Once analysis is done, highlight the claims!
      if (data.results) {
        runHighlight(data.results);
      }

    } catch (e) {
      setError(`Analysis failed. Is your backend server running? Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-background min-h-screen">
      <Header />

      {/* Main button row */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleVerifyClick}
          disabled={isLoading}
          className="flex-1 bg-primary text-primary-foreground font-sans font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Page'}
        </button>
        {/* NEW: Clear Highlights Button */}
        <button
          onClick={runClearHighlights}
          disabled={isLoading}
          className="bg-slate-600 text-white font-sans font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-slate-700 transition-colors disabled:opacity-50"
          title="Clear highlights from page"
        >
          Clear
        </button>
      </div>

      {/* This is where we show our results */}
      <div>
        {isLoading && <Loader />}
        {error && (
          <div className="p-4 rounded-lg bg-disputed/20 text-disputed border border-disputed">
            <p className="font-sans font-medium">{error}</p>
          </div>
        )}
        
        {/* This div applies the animation */}
        {analysis && showResults && (
          <div className="animate-fade-in-up" style={{ animationFillMode: 'forwards', opacity: 0 }}>
            <SiteAnalysis siteAnalysis={analysis.siteAnalysis} />
            
            {/* New dashboard layout */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <SentimentAnalysis sentiment={analysis.sentiment} />
              <AuthorshipAnalysis authorship={analysis.authorship} />
            </div>

            <h2 className="font-display text-2xl font-bold text-foreground mb-3">
              Fact-Check Results
            </h2>
            <div className="space-y-3">
              {analysis.results.map((claim, index) => (
                <ClaimCard key={index} claim={claim} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;