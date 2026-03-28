import { supabase } from "@/integrations/supabase/client";

interface TwitterApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function callTwitterApi<T = unknown>(
  action: string,
  params: Record<string, unknown> = {}
): Promise<TwitterApiResponse<T>> {
  const { data, error } = await supabase.functions.invoke("twitter-api", {
    body: { action, params },
  });

  if (error) {
    return { success: false, error: error.message || "Edge function error" };
  }

  return data as TwitterApiResponse<T>;
}

export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
  };
  verified?: boolean;
}

export interface TwitterTweet {
  id: string;
  text: string;
  created_at?: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
  author_id?: string;
}

// ===== Auth =====
export async function verifyCredentials() {
  return callTwitterApi<{ data: TwitterUser }>("verify_credentials");
}

// ===== Actions =====
export async function likeTweet(tweetId: string) {
  return callTwitterApi("like", { tweetId });
}

export async function unlikeTweet(tweetId: string) {
  return callTwitterApi("unlike", { tweetId });
}

export async function retweetTweet(tweetId: string) {
  return callTwitterApi("retweet", { tweetId });
}

export async function unretweetTweet(tweetId: string) {
  return callTwitterApi("unretweet", { tweetId });
}

export async function followUser(username: string) {
  return callTwitterApi("follow", { username });
}

export async function unfollowUser(username: string) {
  return callTwitterApi("unfollow", { username });
}

export async function postTweet(text: string, replyToId?: string) {
  return callTwitterApi("tweet", { text, replyToId });
}

export async function deleteTweet(tweetId: string) {
  return callTwitterApi("delete_tweet", { tweetId });
}

// ===== Data =====
export async function getTimeline(count = 10) {
  return callTwitterApi<{ data: TwitterTweet[] }>("get_timeline", { count });
}

export async function getFollowers(username?: string, count = 100) {
  return callTwitterApi<{ data: TwitterUser[] }>("get_followers", { username, count });
}

export async function getFollowing(username?: string, count = 100) {
  return callTwitterApi<{ data: TwitterUser[] }>("get_following", { username, count });
}

export async function searchTweets(query: string, count = 10) {
  return callTwitterApi<{ data: TwitterTweet[] }>("search_tweets", { query, count });
}

export async function getHomeTimeline(count = 20) {
  return callTwitterApi<{ data: TwitterTweet[] }>("get_home_timeline", { count });
}
