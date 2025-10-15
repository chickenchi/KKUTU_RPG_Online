import { isNicknameExists } from "./isNickNameExists";

export const checkNickname = async (nickname: string) => {
    const checkingNickname = nickname.toLowerCase().replace(/\s+/g, "");
    const forbiddenFirebaseChars = [".", "#", "$", "[", "]", "/", "\\"];

    switch (true) {
      case checkingNickname.toLowerCase() === "acrylic" ||
        checkingNickname === "아크릴릭":
        alert("무슨 의도를 가지신 거죠? ㅎㅎ");
        return false;
      case checkingNickname.length > 8:
        alert("닉네임은 8자 이하만 가능합니다.");
        return false;
        case forbiddenFirebaseChars.some((char) =>
          checkingNickname.includes(char)
      ):
      alert("[., #, $, [, ], /, \\]와 같은 특수 문자는 사용할 수 없습니다.");
      return false;
      case await isNicknameExists(checkingNickname):
        alert("해당 닉네임은 다른 플레이어가 사용 중입니다.");
        return false;
    }

    return true;
  };