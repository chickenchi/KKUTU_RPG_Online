// src/App.tsx
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  isPlayerFloor,
  updatePlayerLocation,
} from "./game_components/player_db/player";
import {
  floorElementsAtom,
  playerAxisAtom,
  playerIdAtom,
} from "@/atoms/account";
import { useAtom } from "jotai";
import { isChatFocusedAtom } from "@/atoms/ui/ui";

export const Key = () => {
  const [isChatFocused] = useAtom(isChatFocusedAtom);
  const [playerId] = useAtom(playerIdAtom);

  const pressedKeys = useRef(new Set<string>());
  const isJumpingRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isChatFocused) return;
      pressedKeys.current.add(e.key);

      if (["ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        e.preventDefault(); // 기본 스크롤 방지
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isChatFocused]);

  useEffect(() => {
    if (!playerId) return;

    let velocity = 0; // y방향 속도
    const gravity = 1; // 자연스러운 중력 가속도
    const maxFallSpeed = 12; // 최대 낙하 속도

    const gravityInterval = setInterval(async () => {
      if (isJumpingRef.current) {
        velocity = 0;
        return; // 점프 중이면 중력 적용 안함
      }

      // 속도 증가 (중력 적용)
      velocity -= gravity;
      if (velocity < -maxFallSpeed) velocity = -maxFallSpeed;

      // y좌표 업데이트
      await updatePlayerLocation(playerId, "gravity", velocity);
      // 서버에서 velocity로 y 좌표를 더하도록 구현
    }, 16); // 약 60FPS

    return () => clearInterval(gravityInterval);
  }, [playerId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!playerId) return;

      const keyPress = async () => {
        // 좌우 이동
        if (
          pressedKeys.current.has("ArrowLeft") ||
          pressedKeys.current.has("a")
        ) {
          updatePlayerLocation(playerId, "left");
        }
        if (
          pressedKeys.current.has("ArrowRight") ||
          pressedKeys.current.has("d")
        ) {
          updatePlayerLocation(playerId, "right");
        }

        // 점프
        if (
          pressedKeys.current.has(" ") &&
          (await isPlayerFloor(playerId)) &&
          !isJumpingRef.current
        ) {
          isJumpingRef.current = true;
          jumpPlayer(playerId);
        }
      };

      keyPress();
    }, 16);

    return () => clearInterval(interval);
  }, [playerId, isJumpingRef]);

  const jumpPlayer = async (playerId: string) => {
    let velocity = 8; // 초기 속도
    const gravity = 7; // 감속량

    isJumpingRef.current = true;

    const jumpInterval = setInterval(async () => {
      // y값 업데이트 (위로 이동)
      await updatePlayerLocation(playerId, "jump", velocity);

      velocity -= gravity; // 위로 갈수록 속도 감소

      if (velocity <= 0) {
        // 속도가 0 이하이면 점프 종료
        clearInterval(jumpInterval);
        isJumpingRef.current = false; // 이제 중력 적용 가능
      }
    }, 16); // 약 60FPS
  };

  return null;
};

const PadContainer = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  user-select: none;
`;

const Row = styled.div`
  display: flex;
  gap: 10px;
`;

const ArrowButton = styled.button`
  width: 60px;
  height: 60px;
  background: #333;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  transition: background 0.2s;
  user-select: none; /* 텍스트 선택 방지 */
  -webkit-user-select: none; /* iOS Safari용 */
  -webkit-touch-callout: none; /* iOS에서 꾹 눌러도 복사 메뉴 안 뜸 */
  touch-action: none; /* 드래그, 줌, 스크롤 방지 */
  -webkit-tap-highlight-color: transparent; /* 터치 시 반짝임 제거 */

  &:active {
    background: #555;
    transform: scale(0.95);
  }
`;

export const MobileArrowPad = () => {
  const [playerId] = useAtom(playerIdAtom);

  const isJumpingRef = useRef<boolean>(false);

  const jumpPlayer = async (playerId: string) => {
    let velocity = 8; // 초기 속도
    const gravity = 2; // 감속량

    isJumpingRef.current = true;

    const jumpInterval = setInterval(async () => {
      // y값 업데이트 (위로 이동)
      await updatePlayerLocation(playerId, "jump", velocity);

      velocity -= gravity; // 위로 갈수록 속도 감소

      if (velocity <= 0) {
        // 속도가 0 이하이면 점프 종료
        clearInterval(jumpInterval);
        isJumpingRef.current = false; // 이제 중력 적용 가능
      }
    }, 16); // 약 60FPS
  };

  const jump = async () => {
    if (!isJumpingRef.current && (await isPlayerFloor(playerId))) {
      isJumpingRef.current = true;
      jumpPlayer(playerId);
    }
  };

  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const startMove = (direction: "left" | "right") => {
    if (intervalId) return;

    const id = setInterval(() => {
      updatePlayerLocation(playerId, direction);
    }, 10);

    setIntervalId(id);
  };

  const stopMove = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  return (
    <PadContainer>
      <Row>
        <ArrowButton onPointerDown={() => jump()}>▲</ArrowButton>
      </Row>
      <Row>
        <ArrowButton
          onPointerDown={() => startMove("left")}
          onMouseUp={stopMove}
        >
          ◀
        </ArrowButton>
        <ArrowButton
          onPointerDown={() => startMove("right")}
          onMouseUp={stopMove}
        >
          ▶
        </ArrowButton>
      </Row>
    </PadContainer>
  );
};
