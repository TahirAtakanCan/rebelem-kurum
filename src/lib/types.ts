import { Timestamp } from "firebase/firestore";

// ============ GÖRÜŞMELER ============
export type KurumTipi = "Okul" | "Kurs" | "Bireysel" | "Akademi";
export type Durum = "Başlamadı" | "Deneyim Başladı" | "Tamamlandı" | "İptal";
export type SatisDurumu = "Satın Aldı" | "Satın Almadı" | "Kararsız" | "Beklemede";
export type Oncelik = "Yüksek" | "Orta" | "Düşük";

export interface Gorusme {
  id: string;
  kurum: string;
  kurumTipi?: KurumTipi;
  ilgiliKisi?: string;
  konumu?: string;
  iletisimNo?: string;
  mail?: string;
  iletisimeGecen?: string;  // BİLAL, HÜSEYİN, ATAKAN vs.
  araci?: string;
  durum?: Durum;
  oncelik?: Oncelik;
  baslamaTarihi?: Timestamp | null;
  sonTemasTarihi?: Timestamp | null;
  bitisTarihi?: Timestamp | null;
  satisDurumu?: SatisDurumu;
  not?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;  // user uid
  createdByName?: string;
}

export interface KurumNotu {
  id: string;
  gorusmeId: string;
  baslik?: string;
  icerik: string;
  createdAt: Timestamp;
  createdBy: string;
  createdByName?: string;
}

// ============ GÖREVLER ============
export type GorevDurumu = "Bekliyor" | "Yapılıyor" | "Tamamlandı";
export type GorevOnceligi = "Yüksek" | "Orta" | "Düşük";

export interface Gorev {
  id: string;
  baslik: string;
  aciklama?: string;
  durum: GorevDurumu;
  oncelik: GorevOnceligi;
  atananUid?: string;
  atananAd?: string;
  gorusmeId?: string;
  gorusmeKurum?: string;
  sonTarih?: Timestamp;
  tamamlandiTarihi?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  createdByName?: string;
}

// ============ RANDEVULAR ============
export type RandevuTipi = "Yüz Yüze" | "Online" | "Telefon" | "Saha Ziyareti";
export type RandevuDurum = "Planlandı" | "Onaylandı" | "İptal" | "Tamamlandı" | "Ertelendi";

export interface Randevu {
  id: string;
  tarih: Timestamp;
  baslangicSaati: string;  // "14:30"
  bitisSaati: string;      // "15:30"
  kurum: string;
  ilgiliKisi?: string;
  randevuTipi?: RandevuTipi;
  konumLink?: string;
  durum?: RandevuDurum;
  notlar?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// ============ EĞİTİMLER ============
export type TahsilatDurumu = "Tahsil Edildi" | "Beklemede" | "Gecikmiş" | "Faturalandı";
export type EgitimDurumu = "Planlandı" | "Tamamlandı" | "İptal" | "Ertelendi";
export type DevamEdenIliski = "Aktif" | "Pasif" | "Yenilenecek" | "Bitti";

export interface Egitim {
  id: string;
  tarih: Timestamp;
  saat?: string;
  kurum: string;
  egitimKonusu: string;
  egitmen?: string;
  egitimDurumu?: EgitimDurumu;
  katilimciSayisi?: number;
  sureSaat?: number;
  // Legacy fields for old records
  ucret?: number;
  tahsilatDurumu?: TahsilatDurumu;
  geriBildirimPuani?: number;  // 1-5
  devamEdenIliski?: DevamEdenIliski;
  notlar?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// ============ KULLANICI ============
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}
