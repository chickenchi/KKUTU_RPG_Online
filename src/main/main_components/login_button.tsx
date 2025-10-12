import React from "react";
import { googleSignIn } from "../../authentication";
import { styled } from "styled-components";
import { useAtom } from "jotai";
import { accountAtom } from "@/atoms/account";
import { setNickname } from "./account_db/set_nickname";
import { findPlayerInfo } from "./account_db/find_nickname";
import { useNavigate } from "react-router-dom";

const StartOrLoginButton = styled.button`
  width: 200px;
  height: 100px;

  border: 0;

  font-size: 24pt;
`;

const GoogleLoginButton = () => {
  const [account, setAccount] = useAtom(accountAtom);
  const navigate = useNavigate();

  const handleLogin = async () => {
    const user = await googleSignIn();

    if (user) {
      setAccount(user);

      if (user.email) {
        let email = user.email.split("@")[0];

        if (!(await findPlayerInfo(email))) {
          if (createNickname(email)) startGame();
        } else {
          startGame();
        }
      }
    }
  };

  /** 닉네임 생성 */
  const createNickname = (email: string) => {
    let nickname: string | null = "";

    while (true) {
      nickname = window.prompt("닉네임을 입력해 주세요!");

      if (!nickname || !checkNickname(nickname)) {
        alert("사용할 수 없거나 부적절한 닉네임입니다.");
      } else {
        break;
      }
    }

    const status = setNickname(email, nickname);

    if (status == false) {
      alert("예기치 않은 문제가 발생했습니다.");
      return false;
    } else {
      return true;
    }
  };

  /** 부적절한 닉네임 확인 */
  const checkNickname = (nickname: string) => {
    return true;
  };

  const startGame = () => {
    navigate("/game");
  };

  return (
    <StartOrLoginButton
      onClick={() => {
        if (account) {
          startGame();
        } else {
          handleLogin();
        }
      }}
    >
      {account ? "게임 시작" : "로그인"}
    </StartOrLoginButton>
  );
};
export default GoogleLoginButton;
