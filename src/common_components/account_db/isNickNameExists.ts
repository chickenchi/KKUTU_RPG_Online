import { ref, get, getDatabase } from "firebase/database";

interface Player {
  nickname: string; // nickname이 있을 수도 있고 없을 수도 있음
  [key: string]: any; // 다른 필드도 있을 수 있음
}

export const isNicknameExists = async (nickname: string) => {
  const db = getDatabase();
  const playersRef = ref(db, "players");

  try {
    const snapshot = await get(playersRef);

    if (!snapshot.exists()) {
      return false; // players 데이터 없음
    }

    const playersData: Record<string, Player> = snapshot.val();

    // nickname이 targetNickname과 일치하는지 확인
    const exists = Object.values(playersData).some(
      (player) => player.nickname.toLowerCase().replace(/\s+/g, "") === nickname
    );

    return exists;

  } catch (error) {
    console.error("데이터 조회 실패:", error);
    return false;
  }

}