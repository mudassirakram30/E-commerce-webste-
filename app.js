// ============================================
// app.js — Firebase eCommerce App Logic
// Includes: Auth, Realtime DB, Storage (image upload)
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  remove,
  onValue,
  query,
  limitToLast,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ──────────────────────────────────────────────
// 🔥 FIREBASE CONFIG
// ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyAY8JRgXXlO5Mutb0otOkwv7yZFTyn1t6E",
  authDomain:        "ecommerce-web-73dbf.firebaseapp.com",
  databaseURL:       "https://ecommerce-web-73dbf-default-rtdb.firebaseio.com",
  projectId:         "ecommerce-web-73dbf",
  storageBucket:     "ecommerce-web-73dbf.firebasestorage.app",
  messagingSenderId: "234407828753",
  appId:             "1:234407828753:web:365b2cc62ae9db992f00b0",
};

// ── Initialize Firebase ──
const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const db       = getDatabase(app);
const storage  = getStorage(app);
const provider = new GoogleAuthProvider();

// ── Toast Notification ──
export function showToast(message, type = "info") {
  const old = document.getElementById("toast");
  if (old) old.remove();
  const toast = document.createElement("div");
  toast.id        = "toast";
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── Upload image to Firebase Storage ──
// Resolves to the public download URL string.
// onProgress(percent) is called during upload.
export function uploadImage(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Only image files are allowed."));
    }
    if (file.size > 5 * 1024 * 1024) {
      return reject(new Error("Image must be smaller than 5MB."));
    }
    const filename   = "products/" + Date.now() + "_" + file.name;
    const imgRef     = storageRef(storage, filename);
    const uploadTask = uploadBytesResumable(imgRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) onProgress(percent);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

// ── Add a product ──
export async function addProduct(product) {
  if (!product.name.trim() || !product.price || !product.image) {
    throw new Error("All fields are required.");
  }
  if (isNaN(product.price) || Number(product.price) <= 0) {
    throw new Error("Price must be a positive number.");
  }
  await push(ref(db, "products"), {
    name:  product.name.trim(),
    desc:  product.desc ? product.desc.trim() : '',
    price: Number(product.price),
    image: product.image,
  });
}

// ── Delete a product ──
export async function deleteProduct(id) {
  await remove(ref(db, "products/" + id));
}

// ── Real-time product listener ──
export function listenToProducts(callback) {
  const productsRef = query(ref(db, "products"), limitToLast(50));
  onValue(productsRef, (snapshot) => {
    const products = [];
    snapshot.forEach((child) => {
      products.push({ id: child.key, ...child.val() });
    });
    callback(products);
  });
}

// ── Auth: Sign Up ──
export async function signUp(email, password) {
  if (!email || !password) throw new Error("Email and password are required.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");
  await createUserWithEmailAndPassword(auth, email, password);
}

// ── Auth: Login ──
export async function login(email, password) {
  if (!email || !password) throw new Error("Email and password are required.");
  await signInWithEmailAndPassword(auth, email, password);
}

// ── Auth: Google ──
export async function loginWithGoogle() {
  await signInWithPopup(auth, provider);
}

// ── Auth: Logout ──
export async function logout() {
  await signOut(auth);
}

// ── Auth: State Listener ──
export function onAuthChange(callback) {
  onAuthStateChanged(auth, callback);
}