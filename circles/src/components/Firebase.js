import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import config from "../Config";

// Initialize Firebase
const app = initializeApp(config.firebase);

const getFirebaseMessaging = () => {
    try {
        return getMessaging(app);
    } catch {
        return null;
    }
};

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage(app);
export const messaging = getFirebaseMessaging();
//auth.languageCode = "se";

export default db;
