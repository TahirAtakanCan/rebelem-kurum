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
import { Randevu } from "./types";

const COLLECTION = "randevular";

export function subscribeRandevular(callback: (data: Randevu[]) => void) {
  const q = query(collection(db, COLLECTION), orderBy("tarih", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Randevu[];
    callback(data);
  });
}

export async function addRandevu(
  data: Omit<Randevu, "id" | "createdAt" | "updatedAt">
) {
  return addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRandevu(
  id: string,
  data: Partial<Omit<Randevu, "id" | "createdAt">>
) {
  return updateDoc(doc(db, COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRandevu(id: string) {
  return deleteDoc(doc(db, COLLECTION, id));
}

// Google Takvim'e ekleme linki üretir
export function buildGoogleCalendarUrl(r: Randevu): string {
  const tarih = r.tarih.toDate();
  const yyyy = tarih.getFullYear();
  const mm = String(tarih.getMonth() + 1).padStart(2, "0");
  const dd = String(tarih.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}${mm}${dd}`;

  // Saatleri parse et
  const [bh, bm] = (r.baslangicSaati || "09:00").split(":");
  const [eh, em] = (r.bitisSaati || "10:00").split(":");
  const startTime = `${bh.padStart(2, "0")}${bm.padStart(2, "0")}00`;
  const endTime = `${eh.padStart(2, "0")}${em.padStart(2, "0")}00`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `ReBelem - ${r.kurum}${r.ilgiliKisi ? ` (${r.ilgiliKisi})` : ""}`,
    dates: `${dateStr}T${startTime}/${dateStr}T${endTime}`,
    details: [
      r.randevuTipi ? `Tip: ${r.randevuTipi}` : "",
      r.konumLink ? `Konum/Link: ${r.konumLink}` : "",
      r.notlar ? `Notlar: ${r.notlar}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    location: r.konumLink || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
