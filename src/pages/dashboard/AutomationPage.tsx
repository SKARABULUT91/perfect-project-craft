import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';

export default function AutomationPage() {
  const { addLog, setRunning } = useStore();
  const [feedCount, setFeedCount] = useState(20);
  const [feedDelay, setFeedDelay] = useState(4);
  const [manualTarget, setManualTarget] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [cycleCount, setCycleCount] = useState(100);
  const [cycleDelay, setCycleDelay] = useState(5);
  const [cycleMent, setCycleMent] = useState(100);
  const [skipFollowers, setSkipFollowers] = useState(false);
  const [showCacheModal, setShowCacheModal] = useState(false);
  const [cachedFollowers] = useState<string[]>([]);
  const [cacheStatus, setCacheStatus] = useState('Durum: Yok');

  const demoAction = (action: string) => {
    addLog(`Demo: ${action} komutu gönderildi.`, 'info');
    setRunning(true, action);
    toast({ title: 'Demo Mod', description: `${action} - Gerçek Twitter bağlantısı gereklidir.` });
    setTimeout(() => setRunning(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Feed Interaction */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          Akış Etkileşimi
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label>İşlem Adedi</Label>
            <Input type="number" value={feedCount} onChange={(e) => setFeedCount(+e.target.value)} />
          </div>
          <div>
            <Label>Gecikme (Sn)</Label>
            <Input type="number" value={feedDelay} onChange={(e) => setFeedDelay(+e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => demoAction('Akış Beğeni')}>Beğen</Button>
          <Button onClick={() => demoAction('Akış RT')}>Retweet</Button>
        </div>
      </div>

      {/* Manual Target */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          Hedef İşlemler (Profil veya Tweet)
        </div>
        <div className="mb-4">
          <Label>Hedef (Profil Linki / Kullanıcı Adı / Tweet Linki)</Label>
          <Input
            placeholder="@kullanici veya tweet linki..."
            value={manualTarget}
            onChange={(e) => setManualTarget(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Button variant="secondary" onClick={() => demoAction('Hedef Beğeni')}>Beğen</Button>
          <Button variant="secondary" onClick={() => demoAction('Hedef RT')}>RT</Button>
          <Button variant="secondary" onClick={() => demoAction('Hedef Takip')}>Takip</Button>
        </div>
        <Button className="w-full" onClick={() => setShowReply(!showReply)}>
          Yanıt Gönder...
        </Button>
        {showReply && (
          <div className="mt-3 space-y-2">
            <Label>Mesajınız</Label>
            <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} />
            <Button className="w-full" onClick={() => demoAction('Yanıt Gönder')}>Gönder</Button>
          </div>
        )}
      </div>

      {/* Bulk Cycle */}
      <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          🔄 TOPLU DÖNGÜ (BULK)
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <Label>Döngü Sayısı (Tweet)</Label>
            <Input type="number" value={cycleCount} onChange={(e) => setCycleCount(+e.target.value)} />
          </div>
          <div>
            <Label>Gecikme (Sn)</Label>
            <Input type="number" value={cycleDelay} onChange={(e) => setCycleDelay(+e.target.value)} />
          </div>
          <div>
            <Label>Tweet Başı Ment</Label>
            <Input type="number" value={cycleMent} onChange={(e) => setCycleMent(+e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button onClick={() => demoAction('Oto-Beğeni Döngü')}>Oto-Beğeni (Döngü)</Button>
          <Button onClick={() => demoAction('Oto-RT Döngü')}>Oto-RT (Döngü)</Button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <Checkbox
            id="skipFollowers"
            checked={skipFollowers}
            onCheckedChange={(v) => setSkipFollowers(!!v)}
          />
          <label htmlFor="skipFollowers" className="text-sm text-muted-foreground cursor-pointer">
            Bizi Takip Edenleri Atla (Hızlı Mod)
          </label>
        </div>

        {/* Cache Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-primary">📂 Takipçi Önbelleği</h4>
            <span className="text-[11px] text-muted-foreground bg-black/20 px-1.5 py-0.5 rounded">
              {cacheStatus}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" className="text-xs" onClick={() => {
              setCacheStatus('Güncelleniyor...');
              demoAction('Takipçi Önbellek Güncelle');
              setTimeout(() => setCacheStatus('Durum: Demo (0 kişi)'), 2000);
            }}>
              🔄 Listeyi Güncelle
            </Button>
            <Button variant="secondary" className="text-xs" onClick={() => setShowCacheModal(true)}>
              👁️ Görüntüle
            </Button>
            <Button
              variant="outline"
              className="text-xs border-destructive/20 text-destructive"
              onClick={() => {
                setCacheStatus('Durum: Yok');
                addLog('Önbellek temizlendi.', 'success');
              }}
            >
              🗑️ Temizle
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            * Bu listeyi oluşturduğunuzda bot her seferinde profil kontrolü yapmak zorunda kalmaz, işlemleriniz %300 hızlanır.
          </p>
        </div>

        {/* Cache Modal */}
        {showCacheModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setShowCacheModal(false)}>
            <div className="bg-card border border-border rounded-xl p-5 w-[400px] max-w-[90%] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-foreground">📋 Kayıtlı Takipçiler</h3>
                <button onClick={() => setShowCacheModal(false)} className="text-xl text-muted-foreground hover:text-foreground">×</button>
              </div>
              <textarea
                readOnly
                value={cachedFollowers.join('\n') || 'Henüz kayıtlı takipçi yok.'}
                className="flex-1 bg-background text-muted-foreground border border-border p-2.5 rounded-lg resize-y min-h-[300px] font-mono text-xs"
              />
              <Button className="mt-3 w-full" onClick={() => {
                navigator.clipboard.writeText(cachedFollowers.join('\n'));
                toast({ title: 'Kopyalandı!' });
              }}>
                Tümünü Kopyala
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-2">
          ℹ️ Bu modda bot feed'deki tweetleri teker teker açar ve belirtilen sayı kadar altındaki yanıtlara beğeni/RT yapar.
        </p>
      </div>
    </div>
  );
}
