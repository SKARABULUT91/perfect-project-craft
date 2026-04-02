import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TWITTER_API = "https://api.x.com/2";

function getCredentials() {
  const consumerKey = Deno.env.get("TWITTER_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("TWITTER_CONSUMER_SECRET");
  const accessToken = Deno.env.get("TWITTER_ACCESS_TOKEN");
  const accessTokenSecret = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET");
  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    throw new Error("Twitter API credentials not configured");
  }
  return { consumerKey, consumerSecret, accessToken, accessTokenSecret };
}

async function generateOAuthHeader(
  method: string,
  baseUrl: string,
  queryParams: Record<string, string> = {}
): Promise<string> {
  const { consumerKey, consumerSecret, accessToken, accessTokenSecret } = getCredentials();

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomUUID().replace(/-/g, "");

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  // For GET requests, include query params in signature. For POST with JSON body, do NOT.
  const signatureParams: Record<string, string> =
    method.toUpperCase() === "GET"
      ? { ...oauthParams, ...queryParams }
      : { ...oauthParams };

  const sortedKeys = Object.keys(signatureParams).sort();
  const paramString = sortedKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(signatureParams[k])}`)
    .join("&");

  const baseString = `${method.toUpperCase()}&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessTokenSecret)}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(baseString));
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));

  const authParams = { ...oauthParams, oauth_signature: signature };
  const header = Object.keys(authParams)
    .sort()
    .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(authParams[k])}"`)
    .join(", ");

  return `OAuth ${header}`;
}

async function twitterRequest(
  method: string,
  endpoint: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>
) {
  const baseUrl = `${TWITTER_API}${endpoint}`;
  let fullUrl = baseUrl;
  if (queryParams && Object.keys(queryParams).length > 0) {
    const qs = new URLSearchParams(queryParams).toString();
    fullUrl = `${baseUrl}?${qs}`;
  }

  const headers: Record<string, string> = {
    Authorization: await generateOAuthHeader(method, baseUrl, queryParams || {}),
    "Content-Type": "application/json",
  };

  const options: RequestInit = { method, headers };
  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  console.log(`Twitter API ${method} ${fullUrl}`);
  const response = await fetch(fullUrl, options);
  const data = await response.json();

  if (!response.ok) {
    console.error(`Twitter API error [${response.status}]:`, JSON.stringify(data));
    throw new Error(`Twitter API [${response.status}]: ${JSON.stringify(data)}`);
  }

  return data;
}

// Cache user ID to avoid repeated /users/me calls
let cachedUserId: string | null = null;

