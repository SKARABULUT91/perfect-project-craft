import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TWITTER_API = "https://api.x.com/2";

async function generateOAuthHeader(
  method: string,
  url: string,
  params: Record<string, string> = {}
): Promise<string> {
  const consumerKey = Deno.env.get("TWITTER_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("TWITTER_CONSUMER_SECRET");
  const accessToken = Deno.env.get("TWITTER_ACCESS_TOKEN");
  const accessTokenSecret = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET");

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    throw new Error("Twitter API credentials not configured");
  }

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

  // For POST requests with JSON body, do NOT include body params in signature
  const allParams = { ...oauthParams, ...params };
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join("&");

  const baseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
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
  const signatureArray = Array.from(new Uint8Array(signatureBytes));
  const signature = btoa(String.fromCharCode(...signatureArray));

  const authParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

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
  let url = `${TWITTER_API}${endpoint}`;
  if (queryParams) {
    const qs = new URLSearchParams(queryParams).toString();
    url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    Authorization: await generateOAuthHeader(method, url.split("?")[0]),
    "Content-Type": "application/json",
  };

  const options: RequestInit = { method, headers };
  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Twitter API [${response.status}]: ${JSON.stringify(data)}`);
  }

  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Verify required env vars
    const requiredVars = [
      "TWITTER_CONSUMER_KEY",
      "TWITTER_CONSUMER_SECRET",
      "TWITTER_ACCESS_TOKEN",
      "TWITTER_ACCESS_TOKEN_SECRET",
    ];
    for (const v of requiredVars) {
      if (!Deno.env.get(v)) {
        throw new Error(`Missing environment variable: ${v}`);
      }
    }

    const { action, params } = await req.json();

    let result: unknown;

    switch (action) {
      // ===== Auth: Verify credentials =====
      case "verify_credentials": {
        result = await twitterRequest("GET", "/users/me", undefined, {
          "user.fields": "id,name,username,profile_image_url,public_metrics",
        });
        break;
      }

      // ===== Like a tweet =====
      case "like": {
        const meData = await twitterRequest("GET", "/users/me");
        const userId = meData.data.id;
        result = await twitterRequest("POST", `/users/${userId}/likes`, {
          tweet_id: params.tweetId,
        });
        break;
      }

      // ===== Unlike a tweet =====
      case "unlike": {
        const meUnlike = await twitterRequest("GET", "/users/me");
        result = await twitterRequest(
          "DELETE",
          `/users/${meUnlike.data.id}/likes/${params.tweetId}`
        );
        break;
      }

      // ===== Retweet =====
      case "retweet": {
        const meRt = await twitterRequest("GET", "/users/me");
        result = await twitterRequest("POST", `/users/${meRt.data.id}/retweets`, {
          tweet_id: params.tweetId,
        });
        break;
      }

      // ===== Unretweet =====
      case "unretweet": {
        const meUnrt = await twitterRequest("GET", "/users/me");
        result = await twitterRequest(
          "DELETE",
          `/users/${meUnrt.data.id}/retweets/${params.tweetId}`
        );
        break;
      }

      // ===== Follow a user =====
      case "follow": {
        const meFollow = await twitterRequest("GET", "/users/me");
        // Get target user ID from username
        const targetUser = await twitterRequest(
          "GET",
          `/users/by/username/${params.username.replace("@", "")}`
        );
        result = await twitterRequest(
          "POST",
          `/users/${meFollow.data.id}/following`,
          { target_user_id: targetUser.data.id }
        );
        break;
      }

      // ===== Unfollow a user =====
      case "unfollow": {
        const meUnfollow = await twitterRequest("GET", "/users/me");
        const targetUnfollow = await twitterRequest(
          "GET",
          `/users/by/username/${params.username.replace("@", "")}`
        );
        result = await twitterRequest(
          "DELETE",
          `/users/${meUnfollow.data.id}/following/${targetUnfollow.data.id}`
        );
        break;
      }

      // ===== Post a tweet / reply =====
      case "tweet": {
        const tweetBody: Record<string, unknown> = { text: params.text };
        if (params.replyToId) {
          tweetBody.reply = { in_reply_to_tweet_id: params.replyToId };
        }
        result = await twitterRequest("POST", "/tweets", tweetBody);
        break;
      }

      // ===== Delete a tweet =====
      case "delete_tweet": {
        result = await twitterRequest("DELETE", `/tweets/${params.tweetId}`);
        break;
      }

      // ===== Get user timeline =====
      case "get_timeline": {
        const meTimeline = await twitterRequest("GET", "/users/me");
        result = await twitterRequest(
          "GET",
          `/users/${meTimeline.data.id}/tweets`,
          undefined,
          {
            max_results: (params.count || 10).toString(),
            "tweet.fields": "created_at,public_metrics,text",
          }
        );
        break;
      }

      // ===== Get user's followers =====
      case "get_followers": {
        const targetFollowers = params.username
          ? await twitterRequest(
              "GET",
              `/users/by/username/${params.username.replace("@", "")}`
            )
          : await twitterRequest("GET", "/users/me");
        result = await twitterRequest(
          "GET",
          `/users/${targetFollowers.data.id}/followers`,
          undefined,
          {
            max_results: Math.min(params.count || 100, 1000).toString(),
            "user.fields": "username,name,public_metrics,verified",
          }
        );
        break;
      }

      // ===== Get user's following =====
      case "get_following": {
        const targetFollowing = params.username
          ? await twitterRequest(
              "GET",
              `/users/by/username/${params.username.replace("@", "")}`
            )
          : await twitterRequest("GET", "/users/me");
        result = await twitterRequest(
          "GET",
          `/users/${targetFollowing.data.id}/following`,
          undefined,
          {
            max_results: Math.min(params.count || 100, 1000).toString(),
            "user.fields": "username,name,public_metrics,verified",
          }
        );
        break;
      }

      // ===== Search tweets =====
      case "search_tweets": {
        result = await twitterRequest(
          "GET",
          "/tweets/search/recent",
          undefined,
          {
            query: params.query,
            max_results: Math.min(params.count || 10, 100).toString(),
            "tweet.fields": "created_at,public_metrics,author_id",
          }
        );
        break;
      }

      // ===== Get home timeline (reverse chronological) =====
      case "get_home_timeline": {
        const meHome = await twitterRequest("GET", "/users/me");
        result = await twitterRequest(
          "GET",
          `/users/${meHome.data.id}/reverse_chronological`,
          undefined,
          {
            max_results: Math.min(params.count || 20, 100).toString(),
            "tweet.fields": "created_at,public_metrics,author_id",
          }
        );
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error: unknown) {
    console.error("Twitter API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
