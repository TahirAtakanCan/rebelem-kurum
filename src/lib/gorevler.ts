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
import { Gorev, GorevDurumu } from "./types";

const COLLECTION = "gorevler";

const durumOrder: Record<GorevDurumu, number> = {
  "Bekliyor": 0,
  "Yapılıyor": 1,
  "Tamamlandı": 2,
};

function sortGorevler(a: Gorev, b: Gorev) {
  const durumDiff = durumOrder[a.durum] - durumOrder[b.durum];
  if (durumDiff !== 0) return durumDiff;

  const aSon = a.sonTarih?.toDate().getTime() ?? Number.POSITIVE_INFINITY;
  const bSon = b.sonTarih?.toDate().getTime() ?? Number.POSITIVE_INFINITY;
  if (aSon !== bSon) return aSon - bSon;

  const aCreated = a.createdAt?.toDate().getTime() ?? 0;
  const bCreated = b.createdAt?.toDate().getTime() ?? 0;
  return bCreated - aCreated;
}

export function subscribeGorevler(callback: (data: Gorev[]) => void) {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    })) as Gorev[];
    callback([...data].sort(sortGorevler));
  });
}

export async function addGorev(
  data: Omit<Gorev, "id" | "createdAt" | "updatedAt">
) {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateGorev(
  id: string,
  data: Partial<Omit<Gorev, "id" | "createdAt">>
) {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGorev(id: string) {
  return deleteDoc(doc(db, COLLECTION, id));
}

export async function toggleGorevDurum(id: string, yeniDurum: GorevDurumu) {
  return updateDoc(doc(db, COLLECTION, id), {
    durum: yeniDurum,
    tamamlandiTarihi: yeniDurum === "Tamamlandı" ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}
