# Tabes

Zen Browser'ın web sidebar panelleri özelliğini Firefox'a getiren bir eklenti. Sık kullandığınız siteleri panel olarak ekleyin; sidebar'da, sayfanın üzerinde yüzen bir pencerede (Glance) ya da ekranda istediğiniz yere taşıyabildiğiniz yüzen çubukta açın.

## Özellikler

- **Web Panelleri**: Favori sitelerinizi panel olarak ekleyin, tek tıkla aralarında geçin
- **Üç kullanım biçimi**:
  - **Sidebar**: Klasik kenar çubuğu
  - **Glance**: Panel, açık sayfanın ortasında bulanık arka planlı yüzen bir pencerede açılır
  - **Yüzen Çubuk**: Panel ikonları sayfanın üzerinde sürüklenebilir bir çubukta durur; paneller sayfayı bölmeden taşınabilir ve boyutlandırılabilir bir pencerede açılır
- **Siteler panelde açılır**: `X-Frame-Options` / CSP `frame-ancestors` nedeniyle normalde iframe'de açılmayan siteler (YouTube, X vb.) yalnızca Tabes panellerinde açılabilir hale getirilir
- **Gezinti Kontrolleri**: Geri, ileri, yenile, ana sayfa ve "yeni sekmede aç" (gezindiğiniz güncel sayfayı açar)
- **Mobil Kullanıcı Ajanı**: Panel bazında mobil görünüm
- **Temalar**: Dark, Light, Tokyo Night, Catppuccin, Nord, Dracula ve kendi renkleriniz
- **Klavye Kısayolları**: Sidebar, panel geçişi, Glance ve yüzen çubuk için
- **Sürükle-Bırak** ile panel sıralama, **sağ tık menüsü**, ayarları **içe/dışa aktarma**

## Kurulum

Henüz addons.mozilla.org'da yayınlanmadı. Geçici yükleme:

1. Repoyu klonlayın veya ZIP olarak indirin
2. Firefox'ta `about:debugging#/runtime/this-firefox` adresine gidin
3. "Load Temporary Add-on…" butonuna tıklayın ve `manifest.json` dosyasını seçin

Geçici eklentiler Firefox kapanınca kaldırılır; her açılışta yeniden yüklemeniz gerekir. Kalıcı kurulum için [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/) ile paketleyip imzalatabilirsiniz.

## Kullanım

### Panel Ekleme

- Sidebar'daki `+` butonuna tıklayın, URL girin (`https://` otomatik eklenir), isterseniz isim verin ve "mobile user agent" kutusunu işaretleyin
- Ya da toolbar popup'ında "Add Current Page" ile açık sayfayı panel yapın
- Panele sağ tıklayarak düzenleyebilir, silebilir, Glance olarak ya da yeni sekmede açabilirsiniz
- İkonları sürükleyerek sıralayın

### Sidebar

- Toolbar popup'ındaki "Open Sidebar" butonu, Firefox'un sidebar menüsü ya da `Alt+Shift+A`
- İkon çubuğunun yeri (üst/sol/alt/sağ) ayarlardan değiştirilebilir

### Glance (Yüzen Pencere)

- Popup'ta bir panele tıklayın, sidebar'da panele Shift+tıklayın ya da sağ tık → "Open as Glance", veya `Alt+Shift+G` ile son paneli açın
- Arka plana tıklayarak, `Esc` ile veya `×` ile kapatın
- Eklentilerin çalışamadığı sayfalarda (`about:`, addons.mozilla.org vb.) panel ayrı bir küçük pencerede açılır

### Yüzen Çubuk (Floating Bar)

- Toolbar popup'ındaki "Floating Bar" butonuyla ya da `Alt+Shift+D` ile açıp kapatın
- Çubuğu noktalı tutamağından sürükleyin, ↻ ile dikey/yatay yapın, × ile kapatın
- Bir ikona tıklayınca panel yüzen bir pencerede açılır: başlığından taşıyın, sağ alt köşesinden boyutlandırın, küçültün veya kapatın
- Çubuğun ve pencerenin yeri/boyutu tüm sekmelerde hatırlanır; sayfa değişince panel yeniden yüklenir
- Eklentilerin çalışamadığı sayfalarda çubuk görünmez

