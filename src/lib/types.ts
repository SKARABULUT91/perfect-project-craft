export interface TwitterCredentials {
  username: string;
  password: string;
  isLoggedIn: boolean;
}

export interface TwitterAccount {
  id: string;
  username: string;
  password: string;
  twoFASecret: string;
  proxy: string;
  isActive: boolean;
  status: 'idle' | 'running' | 'error' | 'banned';
}

export interface CampaignStep {
  action: 'like' | 'retweet' | 'comment' | 'follow';
  enabled: boolean;
  delay: number;
  commentStyle?: 'mizahi' | 'resmi' | 'samimi' | 'pozitif';
  commentText?: string;
}

export interface Campaign {
  id: string;
  name: string;
  target: string;
  steps: CampaignStep[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  createdAt: string;
  completedActions: number;
  totalActions: number;
}

export interface ScheduledTask {
  id: string;
  name: string;
  action: string;
  target: string;
  schedule: 'once' | 'hourly' | 'daily' | 'weekly';
  scheduledTime: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface ProxyItem {
  id: string;
  address: string;
  port: string;
  type: 'http' | 'socks5';
  username?: string;
  password?: string;
  status: 'active' | 'dead' | 'testing';
}

export interface DailyStats {
  date: string;
  likes: number;
  retweets: number;
  follows: number;
  unfollows: number;
  comments: number;
}

export interface Stats {
  likes: number;
  rts: number;
  follows: number;
  unfollows: number;
}

export interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'default';
}

export interface XMasterSettings {
  botSpeedProfile: string;
  speedFollow: number;
  speedUnfollow: number;
  speedLike: number;
  speedRT: number;
  speedScroll: number;
  speedPageLoad: number;
  speedTyping: number;
  speedCleanup: number;
  randomDelay: boolean;
  mouseSim: boolean;
  verifiedOnly: boolean;
  skipLikedUsers: boolean;
  maxTweetAge: number;
  skipChance: number;
  maxScrollRetries: number;
  keywordFilterEnabled: boolean;
  blacklistKeywords: string;
  whitelistKeywords: string;
  antiShadowbanEnabled: boolean;
  actionsBeforeBreak: number;
  breakDuration: number;
  rateLimitPerHour: number;
  smartScheduling: boolean;
}

export const defaultSettings: XMasterSettings = {
  botSpeedProfile: 'normal',
  speedFollow: 3,
  speedUnfollow: 2,
  speedLike: 2,
  speedRT: 3,
  speedScroll: 4,
  speedPageLoad: 5,
  speedTyping: 100,
  speedCleanup: 2,
  randomDelay: true,
  mouseSim: true,
  verifiedOnly: false,
  skipLikedUsers: false,
  maxTweetAge: 24,
  skipChance: 0,
  maxScrollRetries: 5,
  keywordFilterEnabled: false,
  blacklistKeywords: '',
  whitelistKeywords: '',
  antiShadowbanEnabled: false,
  actionsBeforeBreak: 20,
  breakDuration: 5,
  rateLimitPerHour: 100,
  smartScheduling: false,
};

export type PageId = 'home' | 'automation' | 'follow' | 'cleanup' | 'data' | 'advanced' | 'accounts' | 'campaigns' | 'scheduler' | 'analytics' | 'proxy';
