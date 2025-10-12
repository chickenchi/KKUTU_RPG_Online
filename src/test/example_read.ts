import { ref, onValue } from "firebase/database";
import { db } from '@/common_components/firebase';

const userRef = ref(db, "users/123");
onValue(userRef, (snapshot) => {
  const data = snapshot.val();
  console.log(data);
});
