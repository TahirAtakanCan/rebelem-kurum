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
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { db } from "./firebase";
import { Egitim } from "./types";
import { logActivity } from "./aktivite";

const COLLECTION = "egitimler";

export type AddEgitimPayload = Omit<
  Egitim,
  "id" | "createdAt" | "updatedAt"
> & {
  logOlusturanAd?: string;
};

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

export async function addEgitim(data: AddEgitimPayload) {
  const { logOlusturanAd, ...rest } = data;
  const ref = await addDoc(collection(db, COLLECTION), {
    ...rest,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const tarihTxt = format(rest.tarih.toDate(), "d.MM.yyyy", { locale: tr });
  const kim = logOlusturanAd?.trim() || "Takım";
  void logActivity({
    tip: "egitim",
    mesaj: `${kim} yeni eğitim ekledi: ${rest.kurum} — ${rest.egitimKonusu} (${tarihTxt})`,
    kullaniciId: rest.createdBy,
    kullaniciAd: logOlusturanAd,
  });
  return ref;
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
