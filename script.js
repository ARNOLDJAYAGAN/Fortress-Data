// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔥 FIREBASE CONFIG
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
// INPUT VALIDATION (HARDENED)
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

    // Basic malicious pattern blocking (demo-level protection)
    const dangerousPatterns = [
        /<script.*?>.*?<\/script>/gi,
        /javascript:/gi,
        /onerror=/gi,
        /onload=/gi
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(trimmed)) {
            throw new Error("Malicious input detected");
        }
    }

    return trimmed;
}



// -----------------------------
// REAL ENCRYPTION (Web Crypto AES)
// -----------------------------
const encoder = new TextEncoder();
const decoder = new TextDecoder();

let cryptoKey;

// generate key once per session
async function generateKey() {
    cryptoKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

generateKey();

async function encrypt(text) {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        encoder.encode(text)
    );

    return {
        iv: Array.from(iv),
        data: Array.from(new Uint8Array(encrypted))
    };
}

async function decrypt(payload) {
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(payload.iv) },
        cryptoKey,
        new Uint8Array(payload.data)
    );

    return decoder.decode(decrypted);
}



// -----------------------------
// SAVE NOTE (SECURED)
// -----------------------------
window.saveNote = async function () {
    try {
        let note = document.getElementById("note").value;

        note = validateInput(note);

        const encryptedNote = await encrypt(note);

        await addDoc(collection(db, "secure_notes"), {
            note: encryptedNote,
            createdAt: Date.now()
        });

        alert("Note saved securely!");
        loadNotes();

    } catch (err) {
        alert(err.message);
    }
};



// -----------------------------
// LOAD NOTES (SAFE OUTPUT)
// -----------------------------
async function loadNotes() {
    const q = query(collection(db, "secure_notes"));
    const snapshot = await getDocs(q);

    const list = document.getElementById("notesList");
    list.innerHTML = "";

    for (const doc of snapshot.docs) {
        const data = doc.data();

        try {
            const decrypted = await decrypt(data.note);

            const li = document.createElement("li");

            // SAFE OUTPUT (prevents XSS)
            li.textContent = decrypted;

            list.appendChild(li);

        } catch (e) {
            console.error("Decryption failed:", e);
        }
    }
}

loadNotes();