const puppeteer = require('puppeteer')

async function send(url, message) {
   const bot = require('./bot')
   try {
      const browser = await puppeteer.launch({ headless: false })
      const page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })
      await page.goto(url)

      const button = await page.$('#btnContactBroker')
      await button.click()

      await page.select('#salutation', 'Frau')
      await page.focus('#firstname')
      await page.keyboard.type('Alexandra')

      await page.focus('#lastname')
      await page.keyboard.type('Rydz')

      await page.focus('#email')
      await page.keyboard.type('alexandra.rydz@gmail.com')

      await page.focus('#tel')
      await page.keyboard.type('016090516769')

      const messageInput = await page.$('#message')
      await messageInput.click({ clickCount: 3 })
      await messageInput.type(message)

      await page.screenshot({ path: 'screen.png' })

      return new Promise((resolve, reject) => {
         resolve('./screen.png')
      })
   } catch (e) {
      bot.sendMessage(-246302288, 'Versuche es noch einmal')
   }
}

module.exports = send