import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { followUser, getFollowers, getFollowing } from '@/lib/twitter-api';

export default function FollowPage() {
  const { addLog, setRunning, updateStats, whiteList, setWhiteList, settings, twitterCredentials } = useStore();
  const [targetUsername, setTargetUsername] = useState('');
  const [targetListType, setTargetListType] = useState('followers');
  const [targetFollowCount, setTargetFollowCount] = useState(50);
  const [userListInput, setUserListInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const requireLogin = (): boolean => {
    if (!twitterCredentials.isLoggedIn) {
      toast({ title: 'Giriş Gerekli', description: 'Önce API bağlantısını doğrulayın.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleTargetFollow = async () => {
    if (!requireLogin() || !targetUsername.trim()) return;
    setIsProcessing(true);
    setRunning(true, 'Hedef Takip');
    addLog(`@${targetUsername.trim()} ${targetListType === 'followers' ? 'takipçileri' : 'takip ettikleri'} çekiliyor...`, 'info');

    try {
      const listResult = targetListType === 'followers'
        ? await getFollowers(targetUsername.trim(), targetFollowCount)
        : await getFollowing(targetUsername.trim(), targetFollowCount);

      if (!listResult.success || !listResult.data?.data) {
        throw new Error(listResult.error || 'Liste alınamadı');
      }

      const users = listResult.data.data;
      addLog(`${users.length} kullanıcı bulundu. Takip başlatılıyor...`, 'info');

      let count = 0;
      for (const user of users) {
        const result = await followUser(user.username);
        if (result.success) {
          count++;
          updateStats({ follows: useStore.getState().stats.follows + 1 });
          addLog(`✅ @${user.username} takip edildi (${count}/${users.length})`, 'success');
        } else {
          addLog(`⚠️ @${user.username} takip edilemedi: ${result.error}`, 'error');
        }
        await new Promise(r => setTimeout(r, (3 + (settings.randomDelay ? Math.random() * 2 : 0)) * 1000));

        if (count % settings.actionsBeforeBreak === 0 && settings.antiShadowbanEnabled) {
          addLog(`⏸️ Anti-shadowban dinlenme (${settings.breakDuration}s)...`, 'info');
          await new Promise(r => setTimeout(r, settings.breakDuration * 1000));
        }
      }
      addLog(`✅ Takip tamamlandı: ${count}/${users.length}`, 'success');
    } catch (err: unknown) {
      addLog(`❌ Hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`, 'error');
    }

    setRunning(false);
    setIsProcessing(false);
  };

  const handleCsvDownload = async () => {
    if (!requireLogin() || !targetUsername.trim()) return;
    setIsProcessing(true);
    addLog(`@${targetUsername.trim()} listesi çekiliyor...`, 'info');

    try {
      const listResult = targetListType === 'followers'
        ? await getFollowers(targetUsername.trim(), targetFollowCount)
        : await getFollowing(targetUsername.trim(), targetFollowCount);

      if (!listResult.success || !listResult.data?.data) {
        throw new Error(listResult.error || 'Liste alınamadı');
      }

      const csv = ['username,name,followers,verified']
        .concat(listResult.data.data.map(u =>
          `${u.username},${u.name},${u.public_metrics?.followers_count || 0},${u.verified || false}`
        ))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${targetUsername.trim()}_${targetListType}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addLog(`✅ CSV indirildi: ${listResult.data.data.length} kullanıcı`, 'success');
    } catch (err: unknown) {
      addLog(`❌ CSV hatası: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`, 'error');
    }

    setIsProcessing(false);
  };

  const handleListFollow = async () => {
    if (!requireLogin() || !userListInput.trim()) return;
    setIsProcessing(true);
    setRunning(true, 'Liste Takip');

    const usernames = userListInput
      .split(/[,\n]/)
      .map(u => u.trim().replace('@', ''))
      .filter(Boolean);

    addLog(`${usernames.length} kullanıcı takip edilecek...`, 'info');

    let count = 0;
    for (const username of usernames) {
      const result = await followUser(username);
      if (result.success) {
        count++;
        updateStats({ follows: useStore.getState().stats.follows + 1 });
        addLog(`✅ @${username} takip edildi (${count}/${usernames.length})`, 'success');
      } else {
        addLog(`⚠️ @${username}: ${result.error}`, 'error');
      }
      await new Promise(r => setTimeout(r, (3 + (settings.randomDelay ? Math.random() * 2 : 0)) * 1000));
    }

    addLog(`✅ Liste takip tamamlandı: ${count}/${usernames.length}`, 'success');
    setRunning(false);
    setIsProcessing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Audience Scraping */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          Kitle Çekme (Hedef Analizi)
        </div>
        <div className="mb-4">
          <Label>Hedef Kullanıcı (Link de olabilir)</Label>
          <Input placeholder="@username" value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Label>Kaynak</Label>
            <select
              value={targetListType}
              onChange={(e) => setTargetListType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="followers">Takipçileri</option>
              <option value="following">Takip Ettikleri</option>
            </select>
          </div>
          <div>
            <Label>Adet</Label>
            <Input type="number" value={targetFollowCount} onChange={(e) => setTargetFollowCount(+e.target.value)} />
          </div>
        </div>
        <Button className="w-full mb-2" onClick={handleTargetFollow} disabled={isProcessing}>
          Otomatik Takip Başlat
        </Button>
        <Button variant="secondary" className="w-full" onClick={handleCsvDownload} disabled={isProcessing}>
          Listeyi Çek & İndir (CSV)
        </Button>
      </div>

      {/* List Follow */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          Liste ile Takip Et
        </div>
        <div className="mb-4">
          <Label>Kullanıcı Adları (Her satıra bir tane veya virgülle ayırın)</Label>
          <Textarea
            placeholder="@username1, @username2..."
            value={userListInput}
            onChange={(e) => setUserListInput(e.target.value)}
            className="h-[100px] resize-none"
          />
        </div>
        <Button className="w-full" onClick={handleListFollow} disabled={isProcessing}>
          Listeyi Takip Etmeye Başla
        </Button>
      </div>

      {/* Whitelist */}
      <div className="bg-card border border-border rounded-lg p-6 lg:col-span-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          🛡️ Beyaz Liste (Muaf Tutulanlar)
        </div>
        <div className="mb-2">
          <Label>Bu listedeki kullanıcılar asla takipten çıkarılmaz.</Label>
          <Textarea
            placeholder={"username1\nusername2"}
            value={whiteList}
            onChange={(e) => setWhiteList(e.target.value)}
            className="h-[120px]"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          @ işareti olmadan her satıra bir kullanıcı adı yazın.
        </p>
      </div>
    </div>
  );
}
