// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore/lite";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "little-fifteen-game.firebaseapp.com",
  projectId: "little-fifteen-game",
  storageBucket: "little-fifteen-game.appspot.com",
  messagingSenderId: "534545000048",
  appId: "1:534545000048:web:af746e3090b835b19036b5",
  measurementId: "G-1H9BQF6NPF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Requests

export type Leader = {
  id: string;
  player: string;
  time: number;
  level: string;
  date: string;
};

export async function getLeaderboard(level: string): Promise<Leader[]> {
  try {
    const colRef = collection(db, "leaderboard");
    const q = query(
      colRef,
      where("level", "==", level), // Add a where clause to filter by the 'level' field
      orderBy("time", "asc"), // Sorting by time in ascending order
      limit(10) // Limiting the results to 10
    );
    const docsRef = await getDocs(q);

    return (
      docsRef.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Leader)) || []
    );
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function addPayerToLeaderboard(player: string, time: number, level: string) {
  try {
    const oneHour = 60 * 60 * 1000;
    if (!level || !player || !time || Number.isNaN(+time) || time >= oneHour) {
      throw new Error("Invalid request body");
    }
    const docRef = await addDoc(collection(db, "leaderboard"), {
      player,
      time,
      level,
      date: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.log(error);
  }
}

// Analytics

export function trackGameStart() {
  logEvent(analytics, "fifteen_game_start");
}

export function trackGameWin(time: number, level: string) {
  logEvent(analytics, "fifteen_game_win", { time, level });
}

export function trackSignGame(player: string, time: number, level: string) {
  logEvent(analytics, "fifteen_sign_game", { player, time, level });
}
