import { KurumTipi, Durum, SatisDurumu, Oncelik } from "./types";

export const KURUM_TIPLERI: KurumTipi[] = ["Okul", "Kurs", "Bireysel", "Akademi"];

export const DURUMLAR: Durum[] = [
  "Başlamadı",
  "Deneyim Başladı",
  "Tamamlandı",
  "İptal",
];

export const SATIS_DURUMLARI: SatisDurumu[] = [
  "Satın Aldı",
  "Satın Almadı",
  "Kararsız",
  "Beklemede",
];

export const ONCELIKLER: Oncelik[] = ["Yüksek", "Orta", "Düşük"];

// Ekibinizin isimlerini buraya yazın, istediğiniz zaman değiştirebilirsiniz
export const EKIP_UYELERI = ["BİLAL", "HÜSEYİN", "ATAKAN", "EMİRHAN"];

// Renk eşlemeleri (Badge'ler için)
export const DURUM_RENKLERI: Record<Durum, string> = {
  "Başlamadı": "bg-blue-100 text-blue-800 border-blue-200",
  "Deneyim Başladı": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Tamamlandı": "bg-green-100 text-green-800 border-green-200",
  "İptal": "bg-gray-100 text-gray-800 border-gray-200",
};

export const SATIS_RENKLERI: Record<SatisDurumu, string> = {
  "Satın Aldı": "bg-green-100 text-green-800 border-green-200",
  "Satın Almadı": "bg-red-100 text-red-800 border-red-200",
  "Kararsız": "bg-orange-100 text-orange-800 border-orange-200",
  "Beklemede": "bg-gray-100 text-gray-800 border-gray-200",
};

export const ONCELIK_RENKLERI: Record<Oncelik, string> = {
  "Yüksek": "bg-red-100 text-red-800 border-red-200",
  "Orta": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Düşük": "bg-green-100 text-green-800 border-green-200",
};

export const KURUM_TIPI_RENKLERI: Record<KurumTipi, string> = {
  "Okul": "bg-blue-100 text-blue-800",
  "Kurs": "bg-orange-100 text-orange-800",
  "Bireysel": "bg-pink-100 text-pink-800",
  "Akademi": "bg-purple-100 text-purple-800",
};
