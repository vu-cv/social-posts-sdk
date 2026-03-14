/**
 * TikTok examples
 *
 * Prerequisites:
 *   1. Register at https://developers.tiktok.com and create an app
 *   2. Add the "Content Posting API" product
 *   3. Request scope: video.publish, video.upload
 *   4. Complete OAuth 2.0 flow to get a user access token
 *   5. Set env vars:
 *        TIKTOK_ACCESS_TOKEN=<your-access-token>
 *
 * Notes:
 *   - Default privacy is SELF_ONLY — change to PUBLIC_TO_EVERYONE for real posts
 *   - Video/image URLs must be publicly accessible
 *   - Video requirements: H.264, max 10 min, max 4K resolution
 */

import { TikTokClient } from '../src/index.js'

const client = new TikTokClient({
  accessToken: process.env['TIKTOK_ACCESS_TOKEN']!,
})

// 1. Post a video (SDK pulls from URL)
const videoPost = await client.postVideo({
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  title: 'My first TikTok via SDK',
  description: 'Posted using social-posts-sdk 🚀 #coding #nodejs',
  privacyLevel: 'SELF_ONLY',   // change to 'PUBLIC_TO_EVERYONE' when ready
  disableComment: false,
  disableDuet: false,
  disableStitch: false,
})
console.log('Video post:', videoPost)

// 2. Post photos (carousel)
const photoPost = await client.postPhotos({
  photoUrls: [
    'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
  ],
  title: 'Photo carousel',
  description: 'Swipe through! 👆',
  privacyLevel: 'SELF_ONLY',
  coverIndex: 0,
})
console.log('Photo post:', photoPost)
