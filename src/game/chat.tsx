// src/App.tsx
import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { onValue, ref } from "firebase/database";
import { playerIdAtom, playerNicknameAtom } from "@/atoms/account";
import { useAtom } from "jotai";
import { sendMessage } from "./game_components/chat_db/chat";
import { db } from "@/common_components/firebase";
import { isChatFocusedAtom } from "@/atoms/ui/ui";
import { censorPhrase } from "./game_components/censorPhrase";
import { isNicknameExists } from "@/common_components/account_db/isNickNameExists";

const ChatDiv = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;

  background-color: rgba(50, 50, 50, 0.5);

  width: 300px;
  height: 230px;

  border-top-right-radius: 8px;

  color: #cfcfcf;
  line-height: 25px;

  display: flex;
  flex-direction: column;
`;

const ChatOptionDiv = styled.div`
  width: 100%;
  height: 20px;

  padding: 5px 0 0 5px;

  display: flex;
  align-items: center;
`;

const DefaultChatDiv = styled.div`
  display: flex;
  align-items: center;
`;
const AllChatDiv = styled(DefaultChatDiv)``;
const WhisperChatDiv = styled(DefaultChatDiv)``;

const OptionLabel = styled.label`
  margin-left: 5px;
  font-size: 11pt;
`;
const ChatRadio = styled.input`
  margin-left: 5px;
`;

const ChatList = styled.div`
  height: 90%;

  margin: 15px;

  white-space: nowrap;

  scrollbar-width: none;
  -ms-overflow-style: none;

  overflow-x: none;
  overflow-y: auto;
`;

const Message = styled.div`
  width: 100%;

  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
`;

const WhisperMessage = styled.div`
  color: #aaaaaa;
`;

const SendModeSelect = styled.select`
  background-color: rgba(0, 0, 0, 0);
  border: none;

  width: 20%;

  color: white;

  outline: none;
`;

const SendModeOption = styled.option`
  background-color: rgb(50, 50, 50);
  border-radius: none;

  accent-color: #ff7b00;

  outline: none;
`;

const InputChatDiv = styled.div`
  background-color: rgb(50, 50, 50);

  height: 17%;
  width: 100%;

  display: flex;
  flex-direction: row;
`;

const WhisperRecipientInput = styled.input`
  background-color: rgba(0, 0, 0, 0);
  width: 20%;

  color: white;
  text-align: center;
`;

const InputChat = styled.input`
  background-color: rgba(0, 0, 0, 0);
  width: 80%;

  border: none;

  color: white;
  padding-left: 5px;

  outline: none;
`;

export const Chat = () => {
  const [playerId] = useAtom(playerIdAtom);
  const [playerNickname] = useAtom(playerNicknameAtom);
  const [message, setMessage] = useState<string>("");
  const [, setIsChatFocused] = useAtom(isChatFocusedAtom);

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const [allChatChecked, setAllChatChecked] = useState(true);
  const [whisperChatChecked, setWhisperChatChecked] = useState(true);

  const [sendMode, setSendMode] = useState("all");
  const [whisperRecipient, setWhisperRecipient] = useState("");

  const handleChangeMessage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value);
  };

  const handleFocus = () => {
    setIsChatFocused(true);
  };
  const handleBlur = () => {
    setIsChatFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (message === "") return;
      if (whisperRecipient === playerNickname) {
        alert("자기 자신에게 귓속말을 보낼 수 없습니다.");
        setWhisperRecipient("");
        return;
      }

      if (!isNicknameExists(whisperRecipient)) {
        alert("해당 닉네임은 존재하지 않습니다.");
        return;
      }
      sendMessage(playerId, censorPhrase(message), sendMode, whisperRecipient);
      setMessage("");
    }
  };

  interface ChatMessage {
    id: string;
    nickname: string;
    message: string;
    sendingType: string;
    whisperRecipient: string;
  }

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const chatRef = ref(db, "chat/message");
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

  const handleSendMode = (e: any) => {
    setSendMode(e.target.value);
  };

  const handleWhisperRecipient = (e: any) => {
    setWhisperRecipient(e.target.value);
  };

  const handleAllChatClick = () => {
    setAllChatChecked(!allChatChecked);
  };

  const handleWhisperChatClick = () => {
    setWhisperChatChecked(!whisperChatChecked);
  };

  return (
    <ChatDiv>
      <ChatOptionDiv>
        <AllChatDiv onClick={handleAllChatClick}>
          <OptionLabel>전체</OptionLabel>
          <ChatRadio type="radio" value="all" checked={allChatChecked} />
        </AllChatDiv>
        <WhisperChatDiv onClick={handleWhisperChatClick}>
          <OptionLabel>귓속말</OptionLabel>
          <ChatRadio
            type="radio"
            value="whisper"
            checked={whisperChatChecked}
          />
        </WhisperChatDiv>
      </ChatOptionDiv>
      <ChatList>
        {messages.map((msg, index) => (
          <>
            {msg.sendingType === "all" && allChatChecked ? (
              <Message
                onClick={() => setWhisperRecipient(msg.nickname)}
                key={index}
              >
                {msg.nickname}: {msg.message}
              </Message>
            ) : (
              msg.sendingType === "whisper" &&
              (msg.whisperRecipient === playerNickname ||
                msg.nickname === playerNickname) &&
              whisperChatChecked && (
                <WhisperMessage
                  onClick={() => setWhisperRecipient(msg.nickname)}
                  key={index}
                >
                  {msg.whisperRecipient === playerNickname // 받는 대상이라면
                    ? `${msg.nickname} 님이 보낸 메시지: ${msg.message}`
                    : `${msg.nickname} -> ${msg.whisperRecipient}: ${msg.message}`}
                </WhisperMessage>
              )
            )}
          </>
        ))}
        <div ref={messageEndRef} />
      </ChatList>
      <InputChatDiv>
        <SendModeSelect onChange={handleSendMode}>
          <SendModeOption value="all" selected={sendMode === "all"}>
            전체
          </SendModeOption>
          <SendModeOption value="whisper" selected={sendMode === "whisper"}>
            귓속말
          </SendModeOption>
        </SendModeSelect>
        {sendMode === "whisper" && (
          <WhisperRecipientInput
            type="text"
            value={whisperRecipient}
            onChange={handleWhisperRecipient}
            placeholder="대상"
          />
        )}
        <InputChat
          type="text"
          placeholder="내용을 입력해 주세요!"
          value={message}
          onChange={handleChangeMessage}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </InputChatDiv>
    </ChatDiv>
  );
};
