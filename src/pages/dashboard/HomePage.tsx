import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { LogIn, LogOut, User, CheckCircle2, AlertTriangle, Shield, Server, Settings } from 'lucide-react';
import { checkBackendStatus, loginAccount, getAccountInfo, setBackendUrl, getConfiguredBackendUrl } from '@/lib/api-client';

export default function HomePage() {
  const { stats, resetStats, logs, addLog, clearLogs, twitterCredentials, loginTwitter, logoutTwitter, settings, accounts } = useStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'error'>('all');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendUrl, setBackendUrlState] = useState(getConfiguredBackendUrl());
  const [showBackendConfig, setShowBackendConfig] = useState(false);
  const [connectedUser, setConnectedUser] = useState<{ name: string; username: string; profileImage?: string } | null>(
    twitterCredentials.isLoggedIn ? { name: '', username: twitterCredentials.username } : null
  );

  const statItems = [
    { label: 'BEĞENİ', value: stats.likes, emoji: '❤️' },
    { label: 'RETWEET', value: stats.rts, emoji: '🔁' },
    { label: 'TAKİP', value: stats.follows, emoji: '👤' },
    { label: 'T. BIRAKMA', value: stats.unfollows, emoji: '👋' },
  ];

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    setBackendStatus('checking');
    const result = await checkBackendStatus();
    setBackendStatus(result.success ? 'online' : 'offline');
    if (result.success) {
      addLog(`✅ Backend bağlantısı aktif (${getConfiguredBackendUrl()})`, 'success');
    }
  };

  const handleSaveBackendUrl = () => {
    setBackendUrl(backendUrl);
    setShowBackendConfig(false);
    addLog(`Backend URL güncellendi: ${backendUrl}`, 'info');
    checkBackend();
  };

  const handleReset = () => {
    resetStats();
    addLog('İstatistikler başarıyla sıfırlandı.', 'success');
  };

  const handleConnect = async () => {
    if (backendStatus !== 'online') {
      addLog('❌ Backend çevrimdışı! Önce VPS sunucunuzu başlatın.', 'error');
      return;
    }

    // Aktif hesabı bul
    const activeAccount = accounts.find(a => a.isActive);
    if (!activeAccount) {
      addLog('❌ Aktif hesap yok. Önce Hesaplar sayfasından bir hesap ekleyin ve aktif yapın.', 'error');
      return;
    }

    setIsLoggingIn(true);
    addLog(`@${activeAccount.username} ile giriş yapılıyor (Twikit)...`, 'info');

    const result = await loginAccount(
      activeAccount.username,
      activeAccount.password,
      activeAccount.twoFASecret || undefined,
      activeAccount.proxy || undefined,
      activeAccount.userAgent || undefined
    );

    if (result.success) {
      loginTwitter(activeAccount.username, activeAccount.password);
      
      // Hesap bilgilerini çek
      const info = await getAccountInfo(activeAccount.username);
      setConnectedUser({
        name: info.data?.name || activeAccount.username,
        username: activeAccount.username,
        profileImage: info.data?.profile_image_url,
      });
      addLog(`✅ @${activeAccount.username} başarıyla bağlandı! (Twikit - API Key gereksiz)`, 'success');
    } else {
      addLog(`❌ Giriş hatası: ${result.error}`, 'error');
      if (result.error?.includes('401') || result.error?.includes('password')) {
        addLog('💡 İpucu: Kullanıcı adı, şifre veya 2FA bilgilerinizi kontrol edin.', 'info');
      }
    }

    setIsLoggingIn(false);
  };

  const handleDisconnect = () => {
    const username = twitterCredentials.username;
    logoutTwitter();
    setConnectedUser(null);
    addLog(`@${username} bağlantısı kesildi.`, 'info');
  };

  const filteredLogs = logFilter === 'error' ? logs.filter((l) => l.type === 'error') : logs;
  const errorCount = logs.filter((l) => l.type === 'error').length;

  return (
    <div>
      {/* Backend Status */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Server className="w-4 h-4" /> Backend Bağlantısı (VPS)
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full',
              backendStatus === 'online' ? 'bg-success shadow-[0_0_8px_hsl(var(--success))]' :
              backendStatus === 'offline' ? 'bg-destructive shadow-[0_0_8px_hsl(var(--destructive))]' :
              'bg-warning animate-pulse'
            )} />
            <span className="text-xs text-muted-foreground">
              {backendStatus === 'online' ? 'Çevrimiçi' : backendStatus === 'offline' ? 'Çevrimdışı' : 'Kontrol ediliyor...'}
            </span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowBackendConfig(!showBackendConfig)}>
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {showBackendConfig && (
          <div className="bg-secondary/50 rounded-lg p-4 mb-4 animate-fade-in">
            <Label className="text-xs">Backend URL (VPS Adresi)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={backendUrl}
                onChange={(e) => setBackendUrlState(e.target.value)}
                placeholder="http://your-vps-ip:8000"
                className="text-xs"
              />
              <Button size="sm" onClick={handleSaveBackendUrl}>Kaydet</Button>
              <Button size="sm" variant="secondary" onClick={checkBackend}>Test</Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              VPS'te <code>python main.py</code> ile backend'i başlatın. Varsayılan: http://localhost:8000
            </p>
          </div>
        )}

        {backendStatus === 'offline' && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs text-destructive">
            ⚠️ Backend sunucusuna ulaşılamıyor. VPS'te aşağıdaki komutları çalıştırın:
            <code className="block mt-2 bg-background p-2 rounded text-[10px] font-mono text-foreground">
              pip install -r requirements.txt && python main.py
            </code>
          </div>
        )}
      </div>

      {/* Twitter Connection */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Hesap Bağlantısı (Twikit — API Key Gereksiz)
        </div>

        {twitterCredentials.isLoggedIn && connectedUser ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {connectedUser.profileImage ? (
                  <img src={connectedUser.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-semibold text-sm">
                    {connectedUser.name || `@${connectedUser.username}`}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
                <span className="text-xs text-success">Twikit oturumu aktif — Otomasyon hazır</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={handleDisconnect}>
              <LogOut className="w-4 h-4 mr-1.5" /> Bağlantıyı Kes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-3">
              Twikit ile giriş yapın — API anahtarı gerekmez, sadece hesap bilgileri yeterli.
              Önce <strong>Hesaplar</strong> sayfasından bir hesap ekleyin ve aktif yapın.
            </p>
            <Button className="w-full" onClick={handleConnect} disabled={isLoggingIn || backendStatus !== 'online'}>
              {isLoggingIn ? (
                <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />Giriş Yapılıyor...</>
              ) : (
                <><LogIn className="w-4 h-4 mr-1.5" />Twikit ile Bağlan</>
              )}
            </Button>
            {backendStatus !== 'online' && (
              <p className="text-[10px] text-warning">⚠️ Bağlanmak için önce backend'in çevrimiçi olması gerekir.</p>
            )}
          </div>
        )}
      </div>

      {/* Rate Limit */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">⏱️ Saatlik Oran Limiti</div>
          <span className="text-xs text-muted-foreground">{stats.likes + stats.rts + stats.follows} / {settings.rateLimitPerHour}</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              ((stats.likes + stats.rts + stats.follows) / settings.rateLimitPerHour) > 0.8
                ? 'bg-destructive'
                : ((stats.likes + stats.rts + stats.follows) / settings.rateLimitPerHour) > 0.5
                  ? 'bg-warning'
                  : 'bg-primary'
            )}
            style={{ width: `${Math.min(100, ((stats.likes + stats.rts + stats.follows) / settings.rateLimitPerHour) * 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {statItems.map((item) => (
          <div key={item.label} className="bg-card border border-border rounded-lg p-4 lg:p-5">
            <div className="text-[10px] lg:text-xs text-muted-foreground font-medium mb-1.5">{item.emoji} {item.label}</div>
            <div className="text-2xl lg:text-3xl font-bold text-foreground">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" className="border-destructive/20 text-destructive bg-destructive/10 hover:bg-destructive/20" onClick={handleReset}>
          İstatistikleri Sıfırla
        </Button>
      </div>

      {/* Logs */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            📜 Son İşlemler
          </div>
          <div className="flex items-center gap-2">
            <Button variant={logFilter === 'all' ? 'secondary' : 'ghost'} size="sm" className="text-xs h-7" onClick={() => setLogFilter('all')}>Tümü</Button>
            <Button variant={logFilter === 'error' ? 'secondary' : 'ghost'} size="sm" className="text-xs h-7" onClick={() => setLogFilter('error')}>
              <AlertTriangle className="w-3 h-3 mr-1 text-destructive" />Hatalar {errorCount > 0 && `(${errorCount})`}
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={clearLogs}>Temizle</Button>
          </div>
        </div>
        <div className="bg-background border border-border rounded-lg h-[300px] lg:h-[350px] overflow-y-auto p-3 lg:p-4 font-mono text-[11px] lg:text-xs">
          {filteredLogs.length === 0 ? (
            <div className="text-muted-foreground/50 text-center py-8">
              {logFilter === 'error' ? 'Hata kaydı yok.' : 'Log kaydı yok.'}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex gap-2 py-1 border-b border-card">
                <span className="text-muted-foreground/50 min-w-[50px] lg:min-w-[60px] flex-shrink-0">{log.time}</span>
                <span className={cn(
                  log.type === 'info' && 'text-primary',
                  log.type === 'success' && 'text-success',
                  log.type === 'error' && 'text-destructive',
                  log.type === 'default' && 'text-muted-foreground',
                )}>
                  {log.type === 'error' && '⚠️ '}{log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
