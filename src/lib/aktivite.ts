import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Aktivite, AktiviteTipi } from "./types";

const COLLECTION = "aktiviteler";

export type LogActivityParams = Omit<Aktivite, "id" | "createdAt"> & {
  tip: AktiviteTipi;
  mesaj: string;
  kullaniciId: string;
};

/**
 * Aktivite kaydı (Firestore). Hata yakalanır; arayüz akışını bozmaz.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await addDoc(collection(db, COLLECTION), {
      tip: params.tip,
      mesaj: params.mesaj.slice(0, 500),
      kullaniciId: params.kullaniciId,
      kullaniciAd: params.kullaniciAd || null,
      ilgiliId: params.ilgiliId || null,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("aktivite loglanamadı", e);
  }
}

export function subscribeSonAktiviteler(
  callback: (rows: Aktivite[]) => void,
  sonN = 10
) {
  const q = query(
    collection(db, COLLECTION),
    orderBy("createdAt", "desc"),
    limit(sonN)
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Aktivite[];
    callback(data);
  });
}
