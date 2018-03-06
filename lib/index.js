'use strict'
const path = require('path')
const EventEmitter = require('events')
const tempy = require('tempy')
const sander = require('sander')
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
    this.chrome.on('progress', benchmark => {
      this.emit('progress', benchmark)
    })
    this.chrome.on('close', () => {
      this._shutdown()
    })
  }

  _shutdown() {
    this.chrome.stop()
    this.server.stop()
    this.running = false
  }

  async run(filepath, {debug = false, devtools = false} = {}) {
    if (this.running) {
      throw new Error('Benchmark is already running')
    }
    this.running = true

    const benchmarkPath = path.resolve(filepath)

    if (!await sander.exists(benchmarkPath)) {
      throw new Error('Benchmark file doesn՚t exist')
    }

    const outputPath = tempy.directory()

    this.emit('webpack')

    await webpack.compile(outputPath, benchmarkPath, debug)

    this.emit('server')

    const port = await this.server.start(outputPath)

    return new Promise((resolve, reject) => {
      this.chrome.once('complete', benchmark => {
        if (!devtools) {
          this._shutdown()
        }
        resolve(benchmark)
      })

      this.chrome.once('error', err => {
        if (!devtools) {
          this._shutdown()
        }
        reject(err)
      })

      this.emit('chrome')

      this.chrome.start(port, devtools)
    })
  }
}
