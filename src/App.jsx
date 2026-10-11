import { Routes, Route, Navigate } from 'react-router-dom'
import { useUser } from './context/UserContext'
import NameGate from './components/NameGate'
import NavBar from './components/NavBar'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import SaladCorner from './pages/SaladCorner'
import CoffeeCorner from './pages/CoffeeCorner'
import Cart from './pages/Cart'
import AdminSalad from './pages/AdminSalad'
import AdminCoffee from './pages/AdminCoffee'
import CoffeeRecipes from './pages/CoffeeRecipes'
import Profit from './pages/Profit'
import { Route } from 'react-router-dom'
import { RequireRole } from '../../../../../../Temp/RAR_Temps/Rar$DIa8964.12206/App'
import Profit from './pages/Profit'

function RequireRole({ allow, role, children }) {
  if (!allow.includes(role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { name, role, loading } = useUser()

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-muted)' }}
      >
        <p className="text-sm">Loading&hellip;</p>
      </div>
    )
  }
  if (!name) return <NameGate />

  return (
    <div className="min-h-screen pb-16 sm:pb-0">
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/salad" element={<SaladCorner />} />
          <Route path="/coffee" element={<CoffeeCorner />} />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/admin/salad"
            element={
              <RequireRole allow={['owner', 'salad_admin']} role={role}>
                <AdminSalad />
              </RequireRole>
            }
          />
          <Route
            path="/admin/coffee"
            element={
              <RequireRole allow={['owner', 'coffee_admin']} role={role}>
                <AdminCoffee />
              </RequireRole>
            }
          />
          <Route
            path="/profit"
            element={
              <RequireRole allow={['owner']} role={role}>
                <Profit />
              </RequireRole>
            }
          />
          <Route
            path="/recipes"
            element={
              <RequireRole allow={['owner']} role={role}>
                <CoffeeRecipes />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
