import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import '@coinbase/onchainkit/styles.css'
// Base Sepolia chain id: 84532. Some versions of OnchainKit accept a chain object; we pass id to signal network intent.
const baseSepolia = { id: 84532, name: 'Base Sepolia' }

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <OnchainKitProvider apiKey='OmEuC1U0C8Q1g420Eq4t58xYsf4MAXHD' chain={baseSepolia}>
      <App />
    </OnchainKitProvider>
  </React.StrictMode>
)
