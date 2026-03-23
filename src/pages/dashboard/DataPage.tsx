import { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

export default function DataPage() {
  const {
    blacklistUsers, setBlacklistUsers,
    interactedUsers, clearInteractedUsers,
    addLog, exportData, importData,
  } = useStore();
  const [whitelistKeywords, setWhitelistKeywords] = useState('');
  const [showInteracted, setShowInteracted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xmaster_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('Veritabanı yedeği indirildi.', 'success');
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (importData(result)) {
        toast({ title: 'Başarılı', description: 'Yedek başarıyla yüklendi!' });
        addLog('Yedek başarıyla yüklendi.', 'success');
      } else {
        toast({ title: 'Hata', description: 'Yedek dosyası bozuk veya geçersiz!', variant: 'destructive' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Blacklist */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          🚫 Etkileşim Kara Listesi (Blacklist)
        </div>
        <div className="mb-2">
          <Label>Bu listedeki kullanıcılara ASLA Beğeni, RT veya Yorum yapılmaz.</Label>
          <Textarea
            placeholder={"username1\nusername2\n@username3"}
            value={blacklistUsers}
            onChange={(e) => setBlacklistUsers(e.target.value)}
            className="h-[150px] bg-black text-destructive font-mono"
          />
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Her satıra bir kullanıcı adı yazın. @ işareti olabilir veya olmayabilir.
        </p>
        <Button className="w-full" onClick={() => {
          addLog('Kara liste kaydedildi.', 'success');
          toast({ title: 'Kaydedildi' });
        }}>
          Listeyi Kaydet
        </Button>
      </div>

      {/* Whitelist Keywords */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          ✅ Hedef Kelime Filtresi (Whitelist)
        </div>
        <div className="mb-2">
          <Label>Sadece bu kelimeleri veya cümleleri içeren yanıtlar beğenilir.</Label>
          <Textarea
            placeholder={"harika\nteşekkürler\nfiyat nedir"}
            value={whitelistKeywords}
            onChange={(e) => setWhitelistKeywords(e.target.value)}
            className="h-[100px] bg-black text-success font-mono"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Eğer buraya bir şeyler yazarsanız, bot sadece bu kelimelerin geçtiği yanıtları beğenir. Boş bırakırsanız hepsini beğenir.
        </p>
      </div>

      {/* Interaction History */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          💾 Etkileşim Geçmişi
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          "Beğenilenleri Atla" modu açıkken, bot buradaki listede kayıtlı olan kullanıcıları tekrar beğenmez.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setShowInteracted(!showInteracted)}>
            Listeyi Görüntüle
          </Button>
          <Button
            variant="outline"
            className="border-destructive/20 text-destructive"
            onClick={() => {
              clearInteractedUsers();
              addLog('Etkileşim geçmişi temizlendi.', 'success');
            }}
          >
            Geçmişi Temizle
          </Button>
        </div>
        {showInteracted && (
          <div className="mt-4 max-h-[300px] overflow-y-auto bg-black p-2.5 rounded-md font-mono text-xs text-muted-foreground">
            {interactedUsers.length === 0
              ? 'Henüz kayıt yok.'
              : interactedUsers.map((u, i) => (
                <div key={i} className="py-1 border-b border-border/10">@{u}</div>
              ))
            }
          </div>
        )}
      </div>

      {/* Backup */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          📦 Veritabanı Yedekleme
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={handleBackup}>
            💾 Yedeği İndir
          </Button>
          <Button
            className="border-warning/20 text-warning bg-warning/10 hover:bg-warning/20"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            📂 Yedeği Yükle
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleRestore}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Ayarlarınızı, takipçi listenizi ve etkileşim geçmişinizi bilgisayarınıza kaydedin veya geri yükleyin.
        </p>
      </div>
    </div>
  );
}
