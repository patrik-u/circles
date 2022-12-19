import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import config from "../Config";

// Initialize Firebase
const app = initializeApp(config.firebase);

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage(app);
//auth.languageCode = "se";

export default db;
