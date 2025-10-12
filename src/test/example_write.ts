import { ref, set } from "firebase/database";
import { db } from "./firebase";

set(ref(db, "users/123"), {
  username: "홍길동",
  email: "hong@email.com",
});
