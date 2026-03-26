import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Stats, LogEntry, XMasterSettings, TwitterCredentials, TwitterAccount, Campaign, ScheduledTask, ProxyItem, DailyStats } from './types';
import { defaultSettings } from './types';

interface XMasterStore {
  stats: Stats;
  logs: LogEntry[];
  settings: XMasterSettings;
  isRunning: boolean;
  activeTask: string;
  blacklistUsers: string;
  whiteList: string;
  interactedUsers: string[];
  twitterCredentials: TwitterCredentials;
  accounts: TwitterAccount[];
  campaigns: Campaign[];
  scheduledTasks: ScheduledTask[];
  proxies: ProxyItem[];
  dailyStats: DailyStats[];
  sidebarOpen: boolean;

  updateStats: (stats: Partial<Stats>) => void;
  resetStats: () => void;
  addLog: (message: string, type: LogEntry['type']) => void;
  clearLogs: () => void;
  updateSettings: (settings: Partial<XMasterSettings>) => void;
  setRunning: (running: boolean, task?: string) => void;
  setBlacklistUsers: (value: string) => void;
  setWhiteList: (value: string) => void;
  setInteractedUsers: (users: string[]) => void;
  clearInteractedUsers: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  loginTwitter: (username: string, password: string) => void;
  logoutTwitter: () => void;

  addAccount: (account: TwitterAccount) => void;
  removeAccount: (id: string) => void;
  updateAccount: (id: string, data: Partial<TwitterAccount>) => void;
  setActiveAccount: (id: string) => void;

  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;
  removeCampaign: (id: string) => void;

  addScheduledTask: (task: ScheduledTask) => void;
  updateScheduledTask: (id: string, data: Partial<ScheduledTask>) => void;
  removeScheduledTask: (id: string) => void;

  addProxy: (proxy: ProxyItem) => void;
  removeProxy: (id: string) => void;
  updateProxy: (id: string, data: Partial<ProxyItem>) => void;

  addDailyStats: (stats: DailyStats) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<XMasterStore>()(
  persist(
    (set, get) => ({
      stats: { likes: 0, rts: 0, follows: 0, unfollows: 0 },
      logs: [{ id: '0', time: 'Sistem', message: 'Hazır...', type: 'default' }],
      settings: defaultSettings,
      isRunning: false,
      activeTask: '',
      blacklistUsers: '',
      whiteList: '',
      interactedUsers: [],
      twitterCredentials: { username: '', password: '', isLoggedIn: false },
      accounts: [],
      campaigns: [],
      scheduledTasks: [],
      proxies: [],
      dailyStats: generateDemoStats(),
      sidebarOpen: false,

      updateStats: (partial) =>
        set((state) => ({ stats: { ...state.stats, ...partial } })),

      resetStats: () =>
        set({ stats: { likes: 0, rts: 0, follows: 0, unfollows: 0 } }),

      addLog: (message, type) =>
        set((state) => {
          const now = new Date();
          const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;
          const entry: LogEntry = { id: crypto.randomUUID(), time, message, type };
          return { logs: [entry, ...state.logs].slice(0, 200) };
        }),

      clearLogs: () =>
        set({ logs: [{ id: '0', time: 'Sistem', message: 'Loglar temizlendi.', type: 'info' }] }),

      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),

      setRunning: (running, task = '') =>
        set({ isRunning: running, activeTask: task }),

      setBlacklistUsers: (value) => set({ blacklistUsers: value }),
      setWhiteList: (value) => set({ whiteList: value }),
      setInteractedUsers: (users) => set({ interactedUsers: users }),
      clearInteractedUsers: () => set({ interactedUsers: [] }),

      exportData: () => {
        const state = get();
        return JSON.stringify({
          stats: state.stats,
          settings: state.settings,
          blacklistUsers: state.blacklistUsers,
          whiteList: state.whiteList,
          interactedUsers: state.interactedUsers,
          accounts: state.accounts,
          campaigns: state.campaigns,
          proxies: state.proxies,
        }, null, 2);
      },

      loginTwitter: (username, password) => {
        set({ twitterCredentials: { username, password, isLoggedIn: true } });
        get().addLog(`@${username} hesabıyla giriş yapıldı.`, 'success');
      },

      logoutTwitter: () => {
        const username = get().twitterCredentials.username;
        set({ twitterCredentials: { username: '', password: '', isLoggedIn: false } });
        get().addLog(`@${username} hesabından çıkış yapıldı.`, 'info');
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            ...(data.stats && { stats: data.stats }),
            ...(data.settings && { settings: { ...defaultSettings, ...data.settings } }),
            ...(data.blacklistUsers !== undefined && { blacklistUsers: data.blacklistUsers }),
            ...(data.whiteList !== undefined && { whiteList: data.whiteList }),
            ...(data.interactedUsers && { interactedUsers: data.interactedUsers }),
            ...(data.twitterCredentials && { twitterCredentials: data.twitterCredentials }),
            ...(data.accounts && { accounts: data.accounts }),
            ...(data.campaigns && { campaigns: data.campaigns }),
            ...(data.proxies && { proxies: data.proxies }),
          });
          return true;
        } catch {
          return false;
        }
      },

