import {
  KurumTipi,
  Durum,
  SatisDurumu,
  Oncelik,
  RandevuTipi,
  RandevuDurum,
  EgitimDurumu,
  DevamEdenIliski,
  GorevDurumu,
  MilestoneTipi,
  KurumDurumu,
} from "./types";

export const KURUM_TIPLERI: KurumTipi[] = ["Okul", "Kurs", "Bireysel", "Akademi", "VIP"];

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
  "VIP":
    "bg-amber-100 text-amber-800 border border-amber-300",
};

export const MILESTONE_TIPLERI: {
  tip: MilestoneTipi;
  label: string;
  aciklama: string;
}[] = [
  {
    tip: "ilk_iletisim",
    label: "İlk İletişim Kuruldu",
    aciklama: "Telefon, e-posta veya yüz yüze ilk temas",
  },
  {
    tip: "tanisma_gorusmesi",
    label: "Tanışma Görüşmesi Yapıldı",
    aciklama: "Kurumun ihtiyacı dinlendi",
  },
  {
    tip: "tanitim_sunum",
    label: "Tanıtım/Sunum Yapıldı",
    aciklama: "Sistem ve hizmetler anlatıldı",
  },
  {
    tip: "egitim_takvimi",
    label: "Eğitim Takvimi Belirlendi",
    aciklama: "Resmi tarih ayarlandı",
  },
  {
    tip: "kurum_hesabi",
    label: "Kurum Hesabı Açıldı",
    aciklama: "Sisteme kayıt edildi",
  },
  {
    tip: "ilk_egitim",
    label: "İlk Eğitim Verildi",
    aciklama: "Saha çalışması başladı",
  },
  {
    tip: "aktif_kullanim",
    label: "Aktif Kullanıma Geçti",
    aciklama: "Kurum kendi başına kullanıyor",
  },
];

export const KURUM_DURUMLARI: KurumDurumu[] = [
  "Aktif Süreç",
  "Beklemede",
  "Kazanıldı",
  "Kaybedildi",
  "Pasif",
];

export const KURUM_DURUM_RENKLERI: Record<KurumDurumu, string> = {
  "Aktif Süreç": "bg-blue-100 text-blue-800 border-blue-200",
  "Beklemede": "bg-gray-100 text-gray-800 border-gray-200",
  "Kazanıldı": "bg-green-100 text-green-800 border-green-200",
  "Kaybedildi": "bg-red-100 text-red-800 border-red-200",
  "Pasif": "bg-slate-100 text-slate-600 border-slate-200",
};

export const RANDEVU_TIPLERI: RandevuTipi[] = [
  "Yüz Yüze",
  "Online",
  "Telefon",
  "Saha Ziyareti",
];

export const RANDEVU_DURUMLARI: RandevuDurum[] = [
  "Planlandı",
  "Onaylandı",
  "İptal",
  "Tamamlandı",
  "Ertelendi",
];

export const RANDEVU_TIPI_RENKLERI: Record<RandevuTipi, string> = {
  "Yüz Yüze": "bg-blue-100 text-blue-800",
  "Online": "bg-purple-100 text-purple-800",
  "Telefon": "bg-orange-100 text-orange-800",
  "Saha Ziyareti": "bg-green-100 text-green-800",
};

export const RANDEVU_DURUM_RENKLERI: Record<RandevuDurum, string> = {
  "Planlandı": "bg-blue-100 text-blue-800 border-blue-200",
  "Onaylandı": "bg-green-100 text-green-800 border-green-200",
  "İptal": "bg-red-100 text-red-800 border-red-200",
  "Tamamlandı": "bg-gray-100 text-gray-800 border-gray-200",
  "Ertelendi": "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export const EGITIM_DURUMLARI: EgitimDurumu[] = [
  "Planlandı",
  "Tamamlandı",
  "İptal",
  "Ertelendi",
];

export const DEVAM_EDEN_ILISKILER: DevamEdenIliski[] = [
  "Aktif",
  "Pasif",
  "Yenilenecek",
  "Bitti",
];

export const EGITIM_DURUM_RENKLERI: Record<EgitimDurumu, string> = {
  "Planlandı": "bg-blue-100 text-blue-800 border-blue-200",
  "Tamamlandı": "bg-green-100 text-green-800 border-green-200",
  "İptal": "bg-red-100 text-red-800 border-red-200",
  "Ertelendi": "bg-yellow-100 text-yellow-800 border-yellow-200",
};

export const ILISKI_RENKLERI: Record<DevamEdenIliski, string> = {
  "Aktif": "bg-green-100 text-green-800 border-green-200",
  "Pasif": "bg-gray-100 text-gray-800 border-gray-200",
  "Yenilenecek": "bg-orange-100 text-orange-800 border-orange-200",
  "Bitti": "bg-red-100 text-red-800 border-red-200",
};

export const GOREV_DURUMLARI: GorevDurumu[] = [
  "Bekliyor",
  "Yapılıyor",
  "Tamamlandı",
];

export const GOREV_DURUM_RENKLERI: Record<GorevDurumu, string> = {
  "Bekliyor": "bg-gray-100 text-gray-800",
  "Yapılıyor": "bg-blue-100 text-blue-800",
  "Tamamlandı": "bg-green-100 text-green-800",
};
