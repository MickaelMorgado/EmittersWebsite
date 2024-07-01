import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SciChartSurface, SciChart3DSurface } from "scichart";

SciChartSurface.loadWasmFromCDN();
SciChart3DSurface.loadWasmFromCDN();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
