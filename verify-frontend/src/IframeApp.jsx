import { useEffect, useRef } from 'react';
import PopupApp from './PopupApp.jsx';
import './index.css';

export default function IframeApp() {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const sendHeight = () => {
      const height = el.scrollHeight;
      window.parent.postMessage({ type: 'VERIFY_IFRAME_HEIGHT', height }, '*');
    };

    const observer = new ResizeObserver(sendHeight);
    observer.observe(el);
    sendHeight(); // initial measurement

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="bg-white inline-block">
      <PopupApp />
    </div>
  );
}

