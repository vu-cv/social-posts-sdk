# social-posts-sdk

TypeScript SDK for posting to social media platforms. Currently supports **Facebook Fanpage** and **Instagram Business/Creator**.

> 🇻🇳 [Xem hướng dẫn tiếng Việt](README.vi.md)

---

## Requirements

- Node.js >= 22
- Facebook App with Graph API access
- Page Access Token with the correct permissions

---

## Installation

```bash
npm install social-posts-sdk
```

---

## Quick Start

```ts
import { SocialPostsClient } from 'social-posts-sdk'

const client = new SocialPostsClient({
  facebook: {
    pageId: 'YOUR_PAGE_ID',
    accessToken: 'YOUR_PAGE_ACCESS_TOKEN',
  },
  instagram: {
    igUserId: 'YOUR_IG_USER_ID',
    accessToken: 'YOUR_ACCESS_TOKEN',
  },
})

// Post to Facebook
await client.facebook.postText({ message: 'Hello from the SDK!' })

// Post to Instagram
await client.instagram.postImage({
  imageUrl: 'https://example.com/photo.jpg',
  caption: 'Hello Instagram!',
})
```

---

## Getting Your Tokens

### Facebook Page Access Token

1. Go to [developers.facebook.com](https://developers.facebook.com) and create an App
2. Add the **Pages API** product to your app
3. Request the following permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
4. Use the [Graph API Explorer](https://developers.facebook.com/tools/explorer/) to generate a **Page Access Token**
5. Find your **Page ID**: go to your Facebook Page → About → Page transparency

### Instagram Access Token & User ID

1. Connect your Instagram account to a Facebook Page
2. Make sure the Instagram account is set to **Business** or **Creator**
3. Add the **Instagram Graph API** product to your Facebook App
4. Request additional permissions:
   - `instagram_basic`
   - `instagram_content_publish`
5. Get your Instagram User ID:
   ```bash
   # Step 1 — get the Page ID
   curl "https://graph.facebook.com/v22.0/me/accounts?access_token=TOKEN"

   # Step 2 — get the IG User ID from the Page
   curl "https://graph.facebook.com/v22.0/PAGE_ID?fields=instagram_business_account&access_token=TOKEN"
   ```

---

## Facebook API

### `postText(input)`

Post a text message to your Facebook Page.

```ts
const result = await client.facebook.postText({
  message: 'Hello World!',       // required
  link: 'https://example.com',   // optional — attaches a link preview
  published: true,               // optional — default: true
})
```

### `postPhoto(input)`

Post a single image to your Facebook Page.

```ts
const result = await client.facebook.postPhoto({
  imageUrl: 'https://example.com/photo.jpg',  // required — must be publicly accessible
  message: 'Check this out!',                 // optional
  published: true,                            // optional — default: true
})
```

### `postAlbum(input)`

Post a multi-photo album (2–10 images) to your Facebook Page.

```ts
const result = await client.facebook.postAlbum({
  imageUrls: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg',
  ],
  message: 'My photo album',  // optional
})
```

### `postVideo(input)`

Post a video to your Facebook Page.

```ts
const result = await client.facebook.postVideo({
  videoUrl: 'https://example.com/video.mp4',  // required — must be publicly accessible
  title: 'My video',                          // optional
  description: 'A short description',         // optional
  published: true,                            // optional — default: true
})
```

---

## Instagram API

> **Note:** All Instagram posts go through a two-step flow: create a media container → poll for processing → publish. This is handled automatically by the SDK.

### `postImage(input)`

Post a single image to Instagram.

```ts
const result = await client.instagram.postImage({
  imageUrl: 'https://example.com/photo.jpg',  // required — must be publicly accessible
  caption: 'My caption #hashtag',             // optional — max 2200 chars
  locationId: '123456789',                    // optional
  userTags: [                                 // optional
    { username: 'someone', x: 0.5, y: 0.5 },
  ],
})
```

### `postVideo(input)`

Post a video or Reel to Instagram.

```ts
const result = await client.instagram.postVideo({
  videoUrl: 'https://example.com/video.mp4',  // required
  caption: 'My Reel caption',                 // optional
  mediaType: 'REELS',                         // 'VIDEO' | 'REELS' — default: 'VIDEO'
  thumbOffset: 1000,                          // optional — thumbnail time in ms
})
```

### `postCarousel(input)`

Post a carousel of 2–10 images or videos to Instagram.

```ts
const result = await client.instagram.postCarousel({
  items: [
    { type: 'IMAGE', imageUrl: 'https://example.com/a.jpg' },
    { type: 'IMAGE', imageUrl: 'https://example.com/b.jpg' },
    { type: 'VIDEO', videoUrl: 'https://example.com/c.mp4' },
  ],
  caption: 'Carousel caption',  // optional
  locationId: '123456789',      // optional
})
```

---

## PostResult

All methods return a `PostResult` object:

```ts
interface PostResult {
  id: string        // The platform-assigned post ID
  platform: 'facebook' | 'instagram'
  createdAt: string // ISO 8601 timestamp
}
```

---

## Configuration Options

### `FacebookConfig`

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `pageId` | `string` | ✅ | — | Facebook Page ID |
| `accessToken` | `string` | ✅ | — | Page Access Token |
| `apiVersion` | `string` | — | `'v22.0'` | Graph API version |

### `InstagramConfig`

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `igUserId` | `string` | ✅ | — | Instagram Business/Creator User ID |
| `accessToken` | `string` | ✅ | — | Access Token |
| `apiVersion` | `string` | — | `'v22.0'` | Graph API version |
| `pollIntervalMs` | `number` | — | `3000` | Milliseconds between status polling attempts |
| `pollMaxAttempts` | `number` | — | `20` | Maximum polling attempts before giving up |

---

## Error Handling

```ts
import {
  SocialSDKError,
  AuthError,
  RateLimitError,
  ValidationError,
} from 'social-posts-sdk'

try {
  await client.facebook.postText({ message: 'Hello' })
} catch (err) {
  if (err instanceof ValidationError) {
    // Bad input — check err.issues[] for details
    console.error('Invalid input:', err.issues)
  } else if (err instanceof AuthError) {
    // Token is invalid or expired (Graph API codes 190, 102)
    console.error('Auth failed — refresh your access token')
  } else if (err instanceof RateLimitError) {
    // Rate limit hit (Graph API codes 613, 32, 4)
    console.error('Rate limited — back off and retry later')
  } else if (err instanceof SocialSDKError) {
    // Other Graph API error
    console.error(`Graph API error [${err.code}]:`, err.message)
  }
}
```

| Error class | When it's thrown |
|-------------|-----------------|
| `ValidationError` | Input fails Zod schema validation before any request is made |
| `AuthError` | Graph API returns error code 190, 102, or 2500 (invalid/expired token) |
| `RateLimitError` | Graph API returns error code 613, 32, 4, or 17 (rate limit) |
| `SocialSDKError` | Any other Graph API error — base class for all SDK errors |

---

## Cross-posting Example

Post to Facebook and Instagram at the same time:

```ts
const [fbResult, igResult] = await Promise.all([
  client.facebook.postPhoto({
    imageUrl: 'https://example.com/photo.jpg',
    message: 'Cross-posting!',
  }),
  client.instagram.postImage({
    imageUrl: 'https://example.com/photo.jpg',
    caption: 'Cross-posting!',
  }),
])
```

---

## Examples

See the [`examples/`](examples/) directory:

- [`examples/facebook.ts`](examples/facebook.ts) — All Facebook post types
- [`examples/instagram.ts`](examples/instagram.ts) — All Instagram post types
- [`examples/combined.ts`](examples/combined.ts) — Cross-posting to both platforms

Run an example:

```bash
FB_PAGE_ID=xxx FB_ACCESS_TOKEN=yyy npx tsx examples/facebook.ts
```

---

## License

MIT
