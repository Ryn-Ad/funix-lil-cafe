export const COFFEE_OPTION_DELTAS = { milk: 3000, chocolate: 1000, foamy: 0, condensedMilk: 2000 }

// "stock: null" means unlimited. "image: null" falls back to the icon tile
// in ItemCard until you add a real photo (see README > Adding item photos).
export const seedSaladItems = [
  {
    id: 'salad-regular',
    name: 'Salad Reguler',
    price: 12000,
    category: 'salad',
    sauces: ['Italian', 'Wijen', 'Thousand Island'],
    stock: null,
    image: null,
  },
  {
    id: 'salad-chicken',
    name: 'Salad Ayam',
    price: 15000,
    category: 'salad',
    sauces: ['Italian', 'Wijen', 'Thousand Island'],
    stock: null,
    image: null,
  },
  {
    id: 'salad-campur',
    name: 'Salad Campur',
    price: 15000,
    category: 'salad',
    sauces: ['Italian', 'Wijen', 'Thousand Island'],
    stock: null,
    image: null,
  },
  {
    id: 'salad-campur-wareg',
    name: 'Salad Campur Wareg',
    price: 18000,
    category: 'salad',
    sauces: ['Italian', 'Wijen', 'Thousand Island'],
    stock: null,
    image: null,
  },
  {
    id: 'snack-singkong-thailand',
    name: 'Singkong Thailand',
    price: 10000,
    category: 'snack',
    sauces: null,
    stock: null,
    image: null,
  },
]

export const seedCoffeeItems = [
  { id: 'coffee-nescafe-ice-roast', name: 'Nescafe Ice Roast', price: 5000, category: 'coffee', hasOptions: true, stock: null, image: null },
  { id: 'coffee-goodday-coolin', name: "GoodDay Coolin'", price: 5000, category: 'coffee', hasOptions: true, stock: null, image: null },
  { id: 'coffee-goodday-vanilla-latte', name: 'GoodDay Vanilla Latte', price: 5000, category: 'coffee', hasOptions: true, stock: null, image: null },
  { id: 'coffee-goodday-mocafrio', name: 'GoodDay Freeze Mocafrio', price: 5000, category: 'coffee', hasOptions: true, stock: null, image: null },
  { id: 'coffee-goodday-mocaccino', name: 'GoodDay Mocaccino', price: 5000, category: 'coffee', hasOptions: true, stock: null, image: null },
  { id: 'non-coffee-milo', name: 'Milo', price: 5000, category: 'non-coffee', hasOptions: false, stock: null, image: null },
  { id: 'non-coffee-matcha', name: 'Matcha', price: 5000, category: 'non-coffee', hasOptions: true, stock: null, image: null },
]
