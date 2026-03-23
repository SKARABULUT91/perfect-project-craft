
# X-Master Dashboard — React Web Uygulaması

Mevcut Chrome eklentisi dashboard'unu, birebir aynı tasarım ve işlevsellikle React web uygulamasına dönüştüreceğiz. Veriler `localStorage` ile yönetilecek (Chrome storage yerine).

## Sayfa Yapısı

### Layout
- **Sol Sidebar**: Logo (X-Master), navigasyon menüsü (6 sayfa), alt kısımda "DURDUR" butonu
- **Üst Header**: Sayfa başlığı + durum badge'i (Hazır / Aktif)
- **Ana İçerik**: Seçilen sayfanın içeriği, geçiş animasyonlu

### Sayfalar

1. **Genel Bakış (Home)**
   - 4'lü istatistik grid: Beğeni, Retweet, Takip, Takipten Çıkma
   - İstatistik sıfırlama butonu
   - Log konsolu (monospace, renkli log satırları)

2. **Otomasyon**
   - Akış Etkileşimi kartı (adet + gecikme + Beğen/RT butonları)
   - Hedef İşlemler kartı (profil/tweet input + Beğen/RT/Takip butonları + yanıt gönderme)
   - Toplu Döngü kartı (döngü sayısı, gecikme, ment/tweet + takipçi önbellek yönetimi + modal)

3. **Takip Yönetimi**
   - Kitle Çekme kartı (hedef kullanıcı, kaynak seçimi, adet, CSV indirme)
   - Liste ile Takip kartı (textarea ile kullanıcı listesi)
   - Beyaz Liste kartı

4. **Temizlik & Araçlar**
   - Takipten Çıkma İşlemleri (adet, hız modu, gecikme + 3 farklı unfollow butonu)
   - İçerik Temizliği (beğeni geri çekme, tweet silme, yanıt temizleme, RT kaldırma)

5. **Veri Yönetimi**
   - Kara Liste (blacklist textarea)
   - Hedef Kelime Filtresi (whitelist keywords)
   - Etkileşim Geçmişi (görüntüle/temizle)
   - Veritabanı Yedekleme (JSON export/import)

6. **Ayarlar (Gelişmiş)**
   - Ana Hız Profili seçimi (Turbo/Normal/Güvenli/Yavaş)
   - 8'li detaylı hız ayarları grid'i
   - Spam Koruması toggleları (İnsan Sim., Rastgele Gecikme, Onaylı Filtre, vb.)
   - Kelime Filtresi bölümü (toggle + kara liste textarea)
   - Anti-Shadowban koruması (toggle + işlem sayısı + dinlenme süresi)

## Tasarım
- Orijinal koyu tema: `#09090b` body, `#18181b` sidebar/card, `#27272a` input/border
- Primary: `#3b82f6`, Danger: `#ef4444`, Success: `#10b981`
- Inter fontu, 14px base
- Özel scrollbar, hover efektleri, fadeIn animasyonlar

## Veri Yönetimi
- Tüm ayarlar ve istatistikler `localStorage` ile persist edilecek
- JSON yedekleme/geri yükleme işlevi çalışacak
- Butonlar demo modda `toast` bildirimi gösterecek (gerçek Twitter bağlantısı olmadan)
