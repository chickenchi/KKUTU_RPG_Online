import { ref, set } from "firebase/database";
import { db } from "@/common_components/firebase";

export const setNickname = (email: string, nickname: string) => {
  const userRef = ref(db, `users/${email}`);

  let status: boolean = true;

  const timestamp = Date.now();

  set(userRef, { id: `${timestamp}_${nickname}`, nickname: nickname })
    .then(() => {
      console.log("닉네임 저장 완료");
    })
    .catch((err) => {
      console.error("저장 실패", err);
      status = false;
    });

  return status;
};
