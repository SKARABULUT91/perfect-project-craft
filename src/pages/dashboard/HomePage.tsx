import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { stats, resetStats, logs, addLog } = useStore();

  const statItems = [
    { label: 'BEĞENİ', value: stats.likes },
    { label: 'RETWEET', value: stats.rts },
    { label: 'TAKİP', value: stats.follows },
    { label: 'T. BIRAKMA', value: stats.unfollows },
  ];

  const handleReset = () => {
    resetStats();
    addLog('İstatistikler başarıyla sıfırlandı.', 'success');
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statItems.map((item) => (
          <div key={item.label} className="bg-card border border-border rounded-lg p-5">
            <div className="text-xs text-muted-foreground font-medium mb-2">{item.label}</div>
            <div className="text-3xl font-bold text-foreground">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-6">
        <Button
          variant="outline"
          className="border-destructive/20 text-destructive bg-destructive/10 hover:bg-destructive/20"
          onClick={handleReset}
        >
          İstatistikleri Sıfırla
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          📜 Son İşlemler (Loglar)
        </div>
        <div className="bg-black border border-border rounded-lg h-[350px] overflow-y-auto p-4 font-mono text-xs">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-2.5 py-1 border-b border-card">
              <span className="text-muted-foreground/50 min-w-[60px]">{log.time}</span>
              <span className={cn(
                log.type === 'info' && 'text-primary',
                log.type === 'success' && 'text-success',
                log.type === 'error' && 'text-destructive',
                log.type === 'default' && 'text-muted-foreground',
              )}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