      addAccount: (account) => set((s) => ({ accounts: [...s.accounts, account] })),
      removeAccount: (id) => set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),
      updateAccount: (id, data) => set((s) => ({
        accounts: s.accounts.map((a) => a.id === id ? { ...a, ...data } : a),
      })),
      setActiveAccount: (id) => set((s) => ({
        accounts: s.accounts.map((a) => ({ ...a, isActive: a.id === id })),
      })),

      addCampaign: (campaign) => set((s) => ({ campaigns: [...s.campaigns, campaign] })),
      updateCampaign: (id, data) => set((s) => ({
        campaigns: s.campaigns.map((c) => c.id === id ? { ...c, ...data } : c),
      })),
      removeCampaign: (id) => set((s) => ({ campaigns: s.campaigns.filter((c) => c.id !== id) })),

      addScheduledTask: (task) => set((s) => ({ scheduledTasks: [...s.scheduledTasks, task] })),
      updateScheduledTask: (id, data) => set((s) => ({
        scheduledTasks: s.scheduledTasks.map((t) => t.id === id ? { ...t, ...data } : t),
      })),
      removeScheduledTask: (id) => set((s) => ({ scheduledTasks: s.scheduledTasks.filter((t) => t.id !== id) })),

      addProxy: (proxy) => set((s) => ({ proxies: [...s.proxies, proxy] })),
      removeProxy: (id) => set((s) => ({ proxies: s.proxies.filter((p) => p.id !== id) })),
      updateProxy: (id, data) => set((s) => ({
        proxies: s.proxies.map((p) => p.id === id ? { ...p, ...data } : p),
      })),

      addDailyStats: (stats) => set((s) => ({ dailyStats: [...s.dailyStats, stats] })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'xmaster-storage',
      partialize: (state) => ({
        stats: state.stats,
        settings: state.settings,
        blacklistUsers: state.blacklistUsers,
        whiteList: state.whiteList,
        interactedUsers: state.interactedUsers,
        twitterCredentials: state.twitterCredentials,
        accounts: state.accounts,
        campaigns: state.campaigns,
        scheduledTasks: state.scheduledTasks,
        proxies: state.proxies,
        dailyStats: state.dailyStats,
      }),
    }
  )
);

function generateDemoStats(): DailyStats[] {
  const stats: DailyStats[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    stats.push({
      date: d.toISOString().slice(0, 10),
      likes: Math.floor(Math.random() * 80) + 10,
      retweets: Math.floor(Math.random() * 40) + 5,
      follows: Math.floor(Math.random() * 30) + 3,
      unfollows: Math.floor(Math.random() * 15),
      comments: Math.floor(Math.random() * 20) + 2,
    });
  }
  return stats;
}
