
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export class DataStore {
    constructor() {
        this.db = null;
        this.auth = null;
        this.isInitialized = false;
        this.collectionName = "shorts_to_benz_global";
    }

    async init() {
        try {
            const response = await fetch('./firebase-config.json');
            if (!response.ok) throw new Error("Config not found");
            const firebaseConfig = await response.json();

            const app = initializeApp(firebaseConfig);
            this.db = getFirestore(app);
            this.auth = getAuth(app);

            await signInAnonymously(this.auth);
            console.log("Firebase: Signed in anonymously");

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error("Firebase Init Error:", error);
            return false;
        }
    }

    // Realtime listener
    subscribe(key, callback) {
        if (!this.isInitialized) {
            // Fallback for offline/uninitialized: just load once from local
            const local = localStorage.getItem(key);
            if (local) callback(JSON.parse(local));
            return () => { }; // No-op unsubscribe
        }

        const docRef = doc(this.db, this.collectionName, key);

        // Return the unsubscribe function
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data().data;
                // Sync to local
                localStorage.setItem(key, JSON.stringify(data));
                callback(data);
            } else {
                // If doc doesn't exist yet, check local migration
                const local = localStorage.getItem(key);
                if (local) {
                    const parsed = JSON.parse(local);
                    this.save(key, parsed); // Upload local to DB
                    callback(parsed);
                } else {
                    callback(null); // No data
                }
            }
        }, (error) => {
            console.error(`Subscribe Error for ${key}:`, error);
        });
    }

    async load(key) {
        // ... (Keep existing load for one-time fetch needs)
        if (!this.isInitialized) {
            const local = localStorage.getItem(key);
            return local ? JSON.parse(local) : null;
        }
        try {
            const docRef = doc(this.db, this.collectionName, key);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const val = docSnap.data().data;
                localStorage.setItem(key, JSON.stringify(val));
                return val;
            } else {
                const local = localStorage.getItem(key);
                if (local) {
                    const parsed = JSON.parse(local);
                    await this.save(key, parsed);
                    return parsed;
                }
                return null;
            }
        } catch (e) {
            console.error(`Load Error ${key}:`, e);
            return null;
        }
    }

    async save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        if (!this.isInitialized) return;
        try {
            await setDoc(doc(this.db, this.collectionName, key), {
                data: data,
                updatedAt: new Date().toISOString(),
                updatedBy: this.auth.currentUser ? this.auth.currentUser.uid : 'anon'
            });
        } catch (e) {
            console.error(`Save Error ${key}:`, e);
        }
    }
}
