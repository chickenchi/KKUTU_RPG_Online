import React from "react";
import { googleSignIn } from "../../authentication";
import { styled } from "styled-components";
import { useAtom } from "jotai";
import { accountAtom } from "@/atoms/account";
import { setNickname } from "../../common_components/account_db/set_nickname";
import { findPlayerInfo } from "../../common_components/account_db/find_nickname";
import { useNavigate } from "react-router-dom";
import { checkNickname } from "@/common_components/account_db/checkNickname";

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
          if (await createNickname(email)) startGame();
        } else {
          startGame();
        }
      }
    }
  };

  /** 닉네임 생성 */
  const createNickname = async (email: string) => {
    let nickname: string | null = "";

    while (true) {
      nickname = window.prompt("닉네임을 입력해 주세요!");

      if (!nickname) {
        alert("닉네임을 입력하세요!");
        continue;
      }

      const check = await checkNickname(nickname);

      if (check) {
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
