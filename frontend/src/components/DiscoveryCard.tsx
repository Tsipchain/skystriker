import { Link } from 'react-router-dom'

interface Props {
  to: string
  imageUrl: string
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: string
  meta?: string
}

export default function DiscoveryCard({ to, imageUrl, title, subtitle, badge, badgeColor = 'bg-sky-600', meta }: Props) {
  return (
    <Link to={to} className="card group hover:shadow-md transition-shadow">
      <div className="relative h-48 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sky-100 to-sky-200 flex items-center justify-center text-sky-400 text-4xl">
            &#9992;
          </div>
        )}
        {badge && (
          <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold text-white ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-sky-700 transition-colors">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{subtitle}</p>}
        {meta && <p className="text-xs text-gray-400 mt-2">{meta}</p>}
      </div>
    </Link>
  )
}
