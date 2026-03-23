import { useState } from 'react';
import { Home, PlayCircle, UserPlus, Trash2, Database, Settings } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { PageId } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import HomePage from '@/pages/dashboard/HomePage';
import AutomationPage from '@/pages/dashboard/AutomationPage';
import FollowPage from '@/pages/dashboard/FollowPage';
import CleanupPage from '@/pages/dashboard/CleanupPage';
import DataPage from '@/pages/dashboard/DataPage';
import AdvancedPage from '@/pages/dashboard/AdvancedPage';

const navItems: { id: PageId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Genel Bakış', icon: Home },
  { id: 'automation', label: 'Otomasyon', icon: PlayCircle },
  { id: 'follow', label: 'Takip Yönetimi', icon: UserPlus },
  { id: 'cleanup', label: 'Temizlik & Araçlar', icon: Trash2 },
  { id: 'data', label: 'Veri Yönetimi', icon: Database },
  { id: 'advanced', label: 'Ayarlar', icon: Settings },
];

const pageTitles: Record<PageId, string> = {
  home: 'Genel Bakış',
  automation: 'Otomasyon',
  follow: 'Takip Yönetimi',
  cleanup: 'Temizlik & Araçlar',
  data: 'Veri Yönetimi',
  advanced: 'Gelişmiş Ayarlar',
};

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState<PageId>('home');
  const { isRunning, activeTask, setRunning, addLog } = useStore();

  const handleStop = () => {
    setRunning(false);
    addLog('Tüm işlemler durduruldu.', 'info');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home': return <HomePage />;
      case 'automation': return <AutomationPage />;
      case 'follow': return <FollowPage />;
      case 'cleanup': return <CleanupPage />;
      case 'data': return <DataPage />;
      case 'advanced': return <AdvancedPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-[260px] flex-shrink-0 bg-card border-r border-border flex flex-col p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
            X
          </div>
          <span className="text-foreground font-bold text-xl tracking-tight">X-Master</span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all',
                activePage === item.id
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'w-[18px] h-[18px]',
                  activePage === item.id ? 'text-primary' : 'opacity-70'
                )}
              />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-border pt-4">
          {isRunning && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleStop}
            >
              DURDUR
            </Button>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-8 bg-background/80 backdrop-blur-xl">
          <h1 className="text-lg font-semibold text-foreground">{pageTitles[activePage]}</h1>
          <div className={cn(
            'text-xs font-medium flex items-center gap-2 px-3 py-1.5 rounded-full',
            isRunning
              ? 'text-primary bg-primary/10'
              : 'text-success bg-success/10'
          )}>
            <div className={cn(
              'w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]',
              isRunning ? 'bg-primary' : 'bg-success'
            )} />
            {isRunning ? `AKTİF: ${activeTask}` : 'Hazır'}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="animate-fade-in" key={activePage}>
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
}
