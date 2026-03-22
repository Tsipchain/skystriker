import { useEffect, useState } from 'react'
import api from '../api/client'
import type { GuideCard } from '../types'

export default function RoleSwitcher() {
  const [guides, setGuides] = useState<GuideCard[]>([])
  const [currentId, setCurrentId] = useState(localStorage.getItem('skystriker_guide_id') || '')

  useEffect(() => {
    api.get<GuideCard[]>('/api/v1/public/guides').then(setGuides).catch(() => {})
  }, [])

  function switchGuide(id: string) {
    localStorage.setItem('skystriker_guide_id', id)
    setCurrentId(id)
    window.location.reload()
  }

  return (
    <div className="text-sm">
      <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Switch guide</p>
      <select
        value={currentId}
        onChange={(e) => switchGuide(e.target.value)}
        className="input text-sm py-1"
      >
        <option value="">-- Select guide --</option>
        {guides.map((g) => (
          <option key={g.id} value={g.id}>
            {g.full_name}
          </option>
        ))}
      </select>
    </div>
  )
}
