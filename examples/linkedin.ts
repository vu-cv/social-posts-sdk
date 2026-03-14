/**
 * LinkedIn examples
 *
 * Prerequisites:
 *   1. Create an app at https://www.linkedin.com/developers/apps
 *   2. Add the "Share on LinkedIn" and "Marketing Developer Platform" products
 *   3. Request permissions: r_liteprofile, w_member_social (personal)
 *      or r_organization_social, w_organization_social (company pages)
 *   4. Complete OAuth 2.0 flow to get an access token
 *   5. Get your Person URN or Organization URN:
 *        GET https://api.linkedin.com/v2/me → gives person ID → urn:li:person:{id}
 *        GET https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee → for org pages
 *   6. Set env vars:
 *        LINKEDIN_ACCESS_TOKEN=<your-access-token>
 *        LINKEDIN_AUTHOR_URN=urn:li:organization:12345   (or urn:li:person:xxxx)
 */

import { LinkedInClient } from '../src/index.js'

const client = new LinkedInClient({
  accessToken: process.env['LINKEDIN_ACCESS_TOKEN']!,
})

const authorUrn = process.env['LINKEDIN_AUTHOR_URN']!

// 1. Text post
const textPost = await client.postText({
  text: 'Excited to share this update from social-posts-sdk! 🚀\n\n#nodejs #typescript #sdk',
  authorUrn,
})
console.log('Text post:', textPost)

// 2. Image post
const imagePost = await client.postImage({
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
  text: 'An interesting photo 📸',
  title: 'Nature close-up',
  authorUrn,
})
console.log('Image post:', imagePost)

// 3. Video post
const videoPost = await client.postVideo({
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  text: 'Check out this short clip!',
  title: 'Big Buck Bunny',
  authorUrn,
})
console.log('Video post:', videoPost)
