/**
 * Combined example — post to Facebook and Instagram simultaneously
 * using the top-level SocialPostsClient.
 *
 * Env vars needed:
 *   FB_PAGE_ID, FB_ACCESS_TOKEN, IG_USER_ID, IG_ACCESS_TOKEN
 */

import { SocialPostsClient } from '../src/index.js'

const client = new SocialPostsClient({
  facebook: {
    pageId: process.env['FB_PAGE_ID']!,
    accessToken: process.env['FB_ACCESS_TOKEN']!,
  },
  instagram: {
    igUserId: process.env['IG_USER_ID']!,
    accessToken: process.env['IG_ACCESS_TOKEN']!,
  },
})

const IMAGE_URL = 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg'
const CAPTION = 'Cross-posting with social-posts-sdk 🚀'

// ─── Post to both platforms in parallel ──────────────────────────────────────

const [fbResult, igResult] = await Promise.all([
  client.facebook.postPhoto({ imageUrl: IMAGE_URL, message: CAPTION }),
  client.instagram.postImage({ imageUrl: IMAGE_URL, caption: CAPTION }),
])

console.log('Facebook:', fbResult)
// { id: '...', platform: 'facebook', createdAt: '...' }

console.log('Instagram:', igResult)
// { id: '...', platform: 'instagram', createdAt: '...' }
