import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { ClipboardList, ArrowUpCircle, ArrowDownCircle, Search } from 'lucide-react'
import { format } from 'date-fns'

export default function History() {
  const [transactions, setTransactions] = useState([])
  const [search, setSearch]             = useState('')
  const [filterType, setFilterType]     = useState('')
  const [filterCat, setFilterCat]       = useState('')
  const [categories, setCategories]     = useState([])

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(200))
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setTransactions(docs)
      // collect unique categories from history
      const cats = [...new Set(docs.map(d => d.categoryName).filter(Boolean))]
      setCategories(cats)
    })
    return unsub
  }, [])

  const filtered = transactions.filter(tx => {
    const matchSearch = !search ||
      tx.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      tx.referencePerson?.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || tx.type === filterType
    const matchCat  = !filterCat  || tx.categoryName === filterCat
    return matchSearch && matchType && matchCat
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-sm text-gray-500">All inventory movements</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search item or person…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="OUT">Item Out</option>
          <option value="IN">Item In</option>
        </select>
        <select className="input w-auto" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <ClipboardList size={36} className="mx-auto mb-2 opacity-40" />
          <p>No transactions found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Reference Person</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Processed By</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date & Time</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {tx.type === 'OUT' ? (
                        <span className="badge bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                          <ArrowUpCircle size={12} /> OUT
                        </span>
                      ) : (
                        <span className="badge bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                          <ArrowDownCircle size={12} /> IN
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{tx.itemName}</td>
                    <td className="px-4 py-3 text-gray-500">{tx.categoryName}</td>
                    <td className="px-4 py-3 text-gray-700">{tx.referencePerson}</td>
                    <td className="px-4 py-3 text-gray-500">{tx.quantity}</td>
                    <td className="px-4 py-3 text-gray-500">{tx.processedByName}</td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {tx.timestamp?.toDate ? format(tx.timestamp.toDate(), 'dd MMM yyyy HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{tx.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
