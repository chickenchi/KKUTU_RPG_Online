import { ref, get } from "firebase/database";
import { db } from "@/common_components/firebase";

export const findPlayerInfo = async (
  email: string
): Promise<{ id: string; nickname: string } | null> => {
  const userRef = ref(db, `users/${email}`);
  const snapshot = await get(userRef);

  if (snapshot.exists())
    return { id: snapshot.val().id, nickname: snapshot.val().nickname };
  else return null;
};
