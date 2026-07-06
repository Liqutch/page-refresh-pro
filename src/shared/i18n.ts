import { getAppSettings } from './storage';
import { Language } from './types';

const messages: Record<Language, Record<string, string>> = {
  tr: {
    appName: 'Page Refresh Pro',
    start: 'Başlat',
    stop: 'Durdur',
    settings: 'Ayarlar',
    mainNav: 'Ana menü',
    tabInterval: 'Aralık',
    tabMonitor: 'İzleme',
    tabTabs: 'Sekmeler',
    intervalModeLabel: 'Aralık modu',
    modeFixed: 'Sabit',
    modeRandom: 'Rastgele',
    modeCustom: 'Özel',
    labelInterval: 'Aralık',
    labelSeconds: 'Saniye',
    labelRandomInterval: 'Rastgele Aralık',
    minSec: 'Min (sn)',
    maxSec: 'Maks (sn)',
    labelCustomDuration: 'Özel Süre',
    hoursShort: 'SA',
    minutesShort: 'DK',
    secondsShort: 'SN',
    decrease: 'Azalt',
    increase: 'Artır',
    ariaSeconds: 'Saniye',
    ariaHourUp: 'Saat artır',
    ariaHourDown: 'Saat azalt',
    ariaMinuteUp: 'Dakika artır',
    ariaMinuteDown: 'Dakika azalt',
    ariaSecondUp: 'Saniye artır',
    ariaSecondDown: 'Saniye azalt',
    popupOptions: 'Seçenekler',
    hardRefreshTitle: 'Sıkı Yenileme',
    hardRefreshDesc: 'Her yenilemede önbelleği atla',
    maxRefreshesTitle: 'Yenileme Sayısını Ayarla',
    maxRefreshesDesc: 'Sabit sayıdan sonra dur',
    maxRefreshesCountLabel: 'Yenileme sayısı',
    visualTimerTitle: 'Görsel zamanlayıcıyı göster',
    visualTimerDesc: 'Sayfada geri sayım göster',
    timerTopRight: 'Sağ üst',
    timerTopLeft: 'Sol üst',
    timerBottomRight: 'Sağ alt',
    timerBottomLeft: 'Sol alt',
    detectCaptchaTitle: 'Captcha algılanınca duraklat',
    detectCaptchaDesc: 'Captcha ekranında yenilemeyi durdur',
    detectErrorsTitle: 'Hata sayfası algılanınca duraklat',
    detectErrorsDesc: '404 veya offline sayfalarda dur',
    interactionTitle: 'Kullanıcı etkileşimi algıla',
    interactionDesc: 'Tıklama veya kaydırma sonrası tepki ver',
    interactionStop: 'Durdur',
    interactionPause: 'Duraklat',
    interactionRestart: 'Yeniden başlat',
    refreshTypeLabel: 'Yenileme Türü',
    fullRefresh: 'Tam Sayfa Yenileme',
    xhrRefresh: 'XHR Yenileme',
    fullRefreshHint: 'Değişiklikleri kontrol etmek için tüm sayfayı yeniden yükle.',
    xhrTargets: 'XHR Hedefleri',
    xhrTargetsHint: 'Sayfadaki yenile butonunu seçin',
    pickTarget: 'Hedef seçin...',
    pickerSelectElement: 'XHR Yenileme için bir element seçiniz…',
    monitorModeLabel: 'İzleme Modu',
    templateFound: 'Bulundu',
    templateLost: 'Kayboldu',
    templateCustom: 'Özel',
    templateHintFound: 'Anahtar kelimeniz göründüğünde bildirim alın.',
    templateHintLost: 'Anahtar kelimeniz kaybolduğunda bildirim alın.',
    templateHintCustom: 'Önceki yenilemeden sonra sayfada herhangi bir değişiklik olursa bildirim alın.',
    keywordPlaceholder: 'Anahtar kelime, regex, XPath veya CSS seçici',
    addKeyword: '+ Ekle',
    noKeywords: 'Henüz anahtar kelime yok...',
    clearKeywords: 'Tümünü Temizle',
    autoClickTitle: 'Eşleşen elementi otomatik tıkla',
    continueAfterAlertTitle: 'Uyarıdan Sonra Yenilemeye Devam Et',
    continueAfterAlertDesc: 'Uyarı sonrası anahtar kelime kaybolana (veya Kayboldu modunda geri gelene) kadar 5 sn aralıkla yeniler',
    highlightKeywordTitle: 'Sayfada Anahtar Kelimeyi Vurgula',
    highlightKeywordDesc: 'Eşleşmede anahtar kelimeyi yeşil kesikli çerçeveyle 1 sn vurgular',
    highlightChangeTitle: 'Değişen Öğeyi Vurgula',
    highlightChangeDesc: 'Sayfa değiştiğinde değişen bölümü yeşil kesikli çerçeveyle 1 sn vurgular',
    monitorNotifyFoundTitle: 'Anahtar kelime bulundu',
    monitorNotifyFoundMessage: '"{keyword}" sayfada görünüyor.',
    monitorNotifyLostTitle: 'Anahtar kelime kayboldu',
    monitorNotifyLostMessage: '"{keyword}" artık sayfada görünmüyor.',
    monitorNotifyCustomTitle: 'Sayfa değişti',
    monitorNotifyCustomMessage: 'Önceki yenilemeden sonra sayfada değişiklik algılandı.',
    monitorNotifyWatchingTitle: 'İzleme devam ediyor',
    monitorNotifyWatchingFound: '"{keyword}" hâlâ sayfada. 5 sn aralıkla kontrol ediliyor.',
    monitorNotifyWatchingLost: '"{keyword}" hâlâ sayfada yok. 5 sn aralıkla kontrol ediliyor.',
    refreshingTabs: 'Yenilenen Sekmeler',
    noRefreshingTabs: 'Yenilenen sekme yok',
    go: 'Git',
    stopTab: 'Durdur',
    paused: 'Duraklatıldı',
    remaining: '{n}s kaldı',
    refreshCount: '{n} yenileme',
    refreshTypeFull: 'Tam sayfa',
    refreshTypeXhr: 'XHR',
    toastNoActiveTab: 'Aktif sekme bulunamadı.',
    toastTargetAdded: 'Hedef eklendi: {label}',
    toastPickerRestricted: 'Bu sayfada hedef seçici kullanılamaz.',
    toastPermissionDenied: 'Sayfa erişim izni verilmedi. XHR hedef seçmek için izin gerekir.',
    toastScriptFailed: 'Sayfa betiği yüklenemedi. Sayfayı yenileyip tekrar deneyin.',
    toastPickerFailed: 'Hedef seçici başlatılamadı. Sayfayı yenileyip tekrar deneyin.',
    toastPickerResume: 'İzin verildi. Hedef seçim modu açılıyor…',
    intervalSummaryRandom: 'her {min}-{max} sn yeniler',
    intervalSummarySeconds: 'her {s} sn yeniler',
    intervalSummaryFixed: 'her {h}s {m}d {s}sn',
    optionsTitle: 'Page Refresh Pro Ayarları',
    optionsSubtitle: 'Eklenti tercihlerini yönetin',
    optionsComingSoon: 'Yakında daha fazla seçenek eklenecek.',
    sectionGeneral: 'Genel',
    languageLabel: 'Dil',
    languageDesc: 'Arayüz dili. Kaydettikten sonra popup da güncellenir.',
    saveButton: 'Kaydet',
    savedStatus: 'Ayarlar kaydedildi.',
    langTr: 'Türkçe',
    langEn: 'English',
    sectionTerms: 'Hizmet Koşulları',
    termsUpdated: 'Son güncelleme: 5 Temmuz 2026',
    termsIntro:
      'Page Refresh Pro, tarayıcınızda çalışan bağımsız bir eklentidir. Aşağıdaki koşullar, eklentiyi kurduğunuzda veya kullandığınızda aramızdaki anlaşmayı oluşturur. Devam etmeniz, bu metni okuduğunuz ve kabul ettiğiniz anlamına gelir.',
    termsS1Title: 'Tamamen ücretsiz',
    termsS1Body:
      'Page Refresh Pro, herkesin kullanabilmesi için ücretsiz olarak geliştirilmiştir. Abonelik, ücretli sürüm veya uygulama içi satın alma yoktur; eklenti kar amacı gütmeksizin sunulur ve böyle kalmayı hedefler.',
    termsS2Title: 'Page Refresh Pro tam olarak ne yapar?',
    termsS2Body:
      'Sekmeleri belirlediğiniz sürelerle yeniler; sayfa içeriğinde değişiklik izlemenize, XHR hedefi seçmenize, görsel geri sayım göstermenize ve alan adına özel ayar saklamanıza olanak tanır. Tüm bu işlemler tarayıcınızda, sizin başlattığınız oturumlar üzerinden yürür. Özellik ekleyebilir, değiştirebilir veya kaldırabiliriz; her sürümün ömür boyu aynı kalacağını taahhüt etmiyoruz.',
    termsS3Title: 'Nasıl kullanmalısınız?',
    termsS3Intro: 'Eklenti size kolaylık sağlamak içindir; başkalarına zarar vermek veya kuralları dolanmak için değil. Özellikle şunları yapmamanız gerekir:',
    termsS3Item1: 'Yürürlükteki kanunlara aykırı veya başkalarını aldatmaya yönelik işlemler',
    termsS3Item2: 'Bir siteye saniyede yüzlerce istek göndererek sunucuyu zorlamak',
    termsS3Item3: 'Captcha, bot koruması veya erişim sınırlarını bilerek aşmaya çalışmak',
    termsS3Item4: 'Ziyaret ettiğiniz sitenin kullanım şartlarını ihlal edecek otomasyon kurmak',
    termsS3Item5: 'Eklentiyi izinsiz kopyalayıp kendi ürününüz gibi sunmak',
    termsS3Note:
      'Kurallara uymayan kullanım tespit edilirse, gelecekteki güncellemelerde erişimi kısıtlayabilir veya desteği sonlandırabiliriz.',
    termsS4Title: 'Marka ve kaynak kod',
    termsS4Body:
      'Page Refresh Pro adı, arayüzü, logosu ve yazılımı geliştiriciye aittir. Eklentiyi yeniden paketleyemez, kaynak kodunu çözmeye çalışamaz veya izinsiz ticari amaçla dağıtamazsınız.',
    termsS5Title: 'Ziyaret ettiğiniz siteler',
    termsS5Body:
      'Eklenti yalnızca sizin açtığınız sekmelerde çalışır; ancak o sitelerin içeriği, güvenliği ve politikaları tamamen site sahiplerine aittir. Bir sayfada yaşanan kesinti, veri kaybı veya hesap kısıtlamasından Page Refresh Pro sorumlu tutulamaz.',
    termsS6Title: 'Garanti vermiyoruz',
    termsS6Body:
      'Eklenti olduğu gibi sunulur. Her sitede aynı şekilde çalışacağını, izleme sonuçlarının her zaman doğru olacağını veya kesintisiz devam edeceğini garanti etmiyoruz. Kritik işleriniz için tek güvence olarak kullanmamanızı öneririz.',
    termsS7Title: 'Sorumluluğun sınırı',
    termsS7Body:
      'Yasaların izin verdiği azami ölçüde; dolaylı zararlar, kâr kaybı, veri kaybı veya üçüncü taraf sitelerden doğan sorunlar için geliştiriciye rücu edilemez. Eklentiyi kendi inisiyatifinizle ve riskinizle kullanırsınız.',
    termsS8Title: 'Kullanımı bırakmak',
    termsS8Body:
      'İstediğiniz zaman eklentiyi kaldırarak kullanımı sonlandırabilirsiniz. Koşulları ağır şekilde ihlal eden kullanımlarda, yasal zorunluluk halinde veya güvenlik gerekçesiyle desteği durdurma hakkımız saklıdır.',
    termsS9Title: 'Bu metin değişebilir',
    termsS9Body:
      'Koşulları ve eklenti özelliklerini güncelleyebiliriz. Üstteki tarih en son revizyonu gösterir. Güncellemeden sonra eklentiyi kullanmaya devam etmeniz, yeni metni kabul ettiğiniz anlamına gelir.',
    termsS10Title: 'Hukuk',
    termsS10Body:
      'Uyuşmazlıklarda, geliştiricinin faaliyet gösterdiği ülke hukuku esas alınır; tüketici olarak bulunduğunuz ülkedeki zorunlu haklarınız saklıdır.',
    termsS11Title: 'Soru ve geri bildirim',
    termsS11Body: 'Bu koşullar hakkında yazmak isterseniz:',
    termsClosing:
      'Page Refresh Pro\'yu kullanarak yukarıdaki Hizmet Koşulları\'na uyacağınızı beyan etmiş olursunuz.',
    sectionPrivacy: 'Gizlilik Şartları',
    privacyUpdated: 'Son güncelleme: 5 Temmuz 2026',
    privacyIntro:
      'Bu Gizlilik Şartları, Page Refresh Pro\'nun ("Eklenti") verilerle nasıl ilişki kurduğunu açıklar. Geliştirici olarak kişisel verilerinizi toplamıyor, satmıyor veya pazarlama amacıyla paylaşmıyoruz.',
    privacyS1Title: '1. Topladığımız veri yoktur',
    privacyS1Body:
      'Eklenti, adınız, e-postanız, konumunuz veya tarama geçmişiniz gibi kişisel bilgileri sunucularımıza göndermez. Kullanım istatistiği, reklam kimliği veya analitik takip de yapılmaz.',
    privacyS2Title: '2. Yalnızca cihazınızda saklanan ayarlar',
    privacyS2Intro: 'Aşağıdaki bilgiler yalnızca tarayıcınızın yerel depolama alanında (chrome.storage.local) tutulur:',
    privacyS2Item1: 'Dil ve genel eklenti tercihleri',
    privacyS2Item2: 'Alan adına özel yenileme ve izleme ayarları',
    privacyS2Item3: 'Aktif otomatik yenileme oturumları (sekme kimliği, aralık, durum)',
    privacyS2Note:
      'Bu veriler yalnızca eklentinin çalışması için gereklidir, cihazınızdan dışarı aktarılmaz ve geliştirici tarafından uzaktan okunamaz.',
    privacyS3Title: '3. İzinlerin kullanımı',
    privacyS3Body:
      'Eklenti; sekmeleri yenilemek, sayfa içeriğini izlemek ve hedef seçmek için tarayıcı izinlerini kullanır. Bu işlemler yerelde gerçekleşir. Ziyaret ettiğiniz sayfalara yalnızca siz bir özelliği etkinleştirdiğinizde müdahale edilir.',
    privacyS4Title: '4. Üçüncü taraf web siteleri',
    privacyS4Body:
      'Eklentiyi kullandığınız sitelerin kendi gizlilik uygulamaları geçerlidir. Bu sitelerin topladığı verilerden sorumlu değiliz.',
    privacyS5Title: '5. Verilerin silinmesi',
    privacyS5Body:
      'Eklentiyi kaldırdığınızda veya tarayıcı verilerini temizlediğinizde yerel depolamadaki ayarlar ve oturum bilgileri silinir. Sunucularımızda saklanan bir kopya bulunmaz.',
    privacyS7Title: '6. Politika değişiklikleri',
    privacyS7Body:
      'Bu metni zaman zaman güncelleyebiliriz. Güncelleme tarihi sayfanın üstünde yer alır. Değişiklikten sonra kullanmaya devam etmeniz güncel metni kabul ettiğiniz anlamına gelir.',
    privacyS8Title: '7. İletişim',
    privacyS8Body: 'Gizlilikle ilgili sorularınız için bizimle iletişime geçebilirsiniz:',
    privacyClosing:
      'Page Refresh Pro\'yu kullanarak bu Gizlilik Şartlarını okuduğunuzu ve anladığınızı kabul etmiş olursunuz.',
  },
  en: {
    appName: 'Page Refresh Pro',
    start: 'Start',
    stop: 'Stop',
    settings: 'Settings',
    mainNav: 'Main menu',
    tabInterval: 'Interval',
    tabMonitor: 'Monitor',
    tabTabs: 'Tabs',
    intervalModeLabel: 'Interval mode',
    modeFixed: 'Fixed',
    modeRandom: 'Random',
    modeCustom: 'Custom',
    labelInterval: 'Interval',
    labelSeconds: 'Seconds',
    labelRandomInterval: 'Random Interval',
    minSec: 'Min (s)',
    maxSec: 'Max (s)',
    labelCustomDuration: 'Custom Duration',
    hoursShort: 'HR',
    minutesShort: 'MIN',
    secondsShort: 'SEC',
    decrease: 'Decrease',
    increase: 'Increase',
    ariaSeconds: 'Seconds',
    ariaHourUp: 'Increase hours',
    ariaHourDown: 'Decrease hours',
    ariaMinuteUp: 'Increase minutes',
    ariaMinuteDown: 'Decrease minutes',
    ariaSecondUp: 'Increase seconds',
    ariaSecondDown: 'Decrease seconds',
    popupOptions: 'Options',
    hardRefreshTitle: 'Hard Refresh',
    hardRefreshDesc: 'Bypass cache on every refresh',
    maxRefreshesTitle: 'Set Refresh Count',
    maxRefreshesDesc: 'Stop after a fixed number',
    maxRefreshesCountLabel: 'Refresh count',
    visualTimerTitle: 'Show visual timer',
    visualTimerDesc: 'Display countdown on the page',
    timerTopRight: 'Top right',
    timerTopLeft: 'Top left',
    timerBottomRight: 'Bottom right',
    timerBottomLeft: 'Bottom left',
    detectCaptchaTitle: 'Pause on captcha',
    detectCaptchaDesc: 'Stop refreshing on captcha screens',
    detectErrorsTitle: 'Pause on error page',
    detectErrorsDesc: 'Stop on 404 or offline pages',
    interactionTitle: 'Detect user interaction',
    interactionDesc: 'React after click or scroll',
    interactionStop: 'Stop',
    interactionPause: 'Pause',
    interactionRestart: 'Restart',
    refreshTypeLabel: 'Refresh Type',
    fullRefresh: 'Full Page Refresh',
    xhrRefresh: 'XHR Refresh',
    fullRefreshHint: 'Reload the entire page to check for changes.',
    xhrTargets: 'XHR Targets',
    xhrTargetsHint: 'Select the refresh button on the page',
    pickTarget: 'Select target...',
    pickerSelectElement: 'Select an element for XHR Refresh…',
    monitorModeLabel: 'Monitor Mode',
    templateFound: 'Found',
    templateLost: 'Lost',
    templateCustom: 'Custom',
    templateHintFound: 'Get notified when your keyword appears.',
    templateHintLost: 'Get notified when your keyword disappears.',
    templateHintCustom: 'Get notified when anything on the page changes since the last refresh.',
    keywordPlaceholder: 'Keyword, regex, XPath or CSS selector',
    addKeyword: '+ Add',
    noKeywords: 'No keywords yet...',
    clearKeywords: 'Clear All',
    autoClickTitle: 'Auto-click matched element',
    continueAfterAlertTitle: 'Continue Refresh After Alert',
    continueAfterAlertDesc: 'After an alert, refresh every 5s until the keyword disappears (or reappears in Lost mode)',
    highlightKeywordTitle: 'Highlight Keyword on Page',
    highlightKeywordDesc: 'Highlights the keyword with a green dashed frame for 1 second on match',
    highlightChangeTitle: 'Highlight Changed Element',
    highlightChangeDesc: 'Highlights the changed area with a green dashed frame for 1 second',
    monitorNotifyFoundTitle: 'Keyword found',
    monitorNotifyFoundMessage: '"{keyword}" is visible on the page.',
    monitorNotifyLostTitle: 'Keyword lost',
    monitorNotifyLostMessage: '"{keyword}" is no longer visible on the page.',
    monitorNotifyCustomTitle: 'Page changed',
    monitorNotifyCustomMessage: 'A change was detected on the page since the last refresh.',
    monitorNotifyWatchingTitle: 'Monitoring continues',
    monitorNotifyWatchingFound: '"{keyword}" is still on the page. Checking every 5s.',
    monitorNotifyWatchingLost: '"{keyword}" is still absent. Checking every 5s.',
    refreshingTabs: 'Refreshing Tabs',
    noRefreshingTabs: 'No refreshing tabs',
    go: 'Go',
    stopTab: 'Stop',
    paused: 'Paused',
    remaining: '{n}s left',
    refreshCount: '{n} refreshes',
    refreshTypeFull: 'Full page',
    refreshTypeXhr: 'XHR',
    toastNoActiveTab: 'No active tab found.',
    toastTargetAdded: 'Target added: {label}',
    toastPickerRestricted: 'Target picker is not available on this page.',
    toastPermissionDenied: 'Page permission denied. Permission is required for XHR target picking.',
    toastScriptFailed: 'Content script failed to load. Refresh the page and try again.',
    toastPickerFailed: 'Could not start target picker. Refresh the page and try again.',
    toastPickerResume: 'Permission granted. Starting target picker…',
    intervalSummaryRandom: 'every {min}-{max}s',
    intervalSummarySeconds: 'every {s}s',
    intervalSummaryFixed: 'every {h}h {m}m {s}s',
    optionsTitle: 'Page Refresh Pro Settings',
    optionsSubtitle: 'Manage extension preferences',
    optionsComingSoon: 'More options will be added soon.',
    sectionGeneral: 'General',
    languageLabel: 'Language',
    languageDesc: 'Interface language. The popup updates after you save.',
    saveButton: 'Save',
    savedStatus: 'Settings saved.',
    langTr: 'Türkçe',
    langEn: 'English',
    sectionTerms: 'Terms of Service',
    termsUpdated: 'Last updated: July 5, 2026',
    termsIntro:
      'Page Refresh Pro is an independent browser extension. The terms below form our agreement when you install or use it. By continuing, you confirm that you have read and accept them.',
    termsS1Title: 'Completely free',
    termsS1Body:
      'Page Refresh Pro was built so everyone can use it at no cost. There is no subscription, paid tier, or in-app purchase—the Extension is offered without profit motive and is meant to stay that way.',
    termsS2Title: 'What Page Refresh Pro actually does',
    termsS2Body:
      'It refreshes tabs on schedules you set, helps you watch page content for changes, pick XHR targets, show an on-page countdown, and remember per-domain settings. Everything runs inside your browser from sessions you start. We may add, change, or remove features; we do not promise that every version will behave the same forever.',
    termsS3Title: 'How you should use it',
    termsS3Intro: 'The Extension is meant to save you time—not to harm others or skirt rules. In particular, do not:',
    termsS3Item1: 'Break applicable laws or run deceptive schemes',
    termsS3Item2: 'Hammer a site with excessive automated requests',
    termsS3Item3: 'Deliberately try to bypass CAPTCHA, bot checks, or rate limits',
    termsS3Item4: 'Automate actions that violate a website\'s own terms of use',
    termsS3Item5: 'Repackage the Extension and pass it off as your own product',
    termsS3Note:
      'If we identify serious misuse, we may limit support or access in future releases.',
    termsS4Title: 'Brand and source code',
    termsS4Body:
      'The Page Refresh Pro name, interface, logo, and software belong to the developer. You may not redistribute it, attempt to reverse-engineer it, or sell it without permission.',
    termsS5Title: 'Sites you visit',
    termsS5Body:
      'The Extension only runs on tabs you open, but each website\'s content, security, and policies remain that site\'s responsibility. Outages, account limits, or data issues on a page are not attributable to Page Refresh Pro.',
    termsS6Title: 'No warranties',
    termsS6Body:
      'The Extension is provided as-is. We do not warrant flawless operation on every site, perfect monitoring accuracy, or uninterrupted uptime. Do not rely on it as your only safeguard for critical tasks.',
    termsS7Title: 'Limit of liability',
    termsS7Body:
      'To the maximum extent allowed by law, the developer is not liable for indirect damages, lost profits, lost data, or problems originating on third-party websites. You use the Extension at your own discretion and risk.',
    termsS8Title: 'Stopping use',
    termsS8Body:
      'You can uninstall at any time. We may discontinue support for severe violations, legal requirements, or security reasons.',
    termsS9Title: 'This document may change',
    termsS9Body:
      'We may revise these terms and the Extension itself. The date above shows the latest revision. Continued use after an update means you accept the new text.',
    termsS10Title: 'Governing law',
    termsS10Body:
      'Disputes are handled under the laws of the developer\'s country of operation, without prejudice to mandatory consumer rights where you live.',
    termsS11Title: 'Questions and feedback',
    termsS11Body: 'To reach us about these terms:',
    termsClosing:
      'By using Page Refresh Pro, you agree to follow the Service Terms above.',
    sectionPrivacy: 'Privacy Policy',
    privacyUpdated: 'Last updated: July 5, 2026',
    privacyIntro:
      'This Privacy Policy explains how Page Refresh Pro (the "Extension") handles data. As the developer, we do not collect, sell, or share your personal information for marketing purposes.',
    privacyS1Title: '1. We do not collect your data',
    privacyS1Body:
      'The Extension does not send personal information—such as your name, email, location, or browsing history—to our servers. We do not run analytics, ad tracking, or usage profiling.',
    privacyS2Title: '2. Settings stored only on your device',
    privacyS2Intro: 'The following information is kept only in your browser\'s local storage (chrome.storage.local):',
    privacyS2Item1: 'Language and general extension preferences',
    privacyS2Item2: 'Per-domain refresh and monitor settings',
    privacyS2Item3: 'Active auto-refresh sessions (tab id, interval, status)',
    privacyS2Note:
      'This data exists solely to operate the Extension. It is not transmitted off your device and cannot be read remotely by the developer.',
    privacyS3Title: '3. How permissions are used',
    privacyS3Body:
      'The Extension uses browser permissions to refresh tabs, monitor page content, and pick targets. Processing happens locally. Pages are only accessed when you enable a feature.',
    privacyS4Title: '4. Third-party websites',
    privacyS4Body:
      'Websites you visit have their own privacy practices. We are not responsible for data those sites may collect.',
    privacyS5Title: '5. Deleting your data',
    privacyS5Body:
      'When you uninstall the Extension or clear browser data, local settings and session information are removed. We do not retain copies on our servers.',
    privacyS7Title: '6. Policy updates',
    privacyS7Body:
      'We may update this policy from time to time. The revision date appears at the top. Continued use after an update means you accept the current policy.',
    privacyS8Title: '7. Contact',
    privacyS8Body: 'For privacy-related questions, you can reach us at:',
    privacyClosing:
      'By using Page Refresh Pro, you acknowledge that you have read and understood this Privacy Policy.',
  },
};

