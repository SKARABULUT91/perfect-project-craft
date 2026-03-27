import { useState } from 'react';
import { Home, PlayCircle, UserPlus, Trash2, Database, Settings, Users, Zap, Calendar, BarChart3, Wifi, Menu, X } from 'lucide-react';
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
import AccountsPage from '@/pages/dashboard/AccountsPage';
import CampaignsPage from '@/pages/dashboard/CampaignsPage';
import SchedulerPage from '@/pages/dashboard/SchedulerPage';
import AnalyticsPage from '@/pages/dashboard/AnalyticsPage';
import ProxyPage from '@/pages/dashboard/ProxyPage';

const navItems: { id: PageId; label: string; icon: typeof Home; group?: string }[] = [
  { id: 'home', label: 'Genel Bakış', icon: Home },
  { id: 'accounts', label: 'Hesaplar', icon: Users },
  { id: 'automation', label: 'Otomasyon', icon: PlayCircle },
  { id: 'campaigns', label: 'Kampanyalar', icon: Zap, group: 'İş Akışı' },
  { id: 'scheduler', label: 'Zamanlayıcı', icon: Calendar },
  { id: 'follow', label: 'Takip Yönetimi', icon: UserPlus, group: 'Araçlar' },
  { id: 'cleanup', label: 'Temizlik', icon: Trash2 },
  { id: 'proxy', label: 'Proxy', icon: Wifi },
  { id: 'analytics', label: 'Analitik', icon: BarChart3, group: 'Raporlar' },
  { id: 'data', label: 'Veri Yönetimi', icon: Database },
  { id: 'advanced', label: 'Ayarlar', icon: Settings, group: 'Sistem' },
];

const pageTitles: Record<PageId, string> = {
  home: 'Genel Bakış',
  accounts: 'Hesap Yönetimi',
  automation: 'Otomasyon',
  campaigns: 'Kampanyalar',
  scheduler: 'Görev Zamanlayıcı',
  follow: 'Takip Yönetimi',
  cleanup: 'Temizlik & Araçlar',
  proxy: 'Proxy Yönetimi',
  analytics: 'Analitik & Raporlar',
  data: 'Veri Yönetimi',
  advanced: 'Gelişmiş Ayarlar',
};

export default function DashboardLayout() {
  const [activePage, setActivePage] = useState<PageId>('home');
  const { isRunning, activeTask, setRunning, addLog, twitterCredentials, sidebarOpen, setSidebarOpen } = useStore();

  const handleStop = () => {
    setRunning(false);
    addLog('Tüm işlemler durduruldu.', 'info');
  };

  const handleNav = (id: PageId) => {
    setActivePage(id);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home': return <HomePage />;
      case 'accounts': return <AccountsPage />;
      case 'automation': return <AutomationPage />;
      case 'campaigns': return <CampaignsPage />;
      case 'scheduler': return <SchedulerPage />;
      case 'follow': return <FollowPage />;
      case 'cleanup': return <CleanupPage />;
      case 'proxy': return <ProxyPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'data': return <DataPage />;
      case 'advanced': return <AdvancedPage />;
    }
  };

  let lastGroup = '';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/80 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed lg:static z-50 w-[260px] flex-shrink-0 bg-card border-r border-border flex flex-col h-full transition-transform duration-200',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex items-center justify-between p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
              X
            </div>
            <span className="text-foreground text-xl tracking-tight font-sans text-left font-bold mx-0 px-0">X - KODCUM</span>
          </div>
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 px-4 py-2 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const showGroup = item.group && item.group !== lastGroup;
            if (item.group) lastGroup = item.group;
            return (
              <div key={item.id}>
                {showGroup && (
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold mt-4 mb-1.5 px-3">
                    {item.group}
                  </div>
                )}
                <button
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all w-full text-left',
                    activePage === item.id
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0', activePage === item.id ? 'text-primary' : 'opacity-70')} />
                  {item.label}
                </button>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          {isRunning && (
            <Button variant="destructive" className="w-full" onClick={handleStop}>
              DURDUR
            </Button>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="h-14 lg:h-16 border-b border-border flex items-center justify-between px-4 lg:px-8 bg-background/80 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base lg:text-lg font-semibold text-foreground truncate">{pageTitles[activePage]}</h1>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            {twitterCredentials.isLoggedIn && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                🐦 @{twitterCredentials.username}
              </span>
            )}
            <div className={cn(
              'text-[10px] lg:text-xs font-medium flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full',
              isRunning
                ? 'text-primary bg-primary/10'
                : twitterCredentials.isLoggedIn
                  ? 'text-success bg-success/10'
                  : 'text-warning bg-warning/10'
            )}>
              <div className={cn(
                'w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full shadow-[0_0_8px_currentColor]',
                isRunning ? 'bg-primary' : twitterCredentials.isLoggedIn ? 'bg-success' : 'bg-warning'
              )} />
              <span className="truncate max-w-[100px] lg:max-w-none">
                {isRunning ? `AKTİF: ${activeTask}` : twitterCredentials.isLoggedIn ? 'Hazır' : 'Bağlantı Yok'}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="animate-fade-in" key={activePage}>
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
}
