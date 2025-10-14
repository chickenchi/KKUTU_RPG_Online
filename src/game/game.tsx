// src/App.tsx
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { PlayerFinder } from "./game_components/element_settings";
import { get, getDatabase, onValue, ref, set, update } from "firebase/database";
import {
  isPlayerFloor,
  updatePlayerLocation,
} from "./game_components/player_db/player";
import { playerAxisAtom, playerIdAtom, playerMapAtom } from "@/atoms/account";
import { useAtom } from "jotai";
import { sendMessage } from "./game_components/chat_db/chat";
import { db } from "@/common_components/firebase";
import { isMobile } from "react-device-detect";

const GameBackgroundDiv = styled.div`
  position: relative;

  width: 100%;
  height: 100%;

  overflow-x: hidden;
  overflow-y: auto;
`;

const CameraDiv = styled.div<{ offsetX: number }>`
  position: absolute;

  width: 1550px; /* 맵 전체 크기만큼 */
  height: 100%;
  transform: translate3d(${({ offsetX }) => offsetX}px, 0, 0);

  display: flex;
  flex-direction: column;
  justify-content: flex-end;
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

const ChatDiv = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;

  width: 300px;
  height: 200px;

  background-color: rgba(200, 200, 200, 0.5);

  display: flex;
  flex-direction: column;
`;

const ChatList = styled.div`
  height: 90%;

  margin: 10px;

  white-space: nowrap;

  scrollbar-width: none;
  -ms-overflow-style: none;

  overflow-x: none;
  overflow-y: auto;
`;

const InputChat = styled.input`
  height: 12%;
  outline: none;
`;

interface PlayerProps {
  x: number;
  y: number;
}

const PlayerDiv = styled.div<PlayerProps>`
  position: absolute;
  left: ${({ x }) => `${x}px`};
  bottom: ${({ y }) => `${y}px`};

  transition: all 0.15s ease-out;

  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Player = styled.img`
  width: 70px;
  height: 70px;
`;

const PlayerName = styled.p`
  background-color: rgba(100, 100, 100, 0.5);

  margin-bottom: 5px;

  color: white;
`;

const ChatBubble = styled.div`
  position: absolute;
  top: -50px;

  background-color: white;

  min-width: 80px;
  max-width: 120px;

  padding: 5px;

  border: 1px solid black;
  border-radius: 3px;
