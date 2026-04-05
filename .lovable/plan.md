
## Plan: Twikit + Playwright Entegrasyonu

### 1. Mevcut Twitter API Edge Function Kaldırma
- `supabase/functions/twitter-api/` silinir
- `src/lib/twitter-api.ts` yeniden yazılır → VPS'teki FastAPI'ye istek atar

### 2. Python Backend API Tanımı (VPS'te çalışacak)
- `main.py` güncellenir: Twikit + Playwright tabanlı endpointler
- Endpointler: login, like, retweet, follow, unfollow, tweet, get_timeline, search, view_boost, send_dm
- Session/cookie yönetimi, proxy rotasyonu, rastgele gecikme, human-like scroll

### 3. Frontend → Backend Bağlantısı
- `VITE_BACKEND_URL` environment variable eklenir (VPS adresi)
- `src/lib/api-client.ts` oluşturulur → tüm sayfalar bu client'ı kullanır
- Her sayfa gerçek backend'e bağlanır

### 4. Sayfa Entegrasyonları
- **HomePage**: Backend bağlantı durumu, istatistikler
- **AccountsPage**: Hesap ekleme (username/password/2FA/proxy/user-agent)
- **AutomationPage**: Like/RT/Follow otomasyonu (Twikit üzerinden)
- **FollowPage**: Takip/takipten çıkma
- **CampaignsPage**: Toplu kampanya yönetimi
- **SchedulerPage**: Zamanlı görevler
- **CleanupPage**: Temizlik işlemleri
- **DataPage**: Veri çekme/analiz
- **AnalyticsPage**: İstatistikler
- **ProxyPage**: Proxy yönetimi
- **AdvancedPage**: User-agent, gecikme ayarları

### 5. Güvenlik Özellikleri
- Her hesap için ayrı proxy desteği
- 2FA TOTP otomatik üretimi
- Rastgele gecikme (jitter) ayarları
- User-Agent rotasyonu
- Cookie/session yönetimi
