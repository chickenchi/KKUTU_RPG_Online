import { db } from "@/common_components/firebase";
import { get, ref, set, update } from "firebase/database";

export const sendMessage = async (
  id: string,
  message: string,
  sendingType: string,
  whisperRecipient?: string
) => {
  try {
    // 먼저 차단 여부 확인
    const blockedSnapshot = await get(ref(db, `chat/blocked/players/${id}`));
    if (blockedSnapshot.exists()) {
      alert("채팅이 정지된 상태입니다.");
      return; // 메시지 전송 취소
    }

    clearBubbleTime(id);

    const timestamp = Date.now();
    const userRef = ref(db, `chat/message/${timestamp}_${id}`);

    const userNickname = await get(ref(db, `players/${id}/nickname`));

    await set(userRef, {
      id: id,
      nickname: userNickname.val(),
      message: message,
      bubbleTime: sendingType === "all" ? 3 : 0,
      sendingType: sendingType,
      ...(sendingType === "whisper" && { whisperRecipient }),
    });

    console.log("채팅 전송 완료");
  } catch (err) {
    console.error("전송 실패", err);
  }
};

interface ChatMessage {
  id: string;
  nickname: string;
  message: string;
  bubbleTime?: number;
}

const clearBubbleTime = async (playerId: string) => {
  const chatRef = ref(db, "chat/message");
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
      await update(ref(db, `chat/message/${latestKey}`), { bubbleTime: 0 });
    }
  }
};
