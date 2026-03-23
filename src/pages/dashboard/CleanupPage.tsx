import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

export default function CleanupPage() {
  const { addLog, setRunning } = useStore();
  const [followCount, setFollowCount] = useState(50);
  const [followSpeed, setFollowSpeed] = useState('1');
  const [followDelay, setFollowDelay] = useState(3);
  const [cleanupCount, setCleanupCount] = useState(100);

  const demoAction = (action: string) => {
    addLog(`Demo: ${action}`, 'info');
    setRunning(true, action);
    toast({ title: 'Demo Mod', description: `${action} - Gerçek Twitter bağlantısı gereklidir.` });
    setTimeout(() => setRunning(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Unfollow */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          Takipten Çıkma İşlemleri (Gelişmiş)
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label>İşlem Adedi</Label>
            <Input type="number" value={followCount} onChange={(e) => setFollowCount(+e.target.value)} />
          </div>
          <div>
            <Label>Hız Modu</Label>
            <select
              value={followSpeed}
              onChange={(e) => setFollowSpeed(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="1">Normal</option>
              <option value="1.5">Yavaş</option>
              <option value="0.5">Hızlı</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <Label>Gecikme (Saniye)</Label>
          <Input type="number" value={followDelay} onChange={(e) => setFollowDelay(+e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" className="w-full" onClick={() => demoAction('Takipten Çık (Tüm Liste)')}>
            Takipten Çık (Tüm Liste)
          </Button>
          <Button
            className="w-full border-destructive/20 text-destructive bg-destructive/10 hover:bg-destructive/20"
            variant="outline"
            onClick={() => demoAction('Geri Takip Etmeyenleri Çık')}
          >
            Geri Takip Etmeyenleri Çık
          </Button>
          <Button
            className="w-full border-warning/20 text-warning bg-warning/10 hover:bg-warning/20"
            variant="outline"
            onClick={() => demoAction('Mavi Tiki Olmayanları Çık')}
          >
            Mavi Tiki Olmayanları Çık
          </Button>
        </div>
      </div>

      {/* Content Cleanup */}
      <div className="bg-card border border-destructive/30 rounded-lg p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-destructive mb-5">
          İçerik Temizliği (Dikkat!)
        </div>
        <div className="mb-4">
          <Label>Silinecek Miktar</Label>
          <Input type="number" value={cleanupCount} onChange={(e) => setCleanupCount(+e.target.value)} />
        </div>
        <Button variant="destructive" className="w-full mb-2" onClick={() => demoAction('Beğenileri Geri Çek')}>
          Tüm Beğenileri Geri Çek
        </Button>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Button variant="destructive" onClick={() => demoAction('Tweetleri Sil')}>
            Tüm Tweetleri Sil
          </Button>
          <Button variant="destructive" onClick={() => demoAction('Yanıtları Temizle')}>
            Yanıtlarımı Temizle
          </Button>
        </div>
        <Button variant="destructive" className="w-full" onClick={() => demoAction("RT'leri Kaldır")}>
          Tüm RT'leri Kaldır
        </Button>
      </div>
    </div>
  );
}
