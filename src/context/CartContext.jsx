import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [saladCart, setSaladCart] = useState([])
  const [coffeeCart, setCoffeeCart] = useState([])

  const addSaladLine = (line) =>
    setSaladCart((c) => [...c, { ...line, id: crypto.randomUUID() }])
  const addCoffeeLine = (line) =>
    setCoffeeCart((c) => [...c, { ...line, id: crypto.randomUUID() }])
  const removeSaladLine = (id) => setSaladCart((c) => c.filter((l) => l.id !== id))
  const removeCoffeeLine = (id) => setCoffeeCart((c) => c.filter((l) => l.id !== id))
  const clearSaladCart = () => setSaladCart([])
  const clearCoffeeCart = () => setCoffeeCart([])

  const count = saladCart.length + coffeeCart.length

  return (
    <CartContext.Provider
      value={{
        saladCart,
        coffeeCart,
        addSaladLine,
        addCoffeeLine,
        removeSaladLine,
        removeCoffeeLine,
        clearSaladCart,
        clearCoffeeCart,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
