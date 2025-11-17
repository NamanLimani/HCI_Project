import { useState, useEffect } from 'react';
import Loader from './components/Loader';
import Header from './components/Header';
import SummaryCard from './components/SummaryCard';
import ClaimsList from './components/ClaimsList';
import SiteAnalysis from './components/SiteAnalysis';
import SentimentAnalysis from './components/SentimentAnalysis';
import AuthorshipAnalysis from './components/AuthorshipAnalysis';
import FullAnalysisPage from './FullAnalysisPage';
// Import our highlighter functions
import { highlightClaimsOnPage, clearHighlightsOnPage } from './utils/highlighter';

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [showResults, setShowResults] = useState(false); // For animation
  const [filter, setFilter] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);

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

  const handleShowFullAnalysis = (claim) => {
    setSelectedClaim(claim);
  };

  const handleBackToMain = () => {
    setSelectedClaim(null);
  };

  // This function gets the text and calls the backend
  const handleVerifyClick = async () => {
    if (!activeTab) {
      setError("Could not find active tab.");
      return;
    }
    
    setIsLoading(true);
    setLoadingStatus('Starting analysis...');
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

      console.log('Response status:', response.status, 'Content-Type:', response.headers.get('content-type'));
      
      if (!response.ok) {
        let errorMessage = response.statusText;
        try {
          const errData = await response.json();
          errorMessage = errData.error || errorMessage;
        } catch {
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch {
            // Use statusText as fallback
          }
        }
        throw new Error(`Backend error: ${response.status} ${errorMessage}`);
      }

      // Check if response is SSE
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('text/event-stream')) {
        console.warn('Response is not SSE, content-type:', contentType);
        // Fallback to JSON parsing for backwards compatibility
        try {
          const data = await response.json();
          setAnalysis(data);
          setShowResults(true);
          setFilter(null);
          if (data.results) {
            runHighlight(data.results);
          }
          setIsLoading(false);
          return;
        } catch (e) {
          throw new Error('Response is not SSE and not valid JSON');
        }
      }

      // Initialize analysis state
      const initialAnalysis = {
        siteAnalysis: null,
        sentiment: null,
        authorship: null,
        results: []
      };
      setAnalysis(initialAnalysis);
      setShowResults(true); // Show results container immediately
      setFilter(null);

      console.log('Starting SSE stream parsing...');
      
      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEventType = '';
      let currentData = '';
      let allClaims = [];

      const processEvent = () => {
        if (currentData && currentEventType) {
          try {
            const parsed = JSON.parse(currentData);
            console.log('SSE Event received:', currentEventType, parsed);
            
            if (currentEventType === 'status') {
              setLoadingStatus(parsed.message || '');
            } else if (currentEventType === 'step1') {
              // Update with Step 1 results
              setAnalysis(prev => ({
                ...prev,
                siteAnalysis: parsed.siteAnalysis,
                sentiment: parsed.sentiment,
                authorship: parsed.authorship
              }));
            } else if (currentEventType === 'claim') {
              // Add new claim as it arrives
              allClaims.push(parsed);
              setAnalysis(prev => ({
                ...prev,
                results: [...allClaims]
              }));
              // Highlight claims incrementally
              runHighlight([...allClaims]);
            } else if (currentEventType === 'error') {
              throw new Error(parsed.error || 'Unknown error');
            } else if (currentEventType === 'complete') {
              // Final highlight with all claims
              runHighlight(allClaims);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e, 'Data:', currentData, 'Event:', currentEventType);
          }
        }
        // Reset for next event
        currentEventType = '';
        currentData = '';
      };

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('SSE stream ended. Buffer:', buffer);
          // Process any remaining event before ending
          if (currentData) processEvent();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('Received SSE chunk:', chunk.substring(0, 100));
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          if (line.startsWith('event: ')) {
            // Process previous event if any
            if (currentData) processEvent();
            currentEventType = line.substring(7).trim();
            console.log('Found event type:', currentEventType);
          } else if (line.startsWith('data: ')) {
            currentData = line.substring(6).trim();
            console.log('Found data:', currentData.substring(0, 50));
          } else if (line === '') {
            // Empty line indicates end of event
            if (currentData) processEvent();
          }
        }
      }
      
      console.log('SSE parsing complete');

    } catch (e) {
      setError(`Analysis failed. Is your backend server running? Error: ${e.message}`);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  // Calculate stats for summary card
  const stats = analysis ? {
    verified: analysis.results.filter(c => c.status === 'Verified').length,
    questionable: analysis.results.filter(c => c.status === 'Questionable').length,
    disputed: analysis.results.filter(c => c.status === 'Disputed').length
  } : { verified: 0, questionable: 0, disputed: 0 };

  // If showing full analysis, render that instead
  if (selectedClaim) {
    return (
      <div className="min-h-screen w-full overflow-y-auto scrollbar-thin p-4">
        <FullAnalysisPage claim={selectedClaim} onBack={handleBackToMain} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto scrollbar-thin p-4">
      <Header onSettingsClick={handleSettingsClick} />

      {/* Main button row */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleVerifyClick}
          disabled={isLoading}
          className="flex-1 px-4 py-3 rounded-lg text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover hover:-translate-y-px hover:shadow-lg hover:shadow-gray-300 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed disabled:hover:translate-y-0"
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
        {isLoading && (
          <Loader status={loadingStatus || 'Analyzing article...'} />
        )}
        {error && (
          <div className="p-4 rounded-lg bg-disputed-bg text-disputed border border-disputed">
            <p className="font-medium">{error}</p>
          </div>
        )}
        
        {/* This div applies the animation */}
        {analysis && showResults && (
          <div className="animate-fade-in-up" style={{ animationFillMode: 'forwards', opacity: 0 }}>
            {analysis.siteAnalysis && analysis.sentiment && analysis.authorship && (
              <>
                <SummaryCard stats={stats} onStatClick={handleStatClick} />
                
                <SiteAnalysis siteAnalysis={analysis.siteAnalysis} />
                
                {/* Dashboard layout */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <SentimentAnalysis sentiment={analysis.sentiment} />
                  <AuthorshipAnalysis authorship={analysis.authorship} />
                </div>
              </>
            )}

            {analysis.results && analysis.results.length > 0 && (
              <ClaimsList 
                claims={analysis.results} 
                filter={filter}
                onShowFullAnalysis={handleShowFullAnalysis}
                fullAnalysis={analysis}
                articleUrl={activeTab?.url}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;