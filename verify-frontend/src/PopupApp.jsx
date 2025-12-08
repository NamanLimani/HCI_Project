import { useEffect, useMemo, useState } from 'react';
import { highlightClaimsOnPage } from './utils/highlighter';
import logo from './assets/icons/logo.svg';
import settingsIcon from './assets/icons/settings-icon.svg';

const useActiveTab = () => {
  const [activeTab, setActiveTab] = useState(null);
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setActiveTab(tabs[0]);
    });
  }, []);
  return activeTab;
};

export default function PopupApp() {
  const activeTab = useActiveTab();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [analyzedUrl, setAnalyzedUrl] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    try {
      chrome?.storage?.local?.get?.(['autoRunEnabled'], (res) => {
        setAutoRun(Boolean(res?.autoRunEnabled));
      });
    } catch (err) {
      console.warn('Failed to read auto-run setting', err);
    }
  }, []);

  useEffect(() => {
    if (!activeTab?.url) return;
    try {
      chrome?.storage?.local?.get?.(['lastAnalyzedUrl'], (res) => {
        if (res?.lastAnalyzedUrl === activeTab.url) {
          setAnalyzedUrl(activeTab.url);
        }
      });
    } catch (err) {
      console.warn('Failed to read last analyzed url', err);
    }
  }, [activeTab]);

  const markAnalyzed = (url) => {
    if (!url) return;
    setAnalyzedUrl(url);
    try {
      chrome?.storage?.local?.set?.({ lastAnalyzedUrl: url });
    } catch (err) {
      console.warn('Failed to persist analyzed url', err);
    }
  };

  const appendLog = (entry) => {
    setLogs((prev) => [...prev, { id: crypto.randomUUID(), text: entry, ts: Date.now() }]);
  };

  const disableActions = useMemo(() => {
    const alreadyAnalyzed = activeTab?.url && analyzedUrl === activeTab.url;
    return isLoading || !activeTab || alreadyAnalyzed;
  }, [isLoading, activeTab, analyzedUrl]);

  const runHighlight = (claims) => {
    if (!activeTab) return;
    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: highlightClaimsOnPage,
      args: [claims],
    });
  };

  const handleVerifyClick = async () => {
    if (!activeTab) {
      setError('No active tab found.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLogs([]);
    setLoadingStatus('Starting analysis...');
    appendLog('Fetching page content...');

    let articleText = '';
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => document.body.innerText,
      });
      articleText = results?.[0]?.result || '';
    } catch (e) {
      setError(`Failed to access page content. ${e.message}`);
      setIsLoading(false);
      return;
    }

    if (!articleText || articleText.length < 100) {
      setError('No article text found on this page.');
      setIsLoading(false);
      return;
    }

    appendLog('Sending to backend...');

    try {
      const response = await fetch('http://localhost:3001/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleText, articleUrl: activeTab.url }),
      });

      if (!response.ok) {
        let message = response.statusText;
        try {
          const errData = await response.json();
          message = errData.error || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/event-stream')) {
        const data = await response.json();
        runHighlight(data.results || []);
        appendLog('Analysis complete.');
        setLoadingStatus('');
        if (activeTab?.url) markAnalyzed(activeTab.url);
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEventType = '';
      let currentData = '';
      const allClaims = [];

      const processEvent = () => {
        if (!currentData || !currentEventType) return;
        try {
          const parsed = JSON.parse(currentData);
          if (currentEventType === 'status') {
            setLoadingStatus(parsed.message || '');
            appendLog(parsed.message || 'Processing...');
          } else if (currentEventType === 'step1') {
            appendLog('Site and tone analysis received.');
          } else if (currentEventType === 'claim') {
            allClaims.push(parsed);
            runHighlight([...allClaims]);
            appendLog(`Claim ${allClaims.length} found.`);
          } else if (currentEventType === 'complete') {
            appendLog('Analysis complete.');
          }
        } catch (e) {
          console.error('SSE parse error', e);
        } finally {
          currentEventType = '';
          currentData = '';
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (currentData) processEvent();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            if (currentData) processEvent();
            currentEventType = line.substring(7).trim();
          } else if (line.startsWith('data: ')) {
            currentData = line.substring(6).trim();
          } else if (line === '') {
            processEvent();
          }
        }
      }

      setLoadingStatus('');
      if (activeTab?.url) markAnalyzed(activeTab.url);
    } catch (e) {
      console.error(e);
      setError(`Analysis failed. ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[360px] bg-white text-gray-900 p-4 pb-5 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-900">
          <img src={logo} alt="Verify logo" width="22" height="22" />
          <span className="text-sm font-semibold text-gray-900">Verify</span>
        </div>
        {showSettings ? (
          <button
            onClick={() => setShowSettings(false)}
            className="text-[11px] text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            Close
          </button>
        ) : (
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all"
            aria-label="Settings"
          >
            <img src={settingsIcon} alt="Settings" width="18" height="18" />
          </button>
        )}
      </div>

      {showSettings ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Run analysis automatically</h2>
            <button
              onClick={() =>
                setAutoRun((v) => {
                  const next = !v;
                  try {
                    chrome?.storage?.local?.set?.({ autoRunEnabled: next });
                  } catch (err) {
                    console.warn('Failed to persist auto-run toggle', err);
                  }
                  return next;
                })
              }
              className={`w-full px-4 py-2.5 rounded-full font-semibold text-[13px] border transition-all ${
                autoRun
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {autoRun ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-900">API keys</h2>
            <p className="text-[11px] text-gray-600">Store your API keys (not wired yet).</p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={handleVerifyClick}
            disabled={disableActions}
            className={`w-full px-4 py-3 rounded-full text-[13px] font-semibold text-white transition-all ${
              isLoading
                ? 'bg-primary'
                : 'bg-primary hover:bg-primary-hover'
            } ${disableActions && !isLoading ? 'disabled:bg-slate-400 disabled:cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="verify-wave">
                  <span className="verify-wave-dot" />
                  <span className="verify-wave-dot" />
                  <span className="verify-wave-dot" />
                  <span className="verify-wave-dot" />
                </span>
              </span>
            ) : activeTab?.url && analyzedUrl === activeTab.url ? (
              'Page analyzed'
            ) : (
              'Run Analysis'
            )}
          </button>

          {error && (
            <div className="p-3 rounded-lg bg-disputed-bg text-disputed border border-disputed text-[12px]">
              {error}
            </div>
          )}

          <p className="text-[11px] text-gray-600">
            Highlights will appear on the page. Hover any highlight to view details; click a highlight to open the sidebar.
          </p>
        </div>
      )}
    </div>
  );
}

