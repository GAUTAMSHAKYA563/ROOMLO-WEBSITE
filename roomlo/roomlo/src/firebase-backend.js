/**
 * ══════════════════════════════════════════════════════════════
 * ROOMLO — FIREBASE BACKEND (single file)
 * ══════════════════════════════════════════════════════════════
 * Drop this file into your project as `src/firebase-backend.js`
 * (or `firebaseBackend.js`) and import the functions you need
 * into your main App.jsx.
 *
 * NOTE: This will NOT run inside Claude's artifact preview iframe
 * (sandboxed — no external network / Firebase SDK access there).
 * Use this in your own React app (Vite / CRA / Next.js) after
 * running `npm install firebase`.
 *
 * SETUP CHECKLIST:
 * 1. Go to console.firebase.google.com → Create Project
 * 2. Build → Authentication → Sign-in method → enable "Phone"
 * 3. Build → Firestore Database → Create database (production mode)
 * 4. Project settings → General → "Your apps" → Add Web App → copy config below
 * 5. In Firestore rules (for now, dev only — tighten before launch):
 *
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        match /{document=**} {
 *          allow read, write: if request.auth != null;
 *        }
 *      }
 *    }
 * ══════════════════════════════════════════════════════════════
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

// ══════════════════════════════════════════
// 1. FIREBASE CONFIG — replace with your own
// ══════════════════════════════════════════
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ══════════════════════════════════════════
// 2. PHONE OTP AUTH
// ══════════════════════════════════════════

/**
 * Call this once, right after your OTP screen mounts.
 * Needs an invisible container element with this exact id
 * somewhere in your JSX: <div id="recaptcha-container"></div>
 */
export function setupRecaptcha() {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
  }
  return window.recaptchaVerifier;
}

/**
 * Sends OTP to +91 mobile number.
 * Returns a `confirmationResult` — keep it in state, you'll
 * need it in confirmOtp() below.
 */
export async function sendOtp(mobile10Digit) {
  const verifier = setupRecaptcha();
  const fullNumber = "+91" + mobile10Digit;
  const confirmationResult = await signInWithPhoneNumber(auth, fullNumber, verifier);
  return confirmationResult;
}

/**
 * Confirms the 6-digit OTP the user typed.
 * Returns the Firebase user object on success.
 */
export async function confirmOtp(confirmationResult, otpCode) {
  const result = await confirmationResult.confirm(otpCode);
  return result.user; // has .uid, .phoneNumber
}

export function logout() {
  return fbSignOut(auth);
}

/**
 * Subscribe to login state changes anywhere in your app:
 *   useEffect(() => watchAuthState(setUser), []);
 */
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

// ══════════════════════════════════════════
// 3. USER PROFILE (Firestore: "users" collection)
// ══════════════════════════════════════════

/**
 * Call right after signup (first-time login) to create the
 * user's profile document. uid comes from the Firebase auth user.
 */
export async function createUserProfile(uid, { name, mobile, role }) {
  await setDoc(doc(db, "users", uid), {
    name,
    mobile,
    role, // "renter" | "owner"
    savedRoomIds: [],
    joinedAt: serverTimestamp(),
  });
}

/** Fetch a user's profile doc (null if it doesn't exist yet). */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(uid, partialData) {
  await updateDoc(doc(db, "users", uid), partialData);
}

// ══════════════════════════════════════════
// 4. SAVED / FAVOURITE ROOMS
// ══════════════════════════════════════════

export async function saveRoomForUser(uid, roomId) {
  await updateDoc(doc(db, "users", uid), {
    savedRoomIds: arrayUnion(roomId),
  });
}

export async function unsaveRoomForUser(uid, roomId) {
  await updateDoc(doc(db, "users", uid), {
    savedRoomIds: arrayRemove(roomId),
  });
}

// ══════════════════════════════════════════
// 5. ROOMS (Firestore: "rooms" collection)
// ══════════════════════════════════════════

/** Fetch every room listing. */
export async function getAllRooms() {
  const snap = await getDocs(collection(db, "rooms"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Fetch only rooms posted by a given owner uid. */
export async function getRoomsByOwner(ownerUid) {
  const q = query(collection(db, "rooms"), where("ownerUid", "==", ownerUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Owner adds a new room listing. roomId can be any unique string. */
export async function addRoom(roomId, roomData, ownerUid) {
  await setDoc(doc(db, "rooms", roomId), {
    ...roomData,
    ownerUid,
    createdAt: serverTimestamp(),
  });
}

export async function updateRoom(roomId, partialData) {
  await updateDoc(doc(db, "rooms", roomId), partialData);
}

export async function deleteRoomDoc(roomId) {
  await deleteDoc(doc(db, "rooms", roomId));
}

// ══════════════════════════════════════════
// 6. ADMIN — users list / ban / delete
// ══════════════════════════════════════════

/** Fetch every registered user (for the admin panel). */
export async function getAllUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setUserBanned(uid, banned) {
  await updateDoc(doc(db, "users", uid), { banned });
}

export async function deleteUserDoc(uid) {
  await deleteDoc(doc(db, "users", uid));
}

// ══════════════════════════════════════════
// 7. CHAT (per room + user)
// ══════════════════════════════════════════
// Each conversation lives in one Firestore doc at chats/{roomId_uid}
// with a `messages` array field. Simple and cheap for a demo chat;
// swap for a "messages" subcollection later if you need pagination
// or real-time multi-device sync.

function chatDocId(roomId, uid) {
  return `${roomId}_${uid}`;
}

export async function getChatMessages(roomId, uid) {
  const snap = await getDoc(doc(db, "chats", chatDocId(roomId, uid)));
  return snap.exists() ? snap.data().messages || [] : null;
}

export async function saveChatMessages(roomId, uid, messages) {
  await setDoc(
    doc(db, "chats", chatDocId(roomId, uid)),
    { roomId, uid, messages, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function isChatUnlocked(roomId, uid) {
  const snap = await getDoc(doc(db, "chats", chatDocId(roomId, uid)));
  return snap.exists() ? !!snap.data().unlocked : false;
}

export async function unlockChat(roomId, uid) {
  await setDoc(
    doc(db, "chats", chatDocId(roomId, uid)),
    { roomId, uid, unlocked: true, unlockedAt: serverTimestamp() },
    { merge: true }
  );
}

/*
 ══════════════════════════════════════════════════════════════
 EXAMPLE USAGE INSIDE YOUR AuthModal (replaces the fake OTP logic)
 ══════════════════════════════════════════════════════════════

 import { sendOtp, confirmOtp, createUserProfile, getUserProfile } from "./firebase-backend";

 // step 1 — send otp
 const confirmationRef = useRef(null);
 const handleSendOtp = async () => {
   const confirmation = await sendOtp(mobile);
   confirmationRef.current = confirmation;
   setStep(2);
 };

 // step 2 — verify otp
 const handleVerifyOtp = async () => {
   const fbUser = await confirmOtp(confirmationRef.current, otp);
   let profile = await getUserProfile(fbUser.uid);
   if (!profile) {
     await createUserProfile(fbUser.uid, { name, mobile, role });
     profile = await getUserProfile(fbUser.uid);
   }
   onSuccess(profile, profile ? "signin" : "signup");
 };

 Don't forget to add <div id="recaptcha-container"></div> somewhere
 in the AuthModal's JSX (it can be visually hidden).
 ══════════════════════════════════════════════════════════════
*/
