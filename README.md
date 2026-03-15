# social-posts-sdk

TypeScript SDK for posting to social media platforms.

> 🇻🇳 [Xem hướng dẫn tiếng Việt](README.vi.md)

## Supported Platforms

| Platform | Methods |
|----------|---------|
| **Facebook** (Fanpage) | `postText`, `postPhoto`, `postAlbum`, `postVideo` |
| **Instagram** (Business/Creator) | `postImage`, `postVideo`, `postCarousel` |
| **Threads** | `postText`, `postImage`, `postVideo`, `postCarousel` |
| **Twitter / X** | `postText`, `postImages`, `postVideo` |
| **LinkedIn** (Pages & Personal) | `postText`, `postImage`, `postVideo` |
| **TikTok** | `postVideo`, `postPhotos` |
| **YouTube** | `uploadVideo` |
| **Pinterest** | `createPin` |
| **Telegram** (Bot) | `sendMessage`, `sendPhoto`, `sendVideo`, `sendAlbum` |
| **Zalo** (Official Account) | `postFeed` |

---

## Requirements

- Node.js >= 22

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
  facebook:  { pageId: '...', accessToken: '...' },
  instagram: { igUserId: '...', accessToken: '...' },
  threads:   { userId: '...', accessToken: '...' },
  twitter:   { accessToken: '...' },
  linkedin:  { accessToken: '...' },
  tiktok:    { accessToken: '...' },
  youtube:   { accessToken: '...' },
  pinterest: { accessToken: '...' },
  telegram:  { botToken: '...' },
  zalo:      { accessToken: '...' },
})

// Post to multiple platforms in parallel
await Promise.all([
  client.facebook?.postText({ message: 'Hello!' }),
  client.instagram?.postImage({ imageUrl: 'https://...', caption: 'Hello!' }),
  client.threads?.postText({ text: 'Hello!' }),
  client.twitter?.postText({ text: 'Hello!' }),
  client.telegram?.sendMessage({ chatId: '@channel', text: 'Hello!' }),
])
```

All platforms are optional — only configure the ones you need.

---

## PostResult

Every method returns a `PostResult`:

```ts
interface PostResult {
  id: string        // platform-assigned post ID
  platform: string  // 'facebook' | 'instagram' | 'threads' | ...
  createdAt: string // ISO 8601
}
```

---

## Platform APIs

### Facebook

```ts
import { FacebookClient } from 'social-posts-sdk'

const fb = new FacebookClient({ pageId: 'PAGE_ID', accessToken: 'PAGE_TOKEN' })

await fb.postText({ message: 'Hello!', link?: 'https://...' })
await fb.postPhoto({ imageUrl: 'https://...', message?: '...' })
await fb.postAlbum({ imageUrls: ['https://...', 'https://...'], message?: '...' })
await fb.postVideo({ videoUrl: 'https://...', title?: '...', description?: '...' })
```

**Token:** Page Access Token with `pages_manage_posts` permission.

---

### Instagram

```ts
import { InstagramClient } from 'social-posts-sdk'

const ig = new InstagramClient({ igUserId: 'IG_USER_ID', accessToken: 'TOKEN' })

await ig.postImage({ imageUrl: 'https://...', caption?: '...', userTags?: [...] })
await ig.postVideo({ videoUrl: 'https://...', mediaType?: 'VIDEO' | 'REELS', caption?: '...' })
await ig.postCarousel({ items: [{ type: 'IMAGE', imageUrl: '...' }, ...], caption?: '...' })
```

**Token:** Page Access Token with `instagram_basic`, `instagram_content_publish`.
**Note:** Account must be connected to a Facebook Page and set to Business/Creator.

---

### Threads

```ts
import { ThreadsClient } from 'social-posts-sdk'

const threads = new ThreadsClient({ userId: 'USER_ID', accessToken: 'TOKEN' })

