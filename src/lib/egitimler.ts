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
} from "firebase/firestore";
import { db } from "./firebase";
import { Egitim } from "./types";

const COLLECTION = "egitimler";

export function subscribeEgitimler(callback: (data: Egitim[]) => void) {
  const q = query(collection(db, COLLECTION), orderBy("tarih", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Egitim[];
    callback(data);
  });
}

export async function addEgitim(
  data: Omit<Egitim, "id" | "createdAt" | "updatedAt">
) {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateEgitim(
  id: string,
  data: Partial<Omit<Egitim, "id" | "createdAt">>
) {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEgitim(id: string) {
  return deleteDoc(doc(db, COLLECTION, id));
}
