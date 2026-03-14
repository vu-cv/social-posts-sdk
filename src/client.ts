import { FacebookClient } from './platforms/facebook/facebook-client.js'
import { InstagramClient } from './platforms/instagram/instagram-client.js'
import { ThreadsClient } from './platforms/threads/threads-client.js'
import { TwitterClient } from './platforms/twitter/twitter-client.js'
import { LinkedInClient } from './platforms/linkedin/linkedin-client.js'
import { TikTokClient } from './platforms/tiktok/tiktok-client.js'
import { YouTubeClient } from './platforms/youtube/youtube-client.js'
import { PinterestClient } from './platforms/pinterest/pinterest-client.js'
import { TelegramClient } from './platforms/telegram/telegram-client.js'
import { ZaloClient } from './platforms/zalo/zalo-client.js'
import type { SocialPostsConfig } from './types/index.js'

export class SocialPostsClient {
  readonly facebook?: FacebookClient
  readonly instagram?: InstagramClient
  readonly threads?: ThreadsClient
  readonly twitter?: TwitterClient
  readonly linkedin?: LinkedInClient
  readonly tiktok?: TikTokClient
  readonly youtube?: YouTubeClient
  readonly pinterest?: PinterestClient
  readonly telegram?: TelegramClient
  readonly zalo?: ZaloClient

  constructor(config: SocialPostsConfig) {
    if (config.facebook) this.facebook = new FacebookClient(config.facebook)
    if (config.instagram) this.instagram = new InstagramClient(config.instagram)
    if (config.threads) this.threads = new ThreadsClient(config.threads)
    if (config.twitter) this.twitter = new TwitterClient(config.twitter)
    if (config.linkedin) this.linkedin = new LinkedInClient(config.linkedin)
    if (config.tiktok) this.tiktok = new TikTokClient(config.tiktok)
    if (config.youtube) this.youtube = new YouTubeClient(config.youtube)
    if (config.pinterest) this.pinterest = new PinterestClient(config.pinterest)
    if (config.telegram) this.telegram = new TelegramClient(config.telegram)
    if (config.zalo) this.zalo = new ZaloClient(config.zalo)
  }
}
