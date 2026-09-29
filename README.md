# little cafe

A pre-order app for the Salad Corner and an anytime-order Coffee Corner,
built for Ryn, Zac and Vel.

## Run it locally

```
npm install
npm run dev
```

Then open the printed `localhost` URL. Type "ryn", "zac" or "vel" (any
case) to see the owner/salad-admin/coffee-admin views, or any other name
to browse as a customer. Everything is stored in your browser's
`localStorage` for now — see `FIREBASE_SETUP.md` for wiring up a real
shared database before you invite anyone else.

## Deploy it for free

**Vercel (recommended):**
1. Push this folder to a new GitHub repo.
2. Go to https://vercel.com, sign in with GitHub, click "Add New" > "Project", and import the repo.
3. Framework preset: Vercel auto-detects **Vite**. Leave the build command
   (`npm run build`) and output directory (`dist`) as default.
4. Click **Deploy**. You'll get a live `.vercel.app` URL in about a minute.
5. If you've wired up Firebase, add the `VITE_FIREBASE_*` variables from
   your `.env` under the project's **Settings > Environment Variables**
   (select all three environments: Production, Preview, Development),
   then redeploy.

`vercel.json` in this repo already adds the rewrite rule client-side
routing needs — without it, refreshing on a route like `/salad` would
404, since Vercel would look for a real file at that path instead of
letting React Router handle it.

**GitHub Pages (alternative):**
1. `npm install -D gh-pages`
2. Add `"homepage": "https://<you>.github.io/<repo>"` to `package.json`
   and a `"deploy": "gh-pages -d dist"` script.
3. In `vite.config.js`, add `base: '/<repo>/'`.
4. `npm run build && npm run deploy`.

## Project structure

```
src/
  context/     theme, logged-in user/role, and cart state
  components/  reusable UI: cards, nav bars, pickers, the name gate
  pages/       one file per screen/route
  data/        the menu (salads, sauces, coffees, prices)
  services/    localStore.js — the mock database (swap for Firestore)
  firebase/    config.js — ready to uncomment once you set up Firebase
```

## Adding item photos

Put image files here:

```
public/images/salad/garden-fresh.jpg
public/images/coffee/nescafe-ice-roast.jpg
public/images/payment/qris-zac.png
```

Then, when adding or editing an item (via the "add item" card on each
corner page), set its image field to the matching path starting with a
slash — e.g. `/images/salad/garden-fresh.jpg`. Anything in `public/` is
served from the site root, so that path works both locally and once
deployed. Zac's QRIS code goes at `/images/payment/qris-zac.png`
specifically — that's the path the Cart page's payment screen already
looks for (see `src/pages/Cart.jsx`); until the file exists there, it
shows a placeholder telling you where to drop it. Coffee Corner has no
QRIS, only Vel's transfer number, since that's how you two split up
payment methods.

Recommended: **4:3 landscape, around 800×600px, under ~300KB**, JPEG or
WebP. That matches the card's image tile (it crops to fill, so a taller
or oddly-shaped photo will get cut off at the sides). Square 600×600
photos work fine too. Use lowercase, hyphenated file names
(`grilled-chicken.jpg`, not `Grilled Chicken.JPG`). The QRIS image is the
one exception — keep it square and uncropped (it renders with
`object-contain`, not cropped-to-fill) so the code itself stays scannable.

Items with no image keep showing the colored icon tile, so there's no
rush — add photos whenever you have them.

Once you're on Firebase, you can instead let admins upload a file
directly using **Firebase Storage** rather than hand-placing files in
`public/` — a natural next step after `FIREBASE_SETUP.md`, not covered
there yet since it's an extra service to enable.

## Colors & theme

Colors live as CSS variables in `src/index.css`, with a light-mode
override block. The dark/light toggle just adds a `light` class to
`<html>` — see `src/context/ThemeContext.jsx`.
