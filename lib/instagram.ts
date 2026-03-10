/**
 * Instagram Graph API utility functions
 *
 * Handles fetching user media, publishing content, and managing
 * Instagram Business/Creator account interactions.
 */

const GRAPH_API_BASE = "https://graph.instagram.com";
const GRAPH_API_VERSION = "v21.0";
const FACEBOOK_GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface InstagramMedia {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  timestamp: string;
  permalink: string;
}

export interface InstagramMediaResponse {
  data: InstagramMedia[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface InstagramUser {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
  media_count?: number;
}

/**
 * Fetch the authenticated user's Instagram profile
 */
export async function getInstagramProfile(accessToken: string): Promise<InstagramUser> {
  const response = await fetch(
    `${GRAPH_API_BASE}/me?fields=id,username,name,profile_picture_url,media_count&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch Instagram profile");
  }

  return response.json();
}

/**
 * Fetch the user's recent Instagram media (photos only, filtered)
 */
export async function getInstagramMedia(
  accessToken: string,
  limit: number = 20,
  after?: string
): Promise<InstagramMediaResponse> {
  let url = `${GRAPH_API_BASE}/me/media?fields=id,media_type,media_url,thumbnail_url,caption,timestamp,permalink&limit=${limit}&access_token=${accessToken}`;

  if (after) {
    url += `&after=${after}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch Instagram media");
  }

  const data: InstagramMediaResponse = await response.json();

  // Filter to only include images (not videos or carousels without images)
  data.data = data.data.filter(
    (item) => item.media_type === "IMAGE" || item.media_type === "CAROUSEL_ALBUM"
  );

  return data;
}

/**
 * Get the Instagram Business Account ID linked to a Facebook Page
 * (Required for Content Publishing API)
 */
export async function getInstagramBusinessAccountId(
  accessToken: string
): Promise<string | null> {
  // First get the user's Facebook Pages
  const pagesResponse = await fetch(
    `${FACEBOOK_GRAPH_BASE}/me/accounts?fields=id,instagram_business_account&access_token=${accessToken}`
  );

  if (!pagesResponse.ok) {
    return null;
  }

  const pagesData = await pagesResponse.json();

  // Find the first page with a linked Instagram Business Account
  for (const page of pagesData.data || []) {
    if (page.instagram_business_account?.id) {
      return page.instagram_business_account.id;
    }
  }

  return null;
}

/**
 * Publish a photo to Instagram (requires Business/Creator account linked to Facebook Page)
 *
 * Two-step process:
 * 1. Create a media container
 * 2. Publish the container
 */
export async function publishToInstagram(
  accessToken: string,
  igBusinessAccountId: string,
  imageUrl: string,
  caption: string
): Promise<{ id: string; permalink?: string }> {
  // Step 1: Create media container
  const containerResponse = await fetch(
    `${FACEBOOK_GRAPH_BASE}/${igBusinessAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    }
  );

  if (!containerResponse.ok) {
    const error = await containerResponse.json();
    throw new Error(error.error?.message || "Failed to create Instagram media container");
  }

  const container = await containerResponse.json();
  const containerId = container.id;

  // Step 2: Wait for container to be ready, then publish
  // The container may need time to process
  let retries = 0;
  const maxRetries = 10;

  while (retries < maxRetries) {
    const statusResponse = await fetch(
      `${FACEBOOK_GRAPH_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = await statusResponse.json();

    if (statusData.status_code === "FINISHED") {
      break;
    } else if (statusData.status_code === "ERROR") {
      throw new Error("Instagram media processing failed");
    }

    retries++;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  if (retries >= maxRetries) {
    throw new Error("Instagram media processing timed out");
  }

  // Step 3: Publish
  const publishResponse = await fetch(
    `${FACEBOOK_GRAPH_BASE}/${igBusinessAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );

  if (!publishResponse.ok) {
    const error = await publishResponse.json();
    throw new Error(error.error?.message || "Failed to publish to Instagram");
  }

  const published = await publishResponse.json();

  // Get the permalink of the published post
  const mediaResponse = await fetch(
    `${FACEBOOK_GRAPH_BASE}/${published.id}?fields=permalink&access_token=${accessToken}`
  );

  if (mediaResponse.ok) {
    const mediaData = await mediaResponse.json();
    return { id: published.id, permalink: mediaData.permalink };
  }

  return { id: published.id };
}
