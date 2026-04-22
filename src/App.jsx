import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Categories from './pages/Categories'
import TransactionOut from './pages/TransactionOut'
import TransactionIn from './pages/TransactionIn'
import History from './pages/History'
import Users from './pages/Users'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"            element={<Dashboard />} />
              <Route path="inventory"            element={<Inventory />} />
              <Route path="inventory/categories" element={<Categories />} />
              <Route path="transactions/out"     element={<TransactionOut />} />
              <Route path="transactions/in"      element={<TransactionIn />} />
              <Route path="transactions/history" element={<History />} />
              <Route element={<ProtectedRoute requireAdmin />}>
                <Route path="users" element={<Users />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
