import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Plus, Play, Pause, Trash2, Zap } from 'lucide-react';
import type { Campaign, CampaignStep } from '@/lib/types';
import { likeTweet, retweetTweet, followUser, postTweet, searchTweets } from '@/lib/twitter-api';

const defaultSteps: CampaignStep[] = [
  { action: 'like', enabled: true, delay: 3 },
  { action: 'retweet', enabled: true, delay: 5 },
  { action: 'comment', enabled: false, delay: 8, commentStyle: 'samimi', commentText: '' },
  { action: 'follow', enabled: false, delay: 4 },
];

const actionLabels: Record<string, string> = { like: '❤️ Beğeni', retweet: '🔁 Retweet', comment: '💬 Yorum', follow: '👤 Takip' };
const styleLabels: Record<string, string> = { mizahi: '😄 Mizahi', resmi: '📋 Resmi', samimi: '🤝 Samimi', pozitif: '✨ Pozitif' };

export default function CampaignsPage() {
  const { campaigns, addCampaign, updateCampaign, removeCampaign, addLog, setRunning, accounts } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [steps, setSteps] = useState<CampaignStep[]>(defaultSteps);

  const handleCreate = () => {
    if (!name.trim() || !target.trim()) return;
    const campaign: Campaign = {
      id: crypto.randomUUID(),
      name: name.trim(),
      target: target.trim(),
      steps: steps.filter((s) => s.enabled),
      status: 'draft',
      createdAt: new Date().toISOString(),
      completedActions: 0,
      totalActions: steps.filter((s) => s.enabled).length * 10,
    };
    addCampaign(campaign);
    addLog(`"${campaign.name}" kampanyası oluşturuldu.`, 'success');
    setName('');
    setTarget('');
    setSteps(defaultSteps);
    setShowCreate(false);
  };

  const toggleStep = (idx: number) => {
    setSteps((prev) => prev.map((s, i) => i === idx ? { ...s, enabled: !s.enabled } : s));
  };

  const updateStep = (idx: number, data: Partial<CampaignStep>) => {
    setSteps((prev) => prev.map((s, i) => i === idx ? { ...s, ...data } : s));
  };

  const handleRun = async (campaign: Campaign) => {
    updateCampaign(campaign.id, { status: 'running' });
    setRunning(true, `Kampanya: ${campaign.name}`);
    addLog(`"${campaign.name}" kampanyası başlatıldı.`, 'info');
    toast({ title: 'Kampanya Başlatıldı', description: `${campaign.name} çalışıyor...` });

    try {
      // Search for target tweets
      const searchResult = await searchTweets(campaign.target, 10);
      const tweets = searchResult.success && searchResult.data?.data ? searchResult.data.data : [];
      let completed = 0;

      for (const tweet of tweets) {
        for (const step of campaign.steps) {
          if (step.action === 'like') {
            await likeTweet(tweet.id);
          } else if (step.action === 'retweet') {
            await retweetTweet(tweet.id);
          } else if (step.action === 'follow' && tweet.author_id) {
            // follow requires username, skip if not available
          } else if (step.action === 'comment' && step.commentText) {
            await postTweet(step.commentText, tweet.id);
          }
          completed++;
          updateCampaign(campaign.id, { completedActions: completed });
          await new Promise(r => setTimeout(r, step.delay * 1000));
        }
      }

      updateCampaign(campaign.id, { status: 'completed', completedActions: completed });
      addLog(`"${campaign.name}" kampanyası tamamlandı: ${completed} işlem.`, 'success');
    } catch (err: unknown) {
      addLog(`❌ Kampanya hatası: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`, 'error');
      updateCampaign(campaign.id, { status: 'paused' });
    }

    setRunning(false);
  };

  const statusConfig: Record<string, { label: string; class: string }> = {
    draft: { label: 'Taslak', class: 'text-muted-foreground bg-muted' },
    running: { label: 'Çalışıyor', class: 'text-primary bg-primary/10' },
    paused: { label: 'Duraklatıldı', class: 'text-warning bg-warning/10' },
    completed: { label: 'Tamamlandı', class: 'text-success bg-success/10' },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Çok adımlı kampanyalar oluşturun: Beğen → RT → Yorum → Takip.</p>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> Yeni Kampanya
        </Button>
      </div>

      {showCreate && (
        <div className="bg-card border border-border rounded-lg p-5 animate-fade-in">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">🎯 Yeni Kampanya Oluştur</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <Label>Kampanya Adı</Label>
              <Input placeholder="Ör: Yeni Ürün Lansmanı" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Hedef (Kullanıcı / Hashtag / Tweet)</Label>
              <Input placeholder="@user veya #hashtag" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
          </div>
          <div className="mb-4">
            <Label>Hesap Seçimi</Label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Varsayılan (Aktif Hesap)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>@{acc.username} {acc.isActive ? '(Aktif)' : ''}</option>
              ))}
            </select>
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">İş Akışı Adımları</div>
          <div className="space-y-3 mb-4">
            {steps.map((step, idx) => (
              <div key={step.action} className={cn('border rounded-lg p-3 transition-all', step.enabled ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/30')}>
                <div className="flex items-center gap-3 mb-2">
                  <Checkbox checked={step.enabled} onCheckedChange={() => toggleStep(idx)} />
                  <span className="text-sm font-medium">{actionLabels[step.action]}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Gecikme:</span>
                    <Input type="number" className="w-16 h-7 text-xs" value={step.delay} onChange={(e) => updateStep(idx, { delay: +e.target.value })} disabled={!step.enabled} />
                    <span className="text-[10px] text-muted-foreground">sn</span>
                  </div>
                </div>
                {step.action === 'comment' && step.enabled && (
                  <div className="mt-2 pl-7 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">AI Yorum Stili</Label>
                      <select
                        value={step.commentStyle || 'samimi'}
                        onChange={(e) => updateStep(idx, { commentStyle: e.target.value as CampaignStep['commentStyle'] })}
                        className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        {Object.entries(styleLabels).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Sabit Metin (Boşsa AI üretir)</Label>
                      <Input className="h-8 text-xs" placeholder="Harika bir paylaşım!" value={step.commentText || ''} onChange={(e) => updateStep(idx, { commentText: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={!name.trim() || !target.trim() || !steps.some((s) => s.enabled)}>
              <Zap className="w-4 h-4 mr-1.5" /> Kampanyayı Oluştur
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>İptal</Button>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground text-sm">Henüz kampanya oluşturulmamış.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-foreground font-semibold text-sm">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Hedef: {c.target}</p>
                </div>
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', statusConfig[c.status].class)}>
                  {statusConfig[c.status].label}
                </span>
              </div>
              <div className="flex gap-1.5 mb-3">
                {c.steps.map((s) => (
                  <span key={s.action} className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded">
                    {actionLabels[s.action]}
                  </span>
                ))}
              </div>
              <div className="mb-3">
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${c.totalActions ? (c.completedActions / c.totalActions) * 100 : 0}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{c.completedActions}/{c.totalActions} işlem</p>
              </div>
              <div className="flex gap-2">
                {(c.status === 'draft' || c.status === 'paused') && (
                  <Button size="sm" className="text-xs" onClick={() => handleRun(c)}>
                    <Play className="w-3 h-3 mr-1" /> Başlat
                  </Button>
                )}
                {c.status === 'running' && (
                  <Button size="sm" variant="secondary" className="text-xs" onClick={() => {
                    updateCampaign(c.id, { status: 'paused' });
                    setRunning(false);
                  }}>
                    <Pause className="w-3 h-3 mr-1" /> Duraklat
                  </Button>
                )}
                <Button size="sm" variant="outline" className="text-xs border-destructive/20 text-destructive" onClick={() => removeCampaign(c.id)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Sil
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
