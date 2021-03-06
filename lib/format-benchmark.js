'use strict'
const humanizeNumber = require('humanize-number')
const pluralize = require('pluralize')

module.exports = (benchmark) => {
  const ops = benchmark.hz // Can be null on the first run if it executes really quickly
    ? humanizeNumber(benchmark.hz.toFixed(benchmark.hz < 100 ? 2 : 0))
    : 0
  const marginOfError = benchmark.stats.rme.toFixed(2)
  const runs = pluralize('run', benchmark.stats.sample.length, true)
  return `${ops} ops/sec ±${marginOfError}% (${runs} sampled)`
}
