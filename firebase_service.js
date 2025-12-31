
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export class DataStore {
    constructor() {
        this.db = null;
        this.auth = null;
        this.isInitialized = false;
        // This fixed collection name ensures all users across all devices see the SAME data.
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

            return new Promise((resolve) => {
                onAuthStateChanged(this.auth, (user) => {
                    if (user) {
                        console.log("Firebase: Session restored (User ID:", user.uid, ")");
                        this.isInitialized = true;
                        resolve(true);
                    } else {
                        signInAnonymously(this.auth).then(() => {
                            console.log("Firebase: New anonymous login success");
                            this.isInitialized = true;
                            resolve(true);
                        }).catch((e) => {
                            console.error("Firebase Auth Failed:", e);
                            alert("Firebase 로그인 실패: " + e.message);
                            resolve(false);
                        });
                    }
                });
            });
        } catch (error) {
            console.error("Firebase Init Error:", error);
            return false;
        }
    }

    // Realtime listener
    subscribe(key, callback) {
        if (!this.isInitialized) {
            // Fallback for offline/uninitialized
            const local = localStorage.getItem(key);
            if (local) callback(JSON.parse(local));
            return () => { };
        }

        const docRef = doc(this.db, this.collectionName, key);

        // Return the unsubscribe function
        return onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data().data;
                localStorage.setItem(key, JSON.stringify(data));
                callback(data);
            } else {
                // If doc doesn't exist yet, check local migration
                const local = localStorage.getItem(key);
                if (local) {
                    console.log(`Syncing local data to DB for ${key}...`);
                    const parsed = JSON.parse(local);
                    this.save(key, parsed);
                    callback(parsed);
                } else {
                    callback(null);
                }
            }
        }, (error) => {
            console.error(`Subscribe Error for ${key}:`, error);
            if (error.code === 'permission-denied') {
                alert(`[데이터 연동 오류] 권한이 거부되었습니다.\nFirestore 규칙을 확인해주세요. (${key})`);
            }
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
            if (e.code === 'permission-denied') {
                alert(`[저장 실패] 권한이 없습니다.\n\nFirebase Console > Firestore Database > [규칙] 탭에서 다음 내용을 허용해주세요:\n\nallow read, write: if true;`);
            }
        }
    }
}
