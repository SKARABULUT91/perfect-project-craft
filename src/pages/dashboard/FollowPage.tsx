import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

export default function FollowPage() {
  const { addLog, setRunning, whiteList, setWhiteList } = useStore();
  const [targetUsername, setTargetUsername] = useState('');
  const [targetListType, setTargetListType] = useState('followers');
  const [targetFollowCount, setTargetFollowCount] = useState(50);
  const [userListInput, setUserListInput] = useState('');

  const demoAction = (action: string) => {
    addLog(`Demo: ${action}`, 'info');
    setRunning(true, action);
    toast({ title: 'Demo Mod', description: `${action} - Gerçek Twitter bağlantısı gereklidir.` });
    setTimeout(() => setRunning(false), 2000);
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
        <Button className="w-full mb-2" onClick={() => demoAction('Hedef Takip')}>
          Otomatik Takip Başlat
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => demoAction('CSV İndir')}>
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
        <Button className="w-full" onClick={() => demoAction('Liste Takip')}>
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
