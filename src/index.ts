// Main SDK client
export { SocialPostsClient } from './client.js'

// Platform clients (for direct usage)
export { FacebookClient } from './platforms/facebook/facebook-client.js'
export { InstagramClient } from './platforms/instagram/instagram-client.js'

// Types
export type {
  SocialPostsConfig,
  FacebookConfig,
  InstagramConfig,
  PostResult,
  Platform,
} from './types/index.js'

// Facebook input types
export type {
  PostTextInput,
  PostPhotoInput,
  PostAlbumInput,
  PostVideoInput as FacebookPostVideoInput,
} from './platforms/facebook/facebook.types.js'

// Instagram input types
export type {
  PostImageInput,
  PostVideoInput as InstagramPostVideoInput,
  PostCarouselInput,
  CarouselItem,
  InstagramMediaType,
} from './platforms/instagram/instagram.types.js'

// Errors
export {
  SocialSDKError,
  AuthError,
  RateLimitError,
  ValidationError,
} from './errors/index.js'
