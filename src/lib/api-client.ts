/**
 * API Client - VPS'teki FastAPI backend'e bağlanır
 * Twikit + Playwright tabanlı otomasyon
 */

const getBackendUrl = (): string => {
  // localStorage'dan veya env'den al
  const saved = localStorage.getItem('xmaster-backend-url');
  if (saved) return saved.replace(/\/$/, '');
  return import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8000';
};

export const setBackendUrl = (url: string) => {
  localStorage.setItem('xmaster-backend-url', url.replace(/\/$/, ''));
};

export const getConfiguredBackendUrl = (): string => getBackendUrl();

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function apiCall<T = unknown>(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'POST',
  body?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const url = `${getBackendUrl()}${endpoint}`;
  try {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || data.detail || `HTTP ${res.status}` };
    }
    return { success: true, data: data as T, message: data.message };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Bağlantı hatası - Backend çalışıyor mu?' };
  }
}

// ===== Backend Status =====
export async function checkBackendStatus() {
  return apiCall<{ status: string }>('/health', 'GET');
}

// ===== Auth / Session =====
export async function loginAccount(username: string, password: string, twoFASecret?: string, proxy?: string, userAgent?: string) {
  return apiCall('/auth/login', 'POST', { username, password, two_fa_secret: twoFASecret, proxy, user_agent: userAgent });
}

export async function logoutAccount(username: string) {
  return apiCall('/auth/logout', 'POST', { username });
}

export async function checkSession(username: string) {
  return apiCall<{ logged_in: boolean; username: string }>('/auth/check-session', 'POST', { username });
}

export async function getAccountInfo(username: string) {
  return apiCall<{ name: string; username: string; followers_count: number; following_count: number; tweet_count: number; profile_image_url?: string }>('/auth/account-info', 'POST', { username });
}

// ===== Actions =====
export async function likeTweet(username: string, tweetId: string) {
  return apiCall('/actions/like', 'POST', { username, tweet_id: tweetId });
}

export async function unlikeTweet(username: string, tweetId: string) {
  return apiCall('/actions/unlike', 'POST', { username, tweet_id: tweetId });
}

export async function retweetTweet(username: string, tweetId: string) {
  return apiCall('/actions/retweet', 'POST', { username, tweet_id: tweetId });
}

export async function unretweetTweet(username: string, tweetId: string) {
  return apiCall('/actions/unretweet', 'POST', { username, tweet_id: tweetId });
}

export async function followUser(username: string, targetUsername: string) {
  return apiCall('/actions/follow', 'POST', { username, target_username: targetUsername });
}

export async function unfollowUser(username: string, targetUsername: string) {
  return apiCall('/actions/unfollow', 'POST', { username, target_username: targetUsername });
}

export async function postTweet(username: string, text: string, replyToId?: string) {
  return apiCall('/actions/tweet', 'POST', { username, text, reply_to_id: replyToId });
}

export async function deleteTweet(username: string, tweetId: string) {
  return apiCall('/actions/delete-tweet', 'POST', { username, tweet_id: tweetId });
}

export async function sendDM(username: string, targetUsername: string, text: string) {
  return apiCall('/actions/send-dm', 'POST', { username, target_username: targetUsername, text });
}

// ===== Data / Scraping =====
export async function getTimeline(username: string, count = 20) {
  return apiCall<{ tweets: TweetData[] }>('/data/timeline', 'POST', { username, count });
}

export async function getHomeTimeline(username: string, count = 20) {
  return apiCall<{ tweets: TweetData[] }>('/data/home-timeline', 'POST', { username, count });
}

export async function getFollowers(username: string, targetUsername?: string, count = 100) {
  return apiCall<{ users: UserData[] }>('/data/followers', 'POST', { username, target_username: targetUsername, count });
}

export async function getFollowing(username: string, targetUsername?: string, count = 100) {
  return apiCall<{ users: UserData[] }>('/data/following', 'POST', { username, target_username: targetUsername, count });
}

export async function searchTweets(username: string, query: string, count = 20) {
  return apiCall<{ tweets: TweetData[] }>('/data/search', 'POST', { username, query, count });
}

export async function searchVerifiedUsers(username: string, keyword: string, count = 20) {
  return apiCall<{ users: UserData[] }>('/data/search-verified', 'POST', { username, keyword, count });
}

// ===== View Boost =====
export async function boostViews(username: string, tweetUrl: string, viewCount: number) {
  return apiCall('/boost/views', 'POST', { username, tweet_url: tweetUrl, view_count: viewCount });
}

// ===== Proxy =====
export async function testProxy(address: string, port: string, type: string, proxyUsername?: string, proxyPassword?: string) {
  return apiCall<{ alive: boolean; latency_ms: number }>('/proxy/test', 'POST', { address, port, type, username: proxyUsername, password: proxyPassword });
}

// ===== Bulk Operations =====
export async function bulkFollow(username: string, targets: string[], delay: number, randomJitter: boolean) {
  return apiCall('/bulk/follow', 'POST', { username, targets, delay, random_jitter: randomJitter });
}

export async function bulkUnfollow(username: string, count: number, delay: number, mode: string) {
  return apiCall('/bulk/unfollow', 'POST', { username, count, delay, mode });
}

// ===== Types =====
export interface TweetData {
  id: string;
  text: string;
  created_at?: string;
  like_count?: number;
  retweet_count?: number;
  reply_count?: number;
  author_username?: string;
  author_name?: string;
}

export interface UserData {
  id: string;
  name: string;
  username: string;
  followers_count?: number;
  following_count?: number;
  profile_image_url?: string;
  verified?: boolean;
}
