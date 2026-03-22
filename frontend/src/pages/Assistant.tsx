import ChatWidget from '../components/ChatWidget'

export default function Assistant() {
  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Assistant</h1>
      <div className="flex-1 card p-0 overflow-hidden">
        <ChatWidget />
      </div>
    </div>
  )
}
