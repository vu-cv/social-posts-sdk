/**
 * Twitter / X examples
 *
 * Prerequisites:
 *   1. Create a developer account at https://developer.twitter.com
 *   2. Create a Project + App
 *   3. Enable OAuth 2.0 with User Context and request:
 *      - tweet.read, tweet.write, users.read
 *   4. For media uploads, also set up OAuth 1.0a credentials
 *   5. Complete the OAuth flow to get a user access token
 *   6. Set env vars:
 *        TWITTER_ACCESS_TOKEN=<oauth2-user-access-token>
 *        TWITTER_CONSUMER_KEY=<app-consumer-key>         (for media)
 *        TWITTER_CONSUMER_SECRET=<app-consumer-secret>   (for media)
 *        TWITTER_OAUTH_TOKEN=<user-oauth1-token>         (for media)
 *        TWITTER_OAUTH_SECRET=<user-oauth1-secret>       (for media)
 */

import { TwitterClient } from '../src/index.js'

const client = new TwitterClient({
  accessToken: process.env['TWITTER_ACCESS_TOKEN']!,
  // Include oauth1 to enable image/video uploads
  oauth1: {
    consumerKey: process.env['TWITTER_CONSUMER_KEY']!,
    consumerSecret: process.env['TWITTER_CONSUMER_SECRET']!,
    accessToken: process.env['TWITTER_OAUTH_TOKEN']!,
    accessTokenSecret: process.env['TWITTER_OAUTH_SECRET']!,
  },
})

// 1. Text tweet
const textTweet = await client.postText({ text: 'Hello from social-posts-sdk! 🚀' })
console.log('Text tweet:', textTweet)

// 2. Reply to a tweet
const reply = await client.postText({
  text: 'This is a reply!',
  replyToTweetId: textTweet.id,
})
console.log('Reply:', reply)

// 3. Tweet with images (requires oauth1)
const imageTweet = await client.postImages({
  text: 'Look at this!',
  imageUrls: [
    'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
  ],
})
console.log('Image tweet:', imageTweet)

// 4. Tweet with video (requires oauth1)
const videoTweet = await client.postVideo({
  text: 'Watch this clip',
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
})
console.log('Video tweet:', videoTweet)
