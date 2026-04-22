import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Pencil, Trash2, Tag, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const IDENTIFIER_TYPES = [
  { value: 'serial_number', label: 'Serial Number' },
  { value: 'unique_code',   label: 'Unique Code' },
  { value: 'both',          label: 'Serial + Code' },
  { value: 'quantity',      label: 'Quantity Only' },
]

const DEFAULT_CATEGORIES = [
  { name: 'GPS Devices',    identifierType: 'serial_number', description: 'GPS tracking devices' },
  { name: 'Radios',         identifierType: 'serial_number', description: 'Communication radios' },
  { name: 'Base Stations',  identifierType: 'both',          description: 'Radio base stations' },
  { name: 'Stationery',     identifierType: 'quantity',      description: 'Office stationery items' },
  { name: 'Laptops',        identifierType: 'serial_number', description: 'Laptops and notebooks' },
  { name: 'Other',          identifierType: 'unique_code',   description: 'Miscellaneous items' },
]

function Modal({ category, onClose, onSave }) {
  const [name, setName]                   = useState(category?.name ?? '')
  const [description, setDescription]    = useState(category?.description ?? '')
  const [identifierType, setIdentifier]  = useState(category?.identifierType ?? 'serial_number')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave({ name: name.trim(), description: description.trim(), identifierType })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{category ? 'Edit Category' : 'Add Category'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Category Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label">Identifier Type</label>
            <select className="input" value={identifierType} onChange={e => setIdentifier(e.target.value)}>
              {IDENTIFIER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
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

export default function Categories() {
  const { isManager } = useAuth()
  const [categories, setCategories] = useState([])
  const [modal, setModal]           = useState(null) // null | 'add' | category object
  const [deleting, setDeleting]     = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), snap => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const handleSeed = async () => {
    for (const cat of DEFAULT_CATEGORIES) {
      await addDoc(collection(db, 'categories'), { ...cat, createdAt: serverTimestamp() })
    }
  }

  const handleSave = async (data) => {
    if (modal && modal !== 'add') {
      await updateDoc(doc(db, 'categories', modal.id), data)
    } else {
      await addDoc(collection(db, 'categories'), { ...data, createdAt: serverTimestamp() })
    }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    await deleteDoc(doc(db, 'categories', id))
    setDeleting(null)
  }

  const identifierLabel = (type) => IDENTIFIER_TYPES.find(t => t.value === type)?.label ?? type

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">Manage inventory item types</p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            {categories.length === 0 && (
              <button className="btn-secondary" onClick={handleSeed}>Seed Defaults</button>
            )}
            <button className="btn-primary" onClick={() => setModal('add')}>
              <Plus size={16} /> Add Category
            </button>
          </div>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <Tag size={36} className="mx-auto mb-2 opacity-40" />
          <p>No categories yet. Add one or seed defaults.</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-medium text-gray-800">{cat.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge bg-indigo-50 text-indigo-700">{identifierLabel(cat.identifierType)}</span>
                {isManager && (
                  <div className="flex gap-1">
                    <button onClick={() => setModal(cat)} className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deleting === cat.id}
                      className="p-1.5 hover:bg-red-50 rounded text-red-400 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          category={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
