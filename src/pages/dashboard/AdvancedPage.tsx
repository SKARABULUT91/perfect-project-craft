import { useStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AdvancedPage() {
  const { settings, updateSettings } = useStore();

  const SelectToggle = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between bg-secondary px-4 py-3 rounded-md border border-border">
      <Label className="mb-0">{label}</Label>
      <select
        value={value ? 'true' : 'false'}
        onChange={(e) => onChange(e.target.value === 'true')}
        className="bg-background border border-border rounded px-2 py-1 text-sm"
      >
        <option value="true">Aktif</option>
        <option value="false">Kapalı</option>
      </select>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Speed Profiles */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          🚀 Gelişmiş Hız ve Performans Profileri
        </div>
        <div className="mb-4">
          <Label>ANA HIZ PROFİLİ</Label>
          <select
            value={settings.botSpeedProfile}
            onChange={(e) => updateSettings({ botSpeedProfile: e.target.value })}
            className="flex h-[45px] w-full rounded-md border border-primary/30 bg-card px-3 py-2 text-sm font-bold"
          >
            <option value="turbo">🚀 Turbo (x2.0 Hız)</option>
            <option value="normal">⚡ Normal (Varsayılan)</option>
            <option value="safe">🛡️ Güvenli (x0.75 Hız)</option>
            <option value="slow">🐢 Yavaş (x0.4 Hız)</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Profil seçimi tüm bekleme sürelerini otomatik oranlar.
          </p>
        </div>

        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80 mb-3 mt-5">
          ⚙️ Özellik Bazlı İnce Ayar (Saniye)
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div><Label>Takip Hızı</Label><Input type="number" value={settings.speedFollow} onChange={(e) => updateSettings({ speedFollow: +e.target.value })} /></div>
          <div><Label>T. Bırakma Hızı</Label><Input type="number" value={settings.speedUnfollow} onChange={(e) => updateSettings({ speedUnfollow: +e.target.value })} /></div>
          <div><Label>Beğeni Hızı</Label><Input type="number" value={settings.speedLike} onChange={(e) => updateSettings({ speedLike: +e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div><Label>RT Hızı</Label><Input type="number" value={settings.speedRT} onChange={(e) => updateSettings({ speedRT: +e.target.value })} /></div>
          <div><Label>Kaydırma (sn)</Label><Input type="number" value={settings.speedScroll} onChange={(e) => updateSettings({ speedScroll: +e.target.value })} /></div>
          <div><Label>Yazma (ms)</Label><Input type="number" value={settings.speedTyping} onChange={(e) => updateSettings({ speedTyping: +e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Yükleme (sn)</Label><Input type="number" value={settings.speedPageLoad} onChange={(e) => updateSettings({ speedPageLoad: +e.target.value })} /></div>
          <div><Label>Temizlik Hızı</Label><Input type="number" value={settings.speedCleanup} onChange={(e) => updateSettings({ speedCleanup: +e.target.value })} /></div>
          <div />
        </div>
      </div>

      {/* Spam Protection */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          🛡️ Spam Koruması ve Filtreler
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <SelectToggle label="İnsan Simülasyonu" value={settings.mouseSim} onChange={(v) => updateSettings({ mouseSim: v })} />
          <SelectToggle label="Rastgele Gecikme" value={settings.randomDelay} onChange={(v) => updateSettings({ randomDelay: v })} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <SelectToggle label="Onaylı Hesap Filtresi" value={settings.verifiedOnly} onChange={(v) => updateSettings({ verifiedOnly: v })} />
          <SelectToggle label="Beğenilenleri Atla" value={settings.skipLikedUsers} onChange={(v) => updateSettings({ skipLikedUsers: v })} />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div><Label>Maksimum Tweet Yaşı (Saat)</Label><Input type="number" value={settings.maxTweetAge} onChange={(e) => updateSettings({ maxTweetAge: +e.target.value })} /></div>
          <div><Label>Atlama Şansı (%)</Label><Input type="number" value={settings.skipChance} onChange={(e) => updateSettings({ skipChance: +e.target.value })} /></div>
          <div><Label>Boş Akış Yenileme</Label><Input type="number" value={settings.maxScrollRetries} onChange={(e) => updateSettings({ maxScrollRetries: +e.target.value })} /></div>
        </div>

        {/* Keyword Filter */}
        <SelectToggle
          label="Kelime Filtresi (Kara Liste)"
          value={settings.keywordFilterEnabled}
          onChange={(v) => updateSettings({ keywordFilterEnabled: v })}
        />
        {settings.keywordFilterEnabled && (
          <div className="mt-3 space-y-4">
            <div className="p-4 bg-black/20 rounded-lg border border-dashed border-border">
              <Label className="text-destructive font-semibold">🚫 Engellenecek Kelimeler (Her satıra bir kelime/öbek)</Label>
              <Textarea
                placeholder={"kazan\nhediye\ntakip et"}
                value={settings.blacklistKeywords}
                onChange={(e) => updateSettings({ blacklistKeywords: e.target.value })}
                className="h-[100px] bg-background mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Bu kelimelerin geçtiği mentler otomatik olarak beğenilmeden geçilir.
              </p>
            </div>
            <div className="p-4 bg-black/20 rounded-lg border border-dashed border-success/30">
              <Label className="text-success font-semibold">✅ Beyaz Liste Kelimeleri (Sadece bunları hedefle)</Label>
              <Textarea
                placeholder={"teknoloji\nyazılım\nstartup"}
                value={settings.whitelistKeywords}
                onChange={(e) => updateSettings({ whitelistKeywords: e.target.value })}
                className="h-[100px] bg-background mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Sadece bu kelimeleri içeren tweetlerle etkileşime geçilir. Boş bırakılırsa filtre uygulanmaz.
              </p>
            </div>
          </div>
        )}

        {/* Anti-Shadowban */}
        <div className="text-xs font-semibold uppercase tracking-wider text-destructive mt-6 mb-3">
          🛡️ Gelişmiş Anti-Shadowban Koruması
        </div>
        <SelectToggle
          label="Akıllı Dinlenme Modu"
          value={settings.antiShadowbanEnabled}
          onChange={(v) => updateSettings({ antiShadowbanEnabled: v })}
        />
        {settings.antiShadowbanEnabled && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div><Label>Kaç İşlemde Bir Dinlensin?</Label><Input type="number" value={settings.actionsBeforeBreak} onChange={(e) => updateSettings({ actionsBeforeBreak: +e.target.value })} /></div>
            <div><Label>Dinlenme Süresi (Dakika)</Label><Input type="number" value={settings.breakDuration} onChange={(e) => updateSettings({ breakDuration: +e.target.value })} /></div>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Bot, belirlenen işlem sayısına ulaştığında radara takılmamak için otomatik olarak mola verir.
        </p>
      </div>
    </div>
  );
}
