# social-posts-sdk

TypeScript SDK để đăng bài lên mạng xã hội. Hiện hỗ trợ **Facebook Fanpage** và **Instagram Business/Creator**.

> 🇬🇧 [View English documentation](README.md)

---

## Yêu cầu

- Node.js >= 22
- Facebook App có quyền truy cập Graph API
- Page Access Token với các quyền phù hợp

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
  facebook: {
    pageId: 'YOUR_PAGE_ID',
    accessToken: 'YOUR_PAGE_ACCESS_TOKEN',
  },
  instagram: {
    igUserId: 'YOUR_IG_USER_ID',
    accessToken: 'YOUR_ACCESS_TOKEN',
  },
})

// Đăng lên Facebook
await client.facebook.postText({ message: 'Xin chào từ SDK!' })

// Đăng lên Instagram
await client.instagram.postImage({
  imageUrl: 'https://example.com/anh.jpg',
  caption: 'Xin chào Instagram!',
})
```

---

## Hướng dẫn lấy Token

### Facebook Page Access Token

1. Truy cập [developers.facebook.com](https://developers.facebook.com) và tạo một App
2. Thêm sản phẩm **Pages API** vào App
3. Yêu cầu các quyền sau:
   - `pages_manage_posts`
   - `pages_read_engagement`
4. Dùng [Graph API Explorer](https://developers.facebook.com/tools/explorer/) để tạo **Page Access Token**
5. Tìm **Page ID**: vào Trang Facebook → Giới thiệu → Tính minh bạch của Trang

### Instagram Access Token & User ID

1. Kết nối tài khoản Instagram với Trang Facebook
2. Đảm bảo tài khoản Instagram đã chuyển sang loại **Doanh nghiệp** hoặc **Nhà sáng tạo**
3. Thêm sản phẩm **Instagram Graph API** vào Facebook App
4. Yêu cầu thêm các quyền:
   - `instagram_basic`
   - `instagram_content_publish`
5. Lấy Instagram User ID:
   ```bash
   # Bước 1 — lấy danh sách Page
   curl "https://graph.facebook.com/v22.0/me/accounts?access_token=TOKEN"

   # Bước 2 — lấy IG User ID từ Page
   curl "https://graph.facebook.com/v22.0/PAGE_ID?fields=instagram_business_account&access_token=TOKEN"
   ```

---

## Facebook API

### `postText(input)`

Đăng bài viết dạng văn bản lên Trang Facebook.

```ts
const result = await client.facebook.postText({
  message: 'Nội dung bài viết',  // bắt buộc
  link: 'https://example.com',   // tuỳ chọn — đính kèm link preview
  published: true,               // tuỳ chọn — mặc định: true
})
```

### `postPhoto(input)`

Đăng một ảnh lên Trang Facebook.

```ts
const result = await client.facebook.postPhoto({
  imageUrl: 'https://example.com/anh.jpg',  // bắt buộc — phải là URL công khai
  message: 'Mô tả ảnh',                     // tuỳ chọn
  published: true,                          // tuỳ chọn — mặc định: true
})
```

### `postAlbum(input)`

Đăng album nhiều ảnh (2–10 ảnh) lên Trang Facebook.

```ts
const result = await client.facebook.postAlbum({
  imageUrls: [
    'https://example.com/anh1.jpg',
    'https://example.com/anh2.jpg',
  ],
  message: 'Album ảnh của tôi',  // tuỳ chọn
})
```

### `postVideo(input)`

Đăng video lên Trang Facebook.

```ts
const result = await client.facebook.postVideo({
  videoUrl: 'https://example.com/video.mp4',  // bắt buộc — phải là URL công khai
  title: 'Tiêu đề video',                     // tuỳ chọn
  description: 'Mô tả video',                 // tuỳ chọn
  published: true,                            // tuỳ chọn — mặc định: true
})
```

---

## Instagram API

> **Lưu ý:** Tất cả bài đăng Instagram đều theo quy trình 2 bước: tạo media container → chờ xử lý → publish. SDK tự động xử lý việc này.

### `postImage(input)`

Đăng một ảnh lên Instagram.

```ts
const result = await client.instagram.postImage({
  imageUrl: 'https://example.com/anh.jpg',  // bắt buộc — phải là URL công khai
  caption: 'Caption của tôi #hashtag',      // tuỳ chọn — tối đa 2200 ký tự
  locationId: '123456789',                  // tuỳ chọn — ID địa điểm
  userTags: [                               // tuỳ chọn — tag người dùng
    { username: 'nguoidung', x: 0.5, y: 0.5 },
  ],
})
```

### `postVideo(input)`

Đăng video hoặc Reel lên Instagram.

```ts
const result = await client.instagram.postVideo({
  videoUrl: 'https://example.com/video.mp4',  // bắt buộc
  caption: 'Caption của Reel',                // tuỳ chọn
  mediaType: 'REELS',                         // 'VIDEO' | 'REELS' — mặc định: 'VIDEO'
  thumbOffset: 1000,                          // tuỳ chọn — thời điểm thumbnail (ms)
})
```

### `postCarousel(input)`

Đăng carousel gồm 2–10 ảnh hoặc video lên Instagram.

```ts
const result = await client.instagram.postCarousel({
  items: [
    { type: 'IMAGE', imageUrl: 'https://example.com/a.jpg' },
    { type: 'IMAGE', imageUrl: 'https://example.com/b.jpg' },
    { type: 'VIDEO', videoUrl: 'https://example.com/c.mp4' },
  ],
  caption: 'Caption carousel',  // tuỳ chọn
  locationId: '123456789',      // tuỳ chọn
})
```

---

## Kết quả trả về (PostResult)

Tất cả các method đều trả về `PostResult`:

```ts
interface PostResult {
  id: string        // ID bài đăng do nền tảng cấp
  platform: 'facebook' | 'instagram'
  createdAt: string // Thời gian tạo (ISO 8601)
}
```

---

## Tuỳ chọn cấu hình

### `FacebookConfig`

| Thuộc tính | Kiểu | Bắt buộc | Mặc định | Mô tả |
|------------|------|----------|----------|-------|
| `pageId` | `string` | ✅ | — | ID Trang Facebook |
| `accessToken` | `string` | ✅ | — | Page Access Token |
| `apiVersion` | `string` | — | `'v22.0'` | Phiên bản Graph API |

### `InstagramConfig`

| Thuộc tính | Kiểu | Bắt buộc | Mặc định | Mô tả |
|------------|------|----------|----------|-------|
| `igUserId` | `string` | ✅ | — | Instagram Business/Creator User ID |
| `accessToken` | `string` | ✅ | — | Access Token |
| `apiVersion` | `string` | — | `'v22.0'` | Phiên bản Graph API |
| `pollIntervalMs` | `number` | — | `3000` | Thời gian chờ giữa các lần kiểm tra trạng thái (ms) |
| `pollMaxAttempts` | `number` | — | `20` | Số lần kiểm tra tối đa trước khi báo lỗi |

---

## Xử lý lỗi

```ts
import {
  SocialSDKError,
  AuthError,
  RateLimitError,
  ValidationError,
} from 'social-posts-sdk'

