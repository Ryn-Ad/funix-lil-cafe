import { Link } from 'react-router-dom'
import { Salad, Coffee } from 'lucide-react'
import { useUser } from '../context/UserContext'

export default function Home() {
  const { name } = useUser()
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
      <h1 className="text-xl font-semibold mb-1">Hello, {name}</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
        What are you in the mood for?
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/salad" className="card p-6 flex flex-col gap-3 hover:opacity-90 transition-opacity">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-accent-soft)' }}
          >
            <Salad size={20} color="var(--color-accent)" />
          </div>
          <div>
            <h2 className="text-base font-medium">Salad Corner</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              Pre-order for tomorrow
            </p>
          </div>
        </Link>
        <Link to="/coffee" className="card p-6 flex flex-col gap-3 hover:opacity-90 transition-opacity">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-accent-soft)' }}
          >
            <Coffee size={20} color="var(--color-accent)" />
          </div>
          <div>
            <h2 className="text-base font-medium">Coffee Corner</h2>
            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
              Order anytime
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
