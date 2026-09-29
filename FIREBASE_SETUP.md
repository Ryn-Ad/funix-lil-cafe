# Going live: swapping in Firebase

Right now the app stores everything in `localStorage` (see
`src/services/localStore.js`), so you can run `npm run dev` and click
through the whole thing with no setup. Do that first, get the flows right,
then come back here when you're ready for real friends on real devices.

## 1. Create the Firebase project (free)

1. Go to https://console.firebase.google.com and create a project.
2. In the project, go to **Build > Firestore Database** and create a
   database (start in production mode — the rules file below covers it).
3. Go to **Build > Authentication**, enable the **Email/Password** sign-in
   method.
4. Under **Authentication > Users**, manually add three users: one each
   for Ryn, Zac and Vel, with an email and password you choose.
5. In Firestore, create a `users` collection with one document per admin,
   where the **document ID is that user's Auth UID** (copy it from the
   Authentication tab) and the document has a single field:
   `role: "owner"` / `"salad_admin"` / `"coffee_admin"`.
6. Go to **Project settings > General > Your apps**, click the web icon
   (`</>`) to register a web app, and copy the config values it gives you.

## 2. Wire the config in

1. Copy `.env.example` to `.env` and paste in the values from step 6.
2. Uncomment the code in `src/firebase/config.js`.
3. Deploy the rules: install the Firebase CLI (`npm install -g
   firebase-tools`), run `firebase login`, `firebase init firestore`
   (point it at this project, keep the existing `firestore.rules`), then
   `firebase deploy --only firestore:rules`.

## 3. Replace the mock store

`src/services/localStore.js` exports `useCollection(key)` and
`useDoc(key, fallback)` — every page imports one of these. Swap the
insides of those two functions for real Firestore calls
(`onSnapshot`, `addDoc`, `updateDoc`, `setDoc`) and no page code needs to
change. Roughly:

- `useCollection('saladOrders')` → `onSnapshot(collection(db, 'saladOrders'), ...)`
- `orders.add(doc)` → `addDoc(collection(db, 'saladOrders'), doc)`
- `orders.update(id, patch)` → `updateDoc(doc(db, 'saladOrders', id), patch)`
- `useDoc('saladCornerSettings')` → `onSnapshot(doc(db, 'settings', 'saladCorner'), ...)`

## 4. Replace the name-only login

`src/context/UserContext.jsx` currently guesses the role from whatever
name is typed. Replace `login()`/`logout()` with
`signInWithEmailAndPassword` / `signOut` from `firebase/auth`, show a
small email/password form only for the three of you (customers still
just type a name, no account needed), and read `role` from the `users`
collection using `onAuthStateChanged`'s `uid`.

## Cost

Firebase's free "Spark" plan gives 50k reads and 20k writes a day and 1GB
storage — far more than three admins and a handful of friends ordering
lunch will ever use. No credit card required.
