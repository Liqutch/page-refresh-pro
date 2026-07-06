# <img src="public/icons/icon-128.png" width="40" height="40" alt="Page Refresh Pro" align="top"> Page Refresh Pro
[![License: MIT](https://img.shields.io/badge/License-MIT-00ffb4.svg)](LICENSE)

Manifest V3 tabanlı, tamamen yerel çalışan Chrome eklentisi. Sekmeleri otomatik yeniler, sayfa değişikliklerini izler ve XHR hedeflerine tıklar. Kişisel veri toplamaz; tüm ayarlar `chrome.storage.local` içinde kalır.

[Privacy Policy & Terms](https://liqutch.github.io/page-refresh-pro/#privacy) · [English](#english)

## Özellikler

- **Yenileme:** Sabit, rastgele veya özel aralık (0,1 sn'den itibaren XHR ile)
- **Tam sayfa veya XHR:** Sayfadaki bir öğeye tıklayarak kısmi yenileme
- **İzleme modu:** Bulundu, Kayboldu, Özel (sayfa değişikliği) + bildirim ve vurgulama
- **Akıllı kontroller:** Captcha/hata algılama, yenileme limiti, görsel geri sayım
- **Alan adına özel ayarlar** ve Türkçe/İngilizce arayüz

<img width="378" height="599" alt="1" src="https://github.com/user-attachments/assets/ae1cffdb-0491-4836-9308-de1503933fbb" /> <img width="378" height="598" alt="2" src="https://github.com/user-attachments/assets/fa40f5e3-170e-4152-a545-cd141766acd9" />

## Hızlı başlangıç

```bash
git clone https://github.com/Liqutch/page-refresh-pro
cd page-refresh-pro
npm install
npm run build
```

Chrome'da `chrome://extensions` → **Developer mode** → **Load unpacked** → `dist` klasörünü seçin.

### Release zip ile kurulum (kaynak kod derlemeden)

[Releases](https://github.com/Liqutch/page-refresh-pro/releases) sayfasından `.zip` indirip kurabilirsiniz:

1. Zip'i bir klasöre çıkarın.
2. Çıkan klasörde **doğrudan** `manifest.json` olmalı (içinde bir `dist` alt klasörü olmamalı).
3. `chrome://extensions` → **Geliştirici modu** → **Paketlenmemiş öğe yükle** → o klasörü seçin.

> **Vite / localhost:5173 hatası alıyorsanız:** Zip muhtemelen `npm run dev` çıktısından yapılmıştır. Dev sunucusu çalışırken oluşan `dist` dağıtılamaz. Yayıncı `npm run package` ile üretilmiş zip kullanmalıdır.

Yayıncılar için:

```bash
npm run package
```

Bu komut production build alır ve kökünde `manifest.json` olan `page-refresh-pro-v1.0.0.zip` üretir.

Geliştirme modu:

```bash
npm run dev
```

`npm run dev` terminali açık kalmalı. Popup'ta localhost hatası görürseniz dev sunucusunu yeniden başlatıp eklentiyi reload edin. Dev sunucusu olmadan test için `npm run build` yeterlidir.

## Proje yapısı

```
src/
  background/     Service worker, yenileme motoru
  content/        Sayfa script'leri (XHR, izleme, picker)
  popup/          Eklenti popup arayüzü
  options/        Ayarlar, hizmet koşulları, gizlilik
  shared/         Tipler, i18n, depolama, mesajlaşma
public/icons/     PNG ikonlar (logo.png kaynağından)
index.html        GitHub Pages: gizlilik ve hizmet koşulları
```

## Gizlilik

Harici sunucu, hesap sistemi veya analytics yoktur. Ayarlar ve aktif oturumlar yalnızca tarayıcıda saklanır. Ayrıntılar: [index.html](https://liqutch.github.io/page-refresh-pro/).

## Katkı

1. Fork edin ve bir dal oluşturun
2. Değişikliklerinizi yapın (`npm run build` ile doğrulayın)
3. Pull request açın

Marka adı **Page Refresh Pro** geliştiriciye aittir; izinsiz yeniden paketleyip kendi ürününüz gibi sunmayınız (bkz. [Hizmet Koşulları](https://liqutch.github.io/page-refresh-pro/#terms)).

## Lisans

[MIT](LICENSE) — Telif © 2026 Page Refresh Pro

---

## English

**Page Refresh Pro** is a privacy-first Chrome MV3 extension that auto-refreshes tabs, monitors page content, and clicks XHR targets. No accounts, no analytics, no remote data collection.

### Quick start

```bash
git clone https://github.com/Liqutch/page-refresh-pro
cd page-refresh-pro
npm install
npm run build
```

Load the `dist` folder via `chrome://extensions` → Developer mode → Load unpacked.

Download the release `.zip`, extract it, and load the folder that **directly contains** `manifest.json`. If you see a Vite / `localhost:5173` error, the zip was built from dev mode — use a release zip from `npm run package` or build from source.

### License

MIT — see [LICENSE](LICENSE). Privacy policy and terms: https://liqutch.github.io/page-refresh-pro