await threads.postText({ text: 'Hello!', replyToId?: '...' })
await threads.postImage({ imageUrl: 'https://...', text?: '...' })
await threads.postVideo({ videoUrl: 'https://...', text?: '...' })
await threads.postCarousel({ items: [...], text?: '...' })  // up to 20 items
```

**Token:** User Access Token with `threads_basic`, `threads_content_publish`.

---

### Twitter / X

```ts
import { TwitterClient } from 'social-posts-sdk'

const twitter = new TwitterClient({
  accessToken: 'OAUTH2_USER_TOKEN',
  // Required only for postImages / postVideo:
  oauth1: { consumerKey, consumerSecret, accessToken, accessTokenSecret },
})

await twitter.postText({ text: 'Hello!', replyToTweetId?: '...' })
await twitter.postImages({ imageUrls: ['https://...'], text?: '...' }) // up to 4 images
await twitter.postVideo({ videoUrl: 'https://...', text?: '...' })
```

**Token:** OAuth 2.0 user access token with `tweet.write`. Media uploads additionally require OAuth 1.0a credentials.

---

### LinkedIn

```ts
import { LinkedInClient } from 'social-posts-sdk'

const li = new LinkedInClient({ accessToken: 'OAUTH2_TOKEN' })

// authorUrn: "urn:li:organization:12345" or "urn:li:person:xxxx"
await li.postText({ text: '...', authorUrn: 'urn:li:organization:12345' })
await li.postImage({ imageUrl: 'https://...', text?: '...', authorUrn: '...' })
await li.postVideo({ videoUrl: 'https://...', text?: '...', authorUrn: '...' })
```

**Token:** OAuth 2.0 token with `w_member_social` (personal) or `w_organization_social` (pages).

---

### TikTok

```ts
import { TikTokClient } from 'social-posts-sdk'

const tiktok = new TikTokClient({ accessToken: 'TOKEN' })

await tiktok.postVideo({
  videoUrl: 'https://...',
  title?: '...',
  description?: '...',
  privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'SELF_ONLY', // default: SELF_ONLY
})
await tiktok.postPhotos({ photoUrls: ['https://...', 'https://...'], title?: '...' })
```

**Token:** OAuth 2.0 token with `video.publish` scope.
**Note:** Video URLs must be publicly accessible (SDK uses PULL_FROM_URL).

---

### YouTube

```ts
import { YouTubeClient } from 'social-posts-sdk'

const yt = new YouTubeClient({ accessToken: 'OAUTH2_TOKEN' })

await yt.uploadVideo({
  videoUrl: 'https://...',   // SDK downloads and streams to YouTube
  title: 'My Video',
  description?: '...',
  tags?: ['tag1', 'tag2'],
  categoryId?: '22',         // 22 = People & Blogs
  privacyStatus?: 'public' | 'private' | 'unlisted',
  madeForKids?: false,
})
```

**Token:** OAuth 2.0 token with `https://www.googleapis.com/auth/youtube.upload` scope.

---

### Pinterest

```ts
import { PinterestClient } from 'social-posts-sdk'

const pinterest = new PinterestClient({ accessToken: 'TOKEN' })

await pinterest.createPin({
  boardId: 'BOARD_ID',
  imageUrl: 'https://...',
  title?: '...',
  description?: '...',
  link?: 'https://...',
  altText?: '...',
  boardSectionId?: '...',
})
```

**Token:** OAuth 2.0 token with `pins:write`, `boards:read`.

---

### Telegram

```ts
import { TelegramClient } from 'social-posts-sdk'

const tg = new TelegramClient({ botToken: 'BOT_TOKEN' })

await tg.sendMessage({ chatId: '@channel', text: '<b>Hello!</b>', parseMode?: 'HTML' })
await tg.sendPhoto({ chatId: '@channel', photoUrl: 'https://...', caption?: '...' })
await tg.sendVideo({ chatId: '@channel', videoUrl: 'https://...', caption?: '...' })
await tg.sendAlbum({
  chatId: '@channel',
  media: [
    { type: 'photo', photoUrl: 'https://...' },
    { type: 'video', videoUrl: 'https://...' },
  ],
})
```

