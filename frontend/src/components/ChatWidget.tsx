import { useState, useRef, useEffect } from 'react'
import api from '../api/client'
import type { ChatMessage } from '../types'

export default function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Γεια! Είμαι ο SkyStriker Assistant. Πώς μπορώ να βοηθήσω;' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/api/v1/assistant/chat', { message: input })
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: res.data.response,
        data: res.data.data,
        suggested_actions: res.data.suggested_actions,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error processing request.' }])
    }
    setLoading(false)
  }

  const handleAction = (action: string) => {
    setInput(action)
    sendMessage()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm">{msg.content}</pre>
              {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {msg.suggested_actions.map((a, j) => (
                    <button
                      key={j}
                      onClick={() => handleAction(a.label)}
                      className="text-xs bg-white text-sky-700 px-2 py-1 rounded-full border hover:bg-sky-50"
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl px-4 py-2 text-gray-400 text-sm">Thinking...</div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="border-t p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask me anything..."
          className="input flex-1"
        />
        <button onClick={sendMessage} disabled={loading} className="btn-primary">
          Send
        </button>
      </div>
    </div>
  )
}
