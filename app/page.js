'use client'

import dynamic from 'next/dynamic'

// Use dynamic import with no SSR for the main app
const App = dynamic(() => import('../src/App'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading Retro App...</p>
      </div>
    </div>
  )
})

export default function HomePage() {
  return <App />
}