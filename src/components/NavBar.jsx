import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, LogOut } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { useCart } from '../context/CartContext'
import ThemeToggle from './ThemeToggle'

export default function NavBar() {
  const { name, role, logout } = useUser()
  const { count } = useCart()
  const location = useLocation()

  const linkStyle = (path) => ({
    color: location.pathname === path ? 'var(--color-accent)' : 'var(--color-muted)',
  })

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-3"
      style={{ backgroundColor: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
    >
      <Link to="/" className="font-semibold" style={{ color: 'var(--color-accent)' }}>
        Funix Lil-Cafe
      </Link>

      <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
        <Link to="/salad" style={linkStyle('/salad')}>
          Salad Corner
        </Link>
        <Link to="/coffee" style={linkStyle('/coffee')}>
          Coffee Corner
        </Link>
        {(role === 'owner' || role === 'salad_admin') && (
          <Link to="/admin/salad" style={linkStyle('/admin/salad')}>
            Salad Admin
          </Link>
        )}
        {(role === 'owner' || role === 'coffee_admin') && (
          <Link to="/admin/coffee" style={linkStyle('/admin/coffee')}>
            Coffee Admin
          </Link>
        )}
        {role === 'owner' && (
          <Link to="/recipes" style={linkStyle('/recipes')}>
            Recipes
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-3">
        <span className="hidden md:inline text-xs" style={{ color: 'var(--color-muted)' }}>
          Hello, {name}
        </span>
        <ThemeToggle />
        <Link
          to="/cart"
          aria-label="Cart"
          className="relative w-9 h-9 flex items-center justify-center rounded-full pill"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <ShoppingBag size={16} />
          {count > 0 && (
            <span
              className="absolute -top-1 -right-1 text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
            >
              {count}
            </span>
          )}
        </Link>
        <button
          onClick={logout}
          aria-label="Change Name"
          className="w-9 h-9 flex items-center justify-center rounded-full pill"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  )
}
