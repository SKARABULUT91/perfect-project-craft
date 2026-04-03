import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type QueryParams = Record<string, string>;
type ApiVersion = "v1" | "v2";

interface TwitterActionPayload {
  action?: string;
  params?: Record<string, unknown>;
}

interface TwitterVerifyCredentialsResponse {
  id?: string | number;
  id_str?: string;
  name?: string;
  screen_name?: string;
  description?: string;
  profile_image_url_https?: string;
  verified?: boolean;
  followers_count?: number;
  friends_count?: number;
  statuses_count?: number;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TWITTER_API_V1 = "https://api.x.com/1.1";
const TWITTER_API_V2 = "https://api.x.com/2";

class TwitterApiError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, details: unknown) {
    const message = typeof details === "string" ? details : JSON.stringify(details);
    super(`Twitter API [${status}]: ${message}`);
    this.name = "TwitterApiError";
    this.status = status;
    this.details = details;
  }
}

function getCredentials() {
  const consumerKey = Deno.env.get("TWITTER_CONSUMER_KEY")?.trim();
  const consumerSecret = Deno.env.get("TWITTER_CONSUMER_SECRET")?.trim();
  const accessToken = Deno.env.get("TWITTER_ACCESS_TOKEN")?.trim();
  const accessTokenSecret = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET")?.trim();

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    throw new Error(
      "Twitter API credentials not configured. Please set TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET"
    );
  }

  return { consumerKey, consumerSecret, accessToken, accessTokenSecret };
}

function oauthEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function buildQueryString(queryParams: QueryParams = {}): string {
  return Object.entries(queryParams)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${oauthEncode(key)}=${oauthEncode(value)}`)
    .join("&");
}

function parseResponseBody(rawText: string): unknown {
  if (!rawText) return null;

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

function mapVerifiedUser(user: TwitterVerifyCredentialsResponse) {
  return {
    id: String(user.id_str ?? user.id ?? ""),
    name: user.name ?? "",
    username: user.screen_name ?? "",
    description: user.description,
    profile_image_url: user.profile_image_url_https,
    verified: Boolean(user.verified),
    public_metrics: {
      followers_count: user.followers_count ?? 0,
      following_count: user.friends_count ?? 0,
      tweet_count: user.statuses_count ?? 0,
    },
  };
}

async function generateOAuthHeader(
  method: string,
  baseUrl: string,
  queryParams: QueryParams = {}
): Promise<string> {
  const { consumerKey, consumerSecret, accessToken, accessTokenSecret } = getCredentials();

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID().replace(/-/g, "");

  const oauthParams: QueryParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const signatureParams: QueryParams =
    method.toUpperCase() === "GET" ? { ...oauthParams, ...queryParams } : { ...oauthParams };

  const normalizedParams = Object.entries(signatureParams)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [oauthEncode(key), oauthEncode(value)] as const)
    .sort(([aKey, aValue], [bKey, bValue]) => aKey.localeCompare(bKey) || aValue.localeCompare(bValue))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const baseString = [method.toUpperCase(), oauthEncode(baseUrl), oauthEncode(normalizedParams)].join("&");
  const signingKey = `${oauthEncode(consumerSecret)}&${oauthEncode(accessTokenSecret)}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(baseString));
  const byteArray = new Uint8Array(signatureBytes);

  let binary = "";
  for (let i = 0; i < byteArray.length; i++) {
    binary += String.fromCharCode(byteArray[i]);
  }
  const signature = btoa(binary);

  const authParams = { ...oauthParams, oauth_signature: signature };
  const header = Object.entries(authParams)
    .map(([key, value]) => [oauthEncode(key), oauthEncode(value)] as const)
    .sort(([aKey, aValue], [bKey, bValue]) => aKey.localeCompare(bKey) || aValue.localeCompare(bValue))
    .map(([key, value]) => `${key}="${value}"`)
    .join(", ");

  return `OAuth ${header}`;
}

