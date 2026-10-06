# Changelog

## [Unreleased]

### Yeni Özellikler
- Klavye kısayolları: `Alt+Shift+S` sidebar'ı aç/kapat, `Alt+Shift+Down`/`Up` sonraki/önceki panel
- Panel ikonları Google favicon servisi yerine sitenin kendi `/favicon.ico` adresinden yükleniyor; güncellemede eski Google ikon URL'leri dönüştürülüyor
- Dar sidebar'da başlık çubuğundaki butonlar taşmıyor (başlık gizlenip butonlar küçülüyor)
- **Glance**: Paneller açık sayfanın ortasında, bulanık arka planlı yüzen bir pencerede açılabiliyor (popup'ta panele tıklama, sidebar'da "Open as Glance" / Shift+tık, `Alt+Shift+G`). Overlay Shadow DOM ile sayfadan izole; script eklenemeyen sayfalarda ayrı popup penceresi açılıyor

### Düzeltmeler
- Panel düzenlerken "Update" butonu artık yeni bir panel eklemiyor; iptal edilen düzenleme sonraki "Add" işlemini etkilemiyor
- Düzenlemede URL normalize edilip doğrulanıyor (`https://` otomatik ekleniyor)
- Popup'ta panel başlığı/URL'i `innerHTML` yerine `textContent` ile yazılıyor (HTML injection düzeltildi); ikon fallback'i CSP altında çalışıyor
- Popup'tan sadece `http(s)` sayfaları panel olarak eklenebiliyor
- Yeni eklenen panel sidebar'da iki kez görünmüyor
- Sidebar yeniden açıldığında son aktif panel yükleniyor
- Popup'tan silinen aktif panel sidebar'da kapanıyor
- Dışarıdan sürüklenen link/metin panel sırasını bozmuyor
- "Show Navigation Header" açık panelde tekrar açılınca header geri geliyor
- Ayar içe aktarma bilinmeyen/geçersiz değerleri yok sayıyor
- Sidebar başlığındaki eski "Tebes" adı düzeltildi
- Panel kapatılınca iframe `src=''` ile sidebar.html'e yönleniyordu; artık iframe boş bir iframe ile değiştiriliyor
- Geri/İleri butonları çalışmıyordu (cross-origin `history` erişilemez); artık sidebar'ın ortak oturum geçmişi kullanılıyor ve sadece açık panel içinde geziniyor
- Sol/sağ ikon yerleşiminde başlık çubuğu içeriğin yanında dikey sütun olarak çıkıyordu; başlık + içerik `#panel-main` içinde alt alta
- Light ve diğer temalarda hover/kenarlık/ikincil yazı renkleri koyu temada kalıyordu; artık temadan türetiliyor (`common/theme.js`), popup da temayı uyguluyor
- Güncellemede tüm panelleri silmiş kullanıcıya varsayılan paneller geri gelmiyor; yeni ayar anahtarları varsayılanlarla dolduruluyor
- Esc ile dialog/sağ tık menüsü kapanıyor, isim alanında Enter kaydediyor; panel iframe'inde `alert`/indirme izinli

## [1.0.0] - 2025-01-09

### Değişiklikler

#### Ad Değişikliği
- **Uygulama adı "Tebes" yerine "Tabes" olarak değiştirildi**
  - Tüm dosyalardaki "Tebes" referansları "Tabes" olarak güncellendi
  - Class adı: `TebesSidebar` → `TabesSidebar`
  - Instance: `new TebesSidebar()` → `new TabesSidebar()`
  - HTML başlıkları ve title etiketleri güncellendi
  - Export dosya adı: `tebes-settings.json` → `tabes-settings.json`
  - Extension ID: `tebes@extension` → `tabes@extension`

### Özellikler

- Web sidebar panelleri desteği
- Favori web sitelerini panel olarak ekleme
- Gezinti kontrolleri (geri, ileri, yenile, ana sayfa)
- Özelleştirilebilir temalar:
  - Dark
  - Light
  - Tokyo Night
  - Catppuccin
  - Nord
  - Dracula
  - Custom
- Renk özelleştirme seçenekleri
- Ayarları içe/dışa aktarma
- Mobil kullanıcı ajanı desteği
- Sürükle-bırak panel sıralama
- Sağ tık bağlam menüsü
- Yeni sekmede açma özelliği

### Teknik Detaylar

- Manifest Version 2
- Firefox 109.0+ desteği
- Extension ID: `tabes@extension`
- Gerekli izinler:
  - `storage`
  - `tabs`
  - `activeTab`

---

## Gelecek Sürümler (Planned)

### [1.1.0] - TBD
- [ ] Keyboard shortcuts desteği
- [ ] Panel gruplama özelliği
- [ ] Daha fazla hazır tema
- [ ] İkon özelleştirme
- [ ] Panel arama özelliği

### [1.2.0] - TBD
- [ ] Sync desteği (Firefox Account ile senkronizasyon)
- [ ] Panel paylaşma özelliği
- [ ] Daha fazla gezinti seçeneği
- [ ] Performance iyileştirmeleri

### [2.0.0] - TBD
- [ ] Manifest V3 geçişi
- [ ] Chrome desteği
- [ ] Edge desteği
- [ ] Yeni UI/UX tasarımı
