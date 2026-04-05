import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { likeTweet, retweetTweet, followUser, postTweet, getHomeTimeline, boostViews } from '@/lib/api-client';

export default function AutomationPage() {
  const { addLog, setRunning, updateStats, twitterCredentials, settings, accounts } = useStore();
  const isLoggedIn = twitterCredentials.isLoggedIn;
  const activeUsername = accounts.find(a => a.isActive)?.username || twitterCredentials.username;
  
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [boostUrl, setBoostUrl] = useState('');
  const [boostCount, setBoostCount] = useState(10);

  const requireLogin = (action: string): boolean => {
    if (!isLoggedIn) {
      toast({ title: 'Giriş Gerekli', description: 'Önce Genel Bakış sayfasından bağlantıyı doğrulayın.', variant: 'destructive' });
      addLog(`Hata: ${action} - Bağlantı yok.`, 'error');
      return false;
    }
    return true;
  };

  const extractTweetId = (input: string): string | null => {
    const match = input.match(/status\/(\d+)/);
    return match ? match[1] : null;
  };

  const handleFeedAction = async (type: 'like' | 'rt') => {
    if (!requireLogin('Akış Etkileşimi')) return;
    setIsProcessing(true);
    setRunning(true, `Akış ${type === 'like' ? 'Beğeni' : 'RT'}`);
    addLog(`Akış ${type === 'like' ? 'beğeni' : 'RT'} başlatılıyor (${feedCount} adet)...`, 'info');

    try {
      const timeline = await getHomeTimeline(activeUsername, Math.min(feedCount, 100));
      if (!timeline.success || !timeline.data?.tweets) {
        throw new Error(timeline.error || 'Timeline alınamadı');
      }

      let count = 0;
      for (const tweet of timeline.data.tweets.slice(0, feedCount)) {
        const result = type === 'like' 
          ? await likeTweet(activeUsername, tweet.id) 
          : await retweetTweet(activeUsername, tweet.id);
        if (result.success) {
          count++;
          updateStats(type === 'like' ? { likes: count } : { rts: count });
          addLog(`✅ Tweet ${type === 'like' ? 'beğenildi' : 'RT yapıldı'}: ${tweet.text?.slice(0, 50)}...`, 'success');
        } else {
          addLog(`⚠️ Hata: ${result.error}`, 'error');
        }
        await new Promise(r => setTimeout(r, (feedDelay + (settings.randomDelay ? Math.random() * 2 : 0)) * 1000));
      }
      addLog(`Akış etkileşimi tamamlandı: ${count}/${feedCount}`, 'success');
    } catch (err: unknown) {
      addLog(`❌ Akış hatası: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`, 'error');
    }

    setRunning(false);
    setIsProcessing(false);
  };

  const handleTargetAction = async (type: 'like' | 'rt' | 'follow') => {
    if (!requireLogin('Hedef İşlem') || !manualTarget.trim()) return;
    setIsProcessing(true);
    setRunning(true, `Hedef ${type}`);

    try {
      let result;
      if (type === 'follow') {
        result = await followUser(activeUsername, manualTarget.trim().replace('@', ''));
        if (result.success) {
          updateStats({ follows: useStore.getState().stats.follows + 1 });
          addLog(`✅ @${manualTarget.trim()} takip edildi.`, 'success');
        }
      } else {
        const tweetId = extractTweetId(manualTarget.trim());
        if (!tweetId) {
          addLog('❌ Geçerli bir tweet linki girin.', 'error');
          setIsProcessing(false);
          setRunning(false);
          return;
        }
        result = type === 'like' ? await likeTweet(activeUsername, tweetId) : await retweetTweet(activeUsername, tweetId);
        if (result.success) {
          updateStats(type === 'like' ? { likes: useStore.getState().stats.likes + 1 } : { rts: useStore.getState().stats.rts + 1 });
          addLog(`✅ Tweet ${type === 'like' ? 'beğenildi' : 'RT yapıldı'}.`, 'success');
        }
      }
      if (result && !result.success) {
        addLog(`❌ Hata: ${result.error}`, 'error');
      }
    } catch (err: unknown) {
      addLog(`❌ İşlem hatası: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`, 'error');
    }

    setRunning(false);
    setIsProcessing(false);
  };

  const handleReply = async () => {
    if (!requireLogin('Yanıt Gönder') || !manualTarget.trim() || !replyText.trim()) return;
    setIsProcessing(true);
    const tweetId = extractTweetId(manualTarget.trim());
    if (!tweetId) {
      addLog('❌ Yanıt göndermek için geçerli bir tweet linki girin.', 'error');
      setIsProcessing(false);
      return;
    }

    const result = await postTweet(activeUsername, replyText.trim(), tweetId);
    if (result.success) {
      addLog(`✅ Yanıt gönderildi: "${replyText.trim().slice(0, 50)}"`, 'success');
      setReplyText('');
    } else {
      addLog(`❌ Yanıt hatası: ${result.error}`, 'error');
    }
    setIsProcessing(false);
  };

  const handleBulkCycle = async (type: 'like' | 'rt') => {
    if (!requireLogin('Toplu Döngü')) return;
    setIsProcessing(true);
    setRunning(true, `Toplu ${type === 'like' ? 'Beğeni' : 'RT'} Döngüsü`);
    addLog(`Toplu ${type === 'like' ? 'beğeni' : 'RT'} döngüsü başlatılıyor (${cycleCount} tweet)...`, 'info');

    try {
      const timeline = await getHomeTimeline(activeUsername, Math.min(cycleCount, 100));
      if (!timeline.success || !timeline.data?.tweets) {
        throw new Error(timeline.error || 'Timeline alınamadı');
      }

      let count = 0;
      for (const tweet of timeline.data.tweets) {
        const result = type === 'like' ? await likeTweet(activeUsername, tweet.id) : await retweetTweet(activeUsername, tweet.id);
        if (result.success) {
          count++;
          updateStats(type === 'like' ? { likes: count } : { rts: count });
        }
        await new Promise(r => setTimeout(r, (cycleDelay + (settings.randomDelay ? Math.random() * 3 : 0)) * 1000));

        if (count % settings.actionsBeforeBreak === 0 && settings.antiShadowbanEnabled) {
          addLog(`⏸️ Anti-shadowban dinlenme (${settings.breakDuration}s)...`, 'info');
          await new Promise(r => setTimeout(r, settings.breakDuration * 1000));
        }
      }
      addLog(`✅ Döngü tamamlandı: ${count} işlem yapıldı.`, 'success');
    } catch (err: unknown) {
      addLog(`❌ Döngü hatası: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`, 'error');
    }

    setRunning(false);
    setIsProcessing(false);
  };

  const handleBoostViews = async () => {
    if (!requireLogin('Görüntülenme Artırma') || !boostUrl.trim()) return;
    setIsProcessing(true);
    setRunning(true, 'Görüntülenme Artırma');
    addLog(`Görüntülenme artırma başlatılıyor: ${boostUrl} (${boostCount} kez)...`, 'info');

    const result = await boostViews(activeUsername, boostUrl.trim(), boostCount);
    if (result.success) {
      addLog(`✅ Görüntülenme artırma tamamlandı.`, 'success');
    } else {
      addLog(`❌ Hata: ${result.error}`, 'error');
    }

    setRunning(false);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {!isLoggedIn && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center gap-3">
          <span className="text-warning text-lg">⚠️</span>
          <p className="text-sm text-warning">Otomasyon işlemleri için önce <strong>Genel Bakış</strong> sayfasından bağlantıyı doğrulayın.</p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feed Interaction */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">Akış Etkileşimi</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><Label>İşlem Adedi</Label><Input type="number" value={feedCount} onChange={(e) => setFeedCount(+e.target.value)} /></div>
            <div><Label>Gecikme (Sn)</Label><Input type="number" value={feedDelay} onChange={(e) => setFeedDelay(+e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => handleFeedAction('like')} disabled={isProcessing}>Beğen</Button>
            <Button onClick={() => handleFeedAction('rt')} disabled={isProcessing}>Retweet</Button>
          </div>
        </div>

        {/* Manual Target */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">Hedef İşlemler</div>
          <div className="mb-4">
            <Label>Hedef (Profil / Tweet Linki)</Label>
            <Input placeholder="@kullanici veya tweet linki..." value={manualTarget} onChange={(e) => setManualTarget(e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Button variant="secondary" onClick={() => handleTargetAction('like')} disabled={isProcessing}>Beğen</Button>
            <Button variant="secondary" onClick={() => handleTargetAction('rt')} disabled={isProcessing}>RT</Button>
            <Button variant="secondary" onClick={() => handleTargetAction('follow')} disabled={isProcessing}>Takip</Button>
          </div>
          <Button className="w-full" onClick={() => setShowReply(!showReply)}>Yanıt Gönder...</Button>
          {showReply && (
            <div className="mt-3 space-y-2">
              <Label>Mesajınız</Label>
              <Input value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              <Button className="w-full" onClick={handleReply} disabled={isProcessing}>Gönder</Button>
            </div>
          )}
        </div>

        {/* View Boost */}
        <div className="bg-card border border-primary/30 rounded-lg p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-5">👁️ Görüntülenme Artırma (Playwright)</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><Label>Tweet URL</Label><Input placeholder="https://x.com/user/status/..." value={boostUrl} onChange={(e) => setBoostUrl(e.target.value)} /></div>
            <div><Label>Görüntülenme Sayısı</Label><Input type="number" value={boostCount} onChange={(e) => setBoostCount(+e.target.value)} /></div>
          </div>
          <Button className="w-full" onClick={handleBoostViews} disabled={isProcessing}>
            🚀 Görüntülenme Artır
          </Button>
          <p className="text-[10px] text-muted-foreground mt-2">Playwright ile farklı User-Agent'larla tweet sayfası açılır ve scroll yapılır.</p>
        </div>

        {/* Bulk Cycle */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">🔄 Toplu Döngü</div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div><Label>Döngü Sayısı</Label><Input type="number" value={cycleCount} onChange={(e) => setCycleCount(+e.target.value)} /></div>
            <div><Label>Gecikme (Sn)</Label><Input type="number" value={cycleDelay} onChange={(e) => setCycleDelay(+e.target.value)} /></div>
            <div><Label>Ment Sayısı</Label><Input type="number" value={cycleMent} onChange={(e) => setCycleMent(+e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button onClick={() => handleBulkCycle('like')} disabled={isProcessing}>Oto-Beğeni</Button>
            <Button onClick={() => handleBulkCycle('rt')} disabled={isProcessing}>Oto-RT</Button>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Checkbox id="skipFollowers" checked={skipFollowers} onCheckedChange={(v) => setSkipFollowers(!!v)} />
            <label htmlFor="skipFollowers" className="text-sm text-muted-foreground cursor-pointer">Bizi Takip Edenleri Atla</label>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-semibold text-primary">📂 Takipçi Önbelleği</h4>
              <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{cacheStatus}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="secondary" className="text-xs" onClick={() => { setCacheStatus('Güncelleniyor...'); setTimeout(() => setCacheStatus('Güncellendi'), 2000); }}>🔄 Güncelle</Button>
              <Button variant="secondary" className="text-xs" onClick={() => setShowCacheModal(true)}>👁️ Görüntüle</Button>
              <Button variant="outline" className="text-xs border-destructive/20 text-destructive" onClick={() => { setCacheStatus('Durum: Yok'); addLog('Önbellek temizlendi.', 'success'); }}>🗑️ Temizle</Button>
            </div>
          </div>
        </div>
      </div>

      {showCacheModal && (
        <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center" onClick={() => setShowCacheModal(false)}>
          <div className="bg-card border border-border rounded-xl p-5 w-[400px] max-w-[90%] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-foreground">📋 Kayıtlı Takipçiler</h3>
              <button onClick={() => setShowCacheModal(false)} className="text-xl text-muted-foreground hover:text-foreground">×</button>
            </div>
            <textarea readOnly value={cachedFollowers.join('\n') || 'Henüz kayıtlı takipçi yok.'} className="flex-1 bg-background text-muted-foreground border border-border p-2.5 rounded-lg resize-y min-h-[300px] font-mono text-xs" />
            <Button className="mt-3 w-full" onClick={() => { navigator.clipboard.writeText(cachedFollowers.join('\n')); toast({ title: 'Kopyalandı!' }); }}>Tümünü Kopyala</Button>
          </div>
        </div>
      )}
    </div>
  );
}
