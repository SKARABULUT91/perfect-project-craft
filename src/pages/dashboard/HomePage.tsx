import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LogIn, LogOut, User, Lock, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { verifyCredentials } from '@/lib/twitter-api';

export default function HomePage() {
  const { stats, resetStats, logs, addLog, clearLogs, twitterCredentials, loginTwitter, logoutTwitter, settings } = useStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'error'>('all');
  const [connectedUser, setConnectedUser] = useState<{ name: string; username: string; profileImage?: string } | null>(
    twitterCredentials.isLoggedIn ? { name: '', username: twitterCredentials.username } : null
  );

  const statItems = [
    { label: 'BEĞENİ', value: stats.likes, emoji: '❤️' },
    { label: 'RETWEET', value: stats.rts, emoji: '🔁' },
    { label: 'TAKİP', value: stats.follows, emoji: '👤' },
    { label: 'T. BIRAKMA', value: stats.unfollows, emoji: '👋' },
  ];

  const handleReset = () => {
    resetStats();
    addLog('İstatistikler başarıyla sıfırlandı.', 'success');
  };

  const handleConnect = async () => {
    setIsLoggingIn(true);
    addLog('Twitter API bağlantısı doğrulanıyor...', 'info');

    const result = await verifyCredentials();

    if (result.success && result.data) {
      const user = result.data.data;
      loginTwitter(user.username, '');
      setConnectedUser({
        name: user.name,
        username: user.username,
        profileImage: user.profile_image_url,
      });
      addLog(`✅ @${user.username} hesabı başarıyla bağlandı. (${user.public_metrics?.followers_count || 0} takipçi)`, 'success');
    } else {
      addLog(`❌ Bağlantı hatası: ${result.error || 'Bilinmeyen hata'}`, 'error');
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
      {/* Twitter API Connection */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Twitter API Bağlantısı
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
                <span className="text-xs text-success">API bağlantısı aktif — Otomasyon hazır</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={handleDisconnect}>
              <LogOut className="w-4 h-4 mr-1.5" /> Bağlantıyı Kes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-3">
              Twitter API anahtarlarınız backend'de güvenli şekilde saklanıyor. Bağlantıyı doğrulamak için aşağıdaki butona tıklayın.
            </p>
            <Button className="w-full" onClick={handleConnect} disabled={isLoggingIn}>
              {isLoggingIn ? (
                <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />Doğrulanıyor...</>
              ) : (
                <><LogIn className="w-4 h-4 mr-1.5" />API Bağlantısını Doğrula</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Rate Limit Indicator */}
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
        {((stats.likes + stats.rts + stats.follows) / settings.rateLimitPerHour) > 0.8 && (
          <p className="text-[10px] text-destructive mt-1.5">⚠️ Oran limitine yaklaşıyorsunuz! Hesap güvenliği için yavaşlayın.</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {statItems.map((item) => (
          <div key={item.label} className="bg-card border border-border rounded-lg p-4 lg:p-5">
            <div className="text-[10px] lg:text-xs text-muted-foreground font-medium mb-1.5 lg:mb-2">{item.emoji} {item.label}</div>
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
            📜 Son İşlemler (Loglar)
          </div>
          <div className="flex items-center gap-2">
            <Button variant={logFilter === 'all' ? 'secondary' : 'ghost'} size="sm" className="text-xs h-7" onClick={() => setLogFilter('all')}>
              Tümü
            </Button>
            <Button variant={logFilter === 'error' ? 'secondary' : 'ghost'} size="sm" className="text-xs h-7" onClick={() => setLogFilter('error')}>
              <AlertTriangle className="w-3 h-3 mr-1 text-destructive" />
              Hatalar {errorCount > 0 && `(${errorCount})`}
            </Button>
            <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={clearLogs}>
              Temizle
            </Button>
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