try {
  await client.facebook.postText({ message: 'Xin chào' })
} catch (err) {
  if (err instanceof ValidationError) {
    // Dữ liệu đầu vào không hợp lệ — xem err.issues[] để biết chi tiết
    console.error('Dữ liệu không hợp lệ:', err.issues)
  } else if (err instanceof AuthError) {
    // Token không hợp lệ hoặc đã hết hạn (mã lỗi Graph API 190, 102)
    console.error('Xác thực thất bại — hãy làm mới access token')
  } else if (err instanceof RateLimitError) {
    // Đã chạm giới hạn gọi API (mã lỗi 613, 32, 4)
    console.error('Đã vượt giới hạn — hãy thử lại sau')
  } else if (err instanceof SocialSDKError) {
    // Lỗi Graph API khác
    console.error(`Lỗi Graph API [${err.code}]:`, err.message)
  }
}
```

| Lớp lỗi | Khi nào xuất hiện |
|---------|------------------|
| `ValidationError` | Dữ liệu đầu vào không qua được Zod schema (trước khi gửi request) |
| `AuthError` | Graph API trả về mã lỗi 190, 102, 2500 (token sai/hết hạn) |
| `RateLimitError` | Graph API trả về mã lỗi 613, 32, 4, 17 (vượt giới hạn) |
| `SocialSDKError` | Mọi lỗi Graph API khác — lớp cơ sở của tất cả lỗi SDK |

---

## Đăng đồng thời lên nhiều nền tảng

```ts
const [fbResult, igResult] = await Promise.all([
  client.facebook.postPhoto({
    imageUrl: 'https://example.com/anh.jpg',
    message: 'Đăng chéo nền tảng!',
  }),
  client.instagram.postImage({
    imageUrl: 'https://example.com/anh.jpg',
    caption: 'Đăng chéo nền tảng!',
  }),
])
```

---

## Ví dụ mẫu

Xem thư mục [`examples/`](examples/):

- [`examples/facebook.ts`](examples/facebook.ts) — Tất cả loại bài đăng Facebook
- [`examples/instagram.ts`](examples/instagram.ts) — Tất cả loại bài đăng Instagram
- [`examples/combined.ts`](examples/combined.ts) — Đăng đồng thời lên cả 2 nền tảng

Chạy ví dụ:

```bash
FB_PAGE_ID=xxx FB_ACCESS_TOKEN=yyy npx tsx examples/facebook.ts
```

---

## Giấy phép

MIT
