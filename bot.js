const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs')
const apply = require('./question')
// replace the value below with the Telegram token you receive from @BotFather
const token = '649585537:AAHLmcRBZTZbFj2IqbnsmttcbGfDtT1F5fg';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

let isApplying = false
let url
let message
let confirmed

const applications = fs.readFileSync('./Anfragen.txt', { encoding: 'utf8' }).split('>>>')

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {

   const chatId = msg.chat.id;
   // send a message to the chat acknowledging receipt of their message
   if (msg.text === 'Was geht ab, immofather?') {
      bot.sendMessage(chatId, `Frag mich niemals nach meinen Geschäften, ${msg.from.first_name}`)
   }

   if (msg.text.startsWith('/')) {
      let m = msg.text.slice(1)
      if (m === 'apply') {
         isApplying = true
         return bot.sendMessage(chatId, 'Nenne mir die Immowelt-Expose-URL')
      }
   }

   if (isApplying && !url) {
      let m = msg.text
      url = m
      return bot.sendMessage(chatId, 'Danke. Wähle eine vorgefertigte Nachricht (1-3) oder schreibe eine eigene.')
   }

   if (isApplying && !message) {
      console.log(msg.text === '3')
      if (msg.text === '1' || msg.text === '2' || msg.text === '3') {
         
         message = applications[msg.text - 1]
      } else {
         message = msg.text
      }
      return apply(url, message).then(image => {
         console.log(image)
         bot.sendPhoto(-246302288, image)
         bot.sendMessage(-246302288, 'Einverstanden?')
      })
   }

   if (isApplying && !confirmed) {
      console.log('kösdfjdksöf')
      if (msg.text.trim() === 'ja' || msg.text.trim() === 'Ja') {
         bot.sendMessage(-246302288, 'Alles klar. Ich schicke die Bewerbung los!')
         url = null
         message = null
         isApplying = false
      } else if (msg.text.trim().toLowerCase() === 'nein') {
         bot.sendMessage(-246302288, 'Alles klar. Ich breche ab!')
         url = null
         message = null
         isApplying = false
      }
   }
   //   bot.sendMessage(chatId, 'Received your message');
});

module.exports = bot
