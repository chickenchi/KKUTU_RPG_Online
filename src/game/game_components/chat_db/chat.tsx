import { db } from "@/common_components/firebase";
import { get, ref, set, update } from "firebase/database";

export const sendMessage = async (id: string, message: string) => {
  clearBubbleTime(id);

  const timestamp = Date.now();
  const userRef = ref(db, `chat/all/${timestamp}_${id}`);

  const userNickname = await get(ref(db, `players/${id}/nickname`));

  set(userRef, {
    id: id,
    nickname: userNickname.val(),
    message: message,
    bubbleTime: 30,
  })
    .then(() => {
      console.log("채팅 전송 완료");
    })
    .catch((err) => {
      console.error("전송 실패", err);
    });
};

interface ChatMessage {
  id: string;
  nickname: string;
  message: string;
  bubbleTime?: number;
}

const clearBubbleTime = async (playerId: string) => {
  const chatRef = ref(db, "chat/all");
  const snapshot = await get(chatRef);
  const data: Record<string, ChatMessage> = snapshot.val() || {};

  const playerMessages = Object.entries(data)
    .filter(([_, msg]) => msg.id === playerId)
    .sort(
      ([keyA], [keyB]) =>
        Number(keyB.split("_")[0]) - Number(keyA.split("_")[0])
    );

  if (playerMessages.length > 0) {
    const [latestKey, latestMessage] = playerMessages[0];
    if (latestMessage.bubbleTime && latestMessage.bubbleTime > 0) {
      await update(ref(db, `chat/all/${latestKey}`), { bubbleTime: 0 });
    }
  }
};
