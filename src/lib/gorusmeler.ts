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
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Gorusme } from "./types";

const COLLECTION = "gorusmeler";

// Tüm görüşmeleri gerçek zamanlı dinle
export function subscribeGorusmeler(
  callback: (gorusmeler: Gorusme[]) => void
) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Gorusme[];
    callback(data);
  });
}

// Yeni görüşme ekle
export async function addGorusme(
  data: Omit<Gorusme, "id" | "createdAt" | "updatedAt">
) {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Görüşme güncelle
export async function updateGorusme(
  id: string,
  data: Partial<Omit<Gorusme, "id" | "createdAt">>
) {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// Görüşme sil
export async function deleteGorusme(id: string) {
  return deleteDoc(doc(db, COLLECTION, id));
}

// Tarih helper
export function timestampToDate(ts: Timestamp | null | undefined): Date | null {
  if (!ts) return null;
  return ts.toDate();
}
