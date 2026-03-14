/**
 * Telegram examples
 *
 * Prerequisites:
 *   1. Talk to @BotFather on Telegram to create a bot
 *   2. Get the bot token from BotFather
 *   3. Add the bot to your channel/group as an admin
 *   4. Get the chat ID:
 *      - For public channels: use @channel_username (e.g. "@mychannel")
 *      - For private channels: use the numeric ID (e.g. "-1001234567890")
 *      - To find private channel ID: forward a message to @userinfobot
 *   5. Set env vars:
 *        TELEGRAM_BOT_TOKEN=<your-bot-token>
 *        TELEGRAM_CHAT_ID=<your-chat-id>
 */

import { TelegramClient } from '../src/index.js'

const client = new TelegramClient({
  botToken: process.env['TELEGRAM_BOT_TOKEN']!,
})

const chatId = process.env['TELEGRAM_CHAT_ID']!

// 1. Text message (supports HTML formatting)
const textMsg = await client.sendMessage({
  chatId,
  text: '<b>Hello</b> from <i>social-posts-sdk</i>! 🚀',
  parseMode: 'HTML',
})
console.log('Text message:', textMsg)

// 2. Text with Markdown
await client.sendMessage({
  chatId,
  text: '*Bold* and _italic_ text',
  parseMode: 'Markdown',
  disableWebPagePreview: true,
})

// 3. Photo
const photoMsg = await client.sendPhoto({
  chatId,
  photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg',
  caption: 'Amazing macro photography 📸',
  parseMode: 'HTML',
})
console.log('Photo:', photoMsg)

// 4. Video
const videoMsg = await client.sendVideo({
  chatId,
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  caption: 'Big Buck Bunny clip 🎬',
  width: 320,
  height: 176,
})
console.log('Video:', videoMsg)

// 5. Album (2–10 media items)
const album = await client.sendAlbum({
  chatId,
  media: [
    { type: 'photo', photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg', caption: 'First photo' },
    { type: 'photo', photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg' },
    { type: 'video', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  ],
})
console.log('Album:', album)
