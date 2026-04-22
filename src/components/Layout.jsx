import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, LogOut, Users,
  ArrowUpCircle, ArrowDownCircle, ClipboardList, Menu, X, ChevronDown,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-brand-700 text-white'
      : 'text-indigo-100 hover:bg-brand-700/60 hover:text-white'
  }`

function NavGroup({ label, icon: Icon, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-indigo-300"
      >
        <span className="flex items-center gap-2"><Icon size={14} />{label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="ml-2 mt-1 space-y-0.5">{children}</div>}
    </div>
  )
}

export default function Layout() {
  const { userProfile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-brand-700">
        <div className="flex items-center gap-2">
          <Package size={22} className="text-white" />
          <span className="font-bold text-white text-lg leading-tight">OT Inventory</span>
        </div>
        <p className="text-indigo-300 text-xs mt-0.5">Stock Monitoring</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <NavLink to="/dashboard" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>

        <NavGroup label="Inventory" icon={Package}>
          <NavLink to="/inventory" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <Package size={16} /> All Items
          </NavLink>
          <NavLink to="/inventory/categories" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <Tag size={16} /> Categories
          </NavLink>
        </NavGroup>

        <NavGroup label="Transactions" icon={ClipboardList}>
          <NavLink to="/transactions/out" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <ArrowUpCircle size={16} /> Item Out
          </NavLink>
          <NavLink to="/transactions/in" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <ArrowDownCircle size={16} /> Item In
          </NavLink>
          <NavLink to="/transactions/history" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
            <ClipboardList size={16} /> History
          </NavLink>
        </NavGroup>

        {isAdmin && (
          <NavGroup label="Admin" icon={Users}>
            <NavLink to="/users" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
              <Users size={16} /> Users
            </NavLink>
          </NavGroup>
        )}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-brand-700">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{userProfile?.name}</p>
            <p className="text-xs text-indigo-300 capitalize">{userProfile?.role}</p>
          </div>
          <button onClick={handleSignOut} title="Sign out"
            className="ml-2 p-1.5 rounded-lg text-indigo-300 hover:bg-brand-700 hover:text-white transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-brand-900 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full bg-brand-900 shadow-xl">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-gray-800">OT Inventory</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
