/**
 * Threads examples
 *
 * Prerequisites:
 *   1. Connect your Instagram account to Threads
 *   2. Create a Meta App with Threads API product
 *   3. Get a User Access Token with:
 *      - threads_basic
 *      - threads_content_publish
 *   4. Get your Threads User ID (same as Instagram User ID or via /me endpoint)
 *   5. Set env vars:
 *        THREADS_USER_ID=<your-user-id>
 *        THREADS_ACCESS_TOKEN=<your-access-token>
 */

import { ThreadsClient } from '../src/index.js'

const client = new ThreadsClient({
  userId: process.env['THREADS_USER_ID']!,
  accessToken: process.env['THREADS_ACCESS_TOKEN']!,
})

// 1. Text post (max 500 chars)
const textPost = await client.postText({ text: 'Hello from social-posts-sdk! 🚀' })
console.log('Text post:', textPost)

// 2. Text post as reply
const reply = await client.postText({
  text: 'Replying to a thread',
  replyToId: textPost.id,
})
console.log('Reply:', reply)

// 3. Image post
const imagePost = await client.postImage({
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
  text: 'An interesting ant 🐜',
})
console.log('Image post:', imagePost)

// 4. Video post
const videoPost = await client.postVideo({
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  text: 'Check out this video 🎬',
})
console.log('Video post:', videoPost)

// 5. Carousel (up to 20 items)
const carousel = await client.postCarousel({
  items: [
    { type: 'IMAGE', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg' },
    { type: 'IMAGE', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg' },
  ],
  text: 'Carousel on Threads 🖼️',
})
console.log('Carousel:', carousel)
