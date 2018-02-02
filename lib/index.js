'use strict'
const path = require('path')
const tempy = require('tempy')
const sander = require('sander')
const webpack = require('./webpack')
const server = require('./server')
const chrome = require('./chrome')

function shutdown() {
  chrome.stop()
  server.stop()
}

module.exports = async (filepath, { debug = false, devtools = false } = {}) => {
  const benchmarkPath = path.resolve(filepath)

  if (!await sander.exists(benchmarkPath)) {
    throw new Error('Benchmark file doesn՚t exist')
  }

  const outputPath = tempy.directory()

  await webpack.compile(outputPath, benchmarkPath, debug)

  const port = await server.start(outputPath)

  return new Promise((resolve, reject) => {
    chrome.on('close', () => shutdown())
    chrome.on('complete', benchmark => {
      if (!devtools) {
        shutdown()
      }
      resolve(benchmark)
    })
    chrome.on('error', err => {
      shutdown()
      reject(err)
    })

    chrome.start(port, devtools)
  })
}
