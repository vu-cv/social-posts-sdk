/**
 * Pinterest examples
 *
 * Prerequisites:
 *   1. Create an app at https://developers.pinterest.com
 *   2. Request scope: boards:read, pins:write
 *   3. Complete OAuth 2.0 flow to get an access token
 *   4. Get your board ID:
 *        GET https://api.pinterest.com/v5/boards
 *   5. Set env vars:
 *        PINTEREST_ACCESS_TOKEN=<your-access-token>
 *        PINTEREST_BOARD_ID=<your-board-id>
 */

import { PinterestClient } from '../src/index.js'

const client = new PinterestClient({
  accessToken: process.env['PINTEREST_ACCESS_TOKEN']!,
})

const boardId = process.env['PINTEREST_BOARD_ID']!

// 1. Simple image pin
const pin = await client.createPin({
  boardId,
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
  title: 'Amazing ant macro photo',
  description: 'Close-up photography of a Camponotus flavomarginatus ant. Created via social-posts-sdk.',
  link: 'https://en.wikipedia.org/wiki/Camponotus_flavomarginatus',
  altText: 'Close-up of a Camponotus flavomarginatus ant',
})
console.log('Pin created:', pin)
// { id: '123456', platform: 'pinterest', createdAt: '...' }

// 2. Pin with board section
const sectionPin = await client.createPin({
  boardId,
  imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
  title: 'Pinned to a section',
  boardSectionId: 'YOUR_SECTION_ID',
})
console.log('Section pin:', sectionPin)