async function twitterRequest(
  method: string,
  endpoint: string,
  options: {
    body?: Record<string, unknown>;
    queryParams?: QueryParams;
    apiVersion?: ApiVersion;
  } = {}
) {
  const { body, queryParams = {}, apiVersion = "v2" } = options;
  const apiBase = apiVersion === "v1" ? TWITTER_API_V1 : TWITTER_API_V2;
  const baseUrl = `${apiBase}${endpoint}`;
  const queryString = buildQueryString(queryParams);
  const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
  const upperMethod = method.toUpperCase();

  const headers: Record<string, string> = {
    Authorization: await generateOAuthHeader(upperMethod, baseUrl, queryParams),
  };

  if (body && upperMethod !== "GET" && upperMethod !== "DELETE") {
    headers["Content-Type"] = "application/json";
  }

  const requestOptions: RequestInit = {
    method: upperMethod,
    headers,
  };

  if (body && upperMethod !== "GET" && upperMethod !== "DELETE") {
    requestOptions.body = JSON.stringify(body);
  }

  console.log(`Twitter API ${upperMethod} ${fullUrl}`);
  const response = await fetch(fullUrl, requestOptions);
  const rawText = await response.text();
  const data = parseResponseBody(rawText);

  if (!response.ok) {
    console.error(`Twitter API error [${response.status}]:`, typeof data === "string" ? data : JSON.stringify(data));
    throw new TwitterApiError(response.status, data);
  }

  return data;
}

let cachedUserId: string | null = null;

async function getVerifiedAccount(): Promise<TwitterVerifyCredentialsResponse> {
  return (await twitterRequest("GET", "/account/verify_credentials.json", {
    apiVersion: "v1",
    queryParams: {
      include_entities: "false",
      skip_status: "true",
    },
  })) as TwitterVerifyCredentialsResponse;
}