`;

interface MapPlayer {
  id: string;
  nickname: string;
  x: number;
  y: number;
}

interface PlayersProps {
  mapPlayers: MapPlayer[] | undefined;
  setMapPlayers: React.Dispatch<React.SetStateAction<MapPlayer[] | undefined>>;
}

const Players: React.FC<PlayersProps> = ({ mapPlayers, setMapPlayers }) => {
  interface PlayerFromDB {
    id: string;
    nickname: string;
    connectStatus: string;
    location: string;
    x: number;
    y: number;
  }

  interface MapPlayer {
    id: string;
    nickname: string;
    x: number;
    y: number;
  }

  const [playerMap] = useAtom(playerMapAtom);
  const [playerId] = useAtom(playerIdAtom);
  const [, setPlayerAxis] = useAtom(playerAxisAtom);

  useEffect(() => {
    const db = getDatabase();
    const playersRef = ref(db, "players");

    // 실시간 구독
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const data: Record<string, any> | null = snapshot.val();

      const playerAxis = data
        ? Object.entries(data).find(([key]) => key === playerId)
        : undefined;

      if (playerAxis) setPlayerAxis({ x: playerAxis[1].x, y: playerAxis[1].y });

      const mapPlayersData: MapPlayer[] = data
        ? Object.entries(data)
            .filter(
              ([id, player]: [string, PlayerFromDB]) =>
                player.connectStatus === "online" &&
                player.location === playerMap
            )
            .map(([id, player]: [string, PlayerFromDB]) => ({
              id: id,
              nickname: player.nickname,
              x: player.x,
              y: player.y,
            }))
        : [];

      setMapPlayers(mapPlayersData);
    });

    return () => unsubscribe(); // 구독 해제
  }, [playerId, playerMap]);

  const [otherBubbles, setOtherBubbles] = useState<Record<string, any>>({});

  useEffect(() => {
    const db = getDatabase();
    const playersRef = ref(db, `chat/all`);

    const checkBubbleTime = async () => {
      try {
        const snapshot = await get(playersRef);
        const data: Record<string, any> | null = snapshot.val();
        if (!data) return;

        const updatedOtherBubbles: Record<string, any> = {};

        for (const [chatId, chat] of Object.entries(data)) {
          if (chat.id === playerId) {
            // playerId만 감소
            if (chat.bubbleTime > 0) {
              const newBubbleTime = chat.bubbleTime - 1;
              // Firebase 업데이트
              await update(ref(db, `chat/all/${chatId}`), {
                bubbleTime: newBubbleTime,
              });
            }
          }

          // 나머지 bubbleTime > 0이면 화면에 보여주기
          if (chat.bubbleTime > 0) {
            updatedOtherBubbles[chat.id] = chat;
          }
        }

        setOtherBubbles(updatedOtherBubbles);
      } catch (err) {
        console.error("데이터 처리 실패:", err);
      }
    };

    const intervalId = setInterval(checkBubbleTime, 1000); // 0.1초마다 실행
    return () => clearInterval(intervalId);
  }, [playerId]);

  return (
    <>
      {mapPlayers &&
        mapPlayers.map((p) => (
          <PlayerDiv key={p.id} x={p.x} y={p.y}>
            {otherBubbles[p.id] && (
              <ChatBubble>
                {p.nickname}: {otherBubbles[p.id].message}
              </ChatBubble>
            )}

            <PlayerName>{p.nickname}</PlayerName>
            <Player src="/image/moremi.png" />
          </PlayerDiv>
        ))}
    </>
  );
};

const Key = () => {
  const [playerId] = useAtom(playerIdAtom);
  const pressedKeys = useRef(new Set<string>());
  const isJumpingRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      pressedKeys.current.add(e.key);

      if (["ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        e.preventDefault(); // 기본 스크롤 방지

      if (["Space"].includes(e.code)) e.preventDefault(); // 기본 스크롤 방지
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
        if (pressedKeys.current.has("ArrowLeft")) {
          updatePlayerLocation(playerId, "left");
        }
        if (pressedKeys.current.has("ArrowRight")) {
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
  }, [playerId]);

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

const Field = () => {
  const [playerId] = useAtom(playerIdAtom);
  const [playerMap, setPlayerMap] = useAtom(playerMapAtom);
  const [floorElements, setFloorElements] = useState<{ height: number }>({
    height: 44,
  });
  const [mapPlayers, setMapPlayers] = useState<MapPlayer[]>();

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
    const fieldRef = ref(db, `maps/${playerMap}/field`);
    const unsubscribe = onValue(fieldRef, (snapshot) => {
      const data = snapshot.val() || {};
      setFloorElements(data.floor);
      setPortals(data.portals);
    });

    return () => unsubscribe(); // 컴포넌트 언마운트 시 구독 해제
  }, [playerMap]);

  const [playerAxis, setPlayerAxis] = useAtom(playerAxisAtom);

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
    if (!playerAxis || !portals) return;

    let lastMoveTime = 0;

    const checkPortal = async () => {
      const now = Date.now();
      if (now - lastMoveTime < 500) return;

      const touchedPortal = Object.entries(portals).find(
        ([location, portal]) =>
          Math.hypot(playerAxis.x - portal.x, playerAxis.y - portal.y) <=
          32 /* 포탈 크기 */
      );

      if (touchedPortal) console.log(touchedPortal[0]);

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
  }, [playerAxis, portals]);

  const [cameraOffsetX, setCameraOffsetX] = useState(0);

  useEffect(() => {
    if (!playerAxis) return;

    const mapWidth = 1550;
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
      <Floor height={floorElements.height} />
      <Players mapPlayers={mapPlayers} setMapPlayers={setMapPlayers} />
      {portals !== undefined &&
        Object.entries(portals).map(([location, portal]) => (
          <Portal key={location} x={portal.x} y={portal.y} />
        ))}
    </CameraDiv>
  );
};

const Chat = () => {
  const [playerId] = useAtom(playerIdAtom);
  const [message, setMessage] = useState<string>("");

  const handleChangeMessage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage(playerId, message);
      setMessage("");
    }
  };

  interface ChatMessage {
    id: string;
    nickname: string;
    message: string;
  }

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const chatRef = ref(db, "chat/all");
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val() || {};
      const messageList: ChatMessage[] = Object.values(data);
      setMessages(messageList);
    });

    return () => unsubscribe(); // 컴포넌트 언마운트 시 구독 해제
  }, []);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  return (
    <ChatDiv>
      <ChatList>
        {messages.map((msg, index) => (
          <div key={index}>
            {msg.nickname}: {msg.message}
          </div>
        ))}
        <div ref={messageEndRef} />
      </ChatList>
      <InputChat
        type="text"
        value={message}
        onChange={handleChangeMessage}
        onKeyDown={handleKeyDown}
      />
    </ChatDiv>
  );
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

const MobileArrowPad = () => {
  const isJumpingRef = useRef<boolean>(false);
  const [playerId] = useAtom(playerIdAtom);

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

const Game = () => {
  const [playerId] = useAtom(playerIdAtom);
  const [playerMap] = useAtom(playerMapAtom);
  const [openChat, setOpenChat] = useState<boolean>(true);

  const isRegistered = useRef(false);

  useEffect(() => {
    if (isRegistered.current) return;
    isRegistered.current = true;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        console.log("/ 키 눌림!");
        setOpenChat((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <GameBackgroundDiv>
      {/* 기본 세팅 */}
      <PlayerFinder />
      {/* 맵 요소 */}
      {playerId && (
        <>
          <Key />
          {playerMap && (
            <>
              <Field />
            </>
          )}
        </>
      )}
      {/* 채팅 */}
      {openChat && <Chat />}
      {/* 모바일 UI */}
      {isMobile && <MobileArrowPad />}
    </GameBackgroundDiv>
  );
};

export default Game;
