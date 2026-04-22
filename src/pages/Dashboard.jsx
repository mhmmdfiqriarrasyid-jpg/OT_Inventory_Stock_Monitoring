import { useEffect, useState } from 'react'
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Package, CheckCircle, Clock, Tag, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { format } from 'date-fns'

const COLORS = ['#4f46e5','#7c3aed','#2563eb','#0891b2','#0d9488','#059669']

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats]               = useState({ total: 0, available: 0, inUse: 0, categories: 0 })
  const [chartData, setChartData]       = useState([])
  const [recentTx, setRecentTx]         = useState([])
  const [loadingStats, setLoadingStats] = useState(true)

  // Real-time item counts
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'items'), (snap) => {
      let available = 0, inUse = 0
      const catMap = {}
      snap.docs.forEach(d => {
        const item = d.data()
        if (item.status === 'available') available++
        if (item.status === 'in_use') inUse++
        catMap[item.categoryName] = (catMap[item.categoryName] || 0) + (item.quantity ?? 1)
      })
      setStats(s => ({ ...s, total: snap.size, available, inUse }))
      setChartData(Object.entries(catMap).map(([name, count]) => ({ name, count })))
      setLoadingStats(false)
    })
    return unsub
  }, [])

  // Real-time category count
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), snap => {
      setStats(s => ({ ...s, categories: snap.size }))
    })
    return unsub
  }, [])

  // Recent transactions (live)
  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(10))
    const unsub = onSnapshot(q, snap => {
      setRecentTx(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of inventory status</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package}     label="Total Items"  value={stats.total}      color="bg-brand-600" />
        <StatCard icon={CheckCircle} label="Available"    value={stats.available}   color="bg-green-500" />
        <StatCard icon={Clock}       label="In Use"        value={stats.inUse}       color="bg-amber-500" />
        <StatCard icon={Tag}         label="Categories"   value={stats.categories}  color="bg-purple-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Items by Category</h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 30, left: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent transactions */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Recent Transactions</h2>
          {recentTx.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className={`p-1.5 rounded-full ${tx.type === 'OUT' ? 'bg-red-100' : 'bg-green-100'}`}>
                    {tx.type === 'OUT'
                      ? <ArrowUpCircle size={14} className="text-red-500" />
                      : <ArrowDownCircle size={14} className="text-green-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{tx.itemName}</p>
                    <p className="text-xs text-gray-400">{tx.referencePerson}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {tx.timestamp?.toDate ? format(tx.timestamp.toDate(), 'dd MMM HH:mm') : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
