# social-posts-sdk

TypeScript SDK để đăng bài lên mạng xã hội.

> 🇬🇧 [View English documentation](README.md)

## Nền tảng hỗ trợ

| Nền tảng | Các method |
|----------|-----------|
| **Facebook** (Fanpage) | `postText`, `postPhoto`, `postAlbum`, `postVideo` |
| **Instagram** (Business/Creator) | `postImage`, `postVideo`, `postCarousel` |
| **Threads** | `postText`, `postImage`, `postVideo`, `postCarousel` |
| **Twitter / X** | `postText`, `postImages`, `postVideo` |
| **LinkedIn** (Trang & Cá nhân) | `postText`, `postImage`, `postVideo` |
| **TikTok** | `postVideo`, `postPhotos` |
| **YouTube** | `uploadVideo` |
| **Pinterest** | `createPin` |
| **Telegram** (Bot) | `sendMessage`, `sendPhoto`, `sendVideo`, `sendAlbum` |
| **Zalo** (Official Account) | `postFeed` |

---

## Yêu cầu

- Node.js >= 22

---

## Cài đặt

```bash
npm install social-posts-sdk
```

---

## Bắt đầu nhanh

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

// Đăng lên nhiều nền tảng cùng lúc
await Promise.all([
  client.facebook?.postText({ message: 'Xin chào!' }),
  client.instagram?.postImage({ imageUrl: 'https://...', caption: 'Xin chào!' }),
  client.threads?.postText({ text: 'Xin chào!' }),
  client.twitter?.postText({ text: 'Hello!' }),
  client.telegram?.sendMessage({ chatId: '@kenh', text: 'Xin chào!' }),
])
```

Tất cả nền tảng đều là tuỳ chọn — chỉ cấu hình những nền tảng bạn cần.

---

## Kết quả trả về (PostResult)

Mọi method đều trả về `PostResult`:

```ts
interface PostResult {
  id: string        // ID bài đăng do nền tảng cấp
  platform: string  // 'facebook' | 'instagram' | 'threads' | ...
  createdAt: string // ISO 8601
}
```

---

## API từng nền tảng

### Facebook

```ts
import { FacebookClient } from 'social-posts-sdk'

const fb = new FacebookClient({ pageId: 'PAGE_ID', accessToken: 'PAGE_TOKEN' })

await fb.postText({ message: 'Xin chào!', link?: 'https://...' })
await fb.postPhoto({ imageUrl: 'https://...', message?: '...' })
await fb.postAlbum({ imageUrls: ['https://...', 'https://...'], message?: '...' })
await fb.postVideo({ videoUrl: 'https://...', title?: '...', description?: '...' })
```

**Token:** Page Access Token với quyền `pages_manage_posts`.

---

### Instagram

```ts
import { InstagramClient } from 'social-posts-sdk'

const ig = new InstagramClient({ igUserId: 'IG_USER_ID', accessToken: 'TOKEN' })

await ig.postImage({ imageUrl: 'https://...', caption?: '...', userTags?: [...] })
await ig.postVideo({ videoUrl: 'https://...', mediaType?: 'VIDEO' | 'REELS', caption?: '...' })
await ig.postCarousel({ items: [{ type: 'IMAGE', imageUrl: '...' }, ...], caption?: '...' })
```

**Token:** Page Access Token với `instagram_basic`, `instagram_content_publish`.
**Lưu ý:** Tài khoản phải kết nối với Facebook Page và chuyển sang loại Business/Creator.

---

### Threads

```ts
import { ThreadsClient } from 'social-posts-sdk'

const threads = new ThreadsClient({ userId: 'USER_ID', accessToken: 'TOKEN' })

await threads.postText({ text: 'Xin chào!', replyToId?: '...' })
await threads.postImage({ imageUrl: 'https://...', text?: '...' })
await threads.postVideo({ videoUrl: 'https://...', text?: '...' })
await threads.postCarousel({ items: [...], text?: '...' })  // tối đa 20 items
```

**Token:** User Access Token với `threads_basic`, `threads_content_publish`.

---

### Twitter / X

```ts
import { TwitterClient } from 'social-posts-sdk'

const twitter = new TwitterClient({
  accessToken: 'OAUTH2_USER_TOKEN',
  // Bắt buộc khi dùng postImages / postVideo:
  oauth1: { consumerKey, consumerSecret, accessToken, accessTokenSecret },
})

await twitter.postText({ text: 'Hello!', replyToTweetId?: '...' })
await twitter.postImages({ imageUrls: ['https://...'], text?: '...' }) // tối đa 4 ảnh
await twitter.postVideo({ videoUrl: 'https://...', text?: '...' })
```

**Token:** OAuth 2.0 user access token với `tweet.write`. Upload media cần thêm OAuth 1.0a.

---

### LinkedIn

```ts
import { LinkedInClient } from 'social-posts-sdk'

