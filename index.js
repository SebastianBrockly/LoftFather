const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const bot = require('./bot')
const db = require('./db')
const _ = require('lodash')

const SCRAPING_INTERVAL = 5 * 60 * 1000

async function scrapeImmowelt(page, off = 1) {
   let immoweltUrl = 'https://www.immowelt.de/liste/berlin/wohnungen/mieten?prima=1200&eqid=-205%2C-94%2C-26&sort=createdate%2Bdesc'
   let suffix = ''
   if (off > 1) {
      suffix = `&cp=${off}`
   }

   await page.goto(`${immoweltUrl}${suffix}`, {
      timeout: 300000
   })
   await page.waitFor(5000)
   const lists = await page.$$('.iw_list_content')
   let ids = []

   for (list of lists) {
      const items = await list.$$eval('.listitem_wrap', (lItems => lItems.map(item => item.dataset.estateid)))
      ids = [...ids, ...items]
   }

   const prev = db.get('immowelt').value()
   const prevIds = prev.map(p => p.id)
   const news = []
   const results = []

   for (id of ids) {
      const item = await page.$(`[data-estateid="${id}"]`)
      const link = await item.$eval('a', (a) => a.href)
      results.push({ id, link })
      if (!prevIds.includes(id)) {
         news.push({ id, link, createdAt: Date.now() })
         db.get('immowelt').push({ id, link, createdAt: Date.now() }).write()
      } else {
         db.get('immowelt').find({ id }).assign({ link }).write()
      }
   }

   if (news.length > 0) {
      bot.sendMessage(-246302288, `Ich habe ${news.length} neue Wohnungen gefunden:`)
      const interval = setInterval(function () {
         if (news.length > 0) {
            const idToSend = news.pop()
            bot.sendMessage(-246302288, `${idToSend.link}`)

         }
      }, 500)
   }

   page.waitFor(5000)
   return new Promise(resolve => {
      resolve(results)
   })
}

async function scrape() {
   const info = await bot.getChat(-246302288)
   try {
      const browser = await puppeteer.launch({ headless: true })
      const page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })
      await page.goto('https://www.borchert-hv.de/vermietung')
      const html = await page.content()

      let $ = cheerio.load(html)
      let iframeUrl
      $('iframe').each(function (index, element) {
         const src = $(this).attr('src')
         if (src.startsWith('https://www-borchert')) {
            iframeUrl = src
         }
      })

      if (iframeUrl) {
         const iframePage = await browser.newPage()
         await iframePage.goto(iframeUrl)
         $ = cheerio.load(await iframePage.content())
         const url = $('iframe').first().attr('src')
         await iframePage.goto(`https:${url}`)
         const table = await iframePage.$('#immo-table')
         const tbody = await table.$('tbody')
         const rows = await tbody.$$('tr')
         const ids = []
         const prevIds = db.get('borchert').value()
         const newIds = []
         for (const row of rows) {
            const id = await row.$eval('.col-sm-3', (id) => id.innerText)
            if (!prevIds.includes(id)) {
               const link = await row.$eval('a', a => a.href)
               newIds.push({ id, link })
            }
            ids.push(id)
         }

         db.set('borchert', ids).write()

         if (newIds.length > 0) {
            bot.sendMessage(-246302288, `Ich habe ${newIds.length} neue Wohnungen gefunden:`)
            newIds.forEach(i => {
               bot.sendMessage(-246302288, `${i.link}`)
            })

         }
      }
      for (let i = 0; i < 6; i++) {
         const results = await scrapeImmowelt(page, i + 1)
         console.log(results)
      }

      setTimeout(() => {
         scrape()
      }, SCRAPING_INTERVAL)
   } catch (err) {
      console.log(err)
      scrape()
   }

}

scrape()

// const values = db.get('immowelt').value()
// db.set('immowelt', values.map(id => ({
//    id,
//    link: null
// }))).write()