import { useState, useEffect } from 'react'
import api from '../api/client'

export default function Profile() {
  const [guide, setGuide] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    api.get('/api/v1/guides/me')
      .then((res) => { setGuide(res.data); setForm(res.data) })
      .catch(console.error)
  }, [])

  const handleSave = async () => {
    await api.put('/api/v1/guides/me', {
      name: form.name, phone: form.phone, bio: form.bio,
      location_city: form.location_city, hourly_rate: form.hourly_rate,
    })
    setEditing(false)
    const res = await api.get('/api/v1/guides/me')
    setGuide(res.data)
  }

  if (!guide) return <div className="text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <button onClick={() => editing ? handleSave() : setEditing(true)}
          className={editing ? 'btn-primary' : 'btn-secondary'}>
          {editing ? 'Save' : 'Edit'}
        </button>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Name</label>
            {editing ? (
              <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            ) : (
              <p className="font-medium">{guide.name}</p>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <p className="font-medium">{guide.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Phone</label>
            {editing ? (
              <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
            ) : (
              <p className="font-medium">{guide.phone || '-'}</p>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-500">City</label>
            {editing ? (
              <input value={form.location_city || ''} onChange={(e) => setForm({ ...form, location_city: e.target.value })} className="input" />
            ) : (
              <p className="font-medium">{guide.location_city || '-'}, {guide.location_country}</p>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-500">Hourly Rate</label>
            {editing ? (
              <input type="number" value={form.hourly_rate || 0} onChange={(e) => setForm({ ...form, hourly_rate: +e.target.value })} className="input" />
            ) : (
              <p className="font-medium">€{guide.hourly_rate}/hr</p>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-500">Verified</label>
            <p className="font-medium">{guide.verified ? 'Yes' : 'Pending'}</p>
          </div>
          <div className="col-span-2">
            <label className="text-sm text-gray-500">Bio</label>
            {editing ? (
              <textarea value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="input" rows={3} />
            ) : (
              <p className="text-gray-700">{guide.bio || 'No bio yet'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-sky-600">{guide.total_tours}</p>
          <p className="text-sm text-gray-500">Tours Completed</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-sky-600">{guide.rating?.toFixed(1) || '0.0'}</p>
          <p className="text-sm text-gray-500">Rating ({guide.total_reviews} reviews)</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-sky-600">€{(guide.total_earnings || 0).toFixed(0)}</p>
          <p className="text-sm text-gray-500">Total Earnings</p>
        </div>
      </div>

      {guide.etherfi_card_issued && (
        <div className="card mt-4 bg-green-50 border-green-200">
          <p className="font-medium text-green-800">ether.fi Card Active</p>
          <p className="text-sm text-green-600">Instant payouts enabled via ether.fi card</p>
        </div>
      )}
    </div>
  )
}