const li = new LinkedInClient({ accessToken: 'OAUTH2_TOKEN' })

// authorUrn: "urn:li:organization:12345" hoặc "urn:li:person:xxxx"
await li.postText({ text: '...', authorUrn: 'urn:li:organization:12345' })
await li.postImage({ imageUrl: 'https://...', text?: '...', authorUrn: '...' })
await li.postVideo({ videoUrl: 'https://...', text?: '...', authorUrn: '...' })
```

**Token:** OAuth 2.0 với `w_member_social` (cá nhân) hoặc `w_organization_social` (trang công ty).

---

### TikTok

```ts
import { TikTokClient } from 'social-posts-sdk'

const tiktok = new TikTokClient({ accessToken: 'TOKEN' })

await tiktok.postVideo({
  videoUrl: 'https://...',
  title?: '...',
  description?: '...',
  privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'SELF_ONLY', // mặc định: SELF_ONLY
})
await tiktok.postPhotos({ photoUrls: ['https://...', 'https://...'], title?: '...' })
```

**Token:** OAuth 2.0 với scope `video.publish`.
**Lưu ý:** URL video/ảnh phải công khai (SDK dùng PULL_FROM_URL).

---

### YouTube

```ts
import { YouTubeClient } from 'social-posts-sdk'

const yt = new YouTubeClient({ accessToken: 'OAUTH2_TOKEN' })

await yt.uploadVideo({
  videoUrl: 'https://...',   // SDK tải về và stream lên YouTube
  title: 'Tiêu đề video',
  description?: '...',
  tags?: ['tag1', 'tag2'],
  categoryId?: '22',          // 22 = People & Blogs
  privacyStatus?: 'public' | 'private' | 'unlisted',
  madeForKids?: false,
})
```

**Token:** OAuth 2.0 với scope `https://www.googleapis.com/auth/youtube.upload`.

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

**Token:** OAuth 2.0 với `pins:write`, `boards:read`.

---

### Telegram

```ts
import { TelegramClient } from 'social-posts-sdk'

const tg = new TelegramClient({ botToken: 'BOT_TOKEN' })

await tg.sendMessage({ chatId: '@kenh', text: '<b>Xin chào!</b>', parseMode?: 'HTML' })
await tg.sendPhoto({ chatId: '@kenh', photoUrl: 'https://...', caption?: '...' })
await tg.sendVideo({ chatId: '@kenh', videoUrl: 'https://...', caption?: '...' })
await tg.sendAlbum({
  chatId: '@kenh',
  media: [
    { type: 'photo', photoUrl: 'https://...' },
    { type: 'video', videoUrl: 'https://...' },
  ],
})
```