**Token:** Telegram Bot Token from [@BotFather](https://t.me/BotFather).

---

### Zalo

```ts
import { ZaloClient } from 'social-posts-sdk'

const zalo = new ZaloClient({ accessToken: 'OA_ACCESS_TOKEN' })

await zalo.postFeed({ message: 'Hello!', photoUrls?: ['https://...'] })
```

**Token:** OA Access Token from [Zalo Developers](https://developers.zalo.me).

---

## Reading Posts

Every platform that supports it exposes a typed `getPost` / `getTweet` / `getVideo` / `getPin` method returning a normalised `PostInfo`:

```ts
import type { PostInfo } from 'social-posts-sdk'

const info: PostInfo = await client.facebook!.getPost('post_id')
// info.id, info.platform, info.content, info.url, info.createdAt, info.metrics, info.raw

const tweet: PostInfo = await client.twitter!.getTweet('tweet_id')
const video: PostInfo = await client.youtube!.getVideo('video_id')
const pin:   PostInfo = await client.pinterest!.getPin('pin_id')
```

`PostInfo` shape:
```ts
interface PostInfo {
  id: string
  platform: string
  content: string | null      // message / caption / title
  url: string | null          // permalink
  createdAt: string | null    // ISO 8601
  metrics: {
    likes: number | null
    comments: number | null
    shares: number | null
    views: number | null
  }
  raw: unknown                // full API response
}
```

---

## Deleting & Updating Posts

```ts
// Delete
await client.facebook!.deletePost('post_id')
await client.instagram!.deletePost('media_id')
await client.threads!.deletePost('media_id')
await client.twitter!.deleteTweet('tweet_id')
await client.linkedin!.deletePost('urn:li:ugcPost:123')
await client.youtube!.deleteVideo('video_id')
await client.pinterest!.deletePin('pin_id')

// Update (platforms that support it)
await client.facebook!.updatePost('post_id', { message: 'New text' })
await client.youtube!.updateVideo('video_id', {
  title: 'New title',
  description: 'New description',
  tags: ['tag1'],
  categoryId: '22',
})
```

---

## Retry & Exponential Backoff

Pass `retry` config to any platform client to enable automatic retry on rate-limits and 5xx errors:

```ts
import { FacebookClient } from 'social-posts-sdk'
import type { RetryConfig } from 'social-posts-sdk'

const retry: RetryConfig = {
  maxAttempts: 5,       // default: 3
  initialDelayMs: 500,  // default: 1000
  maxDelayMs: 30_000,   // default: 30_000
  factor: 2,            // default: 2 (exponential)
}

const fb = new FacebookClient({
  pageId: 'PAGE_ID',
  accessToken: 'TOKEN',
  retry,
})
```

Retry behaviour:
- **Retried**: `RateLimitError`, network errors, 5xx `SocialSDKError`
- **Not retried**: `AuthError`, `ValidationError`, 4xx errors

---

## Token Refresh

```ts
import {
  refreshMetaToken,     // Facebook / Instagram / Threads
  refreshTwitterToken,
  refreshLinkedInToken,
  refreshGoogleToken,   // YouTube
  refreshTikTokToken,
  refreshPinterestToken,
} from 'social-posts-sdk'

// Exchange short-lived Meta token for a 60-day long-lived token
const { access_token } = await refreshMetaToken({
  clientId: 'APP_ID',
  clientSecret: 'APP_SECRET',
  shortLivedToken: 'SHORT_TOKEN',
})

// Refresh Twitter OAuth 2.0 token
const tokens = await refreshTwitterToken({
  clientId: 'CLIENT_ID',
  clientSecret: 'CLIENT_SECRET',
  refreshToken: 'REFRESH_TOKEN',
})
```

---

## OAuth Flow

Generate auth URLs and exchange authorization codes for tokens:

```ts
import {
  getMetaAuthUrl, exchangeMetaCode,
  getTwitterAuthUrl, exchangeTwitterCode,
  getLinkedInAuthUrl, exchangeLinkedInCode,
  getGoogleAuthUrl, exchangeGoogleCode,
  getTikTokAuthUrl, exchangeTikTokCode,
  getPinterestAuthUrl, exchangePinterestCode,
  getZaloAuthUrl, exchangeZaloCode,
} from 'social-posts-sdk'

// Step 1: Redirect user
const url = getMetaAuthUrl({
  clientId: 'APP_ID',
  redirectUri: 'https://yourapp.com/callback',
  scopes: ['pages_manage_posts', 'instagram_content_publish'],
  state: 'csrf_token',
})

// Step 2: Exchange code from callback
const { access_token } = await exchangeMetaCode({
  clientId: 'APP_ID',
  clientSecret: 'APP_SECRET',
  redirectUri: 'https://yourapp.com/callback',
  code: req.query.code,
})

// Twitter uses PKCE — store codeVerifier between steps
const { url: twUrl, codeVerifier } = await getTwitterAuthUrl({
  clientId: 'CLIENT_ID',
  redirectUri: 'https://yourapp.com/tw/callback',
  scopes: ['tweet.read', 'tweet.write', 'offline.access'],
  state: 'csrf_token',
})

const twTokens = await exchangeTwitterCode({
  clientId: 'CLIENT_ID',
  clientSecret: 'CLIENT_SECRET',
  redirectUri: 'https://yourapp.com/tw/callback',
  code: req.query.code,
  codeVerifier,   // from step 1
})
```

---

## Error Handling

```ts
import { SocialSDKError, AuthError, RateLimitError, ValidationError } from 'social-posts-sdk'

try {
  await client.facebook?.postText({ message: 'Hello' })
} catch (err) {
  if (err instanceof ValidationError) {
    console.error('Bad input:', err.issues)
  } else if (err instanceof AuthError) {
    console.error('Token invalid or expired')
  } else if (err instanceof RateLimitError) {
    console.error('Rate limit hit — back off and retry')
  } else if (err instanceof SocialSDKError) {
    console.error(`[${err.platform}] error ${err.code}:`, err.message)
  }
}
```

---

## Configuration Reference

### Facebook
| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `pageId` | ✅ | — | Facebook Page ID |
| `accessToken` | ✅ | — | Page Access Token |
| `apiVersion` | — | `v22.0` | Graph API version |

### Instagram / Threads
| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `igUserId` / `userId` | ✅ | — | User ID |
| `accessToken` | ✅ | — | Access Token |
| `apiVersion` | — | `v22.0` | Graph API version |
| `pollIntervalMs` | — | `3000` | Status poll interval (ms) |
| `pollMaxAttempts` | — | `20` | Max poll attempts |

### TikTok
| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `accessToken` | ✅ | — | OAuth 2.0 Access Token |
| `pollIntervalMs` | — | `5000` | Status poll interval (ms) |
| `pollMaxAttempts` | — | `24` | Max poll attempts |

---

## Examples

See [`examples/`](examples/):

| File | Platform |
|------|---------|
| [`examples/facebook.ts`](examples/facebook.ts) | Facebook |
| [`examples/instagram.ts`](examples/instagram.ts) | Instagram |
| [`examples/threads.ts`](examples/threads.ts) | Threads |
| [`examples/twitter.ts`](examples/twitter.ts) | Twitter / X |
| [`examples/linkedin.ts`](examples/linkedin.ts) | LinkedIn |
| [`examples/tiktok.ts`](examples/tiktok.ts) | TikTok |
| [`examples/youtube.ts`](examples/youtube.ts) | YouTube |
| [`examples/pinterest.ts`](examples/pinterest.ts) | Pinterest |
| [`examples/telegram.ts`](examples/telegram.ts) | Telegram |
| [`examples/zalo.ts`](examples/zalo.ts) | Zalo |
| [`examples/combined.ts`](examples/combined.ts) | Facebook + Instagram cross-post |

Run an example:
```bash
FB_PAGE_ID=xxx FB_ACCESS_TOKEN=yyy npx tsx examples/facebook.ts
TELEGRAM_BOT_TOKEN=xxx TELEGRAM_CHAT_ID=@chan npx tsx examples/telegram.ts
```

---

## License

MIT
