// src/App.tsx
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { PlayerFinder } from "./game_components/element_settings";

import { playerIdAtom, playerMapAtom } from "@/atoms/account";
import { useAtom } from "jotai";
import { isMobile } from "react-device-detect";
import { Field } from "./field";
import { Chat } from "./chat";
import { Key, MobileArrowPad } from "./key";

const GameBackgroundDiv = styled.div`
  background-color: #516972;
  position: relative;

  width: 100%;
  height: 100%;

  overflow-x: hidden;
  overflow-y: auto;
`;

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
