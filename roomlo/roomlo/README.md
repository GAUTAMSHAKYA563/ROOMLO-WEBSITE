# Roomlo

## 0. Zaroori software (agar pehle se nahi hai)
- Node.js install karo: https://nodejs.org (LTS version)
- (Optional) VS Code: https://code.visualstudio.com

## 1. Is folder ko kholo
Terminal mein is `roomlo` folder ke andar jaao:
```bash
cd roomlo
```

## 2. Dependencies install karo
```bash
npm install
```

## 3. Apna Firebase logo daalo (optional)
`public/logo.png` mein apna logo image daal do. Agar nahi daaloge, app apne aap
text-based "roomlo" logo dikha dega (fallback already coded hai).

## 4. Firebase config daalo
`src/firebase-backend.js` file kholo, top mein `firebaseConfig` object hai —
usme apne Firebase project ka config paste karo (console.firebase.google.com
→ Project Settings → Your apps → Web app se milega).

Firebase console mein ye do cheezein enable karna zaroori hai:
- **Authentication → Sign-in method → Phone** (enable karo)
- **Firestore Database** (create karo, production mode mein)

⚠️ Real OTP SMS bhejne ke liye Firebase ka **Blaze (pay-as-you-go)** plan chahiye —
free Spark plan mein sirf test phone numbers kaam karte hain.

## 5. Local mein chalao (dev/test ke liye)
```bash
npm run dev
```
Terminal mein jo link milega (jaise `http://localhost:5173`), usse browser mein kholo.

## 6. Live/production ke liye build banao
```bash
npm run build
```
Isse `dist` folder banega — ye hi live deploy hone wali final files hain.

## 7. Deploy (live karne ke liye) — koi bhi ek option chuno

### Option A — Vercel (sabse aasan)
```bash
npm install -g vercel
vercel
```
Prompts follow karo — free hosting + HTTPS + link mil jayega.

### Option B — Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# public directory: dist
# single-page app: Yes
npm run build
firebase deploy
```

## Files
- `src/App.jsx` — poora Roomlo app (UI + logic)
- `src/firebase-backend.js` — Firebase Auth (Phone OTP) + Firestore (users, rooms, saved rooms, chat, admin) ke functions
- `src/main.jsx` — React entry point
- `src/index.css` — Tailwind setup

## Production se pehle
- [ ] Hardcoded admin credentials (`roomlo_admin` / `Admin@2026#`) change karo — abhi ye sirf UI-level check hai
- [ ] Firestore security rules tighten karo (README ke pichle conversation mein diye gaye the)
- [ ] ₹20 chat-unlock abhi fake hai — real payment ke liye Razorpay/Stripe integrate karna hoga
