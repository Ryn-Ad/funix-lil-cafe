// Option names for a coffee order line. New orders store an array of
// { id, name, price }; orders from before options became editable stored
// an object like { milk: true } — this reads both.
export function optionNames(options) {
  if (!options) return []
  if (Array.isArray(options)) return options.map((o) => o.name)
  return Object.entries(options)
    .filter(([, on]) => on)
    .map(([key]) => key)
}
