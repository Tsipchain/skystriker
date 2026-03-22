interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  trend?: string
}

export default function StatsCard({ title, value, subtitle, icon, trend }: StatsCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">{title}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      {trend && <p className="text-sm text-green-600 mt-1">{trend}</p>}
    </div>
  )
}