let currentLanguage: Language = 'tr';

export async function loadLanguage(): Promise<Language> {
  currentLanguage = (await getAppSettings()).language;
  return currentLanguage;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(language: Language): void {
  currentLanguage = language;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  return tForLanguage(currentLanguage, key, vars);
}

export function tForLanguage(
  language: Language,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const chromeMessage = chrome.i18n?.getMessage?.(key);
  let text = chromeMessage || messages[language][key] || messages.tr[key] || key;
  if (vars) {
    Object.entries(vars).forEach(([name, value]) => {
      text = text.replaceAll(`{${name}}`, String(value));
    });
  }
  return text;
}

export function applyTranslations(root: ParentNode = document): void {
  document.documentElement.lang = currentLanguage;

  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    if (key) {
      element.textContent = t(key);
    }
  });

  root.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (key) {
      element.placeholder = t(key);
    }
  });

  root.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((element) => {
    const key = element.dataset.i18nAriaLabel;
    if (key) {
      element.setAttribute('aria-label', t(key));
    }
  });

  root.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((element) => {
    const key = element.dataset.i18nTitle;
    if (key) {
      element.title = t(key);
    }
  });

  if (document.title === '' || document.title.includes('Page Refresh Pro')) {
    const optionsPage = document.querySelector('.options-shell');
    document.title = optionsPage ? t('optionsTitle') : t('appName');
  }
}

export async function initI18n(root: ParentNode = document): Promise<Language> {
  await loadLanguage();
  applyTranslations(root);
  return currentLanguage;
}

export function bindI18nStorageSync(onChange?: () => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.appSettings) {
      return;
    }
    const next = changes.appSettings.newValue as { language?: Language } | undefined;
    if (!next?.language || next.language === currentLanguage) {
      return;
    }
    setLanguage(next.language);
    applyTranslations();
    onChange?.();
  });
}
