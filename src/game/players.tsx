// src/App.tsx
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { get, getDatabase, onValue, ref, set, update } from "firebase/database";
import {
  floorElementsAtom,
  playerAxisAtom,
  playerIdAtom,
  playerMapAtom,
} from "@/atoms/account";
import { useAtom } from "jotai";

const PlayerDiv = styled.div`
  position: absolute;

  transition: all 0.15s ease-out;

  display: flex;
  flex-direction: column;
  align-items: center;
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

const Player = styled.img`
  width: 70px;
  height: 70px;
`;

const PlayerName = styled.p`
  background-color: rgba(100, 100, 100, 0.5);

  margin-bottom: 0px;

  color: white;
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

export const Players: React.FC<PlayersProps> = ({
  mapPlayers,
  setMapPlayers,
}) => {
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
    const playersRef = ref(db, `chat/message`);

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
              await update(ref(db, `chat/message/${chatId}`), {
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
          <PlayerDiv style={{ left: `${p.x}px`, bottom: `${p.y}px` }}>
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
