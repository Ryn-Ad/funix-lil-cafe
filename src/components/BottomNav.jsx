import { Link, useLocation } from 'react-router-dom'
import { Salad, Coffee, ShoppingBag, Home, BookOpen } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'

export default function BottomNav() {
  const location = useLocation()
  const { count } = useCart()
  const { role } = useUser()

  const items = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/salad', icon: Salad, label: 'Salad' },
    { to: '/coffee', icon: Coffee, label: 'Coffee' },
    { to: '/cart', icon: ShoppingBag, label: 'Cart', badge: count },
    ...(role === 'owner' ? [{ to: '/recipes', icon: BookOpen, label: 'Recipes' }] : []),
  ]

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 flex justify-around py-2 z-10"
      style={{ backgroundColor: 'var(--color-bg-soft)', borderTop: '1px solid var(--color-border)' }}
    >
      {items.map(({ to, icon: Icon, label, badge }) => {
        const active = location.pathname === to
        return (
          <Link
            key={to}
            to={to}
            className="relative flex flex-col items-center gap-1 px-3 py-1 text-[11px]"
            style={{ color: active ? 'var(--color-accent)' : 'var(--color-muted)' }}
          >
            <Icon size={18} />
            {label}
            {badge > 0 && (
              <span
                className="absolute -top-0.5 right-1 text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
              >
                {badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
