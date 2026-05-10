import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { KurumNotu } from "./types";

const COLLECTION = "kurumNotlari";

export function subscribeKurumNotlari(
  gorusmeId: string,
  callback: (data: KurumNotu[]) => void
) {
  const q = query(
    collection(db, COLLECTION),
    where("gorusmeId", "==", gorusmeId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })) as KurumNotu[];
    callback(data);
  });
}

export async function addKurumNotu(
  data: Omit<KurumNotu, "id" | "createdAt">
) {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateKurumNotu(
  id: string,
  data: Partial<Omit<KurumNotu, "id" | "createdAt">>
) {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
  });
}

export async function deleteKurumNotu(id: string) {
  return deleteDoc(doc(db, COLLECTION, id));
}
