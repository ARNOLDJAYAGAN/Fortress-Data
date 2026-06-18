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
// SIMPLE ENCRYPTION (DEMO ONLY)
// -----------------------------
function encrypt(text) {
    return btoa(text); // base64 encode (simple demo)
}

function decrypt(text) {
    return atob(text);
}

// -----------------------------
// SAVE DATA (AT-REST PROTECTION)
// -----------------------------
window.saveNote = async function () {
    const note = document.getElementById("note").value;

    const encryptedNote = encrypt(note);

    await addDoc(collection(db, "secure_notes"), {
        note: encryptedNote,
        createdAt: new Date()
    });

    alert("Note saved securely!");
    loadNotes();
};

// -----------------------------
// LOAD DATA (IN-PROCESS SAFE READ)
// -----------------------------
async function loadNotes() {
    const q = query(collection(db, "secure_notes"));
    const snapshot = await getDocs(q);

    const list = document.getElementById("notesList");
    list.innerHTML = "";

    snapshot.forEach(doc => {
        const data = doc.data();
        const decrypted = decrypt(data.note);

        const li = document.createElement("li");
        li.textContent = decrypted;
        list.appendChild(li);
    });
}

loadNotes();