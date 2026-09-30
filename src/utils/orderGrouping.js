// Groups an order list into date buckets for the admin dashboards —
// newest date first, newest order first within each date.
function dateKey(ts) {
  return new Date(ts).toDateString()
}

function formatDateHeading(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
}

export function groupOrdersByDate(orders) {
  const groups = new Map()
  for (const order of orders) {
    const key = dateKey(order.submittedAt)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(order)
  }
  return Array.from(groups.entries())
    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
    .map(([, group]) => ({
      label: formatDateHeading(group[0].submittedAt),
      orders: [...group].sort((a, b) => b.submittedAt - a.submittedAt),
    }))
}
