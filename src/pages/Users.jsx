import { useEffect, useState } from 'react'
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { Users as UsersIcon, ShieldCheck, Eye, Wrench } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'

const ROLES = ['admin', 'manager', 'viewer']

const ROLE_BADGE = {
  admin:   'bg-indigo-100 text-indigo-700',
  manager: 'bg-amber-100 text-amber-700',
  viewer:  'bg-gray-100 text-gray-600',
}

const ROLE_ICON = {
  admin:   ShieldCheck,
  manager: Wrench,
  viewer:  Eye,
}

export default function Users() {
  const { currentUser } = useAuth()
  const [users, setUsers]   = useState([])
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  const handleRoleChange = async (uid, role) => {
    setSaving(uid)
    await updateDoc(doc(db, 'users', uid), { role })
    setSaving(null)
  }

  const handleToggleActive = async (uid, active) => {
    setSaving(uid)
    await updateDoc(doc(db, 'users', uid), { active: !active })
    setSaving(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500">Manage user roles and access</p>
      </div>

      <div className="card p-4 bg-amber-50 border-amber-200 text-sm text-amber-700">
        <strong>Note:</strong> To create new users, use the Firebase Authentication console and have them sign in. Their profile will be created automatically with the <em>viewer</em> role, which you can then upgrade here.
      </div>

      {users.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">
          <UsersIcon size={36} className="mx-auto mb-2 opacity-40" />
          <p>No users yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => {
                  const RoleIcon = ROLE_ICON[user.role] ?? Eye
                  const isSelf   = user.uid === currentUser?.uid
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {user.name}
                        {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-600'} flex items-center gap-1 w-fit`}>
                          <RoleIcon size={11} /> {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${user.active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {user.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {user.createdAt?.toDate ? format(user.createdAt.toDate(), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {!isSelf && (
                            <>
                              <select
                                className="input w-auto py-1 text-xs"
                                value={user.role}
                                disabled={saving === user.uid}
                                onChange={e => handleRoleChange(user.uid, e.target.value)}
                              >
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                              </select>
                              <button
                                className={`btn text-xs py-1 px-2 ${user.active !== false ? 'btn-danger' : 'btn-secondary'}`}
                                disabled={saving === user.uid}
                                onClick={() => handleToggleActive(user.uid, user.active !== false)}
                              >
                                {saving === user.uid ? '…' : user.active !== false ? 'Deactivate' : 'Activate'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