### Klavye Kısayolları

| Kısayol | İşlev |
|---|---|
| `Alt+Shift+A` | Sidebar'ı aç/kapat |
| `Alt+Shift+Down` / `Alt+Shift+Up` | Sonraki / önceki panel |
| `Alt+Shift+G` | Son paneli Glance olarak aç |
| `Alt+Shift+D` | Yüzen çubuğu aç/kapat |

Harfler Firefox menülerinin erişim tuşlarıyla (Dosya `F`, Geçmiş `S` vb.) çakışmayacak şekilde seçildi. Kısayollar `about:addons` → dişli → "Manage Extension Shortcuts" üzerinden değiştirilebilir.

### Ayarlar

Ayarlar sayfası: popup'taki dişli ikonu ya da sidebar'daki `+` butonuna sağ tık.

- Tema seçin veya "Custom" ile kendi renklerinizi girin; ikon boyutu, yazı boyutu, köşe yuvarlaklığı, kompakt mod, başlık çubuğu ve özel CSS
- "Export" ayarları `tabes-settings.json` olarak indirir, "Import" geri yükler (geçersiz değerler yok sayılır)

## Bilinen Sınırlamalar

- Paneller içindeki sayfa konumu Glance/yüzen pencere kapanınca korunmaz
- `top !== self` kontrolüyle iframe'i engelleyen siteler panelde çalışmayabilir
- Mobil kullanıcı ajanı yalnızca istek başlığını değiştirir; `navigator.userAgent` değişmez
- Panellerde oturum açma Firefox'un üçüncü taraf çerez bölümlemesinden etkilenebilir

## İzinler

| İzin | Neden |
|---|---|
| `storage` | Panelleri ve ayarları saklamak |
| `tabs`, `activeTab` | Açık sayfayı panel yapmak, panelleri sekmede açmak, Glance/yüzen çubuğu açık sekmeye eklemek |
| `webRequest`, `webRequestBlocking`, `<all_urls>` | Yalnızca Tabes panel iframe'lerinden gelen isteklerde `X-Frame-Options`/`frame-ancestors` başlıklarını kaldırmak ve mobil `User-Agent` uygulamak; Glance ve yüzen çubuğu sayfalara eklemek. Normal gezinme isteklerine dokunulmaz |

## Dosya Yapısı

```
Tabes/
├── manifest.json
├── background/background.js   # depolama, mesajlar, Glance, yüzen çubuk kaydı, webRequest
├── sidebar/                   # kenar çubuğu arayüzü
├── popup/                     # toolbar popup'ı
├── options/                   # ayarlar sayfası
├── glance/                    # Glance overlay (glance-content.js sayfaya enjekte edilir, glance.html paneli barındırır)
├── float/float-content.js     # yüzen çubuk ve panel penceresi (Shadow DOM)
├── common/theme.js            # tema renklerini türetip uygulayan ortak kod
└── icons/
```

## Teknik Detaylar

- Manifest Version 2, minimum Firefox 109
- Eklenti ID: `tabes@extension`
- Derleme adımı yok; düz JavaScript/HTML/CSS
- Paneller `<iframe>` içinde açılır; Glance ve yüzen pencere sayfaya Shadow DOM ile izole edilmiş olarak eklenir

## Geliştirme

1. Repoyu klonlayın
2. `about:debugging` üzerinden geçici olarak yükleyin; dosya değişikliklerinden sonra "Reload" deyin
3. Söz dizimi kontrolü: `node --check` ile JS dosyalarını kontrol edin (ör. `for f in */*.js; do node --check "$f"; done`)
4. Otomatik test yok; değişiklikleri sidebar, Glance ve yüzen çubukta elle deneyin

## Lisans

MIT License

## Katkıda Bulunma

Katkılar memnuniyetle karşılanır. Lütfen pull request göndermeden önce değişiklikleri test edin ve `CHANGELOG.md` dosyasını güncelleyin.
