'use client'

import dynamic from 'next/dynamic'
import NoSSR from '../../src/components/NoSSR'

// Use dynamic import with no SSR
const App = dynamic(() => import('../../src/App'), { 
  ssr: false,
  loading: () => <div className="loading">Loading application...</div>
})

export default function Page() {
  return (
    <NoSSR fallback={<div className="loading">Loading application...</div>}>
      <App />
    </NoSSR>
  )
} 