export default function LoadingBlock({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-3" />
        <p className="text-gray-500 text-sm">{text}</p>
      </div>
    </div>
  )
}
