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
};

export type PageId = 'home' | 'automation' | 'follow' | 'cleanup' | 'data' | 'advanced';
