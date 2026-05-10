import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Web3Provider } from './Web3Provider.jsx'

const savedTheme = localStorage.getItem('theme');
const initialMode = savedTheme === 'light' ? 'light' : 'dark';

// Apply dark class immediately to avoid flash of wrong theme
if (initialMode === 'dark') {
  document.documentElement.classList.add('dark');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Web3Provider mode={initialMode}>
      <App />
    </Web3Provider>
  </React.StrictMode>,
)
