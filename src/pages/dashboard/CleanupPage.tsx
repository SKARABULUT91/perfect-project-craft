import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { unfollowUser, deleteTweet, getTimeline, getFollowing, bulkUnfollow } from '@/lib/api-client';

export default function CleanupPage() {
  const { addLog, setRunning, updateStats, twitterCredentials, settings, accounts } = useStore();
  const activeUsername = accounts.find(a => a.isActive)?.username || twitterCredentials.username;
  const [followCount, setFollowCount] = useState(50);
  const [followSpeed, setFollowSpeed] = useState('1');
  const [followDelay, setFollowDelay] = useState(3);
  const [cleanupCount, setCleanupCount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);

  const requireLogin = (action: string): boolean => {
    if (!twitterCredentials.isLoggedIn) {
      toast({ title: 'Giriş Gerekli', description: 'Önce bağlantıyı doğrulayın.', variant: 'destructive' });
      addLog(`Hata: ${action} - Bağlantı yok.`, 'error');
      return false;
    }
    return true;
  };

  const handleBulkUnfollow = async (mode: string) => {
    if (!requireLogin('Takipten Çıkma')) return;
    setIsProcessing(true);
    setRunning(true, `Takipten Çıkma (${mode})`);
    addLog(`Toplu takipten çıkma başlatılıyor (mod: ${mode}, adet: ${followCount})...`, 'info');

    const result = await bulkUnfollow(activeUsername, followCount, followDelay * parseFloat(followSpeed), mode);
    if (result.success) {
      const data = result.data as { completed?: number; failed?: number };
      updateStats({ unfollows: useStore.getState().stats.unfollows + (data?.completed || 0) });
      addLog(`✅ Takipten çıkma tamamlandı: ${data?.completed || 0} başarılı`, 'success');
    } else {
      addLog(`❌ Hata: ${result.error}`, 'error');
    }

    setRunning(false);
    setIsProcessing(false);
  };

  const handleDeleteTweets = async () => {
    if (!requireLogin('Tweet Silme')) return;
    setIsProcessing(true);
    setRunning(true, 'Tweet Silme');
    addLog(`Son ${cleanupCount} tweet siliniyor...`, 'info');

    try {
      const timeline = await getTimeline(activeUsername, Math.min(cleanupCount, 100));
      if (!timeline.success || !timeline.data?.tweets) {
        throw new Error(timeline.error || 'Timeline alınamadı');
      }

      let count = 0;
      for (const tweet of timeline.data.tweets) {
        const result = await deleteTweet(activeUsername, tweet.id);
        if (result.success) {
          count++;
          addLog(`🗑️ Tweet silindi (${count})`, 'success');
        }
        await new Promise(r => setTimeout(r, 2000));
      }
      addLog(`✅ ${count} tweet silindi.`, 'success');
    } catch (err: unknown) {
      addLog(`❌ Hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`, 'error');
    }

    setRunning(false);
    setIsProcessing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">Takipten Çıkma (Backend Bulk)</div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div><Label>İşlem Adedi</Label><Input type="number" value={followCount} onChange={(e) => setFollowCount(+e.target.value)} /></div>
          <div>
            <Label>Hız Modu</Label>
            <select value={followSpeed} onChange={(e) => setFollowSpeed(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="1">Normal</option>
              <option value="1.5">Yavaş</option>
              <option value="0.5">Hızlı</option>
            </select>
          </div>
        </div>
        <div className="mb-4"><Label>Gecikme (Saniye)</Label><Input type="number" value={followDelay} onChange={(e) => setFollowDelay(+e.target.value)} /></div>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" className="w-full" onClick={() => handleBulkUnfollow('all')} disabled={isProcessing}>Takipten Çık (Tüm Liste)</Button>
          <Button className="w-full border-destructive/20 text-destructive bg-destructive/10 hover:bg-destructive/20" variant="outline" onClick={() => handleBulkUnfollow('non_followers')} disabled={isProcessing}>Geri Takip Etmeyenleri Çık</Button>
          <Button className="w-full border-warning/20 text-warning bg-warning/10 hover:bg-warning/20" variant="outline" onClick={() => handleBulkUnfollow('non_verified')} disabled={isProcessing}>Mavi Tiki Olmayanları Çık</Button>
        </div>
      </div>

      <div className="bg-card border border-destructive/30 rounded-lg p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-destructive mb-5">İçerik Temizliği (Dikkat!)</div>
        <div className="mb-4"><Label>Silinecek Miktar</Label><Input type="number" value={cleanupCount} onChange={(e) => setCleanupCount(+e.target.value)} /></div>
        <Button variant="destructive" className="w-full mb-2" onClick={handleDeleteTweets} disabled={isProcessing}>Tüm Tweetleri Sil</Button>
        <p className="text-xs text-muted-foreground mt-2">⚠️ Bu işlem geri alınamaz. Tüm tweet'leriniz silinir.</p>
      </div>
    </div>
  );
}
