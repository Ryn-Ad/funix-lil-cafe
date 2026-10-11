import { Link } from 'react-router-dom'
import { Salad, Coffee, ClipboardList, BookOpen, TrendingUp } from 'lucide-react'
import { useUser } from '../context/UserContext'

function HubCard({ to, icon: Icon, title, subtitle }) {
  return (
    <Link to={to} className="card p-6 flex flex-col gap-3 hover:opacity-90 transition-opacity">
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-accent-soft)' }}
      >
        <Icon size={20} color="var(--color-accent)" />
      </div>
      <div>
        <h2 className="text-base font-medium">{title}</h2>
        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
          {subtitle}
        </p>
      </div>
    </Link>
  )
}

export default function Home() {
  const { name, role } = useUser()
  const isOwner = role === 'owner'

  // Admin shortcuts live here so they're reachable on phones too, where
  // the bottom bar only has room for the customer pages.
  const adminCards = [
    (isOwner || role === 'salad_admin') && {
      to: '/admin/salad', icon: ClipboardList, title: 'Salad Orders', subtitle: 'Orders, paid status, open/close',
    },
    (isOwner || role === 'coffee_admin') && {
      to: '/admin/coffee', icon: ClipboardList, title: 'Coffee Orders', subtitle: 'Orders, paid status, open/close',
    },
    isOwner && { to: '/profit', icon: TrendingUp, title: 'Profit', subtitle: 'Weekly profit, capital & owners' },
    isOwner && { to: '/recipes', icon: BookOpen, title: 'Recipes', subtitle: 'Your private coffee recipes' },
  ].filter(Boolean)

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
      <h1 className="text-xl font-semibold mb-1">Hi, {name}!</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
        What are you in the mood for?
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HubCard to="/salad" icon={Salad} title="Salad Corner" subtitle="Pre-order for tomorrow!" />
        <HubCard to="/coffee" icon={Coffee} title="Coffee Corner" subtitle="Order while we're open!" />
      </div>

      {adminCards.length > 0 && (
        <>
          <p className="text-xs font-medium mt-10 mb-3" style={{ color: 'var(--color-muted)' }}>
            Admin
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {adminCards.map((c) => (
              <HubCard key={c.to} {...c} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