**Token:** Bot Token từ [@BotFather](https://t.me/BotFather).

---

### Zalo

```ts
import { ZaloClient } from 'social-posts-sdk'

const zalo = new ZaloClient({ accessToken: 'OA_ACCESS_TOKEN' })

await zalo.postFeed({ message: 'Xin chào!', photoUrls?: ['https://...'] })
```

**Token:** OA Access Token từ [Zalo Developers](https://developers.zalo.me).

---

## Đọc bài đăng

```ts
import type { PostInfo } from 'social-posts-sdk'

const info: PostInfo = await client.facebook!.getPost('post_id')
// info.id, info.platform, info.content, info.url, info.createdAt, info.metrics, info.raw

const tweet: PostInfo = await client.twitter!.getTweet('tweet_id')
const video: PostInfo = await client.youtube!.getVideo('video_id')
const pin:   PostInfo = await client.pinterest!.getPin('pin_id')
```

Cấu trúc `PostInfo`:
```ts
interface PostInfo {
  id: string
  platform: string
  content: string | null      // nội dung / caption / tiêu đề
  url: string | null          // đường link trực tiếp
  createdAt: string | null    // ISO 8601
  metrics: {
    likes: number | null
    comments: number | null
    shares: number | null
    views: number | null
  }
  raw: unknown                // dữ liệu gốc từ API
}
```

---

## Xoá & Cập nhật bài đăng

```ts
// Xoá
await client.facebook!.deletePost('post_id')
await client.instagram!.deletePost('media_id')
await client.threads!.deletePost('media_id')
await client.twitter!.deleteTweet('tweet_id')
await client.linkedin!.deletePost('urn:li:ugcPost:123')
await client.youtube!.deleteVideo('video_id')
await client.pinterest!.deletePin('pin_id')

// Cập nhật (các nền tảng hỗ trợ)
await client.facebook!.updatePost('post_id', { message: 'Nội dung mới' })
await client.youtube!.updateVideo('video_id', {
  title: 'Tiêu đề mới',
  description: 'Mô tả mới',
  tags: ['tag1'],
  categoryId: '22',
})
```

---

## Retry & Exponential Backoff

Truyền cấu hình `retry` vào bất kỳ platform client nào để tự động thử lại khi gặp rate-limit hoặc lỗi 5xx:

```ts
import { FacebookClient } from 'social-posts-sdk'
import type { RetryConfig } from 'social-posts-sdk'

const retry: RetryConfig = {
  maxAttempts: 5,       // mặc định: 3
  initialDelayMs: 500,  // mặc định: 1000
  maxDelayMs: 30_000,   // mặc định: 30_000
  factor: 2,            // mặc định: 2 (tăng theo cấp số nhân)
}

const fb = new FacebookClient({
  pageId: 'PAGE_ID',
  accessToken: 'TOKEN',
  retry,
})
```

Quy tắc retry:
- **Có retry**: `RateLimitError`, lỗi mạng, `SocialSDKError` 5xx
- **Không retry**: `AuthError`, `ValidationError`, lỗi 4xx

---

## Làm mới Token

```ts
import {
  refreshMetaToken,     // Facebook / Instagram / Threads
  refreshTwitterToken,
  refreshLinkedInToken,
  refreshGoogleToken,   // YouTube
  refreshTikTokToken,
  refreshPinterestToken,
} from 'social-posts-sdk'

// Đổi short-lived Meta token lấy long-lived token (60 ngày)
const { access_token } = await refreshMetaToken({
  clientId: 'APP_ID',
  clientSecret: 'APP_SECRET',
  shortLivedToken: 'SHORT_TOKEN',
})

// Làm mới Twitter OAuth 2.0 token
const tokens = await refreshTwitterToken({
  clientId: 'CLIENT_ID',
  clientSecret: 'CLIENT_SECRET',
  refreshToken: 'REFRESH_TOKEN',
})
```

---

## OAuth Flow

Tạo link đăng nhập và đổi code lấy token:

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

// Bước 1: Chuyển hướng user đến trang đăng nhập
const url = getMetaAuthUrl({
  clientId: 'APP_ID',
  redirectUri: 'https://yourapp.com/callback',
  scopes: ['pages_manage_posts', 'instagram_content_publish'],
  state: 'csrf_token',
})

// Bước 2: Nhận code từ callback, đổi lấy token
const { access_token } = await exchangeMetaCode({
  clientId: 'APP_ID',
  clientSecret: 'APP_SECRET',
  redirectUri: 'https://yourapp.com/callback',
  code: req.query.code,
})

// Twitter dùng PKCE — lưu codeVerifier giữa 2 bước
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
  codeVerifier,   // từ bước 1
})
```

---

## Xử lý lỗi

```ts
import { SocialSDKError, AuthError, RateLimitError, ValidationError } from 'social-posts-sdk'

try {
  await client.facebook?.postText({ message: 'Xin chào' })
} catch (err) {
  if (err instanceof ValidationError) {
    console.error('Dữ liệu không hợp lệ:', err.issues)
  } else if (err instanceof AuthError) {
    console.error('Token không hợp lệ hoặc đã hết hạn')
  } else if (err instanceof RateLimitError) {
    console.error('Vượt giới hạn — hãy thử lại sau')
  } else if (err instanceof SocialSDKError) {
    console.error(`[${err.platform}] lỗi ${err.code}:`, err.message)
  }
}
```

---

## Cấu hình chi tiết

### Facebook
| Thuộc tính | Bắt buộc | Mặc định | Mô tả |
|------------|----------|----------|-------|
| `pageId` | ✅ | — | ID Trang Facebook |
| `accessToken` | ✅ | — | Page Access Token |
| `apiVersion` | — | `v22.0` | Phiên bản Graph API |

### Instagram / Threads
| Thuộc tính | Bắt buộc | Mặc định | Mô tả |
|------------|----------|----------|-------|
| `igUserId` / `userId` | ✅ | — | User ID |
| `accessToken` | ✅ | — | Access Token |
| `apiVersion` | — | `v22.0` | Phiên bản Graph API |
| `pollIntervalMs` | — | `3000` | Thời gian chờ giữa các lần kiểm tra (ms) |
| `pollMaxAttempts` | — | `20` | Số lần kiểm tra tối đa |

### TikTok
| Thuộc tính | Bắt buộc | Mặc định | Mô tả |
|------------|----------|----------|-------|
| `accessToken` | ✅ | — | OAuth 2.0 Access Token |
| `pollIntervalMs` | — | `5000` | Thời gian chờ (ms) |
| `pollMaxAttempts` | — | `24` | Số lần kiểm tra tối đa |

---

## Ví dụ mẫu

Xem thư mục [`examples/`](examples/):

| File | Nền tảng |
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
| [`examples/combined.ts`](examples/combined.ts) | Facebook + Instagram đồng thời |

Chạy ví dụ:
```bash
FB_PAGE_ID=xxx FB_ACCESS_TOKEN=yyy npx tsx examples/facebook.ts
TELEGRAM_BOT_TOKEN=xxx TELEGRAM_CHAT_ID=@kenh npx tsx examples/telegram.ts
```

---

## Giấy phép

MIT
