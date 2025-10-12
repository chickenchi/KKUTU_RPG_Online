import React from "react";
import { googleSignIn } from "../../authentication";
import { styled } from "styled-components";
import { useAtom } from "jotai";
import { accountAtom } from "@/atoms/account";
import { setNickname } from "./account_db/set_nickname";
import { findNickname } from "./account_db/find_nickname";
import { useNavigate } from "react-router-dom";

const LogoutButton = styled.button`
  background-color: rgba(0, 0, 0, 0);

  border: 0;

  font-size: 18pt;
`;

const GoogleLogoutButton = () => {
  const [account, setAccount] = useAtom(accountAtom);

  return (
    <>
      {account && (
        <LogoutButton
          onClick={() => {
            if (account) {
              setAccount(null);
            } else {
              alert("이미 로그아웃하였습니다.");
            }
          }}
        >
          로그아웃
        </LogoutButton>
      )}
    </>
  );
};
export default GoogleLogoutButton;
