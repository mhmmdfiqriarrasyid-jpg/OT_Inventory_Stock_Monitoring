import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { ArrowUpCircle, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function TransactionOut() {
  const { currentUser, userProfile, isManager } = useAuth()
  const [items, setItems]       = useState([])
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState({ referencePerson: '', quantity: 1, notes: '' })
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'items'), where('status', '==', 'available'))
    const unsub = onSnapshot(q, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const filtered = items.filter(item =>
    !search ||
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.serialNumber?.toLowerCase().includes(search.toLowerCase()) ||
    item.uniqueCode?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'transactions'), {
        itemId:          selected.id,
        itemName:        selected.name,
        categoryName:    selected.categoryName,
        type:            'OUT',
        quantity:        Number(form.quantity),
        referencePerson: form.referencePerson.trim(),
        notes:           form.notes.trim(),
        processedBy:     currentUser.uid,
        processedByName: userProfile?.name ?? currentUser.email,
        timestamp:       serverTimestamp(),
      })
      // Update item status
      const newStatus = selected.identifierType === 'quantity'
        ? (selected.quantity - Number(form.quantity) <= 0 ? 'in_use' : 'available')
        : 'in_use'
      await updateDoc(doc(db, 'items', selected.id), {
        status:    newStatus,
        quantity:  Math.max(0, (selected.quantity ?? 1) - Number(form.quantity)),
        updatedAt: serverTimestamp(),
      })
      setSuccess(true)
      setSelected(null)
      setForm({ referencePerson: '', quantity: 1, notes: '' })
      setSearch('')
      setTimeout(() => setSuccess(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (!isManager) return (
    <div className="card p-10 text-center text-gray-400">You don't have permission to log transactions.</div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ArrowUpCircle size={24} className="text-red-500" /> Item Out
        </h1>
        <p className="text-sm text-gray-500">Log an item leaving inventory</p>
      </div>

      {success && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          Transaction recorded successfully.
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Item search */}
        <div>
          <label className="label">Select Item (available only)</label>
          <div className="relative mb-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Search by name, SN, or code…"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelected(null) }}
            />
          </div>
          {search && !selected && (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {filtered.length === 0
                ? <p className="px-4 py-3 text-sm text-gray-400">No available items found</p>
                : filtered.map(item => (
                  <button
                    type="button"
                    key={item.id}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm"
                    onClick={() => { setSelected(item); setSearch(item.name) }}
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-400 ml-2">{item.categoryName}</span>
                    {item.serialNumber && <span className="text-gray-400 ml-2 font-mono text-xs">{item.serialNumber}</span>}
                  </button>
                ))}
            </div>
          )}
          {selected && (
            <div className="mt-1 px-3 py-2 bg-indigo-50 rounded-lg text-sm text-indigo-700 font-medium">
              Selected: {selected.name} {selected.serialNumber && `· ${selected.serialNumber}`}
            </div>
          )}
        </div>

        <div>
          <label className="label">Reference Person</label>
          <input
            className="input"
            placeholder="Name of person taking item"
            value={form.referencePerson}
            onChange={e => setForm(f => ({ ...f, referencePerson: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="label">Quantity</label>
          <input
            className="input"
            type="number"
            min="1"
            max={selected?.quantity ?? 999}
            value={form.quantity}
            onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            className="input"
            rows={2}
            placeholder="Optional notes…"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={saving || !selected}>
          {saving ? 'Saving…' : 'Record Item Out'}
        </button>
      </form>
    </div>
  )
}
