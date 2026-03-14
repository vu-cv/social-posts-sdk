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
