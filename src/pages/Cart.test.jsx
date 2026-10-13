// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { useEffect, useState } from 'react'

let currentName = 'Andi'
vi.mock('../context/UserContext', () => ({ useUser: () => ({ name: currentName, role: 'customer' }) }))
vi.mock('../services/orders', () => ({ submitOrder: vi.fn() }))
// Order status normally comes from Firestore; here every order is "unpaid".
vi.mock('../hooks/useOrderStatus', () => ({
  useOrderStatus: () => ({ loading: false, exists: true, paid: false, unknown: false }),
}))

import { submitOrder } from '../services/orders'
import { CartProvider, useCart } from '../context/CartContext'
import ErrorBoundary from '../components/ErrorBoundary'
import Cart from './Cart'

function Seed({ coffee, salad }) {
  const { addCoffeeLine, addSaladLine } = useCart()
  useEffect(() => {
    if (coffee) addCoffeeLine({ itemId: 'c1', name: 'GoodDay', optionIds: ['m'], optionNames: ['Milk'], price: 8000 })
    if (salad) addSaladLine({ itemId: 's1', name: 'Garden Salad', sauceId: 'c', sauce: 'Caesar', price: 15000 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

// Mounts <Cart/> inside one long-lived provider, and lets a test unmount and
// remount just the page — exactly what navigating away and back does.
function renderApp(seed) {
  let toggle
  function Page() {
    const [show, setShow] = useState(true)
    toggle = setShow
    return show ? <Cart /> : null
  }
  const view = render(
    <CartProvider>
      <Seed {...seed} />
      <Page />
    </CartProvider>
  )
  return { ...view, leaveAndReturn: async () => {
    toggle(false)
    await waitFor(() => expect(screen.queryByText('your cart')).toBeNull())
    toggle(true)
    await screen.findByText('your cart')
  } }
}

describe('Cart: ordering and coming back', () => {
  beforeEach(() => {
    localStorage.clear()
    currentName = 'Andi'
    vi.clearAllMocks()
  })
  afterEach(cleanup)

  it('after ordering, the order and how to pay are still there when you leave and return', async () => {
    submitOrder.mockResolvedValue({ ok: true, orderId: 'abc123', total: 8000 })
    const { leaveAndReturn } = renderApp({ coffee: true })

    fireEvent.click(await screen.findByText('submit order'))
    await screen.findByText('your orders')
    expect(screen.getByText('hide payment info')).toBeTruthy() // payment shown straight after ordering
    expect(screen.getByText(/BANK A/)).toBeTruthy()

    await leaveAndReturn() // <- this used to leave an empty, useless Cart
    expect(screen.getByText('your orders')).toBeTruthy()
    expect(screen.getByText('GoodDay')).toBeTruthy()
    expect(screen.getAllByText(/Rp 8\.000/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByText('how to pay'))
    expect(screen.getByText(/BANK B/)).toBeTruthy()
  })

  it('survives a page refresh (receipt is stored on the device)', async () => {
    submitOrder.mockResolvedValue({ ok: true, orderId: 'abc123', total: 15000 })
    renderApp({ salad: true })
    fireEvent.click(await screen.findByText('submit order'))
    await screen.findByText('your orders')
    cleanup()

    renderApp({}) // a brand-new page load
    expect(await screen.findByText('Garden Salad')).toBeTruthy()
    expect(screen.getByText('Caesar sauce')).toBeTruthy()
  })

  it('a server reply with no total no longer blanks the page', async () => {
    submitOrder.mockResolvedValue({ ok: true, orderId: 'abc123' }) // <- missing total
    renderApp({ coffee: true })
    fireEvent.click(await screen.findByText('submit order'))
    await screen.findByText('your orders')
    expect(screen.getAllByText(/Rp 8\.000/).length).toBeGreaterThan(0) // falls back to the cart's own total
  })

  it("someone else's receipts on a shared device are not shown", async () => {
    submitOrder.mockResolvedValue({ ok: true, orderId: 'abc123', total: 8000 })
    renderApp({ coffee: true })
    fireEvent.click(await screen.findByText('submit order'))
    await screen.findByText('your orders')
    cleanup()

    currentName = 'Budi'
    renderApp({})
    await screen.findByText('your cart')
    expect(screen.queryByText('your orders')).toBeNull()
  })

  it('a failed order shows the reason and keeps the cart', async () => {
    submitOrder.mockRejectedValue(new Error('Coffee Corner is closed right now.'))
    renderApp({ coffee: true })
    fireEvent.click(await screen.findByText('submit order'))
    expect(await screen.findByText('Coffee Corner is closed right now.')).toBeTruthy()
    expect(screen.getByText('GoodDay')).toBeTruthy()
    expect(screen.queryByText('your orders')).toBeNull()
  })

  it('corrupted saved data cannot break the page', async () => {
    localStorage.setItem('cafe_my_orders', '{not json')
    renderApp({})
    expect(await screen.findByText('your cart')).toBeTruthy()
  })
})

describe('ErrorBoundary', () => {
  it('shows a message instead of a blank page when a component crashes', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    function Boom() {
      throw new Error('boom')
    }
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByText('something went wrong on this page')).toBeTruthy()
    expect(screen.getByText('reload')).toBeTruthy()
  })
})
