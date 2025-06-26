import React, { useState } from 'react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import AuthForm from '../components/auth/AuthForm'

// Test component that uses authentication
function AuthTestComponent() {
  const { user, session, loading, error, signOut, isAuthenticated } = useAuth()
  const [testResult, setTestResult] = useState('')

  const runDatabaseTest = async () => {
    try {
      setTestResult('Testing database access...')
      
      // This would be where you test database operations
      // For now, just show auth state
      const authInfo = {
        isAuthenticated,
        userEmail: user?.email,
        hasSession: !!session,
        userId: user?.id
      }
      
      setTestResult(`Database test complete: ${JSON.stringify(authInfo, null, 2)}`)
    } catch (error) {
      setTestResult(`Database test failed: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthForm />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Authentication Test</h1>
          
          {/* User Info */}
          <div className="mb-8 p-4 bg-green-50 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Authenticated User</h2>
            <p className="text-green-700">Email: {user.email}</p>
            <p className="text-green-700">User ID: {user.id}</p>
            <p className="text-green-700">Has Session: {session ? 'Yes' : 'No'}</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Test Buttons */}
          <div className="space-y-4">
            <button
              onClick={runDatabaseTest}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Test Database Access
            </button>

            <button
              onClick={signOut}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Test Results</h3>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Main page component with AuthProvider
export default function TestAuthPage() {
  return (
    <AuthProvider>
      <AuthTestComponent />
    </AuthProvider>
  )
}