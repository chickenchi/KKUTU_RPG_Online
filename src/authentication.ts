// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// 로그인 함수 예시
export async function googleSignIn() {
  try {
    const result = await signInWithPopup(auth, provider);
    // 로그인 성공 시 사용자 정보는 result.user에서 확인
    return result.user;
  } catch (err) {
    console.error("구글 로그인 실패", err);
    return null;
  }
}
