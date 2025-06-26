const { supabase } = require('./supabase')

// Authentication service functions
const authService = {
  // Sign up new user
  async signUp(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) throw error
      
      return { 
        user: data.user, 
        session: data.session,
        needsConfirmation: !data.session // True if email confirmation required
      }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  },

  // Sign in existing user
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      return { 
        user: data.user, 
        session: data.session 
      }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  },

  // Sign out current user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return true
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  },

  // Get current session
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Reset password
  async resetPassword(email, redirectTo = null) {
    try {
      const resetOptions = {}
      if (redirectTo) {
        resetOptions.redirectTo = redirectTo
      } else if (typeof window !== 'undefined') {
        resetOptions.redirectTo = `${window.location.origin}/reset-password`
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, resetOptions)
      if (error) throw error
      return true
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  },

  // Update password (for authenticated users)
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
      return true
    } catch (error) {
      console.error('Update password error:', error)
      throw error
    }
  }
}

// Helper function to check if user is authenticated
const isAuthenticated = async () => {
  const session = await authService.getCurrentSession()
  return !!session?.user
}

// Helper function to get user email
const getUserEmail = async () => {
  const user = await authService.getCurrentUser()
  return user?.email
}

module.exports = { authService, isAuthenticated, getUserEmail }