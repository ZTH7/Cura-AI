import './styles.css' // CSS 必须最先导入
import React from 'react'
import { createRoot } from 'react-dom/client'
import MyApp from './pages/MyApp.jsx'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import '@coinbase/onchainkit/styles.css'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'

const config = createConfig({
  chains: [baseSepolia],
  connectors: [coinbaseWallet({ appName: 'Cura - Psychological Counseling' })],
  transports: { [baseSepolia.id]: http() },
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider apiKey='OmEuC1U0C8Q1g420Eq4t58xYsf4MAXHD' chain={baseSepolia}>
          <MyApp />
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
