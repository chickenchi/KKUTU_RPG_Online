import {
  accountAtom,
  playerAxisAtom,
  playerIdAtom,
  playerMapAtom,
  playerNicknameAtom,
} from "@/atoms/account";
import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { findPlayerInfo } from "@/common_components/account_db/find_nickname";
import { User } from "firebase/auth";
import { findPlayer, setPlayerSetting } from "./player_db/player";

export const PlayerFinder = () => {
  const navigate = useNavigate();
  const [accountData] = useAtom(accountAtom);
  const [, setPlayerId] = useAtom(playerIdAtom);
  const [, setPlayerMap] = useAtom(playerMapAtom);
  const [, setPlayerAxis] = useAtom(playerAxisAtom);
  const [, setPlayerNickname] = useAtom(playerNicknameAtom);

  useEffect(() => {
    const findUserInfo = async () => {
      const accountStr = accountData ?? (await localStorage.getItem("account"));

      const account: { email: string } | User | null =
        typeof accountStr == "string" // localStorage로 불러왔을 경우 파싱
          ? JSON.parse(accountStr)
          : accountStr ?? null; // jotai로 불러온 경우 그대로지만 미존재 시 null

      if (!account || !account.email) {
        alert("계정 정보가 존재하지 않아 메인 화면으로 이동합니다.");
        navigate("/");
        return;
      }

      let email = account.email.split("@")[0];
      let playerInfo = await findPlayerInfo(email);

      if (!playerInfo) {
        alert(`닉네임이 존재하지 않습니다!
로그아웃 후 로그인해 닉네임을 입력해 주세요.`);
        navigate("/");
        return;
      } else {
        setPlayerId(playerInfo.id);
      }

      const playerLocation = await findPlayer(playerInfo.id);

      if (!playerLocation) {
        setPlayerSetting(playerInfo.id, playerInfo.nickname);
        setPlayerMap("potatina");
        setPlayerNickname(playerInfo.nickname);
      } else {
        setPlayerMap(playerLocation.location);
        setPlayerAxis({ x: playerLocation.x, y: playerLocation.y });
        setPlayerNickname(playerInfo.nickname);
      }
    };

    findUserInfo();
  }, []);

  return null;
};