async function getMyUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const me = await twitterRequest("GET", "/users/me");
  cachedUserId = me.data.id;
  return cachedUserId;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    getCredentials(); // Validate early

    const { action, params } = await req.json();
    let result: unknown;

    switch (action) {
      case "verify_credentials": {
        result = await twitterRequest("GET", "/users/me", undefined, {
          "user.fields": "id,name,username,profile_image_url,public_metrics,verified",
        });
        break;
      }

      case "like": {
        const userId = await getMyUserId();
        result = await twitterRequest("POST", `/users/${userId}/likes`, {
          tweet_id: params.tweetId,
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
          tweet_id: params.tweetId,
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
        const target = await twitterRequest(
          "GET",
          `/users/by/username/${params.username.replace("@", "")}`,
          undefined,
          { "user.fields": "id" }
        );
        result = await twitterRequest("POST", `/users/${userId}/following`, {
          target_user_id: target.data.id,
        });
        break;
      }

      case "unfollow": {
        const userId = await getMyUserId();
        const targetU = await twitterRequest(
          "GET",
          `/users/by/username/${params.username.replace("@", "")}`,
          undefined,
          { "user.fields": "id" }
        );
        result = await twitterRequest("DELETE", `/users/${userId}/following/${targetU.data.id}`);
        break;
      }

      case "tweet": {
        const tweetBody: Record<string, unknown> = { text: params.text };
        if (params.replyToId) {
          tweetBody.reply = { in_reply_to_tweet_id: params.replyToId };
        }
        result = await twitterRequest("POST", "/tweets", tweetBody);
        break;
      }

      case "delete_tweet": {
        result = await twitterRequest("DELETE", `/tweets/${params.tweetId}`);
        break;
      }

      case "get_timeline": {
        const userId = await getMyUserId();
        result = await twitterRequest("GET", `/users/${userId}/tweets`, undefined, {
          max_results: Math.min(Math.max(params.count || 10, 5), 100).toString(),
          "tweet.fields": "created_at,public_metrics,text,author_id",
        });
        break;
      }

      case "get_home_timeline": {
        const userId = await getMyUserId();
        result = await twitterRequest(
          "GET",
          `/users/${userId}/timelines/reverse_chronological`,
          undefined,
          {
            max_results: Math.min(Math.max(params.count || 20, 1), 100).toString(),
            "tweet.fields": "created_at,public_metrics,author_id,text",
          }
        );
        break;
      }

      case "get_followers": {
        let targetId: string;
        if (params.username) {
          const u = await twitterRequest(
            "GET",
            `/users/by/username/${params.username.replace("@", "")}`,
            undefined,
            { "user.fields": "id" }
          );
          targetId = u.data.id;
        } else {
          targetId = await getMyUserId();
        }
        result = await twitterRequest("GET", `/users/${targetId}/followers`, undefined, {
          max_results: Math.min(Math.max(params.count || 100, 1), 1000).toString(),
          "user.fields": "username,name,public_metrics,verified,profile_image_url",
        });
        break;
      }

      case "get_following": {
        let targetId: string;
        if (params.username) {
          const u = await twitterRequest(
            "GET",
            `/users/by/username/${params.username.replace("@", "")}`,
            undefined,
            { "user.fields": "id" }
          );
          targetId = u.data.id;
        } else {
          targetId = await getMyUserId();
        }
        result = await twitterRequest("GET", `/users/${targetId}/following`, undefined, {
          max_results: Math.min(Math.max(params.count || 100, 1), 1000).toString(),
          "user.fields": "username,name,public_metrics,verified,profile_image_url",
        });
        break;
      }

      case "search_tweets": {
        result = await twitterRequest("GET", "/tweets/search/recent", undefined, {
          query: params.query,
          max_results: Math.min(Math.max(params.count || 10, 10), 100).toString(),
          "tweet.fields": "created_at,public_metrics,author_id,text",
          expansions: "author_id",
          "user.fields": "username,name,verified,profile_image_url",
        });
        break;
      }

      case "search_verified_users": {
        // Blue Tick Hunter - search for tweets from verified accounts
        const query = params.keyword
          ? `${params.keyword} filter:verified`
          : "filter:verified";
        result = await twitterRequest("GET", "/tweets/search/recent", undefined, {
          query,
          max_results: Math.min(Math.max(params.count || 20, 10), 100).toString(),
          "tweet.fields": "created_at,public_metrics,author_id,text",
          expansions: "author_id",
          "user.fields": "username,name,verified,public_metrics,profile_image_url",
        });
        break;
      }

      case "send_dm": {
        // Direct Message via Twitter API v2
        // First get target user ID
        const targetDm = await twitterRequest(
          "GET",
          `/users/by/username/${params.username.replace("@", "")}`,
          undefined,
          { "user.fields": "id" }
        );
        result = await twitterRequest("POST", "/dm_conversations/with/" + targetDm.data.id + "/messages", {
          text: params.text,
        });
        break;
      }

      case "get_user_by_username": {
        result = await twitterRequest(
          "GET",
          `/users/by/username/${params.username.replace("@", "")}`,
          undefined,
          { "user.fields": "id,name,username,public_metrics,verified,profile_image_url,description" }
        );
        break;
      }

      case "follow_by_id": {
        const userId = await getMyUserId();
        result = await twitterRequest("POST", `/users/${userId}/following`, {
          target_user_id: params.targetUserId,
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
