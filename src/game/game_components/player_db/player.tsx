import { db } from "@/common_components/firebase";
import { get, ref, runTransaction, set } from "firebase/database";

export const findPlayer = async (
  id: string
): Promise<{
  connectStatus: string;
  location: string;
  x: number;
  y: number;
} | null> => {
  const userRef = ref(db, `players/${id}`);
  const snapshot = await get(userRef);

  return snapshot.val() ? snapshot.val() : null;
};

export const setPlayerSetting = async (id: string, nickname: string) => {
  const userRef = ref(db, `players/${id}`);

  let status: boolean = true;

  set(userRef, {
    nickname: nickname,
    connectStatus: "online",
    location: "potatina",
    x: 10,
    y: 300,
  })
    .then(() => {
      console.log("플레이어 기본 위치 지정 완료");
    })
    .catch((err) => {
      console.error("저장 실패", err);
      status = false;
    });

  return status;
};

type Direction = "left" | "right" | "jump" | "gravity";

export const updatePlayerLocation = async (
  id: string,
  direction: Direction,
  figure?: number
) => {
  const MOVE_STEP = 5;

  const playerLocation = await get(ref(db, `players/${id}/location`));
  const mapSize = await get(ref(db, `maps/${playerLocation.val()}/mapSize`));
  const locationFloor = await get(
    ref(db, `maps/${playerLocation.val()}/field/floor/height`)
  );

  const axis = direction === "left" || direction === "right" ? "x" : "y";
  const playerRef = ref(db, `players/${id}/${axis}`);

  const currentSnapshot = await get(playerRef);
  const currentPos = currentSnapshot.val();
  const floor = locationFloor.val();

  // ✅ 효율 개선 포인트:
  // 중력일 때, 이미 바닥에 닿아 있으면 굳이 runTransaction 호출하지 않음
  if (direction === "gravity" && (currentPos <= floor || !figure)) return;

  await runTransaction(playerRef, (pos) => {
    switch (direction) {
      case "left":
        if (pos > 0) pos -= MOVE_STEP;
        break;

      case "right":
        if (mapSize.val().width > pos) pos += MOVE_STEP;
        break;

      case "jump":
        pos += figure ?? 0;
        break;

      case "gravity":
        pos += figure!; // figure는 위에서 null 체크 끝남
        if (pos < floor) pos = floor;
        break;
    }

    return pos;
  });
};

export const isPlayerFloor = async (id: string) => {
  const playerLocationSnap = await get(ref(db, `players/${id}/location`));
  const playerLocation = playerLocationSnap.val();

  const floorSnap = await get(
    ref(db, `maps/${playerLocation}/field/floor/height`)
  );
  const floorY = floorSnap.val();

  const playerYSnap = await get(ref(db, `players/${id}/y`));
  const playerY = playerYSnap.val();

  return playerY === floorY;
};
