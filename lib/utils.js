'use strict'
const humanizeNumber = require('humanize-number')
const pluralize = require('pluralize')
const server = require('./server')
const browser = require('./browser')

exports.formatBenchmark = benchmark => {
  const ops = humanizeNumber(benchmark.hz.toFixed(benchmark.hz < 100 ? 2 : 0))
  const marginOfError = benchmark.stats.rme.toFixed(2)
  const runs = pluralize('run', benchmark.stats.sample.length, true)
  return `${ops} ops/sec ±${marginOfError}% (${runs} sampled)`
}

exports.gracefulExit = (didError = false) => {
  if (didError) {
    process.exitCode = 1
  }

  browser.stop()
  server.stop()
}
