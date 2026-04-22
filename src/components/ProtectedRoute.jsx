import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ requireAdmin = false }) {
  const { currentUser, userProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  if (!currentUser) return <Navigate to="/login" replace />
  if (requireAdmin && userProfile?.role !== 'admin') return <Navigate to="/dashboard" replace />

  return <Outlet />
}
