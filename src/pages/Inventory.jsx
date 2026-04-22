import { useEffect, useState } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Pencil, Trash2, Search, Package, X, Filter } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const STATUS_OPTIONS = [
  { value: 'available',   label: 'Available',   color: 'bg-green-100 text-green-700' },
  { value: 'in_use',      label: 'In Use',      color: 'bg-amber-100 text-amber-700' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-blue-100 text-blue-700' },
  { value: 'retired',     label: 'Retired',     color: 'bg-gray-100 text-gray-600' },
]

function statusBadge(status) {
  const s = STATUS_OPTIONS.find(o => o.value === status)
  return s ? <span className={`badge ${s.color}`}>{s.label}</span> : null
}

function ItemModal({ item, categories, onClose, onSave }) {
  const [form, setForm] = useState({
    name:          item?.name          ?? '',
    categoryId:    item?.categoryId    ?? '',
    categoryName:  item?.categoryName  ?? '',
    serialNumber:  item?.serialNumber  ?? '',
    uniqueCode:    item?.uniqueCode    ?? '',
    status:        item?.status        ?? 'available',
    location:      item?.location      ?? '',
    quantity:      item?.quantity      ?? 1,
    description:   item?.description   ?? '',
  })
  const [saving, setSaving] = useState(false)

  const selectedCat = categories.find(c => c.id === form.categoryId)
  const showSerial  = selectedCat?.identifierType === 'serial_number' || selectedCat?.identifierType === 'both'
  const showCode    = selectedCat?.identifierType === 'unique_code'   || selectedCat?.identifierType === 'both'
  const showQty     = selectedCat?.identifierType === 'quantity'

  const set = (key) => (e) => {
    const val = e.target.value
    if (key === 'categoryId') {
      const cat = categories.find(c => c.id === val)
      setForm(f => ({ ...f, categoryId: val, categoryName: cat?.name ?? '' }))
    } else {
      setForm(f => ({ ...f, [key]: val }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave({ ...form, quantity: Number(form.quantity) })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{item ? 'Edit Item' : 'Add Item'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Item Name</label>
              <input className="input" value={form.name} onChange={set('name')} required />
            </div>
            <div className="col-span-2">
              <label className="label">Category</label>
              <select className="input" value={form.categoryId} onChange={set('categoryId')} required>
                <option value="">Select category…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {showSerial && (
              <div>
                <label className="label">Serial Number</label>
                <input className="input" value={form.serialNumber} onChange={set('serialNumber')} />
              </div>
            )}
            {showCode && (
              <div>
                <label className="label">Unique Code</label>
                <input className="input" value={form.uniqueCode} onChange={set('uniqueCode')} />
              </div>
            )}
            {showQty && (
              <div>
                <label className="label">Quantity</label>
                <input className="input" type="number" min="0" value={form.quantity} onChange={set('quantity')} />
              </div>
            )}
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={set('status')}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className={showSerial || showCode ? 'col-span-2' : ''}>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={set('location')} placeholder="e.g. Warehouse A" />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={set('description')} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Inventory() {
  const { isManager } = useAuth()
  const [items, setItems]           = useState([])
  const [categories, setCategories] = useState([])
  const [modal, setModal]           = useState(null)
  const [search, setSearch]         = useState('')
  const [filterCat, setFilterCat]   = useState('')
  const [filterStatus, setStatus]   = useState('')
  const [deleting, setDeleting]     = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'items'), orderBy('name')), snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const handleSave = async (data) => {
    if (modal && modal !== 'add') {
      await updateDoc(doc(db, 'items', modal.id), { ...data, updatedAt: serverTimestamp() })
    } else {
      await addDoc(collection(db, 'items'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return
    setDeleting(id)
    await deleteDoc(doc(db, 'items', id))
    setDeleting(null)
  }

  const filtered = items.filter(item => {
    const matchSearch = !search ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(search.toLowerCase()) ||
      item.uniqueCode?.toLowerCase().includes(search.toLowerCase())
    const matchCat    = !filterCat    || item.categoryId === filterCat
    const matchStatus = !filterStatus || item.status === filterStatus
    return matchSearch && matchCat && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">{items.length} total items</p>
        </div>
        {isManager && (
          <button className="btn-primary" onClick={() => setModal('add')}>
            <Plus size={16} /> Add Item
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search name, SN, code…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input w-auto" value={filterStatus} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <Package size={36} className="mx-auto mb-2 opacity-40" />
          <p>No items found.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">SN / Code</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  {isManager && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500">{item.categoryName}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {item.serialNumber && <span>{item.serialNumber}</span>}
                      {item.serialNumber && item.uniqueCode && <span className="mx-1 text-gray-300">|</span>}
                      {item.uniqueCode && <span>{item.uniqueCode}</span>}
                      {!item.serialNumber && !item.uniqueCode && <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.location || '—'}</td>
                    <td className="px-4 py-3">{statusBadge(item.status)}</td>
                    {isManager && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => setModal(item)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            className="p-1.5 hover:bg-red-50 rounded text-red-400 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <ItemModal
          item={modal === 'add' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
