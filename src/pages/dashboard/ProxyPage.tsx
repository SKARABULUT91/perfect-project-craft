import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Wifi, RefreshCw } from 'lucide-react';
import type { ProxyItem } from '@/lib/types';

export default function ProxyPage() {
  const { proxies, addProxy, removeProxy, updateProxy, addLog } = useStore();
  const [mode, setMode] = useState<'manual' | 'bulk'>('manual');
  const [address, setAddress] = useState('');
  const [port, setPort] = useState('');
  const [proxyType, setProxyType] = useState<'http' | 'socks5'>('http');
  const [proxyUser, setProxyUser] = useState('');
  const [proxyPass, setProxyPass] = useState('');
  const [bulkList, setBulkList] = useState('');

  const handleAdd = () => {
    if (!address.trim() || !port.trim()) return;
    const proxy: ProxyItem = {
      id: crypto.randomUUID(),
      address: address.trim(),
      port: port.trim(),
      type: proxyType,
      username: proxyUser || undefined,
      password: proxyPass || undefined,
      status: 'active',
    };
    addProxy(proxy);
    addLog(`Proxy eklendi: ${proxy.address}:${proxy.port}`, 'success');
    setAddress('');
    setPort('');
    setProxyUser('');
    setProxyPass('');
  };

  const handleBulkAdd = () => {
    const lines = bulkList.split('\n').filter((l) => l.trim());
    let count = 0;
    lines.forEach((line) => {
      const parts = line.trim().split(':');
      if (parts.length >= 2) {
        addProxy({
          id: crypto.randomUUID(),
          address: parts[0],
          port: parts[1],
          type: 'http',
          username: parts[2] || undefined,
          password: parts[3] || undefined,
          status: 'active',
        });
        count++;
      }
    });
    addLog(`${count} proxy toplu eklendi.`, 'success');
    setBulkList('');
  };

  const handleTest = (proxy: ProxyItem) => {
    updateProxy(proxy.id, { status: 'testing' });
    addLog(`Proxy test ediliyor: ${proxy.address}:${proxy.port}`, 'info');
    setTimeout(() => {
      const alive = Math.random() > 0.3;
      updateProxy(proxy.id, { status: alive ? 'active' : 'dead' });
      addLog(`Proxy ${proxy.address}:${proxy.port} — ${alive ? 'Aktif ✓' : 'Ölü ✗'}`, alive ? 'success' : 'error');
    }, 1500);
  };

  const statusConfig: Record<string, { label: string; class: string }> = {
    active: { label: 'Aktif', class: 'text-success bg-success/10' },
    dead: { label: 'Ölü', class: 'text-destructive bg-destructive/10' },
    testing: { label: 'Test...', class: 'text-warning bg-warning/10' },
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">IP rotasyonu için proxy listesi tanımlayın.</p>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex gap-2 mb-4">
          <Button variant={mode === 'manual' ? 'default' : 'secondary'} size="sm" onClick={() => setMode('manual')}>Manuel Ekle</Button>
          <Button variant={mode === 'bulk' ? 'default' : 'secondary'} size="sm" onClick={() => setMode('bulk')}>Toplu Ekle</Button>
        </div>

        {mode === 'manual' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label>IP Adresi</Label>
                <Input placeholder="192.168.1.1" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div>
                <Label>Port</Label>
                <Input placeholder="8080" value={port} onChange={(e) => setPort(e.target.value)} />
              </div>
              <div>
                <Label>Tip</Label>
                <select value={proxyType} onChange={(e) => setProxyType(e.target.value as 'http' | 'socks5')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="http">HTTP</option>
                  <option value="socks5">SOCKS5</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={handleAdd} disabled={!address.trim() || !port.trim()}>
                  <Plus className="w-4 h-4 mr-1" /> Ekle
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kullanıcı Adı (Opsiyonel)</Label>
                <Input placeholder="user" value={proxyUser} onChange={(e) => setProxyUser(e.target.value)} />
              </div>
              <div>
                <Label>Şifre (Opsiyonel)</Label>
                <Input type="password" placeholder="••••" value={proxyPass} onChange={(e) => setProxyPass(e.target.value)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Label>Proxy Listesi (ip:port:user:pass formatında, her satıra bir tane)</Label>
            <Textarea placeholder="192.168.1.1:8080:user:pass\n10.0.0.1:3128" value={bulkList} onChange={(e) => setBulkList(e.target.value)} className="h-[120px] font-mono text-xs" />
            <Button onClick={handleBulkAdd} disabled={!bulkList.trim()}>Toplu Ekle</Button>
          </div>
        )}
      </div>

      {proxies.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <Wifi className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground text-sm">Henüz proxy eklenmemiş.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left p-3">Adres</th>
                  <th className="text-left p-3">Port</th>
                  <th className="text-left p-3">Tip</th>
                  <th className="text-left p-3">Kimlik</th>
                  <th className="text-left p-3">Durum</th>
                  <th className="text-right p-3">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {proxies.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="p-3 font-mono text-xs text-foreground">{p.address}</td>
                    <td className="p-3 font-mono text-xs text-foreground">{p.port}</td>
                    <td className="p-3 text-xs uppercase text-muted-foreground">{p.type}</td>
                    <td className="p-3 text-xs text-muted-foreground">{p.username ? '✓' : '—'}</td>
                    <td className="p-3">
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', statusConfig[p.status].class)}>
                        {statusConfig[p.status].label}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleTest(p)}>
                          <RefreshCw className={cn('w-3 h-3', p.status === 'testing' && 'animate-spin')} />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeProxy(p.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-border flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{proxies.length} proxy • {proxies.filter((p) => p.status === 'active').length} aktif</span>
            <Button size="sm" variant="secondary" className="text-xs" onClick={() => proxies.forEach((p) => handleTest(p))}>
              Tümünü Test Et
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