async function getMyUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  const me = await getVerifiedAccount();
  cachedUserId = String(me.id_str ?? me.id ?? "");

  if (!cachedUserId) {
    throw new Error("Could not resolve authenticated Twitter user ID.");
  }

  return cachedUserId;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    getCredentials();

    let payload: TwitterActionPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Invalid JSON body." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const action = payload.action;
    const params = payload.params ?? {};

    if (!action) {
      return new Response(JSON.stringify({ success: false, error: "Missing action." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: unknown;

    switch (action) {
      case "verify_credentials":
      case "verify_credentials_full": {
        const verifiedUser = await getVerifiedAccount();
        result = {
          data: mapVerifiedUser(verifiedUser),
          ...(action === "verify_credentials_full" ? { raw: verifiedUser } : {}),
        };
        break;
      }

      case "like": {
        const userId = await getMyUserId();
        result = await twitterRequest("POST", `/users/${userId}/likes`, {
          body: { tweet_id: params.tweetId },
        });
        break;
      }

      case "unlike": {
        const userId = await getMyUserId();
        result = await twitterRequest("DELETE", `/users/${userId}/likes/${params.tweetId}`);
        break;
      }

      case "retweet": {
        const userId = await getMyUserId();
        result = await twitterRequest("POST", `/users/${userId}/retweets`, {
          body: { tweet_id: params.tweetId },
        });
        break;
      }

      case "unretweet": {
        const userId = await getMyUserId();
        result = await twitterRequest("DELETE", `/users/${userId}/retweets/${params.tweetId}`);
        break;
      }

      case "follow": {
        const userId = await getMyUserId();
        const username = String(params.username ?? "").replace("@", "");
        const target = await twitterRequest("GET", `/users/by/username/${username}`, {
          queryParams: { "user.fields": "id" },
        });
        result = await twitterRequest("POST", `/users/${userId}/following`, {
          body: { target_user_id: (target as { data: { id: string } }).data.id },
        });
        break;
      }

      case "unfollow": {
        const userId = await getMyUserId();
        const username = String(params.username ?? "").replace("@", "");
        const target = await twitterRequest("GET", `/users/by/username/${username}`, {
          queryParams: { "user.fields": "id" },
        });
        result = await twitterRequest("DELETE", `/users/${userId}/following/${(target as { data: { id: string } }).data.id}`);
        break;
      }

      case "tweet": {
        const tweetBody: Record<string, unknown> = { text: params.text };
        if (params.replyToId) {
          tweetBody.reply = { in_reply_to_tweet_id: params.replyToId };
        }
        result = await twitterRequest("POST", "/tweets", { body: tweetBody });
        break;
      }

      case "delete_tweet": {
        result = await twitterRequest("DELETE", `/tweets/${params.tweetId}`);
        break;
      }

      case "get_timeline": {
        const userId = await getMyUserId();
        result = await twitterRequest("GET", `/users/${userId}/tweets`, {
          queryParams: {
            max_results: Math.min(Math.max(Number(params.count) || 10, 5), 100).toString(),
            "tweet.fields": "created_at,public_metrics,text,author_id",
          },
        });
        break;
      }

      case "get_home_timeline": {
        const userId = await getMyUserId();
        result = await twitterRequest("GET", `/users/${userId}/timelines/reverse_chronological`, {
          queryParams: {
            max_results: Math.min(Math.max(Number(params.count) || 20, 1), 100).toString(),
            "tweet.fields": "created_at,public_metrics,author_id,text",
          },
        });
        break;
      }

      case "get_followers": {
        let targetId: string;
        if (params.username) {
          const username = String(params.username).replace("@", "");
          const user = await twitterRequest("GET", `/users/by/username/${username}`, {
            queryParams: { "user.fields": "id" },
          });
          targetId = (user as { data: { id: string } }).data.id;
        } else {
          targetId = await getMyUserId();
        }
        result = await twitterRequest("GET", `/users/${targetId}/followers`, {
          queryParams: {
            max_results: Math.min(Math.max(Number(params.count) || 100, 1), 1000).toString(),
            "user.fields": "username,name,public_metrics,verified,profile_image_url",
          },
        });
        break;
      }

      case "get_following": {
        let targetId: string;
        if (params.username) {
          const username = String(params.username).replace("@", "");
          const user = await twitterRequest("GET", `/users/by/username/${username}`, {
            queryParams: { "user.fields": "id" },
          });
          targetId = (user as { data: { id: string } }).data.id;
        } else {
          targetId = await getMyUserId();
        }
        result = await twitterRequest("GET", `/users/${targetId}/following`, {
          queryParams: {
            max_results: Math.min(Math.max(Number(params.count) || 100, 1), 1000).toString(),
            "user.fields": "username,name,public_metrics,verified,profile_image_url",
          },
        });
        break;
      }

      case "search_tweets": {
        result = await twitterRequest("GET", "/tweets/search/recent", {
          queryParams: {
            query: String(params.query ?? ""),
            max_results: Math.min(Math.max(Number(params.count) || 10, 10), 100).toString(),
            "tweet.fields": "created_at,public_metrics,author_id,text",
            expansions: "author_id",
            "user.fields": "username,name,verified,profile_image_url",
          },
        });
        break;
      }

      case "search_verified_users": {
        const keyword = String(params.keyword ?? "").trim();
        const query = keyword ? `${keyword} filter:verified` : "filter:verified";
        result = await twitterRequest("GET", "/tweets/search/recent", {
          queryParams: {
            query,
            max_results: Math.min(Math.max(Number(params.count) || 20, 10), 100).toString(),
            "tweet.fields": "created_at,public_metrics,author_id,text",
            expansions: "author_id",
            "user.fields": "username,name,verified,public_metrics,profile_image_url",
          },
        });
        break;
      }

      case "send_dm": {
        const username = String(params.username ?? "").replace("@", "");
        const target = await twitterRequest("GET", `/users/by/username/${username}`, {
          queryParams: { "user.fields": "id" },
        });
        result = await twitterRequest("POST", `/dm_conversations/with/${(target as { data: { id: string } }).data.id}/messages`, {
          body: { text: params.text },
        });
        break;
      }

      case "get_user_by_username": {
        const username = String(params.username ?? "").replace("@", "");
        result = await twitterRequest("GET", `/users/by/username/${username}`, {
          queryParams: {
            "user.fields": "id,name,username,public_metrics,verified,profile_image_url,description",
          },
        });
        break;
      }

      case "follow_by_id": {
        const userId = await getMyUserId();
        result = await twitterRequest("POST", `/users/${userId}/following`, {
          body: { target_user_id: params.targetUserId },
        });
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Twitter API error:", error);

    if (error instanceof TwitterApiError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          details: error.details,
        }),
        {
          status: error.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
