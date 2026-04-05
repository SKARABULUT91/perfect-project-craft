import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Shield, Wifi, User, Globe } from 'lucide-react';
import type { TwitterAccount } from '@/lib/types';
import { loginAccount, checkSession } from '@/lib/api-client';

export default function AccountsPage() {
  const { accounts, addAccount, removeAccount, updateAccount, setActiveAccount, addLog, twitterCredentials } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [new2FA, setNew2FA] = useState('');
  const [newProxy, setNewProxy] = useState('');
  const [newUserAgent, setNewUserAgent] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!newUsername.trim() || !newPassword.trim()) return;
    const account: TwitterAccount = {
      id: crypto.randomUUID(),
      username: newUsername.trim().replace('@', ''),
      password: newPassword,
      twoFASecret: new2FA,
      proxy: newProxy,
      userAgent: newUserAgent,
      isActive: accounts.length === 0,
      status: 'idle',
    };
    addAccount(account);
    addLog(`@${account.username} hesabı eklendi.`, 'success');
    setNewUsername('');
    setNewPassword('');
    setNew2FA('');
    setNewProxy('');
    setNewUserAgent('');
    setShowAdd(false);
  };

  const handleTestLogin = async (acc: TwitterAccount) => {
    setTestingId(acc.id);
    addLog(`@${acc.username} giriş testi yapılıyor...`, 'info');
    
    const result = await loginAccount(acc.username, acc.password, acc.twoFASecret || undefined, acc.proxy || undefined, acc.userAgent || undefined);
    
    if (result.success) {
      updateAccount(acc.id, { status: 'running' });
      addLog(`✅ @${acc.username} giriş başarılı! Oturum aktif.`, 'success');
    } else {
      updateAccount(acc.id, { status: 'error' });
      addLog(`❌ @${acc.username} giriş hatası: ${result.error}`, 'error');
    }
    setTestingId(null);
  };

  const statusColors: Record<string, string> = {
    idle: 'text-muted-foreground bg-muted',
    running: 'text-primary bg-primary/10',
    error: 'text-destructive bg-destructive/10',
    banned: 'text-destructive bg-destructive/20',
  };

  const statusLabels: Record<string, string> = {
    idle: 'Bekliyor',
    running: 'Aktif',
    error: 'Hata',
    banned: 'Engelli',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Twikit ile giriş — API anahtarı gereksiz. Kullanıcı adı + şifre yeterli.</p>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Hesap Ekle
        </Button>
      </div>

      {showAdd && (
        <div className="bg-card border border-border rounded-lg p-5 animate-fade-in">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Yeni Hesap Ekle</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <Label>Kullanıcı Adı</Label>
              <Input placeholder="@username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            </div>
            <div>
              <Label>Şifre</Label>
              <Input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div>
              <Label>2FA Gizli Anahtar (Opsiyonel)</Label>
              <Input placeholder="JBSWY3DPEHPK3PXP" value={new2FA} onChange={(e) => setNew2FA(e.target.value)} />
            </div>
            <div>
              <Label>Proxy (Opsiyonel)</Label>
              <Input placeholder="http://user:pass@ip:port" value={newProxy} onChange={(e) => setNewProxy(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>User-Agent (Opsiyonel — Boş bırakılırsa otomatik atanır)</Label>
              <Input placeholder="Mozilla/5.0 (Windows NT 10.0; ...)" value={newUserAgent} onChange={(e) => setNewUserAgent(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={!newUsername.trim() || !newPassword.trim()}>Kaydet</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>İptal</Button>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground text-sm">Henüz hesap eklenmemiş.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Yukarıdaki butona tıklayarak ilk hesabınızı ekleyin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className={cn(
                'bg-card border rounded-lg p-5 transition-all',
                acc.isActive ? 'border-primary/50 shadow-[0_0_15px_hsl(var(--primary)/0.1)]' : 'border-border'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', acc.isActive ? 'bg-primary/20' : 'bg-secondary')}>
                    <User className={cn('w-4 h-4', acc.isActive ? 'text-primary' : 'text-muted-foreground')} />
                  </div>
                  <div>
                    <span className="text-foreground font-semibold text-sm">@{acc.username}</span>
                    {acc.isActive && <span className="ml-2 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">AKTİF</span>}
                  </div>
                </div>
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', statusColors[acc.status])}>
                  {statusLabels[acc.status]}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                {acc.twoFASecret && (
                  <div className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-success" /> 2FA Aktif</div>
                )}
                {acc.proxy && (
                  <div className="flex items-center gap-1.5"><Wifi className="w-3 h-3 text-warning" /> Proxy: {acc.proxy.slice(0, 30)}...</div>
                )}
                {acc.userAgent && (
                  <div className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-primary" /> Özel User-Agent</div>
                )}
              </div>

              <div className="flex gap-2">
                {!acc.isActive && (
                  <Button size="sm" variant="secondary" className="text-xs flex-1" onClick={() => {
                    setActiveAccount(acc.id);
                    addLog(`@${acc.username} aktif hesap olarak ayarlandı.`, 'info');
                  }}>
                    Aktif Yap
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs flex-1"
                  onClick={() => handleTestLogin(acc)}
                  disabled={testingId === acc.id}
                >
                  {testingId === acc.id ? '⏳ Test...' : '🔑 Giriş Test'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-destructive/20 text-destructive"
                  onClick={() => {
                    removeAccount(acc.id);
                    addLog(`@${acc.username} hesabı kaldırıldı.`, 'info');
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">🛡️ Güvenlik İpuçları</div>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li>• Her hesap için farklı <strong>Residential Proxy</strong> kullanın (datacenter proxy ban sebebi).</li>
          <li>• 2FA gizli anahtarını ekleyerek otomatik TOTP doğrulaması yapın.</li>
          <li>• Her hesaba farklı User-Agent atayarak cihaz çeşitliliği sağlayın.</li>
          <li>• Oturumlar çerez dosyası olarak backend'de saklanır — her seferinde giriş gerekmez.</li>
        </ul>
      </div>
    </div>
  );
}
