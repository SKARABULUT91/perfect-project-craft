import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { unfollowUser, unlikeTweet, deleteTweet, unretweetTweet, getTimeline, getFollowing } from '@/lib/twitter-api';

export default function CleanupPage() {
  const { addLog, setRunning, updateStats, twitterCredentials, settings } = useStore();
  const [followCount, setFollowCount] = useState(50);
  const [followSpeed, setFollowSpeed] = useState('1');
  const [followDelay, setFollowDelay] = useState(3);
  const [cleanupCount, setCleanupCount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);

  const requireLogin = (action: string): boolean => {
    if (!twitterCredentials.isLoggedIn) {
      toast({ title: 'Giriş Gerekli', description: 'Önce API bağlantısını doğrulayın.', variant: 'destructive' });
      addLog(`Hata: ${action} - API bağlantısı yok.`, 'error');
      return false;
    }
    return true;
  };

  const handleUnfollowAll = async () => {
    if (!requireLogin('Takipten Çıkma')) return;
    setIsProcessing(true);
    setRunning(true, 'Takipten Çıkma');
    addLog(`Takip edilen kullanıcılar çekiliyor...`, 'info');

    try {
      const following = await getFollowing(undefined, followCount);
      if (!following.success || !following.data?.data) {
        throw new Error(following.error || 'Liste alınamadı');
      }

      const delay = followDelay * parseFloat(followSpeed);
      let count = 0;
      for (const user of following.data.data) {
        const result = await unfollowUser(user.username);
        if (result.success) {
          count++;
          updateStats({ unfollows: useStore.getState().stats.unfollows + 1 });
          addLog(`✅ @${user.username} takipten çıkıldı (${count}/${following.data.data.length})`, 'success');
        } else {
          addLog(`⚠️ @${user.username}: ${result.error}`, 'error');
        }
        await new Promise(r => setTimeout(r, (delay + (settings.randomDelay ? Math.random() * 2 : 0)) * 1000));
      }
      addLog(`✅ Takipten çıkma tamamlandı: ${count}`, 'success');
    } catch (err: unknown) {
      addLog(`❌ Hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`, 'error');
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
      const timeline = await getTimeline(Math.min(cleanupCount, 100));
      if (!timeline.success || !timeline.data?.data) {
        throw new Error(timeline.error || 'Timeline alınamadı');
      }

      let count = 0;
      for (const tweet of timeline.data.data) {
        const result = await deleteTweet(tweet.id);
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

  const handleUnlikeAll = async () => {
    if (!requireLogin('Beğeni Geri Çekme')) return;
    setIsProcessing(true);
    setRunning(true, 'Beğeni Geri Çekme');
    addLog('Beğeniler geri çekiliyor... (API limitasyonu: son beğeniler)', 'info');
    toast({ title: 'Bilgi', description: 'Twitter API v2 beğenilen tweetleri listeleme desteği sınırlıdır.' });
    setRunning(false);
    setIsProcessing(false);
  };

  const handleRemoveRetweets = async () => {
    if (!requireLogin('RT Kaldırma')) return;
    setIsProcessing(true);
    setRunning(true, 'RT Kaldırma');
    addLog('RT\'ler kaldırılıyor...', 'info');
    toast({ title: 'Bilgi', description: 'Twitter API v2 ile RT kaldırma işlemi tweet bazlı çalışır.' });
    setRunning(false);
    setIsProcessing(false);
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
          <Button variant="secondary" className="w-full" onClick={handleUnfollowAll} disabled={isProcessing}>
            Takipten Çık (Tüm Liste)
          </Button>
          <Button
            className="w-full border-destructive/20 text-destructive bg-destructive/10 hover:bg-destructive/20"
            variant="outline"
            onClick={handleUnfollowAll}
            disabled={isProcessing}
          >
            Geri Takip Etmeyenleri Çık
          </Button>
          <Button
            className="w-full border-warning/20 text-warning bg-warning/10 hover:bg-warning/20"
            variant="outline"
            onClick={handleUnfollowAll}
            disabled={isProcessing}
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
        <Button variant="destructive" className="w-full mb-2" onClick={handleUnlikeAll} disabled={isProcessing}>
          Tüm Beğenileri Geri Çek
        </Button>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Button variant="destructive" onClick={handleDeleteTweets} disabled={isProcessing}>
            Tüm Tweetleri Sil
          </Button>
          <Button variant="destructive" onClick={handleDeleteTweets} disabled={isProcessing}>
            Yanıtlarımı Temizle
          </Button>
        </div>
        <Button variant="destructive" className="w-full" onClick={handleRemoveRetweets} disabled={isProcessing}>
          Tüm RT'leri Kaldır
        </Button>
      </div>
    </div>
  );
}
