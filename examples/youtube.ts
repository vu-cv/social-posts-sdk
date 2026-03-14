/**
 * YouTube examples
 *
 * Prerequisites:
 *   1. Go to https://console.cloud.google.com and create a project
 *   2. Enable the YouTube Data API v3
 *   3. Create OAuth 2.0 credentials (Web App or Desktop)
 *   4. Add scope: https://www.googleapis.com/auth/youtube.upload
 *   5. Complete OAuth flow to get an access token
 *   6. Set env vars:
 *        YOUTUBE_ACCESS_TOKEN=<your-oauth2-access-token>
 *
 * Notes:
 *   - The SDK downloads the video from videoUrl and streams it to YouTube
 *   - Default privacy is 'public' — use 'private' for testing
 *   - Category IDs: 1=Film, 10=Music, 17=Sports, 20=Gaming, 22=People & Blogs, 28=Science & Tech
 */

import { YouTubeClient } from '../src/index.js'

const client = new YouTubeClient({
  accessToken: process.env['YOUTUBE_ACCESS_TOKEN']!,
})

// Upload a video
const result = await client.uploadVideo({
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  title: 'Big Buck Bunny Clip',
  description: 'Uploaded via social-posts-sdk 🚀\n\n#nodejs #typescript',
  tags: ['nodejs', 'sdk', 'opensource'],
  categoryId: '28',           // Science & Technology
  privacyStatus: 'private',   // use 'public' when ready
  madeForKids: false,
})
console.log('Uploaded video:', result)
// { id: 'dQw4w9WgXcQ', platform: 'youtube', createdAt: '...' }
// Video URL: https://www.youtube.com/watch?v={id}
