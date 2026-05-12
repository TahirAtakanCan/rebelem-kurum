import { Timestamp } from "firebase/firestore";

// ============ KURUMLAR (gorusmeler koleksiyonu) ============
export type KurumTipi = "Okul" | "Kurs" | "Bireysel" | "Akademi" | "VIP";

export interface KurumKisi {
  id: string;
  ad: string;
  rol?: string;
  telefon?: string;
  email?: string;
  notlar?: string;
}

export type MilestoneTipi =
  | "ilk_iletisim"
  | "tanisma_gorusmesi"
  | "tanitim_sunum"
  | "egitim_takvimi"
  | "kurum_hesabi"
  | "ilk_egitim"
  | "aktif_kullanim";

export interface KurumMilestone {
  tip: MilestoneTipi;
  tamamlandi: boolean;
  tamamlanmaTarihi?: Timestamp;
  tamamlayanUid?: string;
  tamamlayanAd?: string;
  not?: string;
}

export type KurumDurumu =
  | "Aktif Süreç"
  | "Beklemede"
  | "Kazanıldı"
  | "Kaybedildi"
  | "Pasif";

export type Durum = "Başlamadı" | "Deneyim Başladı" | "Tamamlandı" | "İptal";
export type SatisDurumu = "Satın Aldı" | "Satın Almadı" | "Kararsız" | "Beklemede";
export type Oncelik = "Yüksek" | "Orta" | "Düşük";

/** Firestore koleksiyon adı sabit kalır (gorusmeler); tek kayıt kurum kaydıdır. */
export interface Gorusme {
  id: string;

  /** Ana kurum adı (öncelikli); eski dokümanlarda eksik olabilir. */
  ad?: string;
  kurumTipi?: KurumTipi;
  sehir?: string;
  ilce?: string;
  webSitesi?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  etiketler?: string[];
  tahminiDeger?: number;
  kisiler?: KurumKisi[];
  milestones?: KurumMilestone[];
  kurumDurumu?: KurumDurumu;

  /** @deprecated görüntüleme için ad || kurum kullanın */
  kurum?: string;
  ilgiliKisi?: string;
  konumu?: string;
  iletisimNo?: string;
  mail?: string;
  iletisimeGecen?: string;
  araci?: string;
  /** @deprecated kurumDurumu kullanılmalı */
  durum?: Durum;
  oncelik?: Oncelik;
  baslamaTarihi?: Timestamp | null;
  sonTemasTarihi?: Timestamp | null;
  bitisTarihi?: Timestamp | null;
  /** @deprecated kurumDurumu ile senkron tutulabilir */
  satisDurumu?: SatisDurumu;
  not?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
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
  baslangicSaati: string;
  bitisSaati: string;
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
  ucret?: number;
  tahsilatDurumu?: TahsilatDurumu;
  geriBildirimPuani?: number;
  devamEdenIliski?: DevamEdenIliski;
  notlar?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// ============ AKTİVİTE FEED ============
export type AktiviteTipi =
  | "milestone"
  | "kurum_durumu"
  | "randevu"
  | "egitim"
  | "diger";

export interface Aktivite {
  id: string;
  tip: AktiviteTipi;
  mesaj: string;
  kullaniciId: string;
  kullaniciAd?: string;
  ilgiliId?: string;
  createdAt: Timestamp;
}

// ============ KULLANICI ============
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}
