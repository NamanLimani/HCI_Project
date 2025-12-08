import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import IframeApp from './IframeApp.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <IframeApp />
  </StrictMode>
);

