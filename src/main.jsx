import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'
import { UserProvider } from './context/UserContext'
import { CartProvider } from './context/CartContext'
import { seedIfEmpty } from './services/localStore'
import { seedSaladItems, seedCoffeeItems } from './data/menuData'

// First run only — populates the item collections with your starting
// menu. Never overwrites items you've since added, edited, or deleted.
seedIfEmpty('saladItems', seedSaladItems)
seedIfEmpty('coffeeItems', seedCoffeeItems)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <UserProvider>
        <CartProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CartProvider>
      </UserProvider>
    </ThemeProvider>
  </StrictMode>
)
