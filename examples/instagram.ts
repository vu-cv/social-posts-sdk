/**
 * Instagram Business / Creator Account examples
 *
 * Prerequisites:
 *   1. Connect your Instagram account to a Facebook Page
 *   2. Ensure the account is set to Business or Creator
 *   3. Create a Facebook App with Instagram Graph API product
 *   4. Generate a Page Access Token (or User Token) with:
 *      - instagram_basic
 *      - instagram_content_publish
 *   5. Get your Instagram User ID:
 *        GET https://graph.facebook.com/v22.0/me/accounts?access_token=TOKEN
 *        then GET /{page-id}?fields=instagram_business_account&access_token=TOKEN
 *   6. Set env vars:
 *        IG_USER_ID=<your-ig-user-id>
 *        IG_ACCESS_TOKEN=<your-access-token>
 */

import { InstagramClient, AuthError, RateLimitError, ValidationError } from '../src/index.js'

const client = new InstagramClient({
  igUserId: process.env['IG_USER_ID']!,
  accessToken: process.env['IG_ACCESS_TOKEN']!,
  // Optional tuning (defaults shown):
  // pollIntervalMs: 3000,   // how long to wait between status checks
  // pollMaxAttempts: 20,    // give up after this many checks (~1 minute)
})

// ─── 1. Single image post ─────────────────────────────────────────────────────

const imagePost = await client.postImage({
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
  caption: 'Posted with social-posts-sdk 🚀 #nodejs #typescript',
})
console.log('Image post:', imagePost)
// { id: '17846368219941196', platform: 'instagram', createdAt: '...' }

// ─── 2. Reel ──────────────────────────────────────────────────────────────────

const reelPost = await client.postVideo({
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  mediaType: 'REELS',
  caption: 'My first Reel via the SDK 🎬',
})
console.log('Reel post:', reelPost)

// ─── 3. Regular video ─────────────────────────────────────────────────────────

const videoPost = await client.postVideo({
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  mediaType: 'VIDEO',
  caption: 'A regular video post',
})
console.log('Video post:', videoPost)

// ─── 4. Carousel (multi-image) ───────────────────────────────────────────────

const carouselPost = await client.postCarousel({
  items: [
    { type: 'IMAGE', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg' },
    { type: 'IMAGE', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png' },
    { type: 'IMAGE', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg' },
  ],
  caption: 'Carousel post with 3 images 🖼️',
})
console.log('Carousel post:', carouselPost)

// ─── 5. Carousel (mixed image + video) ───────────────────────────────────────

const mixedCarousel = await client.postCarousel({
  items: [
    { type: 'IMAGE', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg' },
    { type: 'VIDEO', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  ],
  caption: 'Mixed image + video carousel',
})
console.log('Mixed carousel:', mixedCarousel)

// ─── 6. Error handling ────────────────────────────────────────────────────────

try {
  await client.postImage({ imageUrl: 'not-a-valid-url' })
} catch (err) {
  if (err instanceof ValidationError) {
    console.error('Validation failed:', err.issues)
    // ['Invalid url']
  } else if (err instanceof AuthError) {
    console.error('Token expired or missing instagram_content_publish permission')
  } else if (err instanceof RateLimitError) {
    console.error('Instagram publish limit reached (25 posts/24h for most accounts)')
  } else {
    console.error('Unexpected error:', err)
  }
}
