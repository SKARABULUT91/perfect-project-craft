import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { LogIn, LogOut, User, Lock, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const { stats, resetStats, logs, addLog, twitterCredentials, loginTwitter, logoutTwitter } = useStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const statItems = [
    { label: 'BEĞENİ', value: stats.likes },
    { label: 'RETWEET', value: stats.rts },
    { label: 'TAKİP', value: stats.follows },
    { label: 'T. BIRAKMA', value: stats.unfollows },
  ];

  const handleReset = () => {
    resetStats();
    addLog('İstatistikler başarıyla sıfırlandı.', 'success');
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      addLog('Kullanıcı adı ve şifre boş bırakılamaz.', 'error');
      return;
    }
    setIsLoggingIn(true);
    addLog(`@${username.trim()} hesabına giriş yapılıyor...`, 'info');
    
    // Simulate login delay
    await new Promise((r) => setTimeout(r, 1500));
    
    loginTwitter(username.trim(), password);
    setUsername('');
    setPassword('');
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    logoutTwitter();
  };

  return (
    <div>
      {/* Twitter Login Section */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          🐦 Twitter Hesap Bağlantısı
        </div>

        {twitterCredentials.isLoggedIn ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-semibold text-sm">@{twitterCredentials.username}</span>
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
                <span className="text-xs text-success">Bağlı — Otomasyon kullanıma hazır</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Çıkış Yap
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground mb-3">
              Otomasyon işlemlerini başlatmak için Twitter hesabınızla giriş yapın.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Kullanıcı adı"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 bg-secondary border-border"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Şifre"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-secondary border-border"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleLogin}
              disabled={isLoggingIn || !username.trim() || !password.trim()}
            >
              {isLoggingIn ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Giriş Yap
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statItems.map((item) => (
          <div key={item.label} className="bg-card border border-border rounded-lg p-5">
            <div className="text-xs text-muted-foreground font-medium mb-2">{item.label}</div>
            <div className="text-3xl font-bold text-foreground">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-6">
        <Button
          variant="outline"
          className="border-destructive/20 text-destructive bg-destructive/10 hover:bg-destructive/20"
          onClick={handleReset}
        >
          İstatistikleri Sıfırla
        </Button>
      </div>

      {/* Logs */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          📜 Son İşlemler (Loglar)
        </div>
        <div className="bg-background border border-border rounded-lg h-[350px] overflow-y-auto p-4 font-mono text-xs">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2.5 py-1 border-b border-card">
              <span className="text-muted-foreground/50 min-w-[60px]">{log.time}</span>
              <span className={cn(
                log.type === 'info' && 'text-primary',
                log.type === 'success' && 'text-success',
                log.type === 'error' && 'text-destructive',
                log.type === 'default' && 'text-muted-foreground',
              )}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
