// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyCxHde2XGZi1UU6f-sS-IWPWZLPRe57WvI",
    authDomain: "fortress-1ecf5.firebaseapp.com",
    projectId: "fortress-1ecf5",
    storageBucket: "fortress-1ecf5.firebasestorage.app",
    messagingSenderId: "728395966883",
    appId: "1:728395966883:web:9c2d9b2cedc2ab6cc3d216"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -----------------------------
// INPUT VALIDATION (STRICT ALLOW-LIST)
// -----------------------------
function validateInput(input) {
    if (typeof input !== "string") {
        throw new Error("Invalid input type");
    }

    const trimmed = input.trim();

    if (trimmed.length === 0) {
        throw new Error("Input cannot be empty");
    }

    if (trimmed.length > 1000) {
        throw new Error("Input too long");
    }

    // "Clean Room" Strict Allow-list: Only permits letters, numbers, spaces, and basic text punctuation.
    // This automatically blocks <, >, =, and scripts without playing whack-a-mole with bad tags.
    const safePattern = /^[a-zA-Z0-9\s.,!?'"-]+$/;

    if (!safePattern.test(trimmed)) {
        throw new Error("Invalid characters detected. Only standard text and basic punctuation are allowed.");
    }

    return trimmed;
}

// -----------------------------
// REAL ENCRYPTION UTILITIES (Web Crypto AES-GCM)
// -----------------------------
const encoder = new TextEncoder();
const decoder = new TextDecoder();

let cryptoKey;

// Generate key once per session
async function generateKey() {
    cryptoKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}
generateKey();

// Helper functions to turn raw unreadable bytes into clean text strings (Base64)
function bufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

// Encrypts text into safe, clean Base64 strings instead of long arrays of numbers
async function encrypt(text) {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        encoder.encode(text)
    );

    return {
        iv: bufferToBase64(iv),
        data: bufferToBase64(encrypted)
    };
}

// Decrypts clean Base64 payloads back to original text
async function decrypt(payload) {
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64ToBuffer(payload.iv) },
        cryptoKey,
        base64ToBuffer(payload.data)
    );

    return decoder.decode(decrypted);
}

// -----------------------------
// SAVE DATA (AT-REST PROTECTION)
// -----------------------------
window.saveNote = async function () {
    try {
        let note = document.getElementById("note").value;

        // Clean room validation check
        note = validateInput(note);

        // Advanced AES encryption
        const encryptedNote = await encrypt(note);

        await addDoc(collection(db, "secure_notes"), {
            note: encryptedNote, // Stores cleanly as strings inside an object
            createdAt: Date.now()
        });

        alert("Note saved securely!");
        loadNotes();

    } catch (err) {
        alert(err.message);
    }
};

// -----------------------------
// LOAD DATA (IN-PROCESS SAFE READ)
// -----------------------------
async function loadNotes() {
    const q = query(collection(db, "secure_notes"));
    const snapshot = await getDocs(q);

    const list = document.getElementById("notesList");
    list.innerHTML = "";

    for (const doc of snapshot.docs) {
        const data = doc.data();

        try {
            // Decrypts the clean Base64 data strings seamlessly
            const decrypted = await decrypt(data.note);

            const li = document.createElement("li");

            // SAFE OUTPUT (Prevents DOM-based XSS attacks)
            li.textContent = decrypted;
            list.appendChild(li);

        } catch (e) {
            console.error("Decryption failed for a document:", e);
        }
    }
}

loadNotes();