import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Stats, LogEntry, XMasterSettings, TwitterCredentials } from './types';
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
          });
          return true;
        } catch {
          return false;
        }
      },
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
      }),
    }
  )
);
