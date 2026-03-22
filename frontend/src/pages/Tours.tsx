import { useState, useEffect } from 'react'
import api from '../api/client'
import TourCard from '../components/TourCard'
import type { Tour } from '../types'

export default function Tours() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    title: '', category: 'cultural', price_per_person: 50, duration_hours: 2,
    city: '', description: '', max_participants: 15,
  })

  useEffect(() => {
    loadTours()
  }, [])

  const loadTours = () => {
    api.get('/api/v1/tours')
      .then((res) => setTours(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const createTour = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/api/v1/tours', form)
      setShowCreate(false)
      setForm({ title: '', category: 'cultural', price_per_person: 50, duration_hours: 2,
        city: '', description: '', max_participants: 15 })
      loadTours()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tours</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
          {showCreate ? 'Cancel' : '+ New Tour'}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={createTour} className="card mb-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input" required placeholder="Athens Food Tour" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input">
              <option value="historical">Historical</option>
              <option value="cultural">Cultural</option>
              <option value="food">Food</option>
              <option value="archaeological">Archaeological</option>
              <option value="nature">Nature</option>
              <option value="adventure">Adventure</option>
              <option value="nightlife">Nightlife</option>
              <option value="religious">Religious</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="input" placeholder="Athens" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price per person (EUR)</label>
            <input type="number" value={form.price_per_person}
              onChange={(e) => setForm({ ...form, price_per_person: +e.target.value })}
              className="input" min={1} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duration (hours)</label>
            <input type="number" value={form.duration_hours}
              onChange={(e) => setForm({ ...form, duration_hours: +e.target.value })}
              className="input" min={0.5} step={0.5} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max participants</label>
            <input type="number" value={form.max_participants}
              onChange={(e) => setForm({ ...form, max_participants: +e.target.value })}
              className="input" min={1} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input" rows={3} />
          </div>
          <div className="col-span-2">
            <button type="submit" className="btn-primary">Create Tour</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : tours.length === 0 ? (
        <p className="text-gray-400">No tours yet. Create your first one!</p>
      ) : (
        <div className="space-y-3">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      )}
    </div>
  )
}
