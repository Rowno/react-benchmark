'use strict'
const path = require('path')
const EventEmitter = require('events')
const tempy = require('tempy')
const fs = require('fs-extra')
const webpack = require('./webpack')
const Chrome = require('./chrome')
const Server = require('./server')

module.exports = class ReactBenchmark extends EventEmitter {
  constructor() {
    super()

    this.chrome = new Chrome()
    this.server = new Server()

    this.chrome.on('start', () => {
      this.emit('start')
    })
    this.chrome.on('progress', (...a) => {
      this.emit('progress', ...a)
    })
    this.chrome.on('console', (log) => {
      this.emit('console', log)
    })
    this.chrome.on('close', () => {
      this._shutdown()
    })
  }

  async _shutdown() {
    await this.chrome.stop()
    await this.server.stop()
    this.running = false
  }

  async run(
    filepath,
    {
      debug = false,
      devtools = false,
      cpuThrottle = 1,
      isRamMeasured = false,
    } = {}
  ) {
    if (this.running) {
      throw new Error('Benchmark is already running')
    }

    this.running = true

    const benchmarkPath = path.resolve(filepath)

    if (!(await fs.pathExists(benchmarkPath))) {
      throw new Error('Benchmark file doesn՚t exist')
    }

    const outputPath = tempy.directory()

    this.emit('webpack')

    await webpack.compile(outputPath, benchmarkPath, debug)

    this.emit('server')

    const port = await this.server.start(outputPath)

    return new Promise((resolve, reject) => {
      this.chrome.once('complete', async (...a) => {
        if (!devtools) {
          await this._shutdown()
        }
        resolve([...a])
      })

      this.chrome.once('error', async (err) => {
        if (!devtools) {
          await this._shutdown()
        }
        reject(err)
      })

      this.emit('chrome')

      this.chrome.start(port, devtools, { cpuThrottle, isRamMeasured })
    })
  }
}
