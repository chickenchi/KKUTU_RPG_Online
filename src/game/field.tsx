// src/App.tsx
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { get, ref, update } from "firebase/database";
import { updatePlayerLocation } from "./game_components/player_db/player";
import {
  playerAxisAtom,
  playerIdAtom,
  playerMapAtom,
  playerMapSizeAtom,
  skyFloorsAtom,
} from "@/atoms/account";
import { useAtom } from "jotai";
import { db } from "@/common_components/firebase";
import { isChatFocusedAtom } from "@/atoms/ui/ui";
import { Players } from "./players";

const CameraDiv = styled.div<{ offsetX: number }>`
  position: absolute;

  width: 1550px; /* 맵 전체 크기만큼 */
  height: 100%;
  transform: translate3d(${({ offsetX }) => offsetX}px, 0, 0);

  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;

const SkyFloor = styled.div<{
  x: number;
  y: number;
  width: number;
  height: number;
}>`
  position: absolute;
  left: ${({ x }) => `${x}px`};
  bottom: ${({ y }) => `${y}px`};

  background-color: green;

  width: ${({ width }) => `${width}px`};
  height: ${({ height }) => `${height}px`};
`;

const Floor = styled.div<{ height: number }>`
  background-color: green;

  height: ${({ height }) => `${height}px`};
