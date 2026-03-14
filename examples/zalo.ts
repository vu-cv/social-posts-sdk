/**
 * Zalo Official Account examples
 *
 * Prerequisites:
 *   1. Đăng ký tài khoản tại https://developers.zalo.me
 *   2. Tạo Official Account (OA) và App
 *   3. Liên kết App với OA
 *   4. Lấy OA Access Token:
 *      - Dùng Zalo Login để xác thực và nhận access_token
 *      - Hoặc dùng refresh_token để làm mới token
 *   5. Set env vars:
 *        ZALO_ACCESS_TOKEN=<oa-access-token>
 */

import { ZaloClient } from '../src/index.js'

const client = new ZaloClient({
  accessToken: process.env['ZALO_ACCESS_TOKEN']!,
})

// 1. Bài đăng chỉ có text
const textPost = await client.postFeed({
  message: 'Xin chào từ social-posts-sdk! 🚀 Đây là bài đăng thử nghiệm.',
})
console.log('Text post:', textPost)

// 2. Bài đăng với một ảnh
const photoPost = await client.postFeed({
  message: 'Bài đăng kèm ảnh từ SDK',
  photoUrls: [
    'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
  ],
})
console.log('Photo post:', photoPost)

// 3. Bài đăng với nhiều ảnh (tối đa 10)
const multiPhotoPost = await client.postFeed({
  message: 'Bài đăng với nhiều ảnh 📸',
  photoUrls: [
    'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
  ],
})
console.log('Multi-photo post:', multiPhotoPost)
