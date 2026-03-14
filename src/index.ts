// Main SDK client
export { SocialPostsClient } from './client.js'

// Platform clients
export { FacebookClient } from './platforms/facebook/facebook-client.js'
export { InstagramClient } from './platforms/instagram/instagram-client.js'
export { ThreadsClient } from './platforms/threads/threads-client.js'
export { TwitterClient } from './platforms/twitter/twitter-client.js'
export { LinkedInClient } from './platforms/linkedin/linkedin-client.js'
export { TikTokClient } from './platforms/tiktok/tiktok-client.js'
export { YouTubeClient } from './platforms/youtube/youtube-client.js'
export { PinterestClient } from './platforms/pinterest/pinterest-client.js'
export { TelegramClient } from './platforms/telegram/telegram-client.js'
export { ZaloClient } from './platforms/zalo/zalo-client.js'

// Config & shared types
export type {
  SocialPostsConfig,
  FacebookConfig,
  InstagramConfig,
  ThreadsConfig,
  TwitterConfig,
  LinkedInConfig,
  TikTokConfig,
  YouTubeConfig,
  PinterestConfig,
  TelegramConfig,
  ZaloConfig,
  PostResult,
  Platform,
} from './types/index.js'

// Facebook input types
export type {
  PostTextInput as FacebookPostTextInput,
  PostPhotoInput as FacebookPostPhotoInput,
  PostAlbumInput as FacebookPostAlbumInput,
  PostVideoInput as FacebookPostVideoInput,
} from './platforms/facebook/facebook.types.js'

// Instagram input types
export type {
  PostImageInput as InstagramPostImageInput,
  PostVideoInput as InstagramPostVideoInput,
  PostCarouselInput as InstagramPostCarouselInput,
  CarouselItem as InstagramCarouselItem,
  InstagramMediaType,
} from './platforms/instagram/instagram.types.js'

// Threads input types
export type {
  ThreadsPostTextInput,
  ThreadsPostImageInput,
  ThreadsPostVideoInput,
  ThreadsPostCarouselInput,
  ThreadsCarouselItem,
} from './platforms/threads/threads.types.js'

// Twitter input types
export type {
  TwitterPostTextInput,
  TwitterPostImagesInput,
  TwitterPostVideoInput,
} from './platforms/twitter/twitter.types.js'

// LinkedIn input types
export type {
  LinkedInPostTextInput,
  LinkedInPostImageInput,
  LinkedInPostVideoInput,
} from './platforms/linkedin/linkedin.types.js'

// TikTok input types
export type {
  TikTokPostVideoInput,
  TikTokPostPhotosInput,
  TikTokPrivacyLevel,
} from './platforms/tiktok/tiktok.types.js'

// YouTube input types
export type {
  YouTubeUploadVideoInput,
  YouTubePrivacyStatus,
} from './platforms/youtube/youtube.types.js'

// Pinterest input types
export type {
  PinterestCreatePinInput,
} from './platforms/pinterest/pinterest.types.js'

// Telegram input types
export type {
  TelegramSendMessageInput,
  TelegramSendPhotoInput,
  TelegramSendVideoInput,
  TelegramSendAlbumInput,
  TelegramAlbumItem,
} from './platforms/telegram/telegram.types.js'

// Zalo input types
export type {
  ZaloPostFeedInput,
} from './platforms/zalo/zalo.types.js'

// Errors
export {
  SocialSDKError,
  AuthError,
  RateLimitError,
  ValidationError,
} from './errors/index.js'
