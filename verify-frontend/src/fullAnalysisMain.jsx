import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FullAnalysisPage from './FullAnalysisPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FullAnalysisPage />
  </StrictMode>,
)

