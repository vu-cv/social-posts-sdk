/**
 * Facebook Fanpage examples
 *
 * Prerequisites:
 *   1. Create a Facebook App at https://developers.facebook.com
 *   2. Add the Pages API product
 *   3. Generate a Page Access Token with:
 *      - pages_manage_posts
 *      - pages_read_engagement
 *   4. Set env vars:
 *        FB_PAGE_ID=<your-page-id>
 *        FB_ACCESS_TOKEN=<your-page-access-token>
 */

import { FacebookClient, AuthError, RateLimitError, ValidationError } from '../src/index.js'

const client = new FacebookClient({
  pageId: process.env['FB_PAGE_ID']!,
  accessToken: process.env['FB_ACCESS_TOKEN']!,
})

// ─── 1. Text post ─────────────────────────────────────────────────────────────

const textPost = await client.postText({
  message: 'Hello from social-posts-sdk! 🚀',
})
console.log('Text post:', textPost)
// { id: '123456_789', platform: 'facebook', createdAt: '...' }

// ─── 2. Text post with link preview ──────────────────────────────────────────

const linkPost = await client.postText({
  message: 'Check out this article',
  link: 'https://example.com/article',
})
console.log('Link post:', linkPost)

// ─── 3. Single photo ──────────────────────────────────────────────────────────

const photoPost = await client.postPhoto({
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png',
  message: 'A photo from the SDK',
})
console.log('Photo post:', photoPost)

// ─── 4. Multi-photo album ─────────────────────────────────────────────────────

const albumPost = await client.postAlbum({
  imageUrls: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png',
    'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
  ],
  message: 'An album with two photos',
})
console.log('Album post:', albumPost)

// ─── 5. Video post ────────────────────────────────────────────────────────────

const videoPost = await client.postVideo({
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  title: 'Big Buck Bunny clip',
  description: 'A short video clip posted via the SDK',
})
console.log('Video post:', videoPost)

// ─── 6. Error handling ────────────────────────────────────────────────────────

try {
  await client.postText({ message: 'Testing error handling' })
} catch (err) {
  if (err instanceof ValidationError) {
    console.error('Bad input:', err.issues)
  } else if (err instanceof AuthError) {
    console.error('Token is invalid or expired — refresh it and retry')
  } else if (err instanceof RateLimitError) {
    console.error('Rate limit hit — back off and retry later')
  } else {
    console.error('Unexpected error:', err)
  }
}
