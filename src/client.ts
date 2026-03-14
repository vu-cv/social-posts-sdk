import { FacebookClient } from './platforms/facebook/facebook-client.js'
import { InstagramClient } from './platforms/instagram/instagram-client.js'
import type { SocialPostsConfig } from './types/index.js'

export class SocialPostsClient {
  /** Facebook Fanpage client. Only available when `facebook` config is provided. */
  readonly facebook: FacebookClient

  /** Instagram client. Only available when `instagram` config is provided. */
  readonly instagram: InstagramClient

  constructor(config: SocialPostsConfig & { facebook: NonNullable<SocialPostsConfig['facebook']>; instagram: NonNullable<SocialPostsConfig['instagram']> })
  constructor(config: SocialPostsConfig & { facebook: NonNullable<SocialPostsConfig['facebook']> })
  constructor(config: SocialPostsConfig & { instagram: NonNullable<SocialPostsConfig['instagram']> })
  constructor(config: SocialPostsConfig) {
    if (config.facebook) {
      this.facebook = new FacebookClient(config.facebook)
    } else {
      this.facebook = null as unknown as FacebookClient
    }

    if (config.instagram) {
      this.instagram = new InstagramClient(config.instagram)
    } else {
      this.instagram = null as unknown as InstagramClient
    }
  }
}