`;

const Portal = styled.div<{ x: number; y: number }>`
  position: absolute;
  left: ${({ x }) => `${x}px`};
  bottom: ${({ y }) => `${y + 60}px`};

  border-radius: 50%;
  background: radial-gradient(circle at center, #ff00ff, #800080 70%);
  animation: portalGlow 1.5s infinite alternate;
  cursor: pointer;

  @keyframes portalGlow {
    0% {
      transform: scale(1.3);
      box-shadow: 0 0 15px 5px rgba(172, 128, 203, 0.863);
    }
    50% {
      transform: scale(1.5);
      box-shadow: 0 0 25px 10px rgba(217, 211, 221, 1);
    }
    100% {
      transform: scale(1.3);
      box-shadow: 0 0 15px 5px rgba(172, 128, 203, 0.863);
    }
  }
`;

interface MapPlayer {
  id: string;
  nickname: string;
  x: number;
  y: number;
}

export const Field = () => {
  const [playerId] = useAtom(playerIdAtom);
  const [playerMap, setPlayerMap] = useAtom(playerMapAtom);
  const [playerMapSize, setPlayerMapSize] = useAtom(playerMapSizeAtom);
  const [floorElements, setFloorElements] = useState<{ height: number }>({
    height: 44,
  });
  const [skyFloors, setSkyFloors] = useAtom(skyFloorsAtom);
  const [mapPlayers, setMapPlayers] = useState<MapPlayer[]>();
  const [isChatFocused] = useAtom(isChatFocusedAtom);

  interface Portal {
    condition: string;
    x: number;
    y: number;
    movingAxis: {
      x: number;
      y: number;
    };
  }

  const [portals, setPortals] = useState<Record<string, Portal>>();

  useEffect(() => {
    const fetchFieldData = async () => {
      const fieldRef = ref(db, `maps/${playerMap}`);
      const snapshot = await get(fieldRef);
      const data = snapshot.val();

      // 값이 무조건 있다고 가정
      setFloorElements(data.field.floor);
      setPortals(data.field.portals);
      setSkyFloors(data.field.skyFloors);
      setPlayerMapSize(data.mapSize);
    };

    fetchFieldData();
  }, [playerMap]);

  const [playerAxis] = useAtom(playerAxisAtom);

  const pressedKeys = useRef(new Set<string>());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      pressedKeys.current.add(e.key);
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
  }, []);

  useEffect(() => {
    if (!playerAxis || !portals || isChatFocused) return;

    let lastMoveTime = 0;

    const checkPortal = async () => {
      const now = Date.now();
      if (now - lastMoveTime < 500) return;

      const touchedPortal = Object.entries(portals).find(
        ([location, portal]) =>
          Math.hypot(playerAxis.x - (portal.x - 25), playerAxis.y - portal.y) <=
          50 /* 포탈 크기 */
      );

      if (touchedPortal && pressedKeys.current.has("Enter")) {
        lastMoveTime = now;

        const playerRef = ref(db, `players/${playerId}`);
        await update(playerRef, {
          location: touchedPortal[0],
          x: touchedPortal[1].movingAxis.x,
          y: touchedPortal[1].movingAxis.y,
        });

        setPlayerMap(touchedPortal[0]);
      }
    };

    const interval = setInterval(checkPortal, 50);
    return () => clearInterval(interval);
  }, [playerAxis, portals, isChatFocused]);

  useEffect(() => {
    if (!playerAxis || !skyFloors) return;

    const playerWidth = 70;
    const playerHeight = 70;

    const checkSkyFloorCollision = () => {
      Object.values(skyFloors).forEach((skyFloor: any) => {
        const sfX = skyFloor.x;
        const sfY = skyFloor.y; // bottom 기준
        const sfWidth = skyFloor.width;
        const sfHeight = skyFloor.height;

        // SkyFloor의 실제 top-left 좌표
        const sfTop = sfY;
        const sfBottom = sfY + sfHeight;

        // console.log([sfTop, sfBottom, sfWidth, sfHeight]);

        // 플레이어 top/bottom
        const playerTop = playerAxis.y;
        const playerBottom = playerAxis.y + playerHeight;

        // console.log([playerTop, playerBottom]);

        const isColliding =
          playerAxis.x < sfX + sfWidth &&
          playerAxis.x + playerWidth > sfX &&
          playerBottom > sfTop &&
          playerTop < sfBottom;

        if (isColliding) {
          const overlapX = playerAxis.x + playerWidth / 2 - (sfX + sfWidth / 2);
          const overlapY =
            playerAxis.y + playerHeight / 2 - (sfTop + sfHeight / 2);

          const halfWidth = (playerWidth + sfWidth) / 2;
          const halfHeight = (playerHeight + sfHeight) / 2;

          const dx = halfWidth - Math.abs(overlapX);
          const dy = halfHeight - Math.abs(overlapY);

          if (dx < dy) {
            // 좌우 충돌
            if (overlapX > 0) {
              updatePlayerLocation(playerId, "right", dx);
            } else {
              updatePlayerLocation(playerId, "left", dx);
            }
          } else {
            // 위/아래 충돌
            if (overlapY > 0) {
              // 아래에서 충돌 → 점프 중단
              // updatePlayerLocation(playerId, "jump", dy);
              // isJumpingRef.current = false; // 점프 종료
            } else {
              // 위에서 충돌 → 머리 박힘
              // updatePlayerLocation(playerId, "jump", dy);
            }
          }
        }
      });
    };

    const interval = setInterval(checkSkyFloorCollision, 16); // 60FPS
    return () => clearInterval(interval);
  }, [playerAxis, skyFloors]);

  const [cameraOffsetX, setCameraOffsetX] = useState(0);

  useEffect(() => {
    if (!playerAxis) return;

    const mapWidth = playerMapSize.width + 50;
    const screenWidth = window.innerWidth;
    const centerX = screenWidth / 2;

    let targetOffset = centerX - playerAxis.x;

    // 맵 경계 체크
    if (targetOffset > 0) targetOffset = 0;
    if (targetOffset < screenWidth - mapWidth)
      targetOffset = screenWidth - mapWidth;

    // 부드럽게 이동 (lerp)
    setCameraOffsetX(targetOffset);
  }, [playerAxis]);

  return (
    <CameraDiv offsetX={cameraOffsetX}>
      <Players mapPlayers={mapPlayers} setMapPlayers={setMapPlayers} />
      {portals !== undefined &&
        Object.entries(portals).map(([location, portal]) => (
          <Portal key={location} x={portal.x} y={portal.y} />
        ))}
      {skyFloors !== undefined &&
        Object.entries(skyFloors).map(([key, skyFloor]) => (
          <SkyFloor
            key={key}
            x={skyFloor.x}
            y={skyFloor.y}
            width={skyFloor.width}
            height={skyFloor.height}
          />
        ))}
      <Floor height={floorElements.height} />
    </CameraDiv>
  );
};
