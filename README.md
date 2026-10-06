# Tabes

Zen Browser web sidebar panelleri özelliğini geri getiren bir Firefox eklentisi. Web sitelerini sidebar panelleri olarak ekleyin ve hızlı erişim sağlayın.

## Özellikler

- **Web Panelleri**: Favori web sitelerinizi sidebar paneli olarak ekleyin
- **Hızlı Erişim**: Paneller arasında tek tıkla geçiş yapın
- **Gezinti Kontrolleri**: Geri, ileri, yenile ve ana sayfa butonları
- **Özelleştirilebilir Temalar**: Dark, Light, Tokyo Night, Catppuccin, Nord, Dracula ve özel temalar
- **Renk Özelleştirme**: Kendi renk şemanızı oluşturun
- **İçe/Dışa Aktarma**: Ayarlarınızı yedekleyin ve geri yükleyin
- **Mobil Kullanıcı Ajanı**: Mobil görünümde siteleri açma seçeneği
- **Sürükle-Bırak**: Panelleri yeniden sıralayın
- **Sağ Tık Menüsü**: Paneller için bağlam menüsü desteği
- **Glance**: Paneli açık sayfanın ortasında yüzen bir pencerede açın (Zen Glance gibi)
- **Yüzen Çubuk**: Sidebar yerine, panel ikonlarını sayfanın üzerinde sürüklenebilir bir çubukta ve panelleri taşınabilir/boyutlandırılabilir bir pencerede kullanın

## Kurulum

1. Firefox'ta `about:debugging` adresine gidin
2. "This Firefox" sekmesine tıklayın
3. "Load Temporary Add-on" butonuna tıklayın
4. `manifest.json` dosyasını seçin

## Kullanım

### Panel Ekleme

1. Sidebar'daki `+` butonuna tıklayın
2. URL girin (örn: https://example.com)
3. İsteğe bağlı olarak isim verin
4. Mobil kullanıcı ajanı kullanmak isterseniz kutuyu işaretleyin

### Glance (Yüzen Pencere)

- Toolbar popup'ında bir panele tıklayın, sidebar'da panele sağ tıklayıp "Open as Glance" seçin, Shift+tıklayın ya da `Alt+Shift+G` ile son paneli açın
- Arka plana tıklayarak, `Esc` ile veya `×` butonuyla kapatın
- Sidebar'dan ilk kullanımda sayfaya erişim izni istenir
- Eklentilerin çalışamadığı sayfalarda (`about:`, addons.mozilla.org vb.) panel ayrı bir popup penceresinde açılır

### Yüzen Çubuk (Floating Bar)

- Toolbar popup'ındaki "Floating Bar" butonuyla ya da `Alt+Shift+D` ile açıp kapatın; ilk açılışta tüm sitelere erişim izni istenir
- Çubuğu soldaki noktalı tutamaktan sürükleyin, ↻ ile dikey/yatay yapın, × ile kapatın
- Bir ikona tıklayınca panel yüzen bir pencerede açılır: başlığından taşıyın, sağ alt köşesinden boyutlandırın, küçültün veya kapatın
- Çubuğun ve pencerenin yeri/boyutu tüm sekmelerde hatırlanır; sayfa değişince panel yeniden yüklenir
- Eklentilerin çalışamadığı sayfalarda (`about:`, addons.mozilla.org vb.) çubuk görünmez

### Klavye Kısayolları

- `Alt+Shift+A`: Sidebar'ı aç/kapat
- `Alt+Shift+Down` / `Alt+Shift+Up`: Sonraki / önceki panel
- `Alt+Shift+G`: Son paneli Glance olarak aç
- `Alt+Shift+D`: Yüzen çubuğu aç/kapat

Firefox menülerinin erişim tuşlarıyla (Dosya `F`, Geçmiş `S` vb.) çakışmamaları için harfler seçildi. Kısayollar `about:addons` → dişli → "Manage Extension Shortcuts" üzerinden değiştirilebilir.

### Tema Değiştirme

1. Ayarlar sayfasını açın (popup'taki dişli ikonu veya sidebar'daki `+` butonuna sağ tık)
2. "Theme" bölümünden tema seçin
3. Özel tema için renkleri ayarlayın

### Ayarları Dışa Aktarma

1. Ayarlar sayfasını açın
2. "Export" butonuna tıklayın
3. `tabes-settings.json` dosyası indirilecektir

## Dosya Yapısı

```
Tabes/
├── manifest.json
├── README.md
├── CHANGELOG.md
├── icons/
│   ├── icon.svg
│   └── icon-16.svg
├── common/
│   └── theme.js
├── float/
│   └── float-content.js
├── glance/
│   ├── glance-content.js
│   ├── glance.html
│   ├── glance.css
│   └── glance.js
├── sidebar/
│   ├── sidebar.html
│   ├── sidebar.css
│   └── sidebar.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/
│   ├── options.html
│   ├── options.css
│   └── options.js
└── background/
    └── background.js
```

## Teknik Detaylar

- **Manifest Version**: 2
- **Minimum Firefox Sürümü**: 109.0
- **Eklenti ID**: tabes@extension
- **Sürüm**: 1.0.0

## İzinler

- `storage`: Ayarları ve panelleri kaydetmek için
- `tabs`: Sekme yönetimi için
- `activeTab`: Aktif sekme üzerinde işlem yapmak için
- `webRequest`, `webRequestBlocking`, `<all_urls>`: Sadece Tabes panel iframe'lerinden gelen isteklerde `X-Frame-Options` ve CSP `frame-ancestors` başlıklarını kaldırmak (sitelerin panelde açılabilmesi için) ve "mobile user agent" seçili panellerde `User-Agent` başlığını değiştirmek için. Aynı izin Glance overlay'ini ve yüzen çubuğu sayfalara eklemek için de kullanılır

## Geliştirme

### Gereksinimler

- Firefox 109.0 veya üstü
- Modern bir web tarayıcısı

### Yapılandırma

1. Repoyu klonlayın
2. Firefox'ta `about:debugging` açın
3. "Load Temporary Add-on" ile `manifest.json` yükleyin

## Lisans

MIT License

## Katkıda Bulunma

Katkılar memnuniyetle karşılanır. Lütfen pull request göndermeden önce değişiklikleri test edin.
