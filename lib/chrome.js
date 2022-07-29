'use strict'
const EventEmitter = require('events')
const puppeteer = require('puppeteer')

/** https://media-codings.com/articles/automatically-detect-memory-leaks-with-puppeteer */
const countObjects = async (page) => {
  const prototype = await page.evaluateHandle(() => {
    return Object.prototype
  })
  const objects = await page.queryObjects(prototype)
  const numberOfObjects = await page.evaluate(
    (instances) => instances.length,
    objects
  )

  await prototype.dispose()
  await objects.dispose()

  return numberOfObjects
}

module.exports = class Chrome extends EventEmitter {
  constructor() {
    super()

    this.chrome = null
  }

  async start(port, devtools, { cpuThrottle, isRamMeasured }) {
    let completed = false
    const chromeArgs = []
    if (isRamMeasured) {
      chromeArgs.push('--js-flags=--expose-gc')
    }
    this.chrome = await puppeteer.launch({ devtools, args: chromeArgs })
    const heapSizeMeasurements = []
    const objectCountMeasurements = []
    const page = await this.chrome.newPage()
    const client = await page.target().createCDPSession()

    await client.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottle })

    this.chrome.on('disconnected', () => {
      this.chrome = null

      if (completed) {
        this.emit('close')
      } else {
        this.emit('error', new Error('Chrome disconnected unexpectedly'))
      }
    })
    this.chrome.on('targetdestroyed', async (target) => {
      try {
        if ((await target.page()) === page) {
          if (completed) {
            this.emit('close')
          } else {
            this.emit('error', new Error('Chrome tab closed unexpectedly'))
          }
        }
      } catch (error) {
        // Workaround target.page() throwing an error when Chrome is closing
        if (
          !error.message.includes('No target with given id found undefined')
        ) {
          this.emit('error', error)
        }
      }
    })

    page.on('console', (msg) => {
      this.emit('console', { type: msg.type(), text: msg.text() })
    })
    page.on('pageerror', (err) => {
      this.emit('error', err)
    })
    page.on('requestfailed', (request) => {
      const error = new Error(`${request.failure().errorText} ${request.url()}`)
      this.emit('error', error)
    })

    page.exposeFunction('benchmarkProgress', async (data) => {
      const benchmark = JSON.parse(data)
      if (isRamMeasured) {
        // eslint-disable-next-line no-undef
        await page.evaluate(() => gc())
        const { JSHeapUsedSize } = await page.metrics()
        heapSizeMeasurements.push(JSHeapUsedSize)
        const n = await countObjects(page)
        objectCountMeasurements.push(n)
      }
      this.emit(
        'progress',
        benchmark,
        heapSizeMeasurements,
        objectCountMeasurements
      )
    })

    page.exposeFunction('benchmarkComplete', (data) => {
      const benchmark = JSON.parse(data)
      completed = true
      this.emit(
        'complete',
        benchmark,
        heapSizeMeasurements,
        objectCountMeasurements
      )
    })

    this.emit('start')

    await page.goto(`http://localhost:${port}`)
  }

  async stop() {
    if (this.chrome) {
      await this.chrome.close()
      this.chrome = null
    }
  }
}
