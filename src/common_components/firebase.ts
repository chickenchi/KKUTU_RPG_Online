// firebase.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";  // ← 여기 추가
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC0yKo7Anp-LwgJv8N03I5vp0cerEHjfpI",
  authDomain: "kkutu-rpg.firebaseapp.com",
  databaseURL: "https://kkutu-rpg-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kkutu-rpg",
  storageBucket: "kkutu-rpg.firebasestorage.app",
  messagingSenderId: "1079232234843",
  appId: "1:1079232234843:web:2d2c5afbd295c6ecb1467e",
  measurementId: "G-BQ913RE9HM"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Realtime Database 객체
export const db = getDatabase(app);  // ← 이렇게 내보냄
