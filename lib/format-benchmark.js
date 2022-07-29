'use strict'
const humanizeNumber = require('humanize-number')
const pluralize = require('pluralize')

/**
 * Computes the arithmetic mean of a sample.
 * https://github.com/bestiejs/benchmark.js/blob/42f3b732bac3640eddb3ae5f50e445f3141016fd/benchmark.js
 * @private
 * @param {Array} sample The sample.
 * @returns {number} The mean.
 */
function getMean(sample = []) {
  return sample.reduce((sum, x) => sum + x, 0) / sample.length
}

function bytesToSize(bytes) {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes == 0) return '0 Byte'
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
}

/**
 * T-Distribution two-tailed critical values for 95% confidence.
 * For more info see http://www.itl.nist.gov/div898/handbook/eda/section3/eda3672.htm.
 */
const tTable = {
  1: 12.706,
  2: 4.303,
  3: 3.182,
  4: 2.776,
  5: 2.571,
  6: 2.447,
  7: 2.365,
  8: 2.306,
  9: 2.262,
  10: 2.228,
  11: 2.201,
  12: 2.179,
  13: 2.16,
  14: 2.145,
  15: 2.131,
  16: 2.12,
  17: 2.11,
  18: 2.101,
  19: 2.093,
  20: 2.086,
  21: 2.08,
  22: 2.074,
  23: 2.069,
  24: 2.064,
  25: 2.06,
  26: 2.056,
  27: 2.052,
  28: 2.048,
  29: 2.045,
  30: 2.042,
  infinity: 1.96,
}

/** https://github.com/bestiejs/benchmark.js/blob/42f3b732bac3640eddb3ae5f50e445f3141016fd/benchmark.js */
function getRme(sample, mean) {
  const varOf = function (sum, x) {
    return sum + Math.pow(x - mean, 2)
  }
  // Compute the sample variance (estimate of the population variance).
  const variance = sample.reduce(varOf, 0) / (sample.length - 1) || 0
  // Compute the sample standard deviation (estimate of the population standard deviation).
  const sd = Math.sqrt(variance)
  // Compute the standard error of the mean (a.k.a. the standard deviation of the sampling distribution of the sample mean).
  const sem = sd / Math.sqrt(sample.length)
  // Compute the degrees of freedom.
  const df = sample.length - 1
  // Compute the critical value.
  const critical = tTable[Math.round(df) || 1] || tTable.infinity
  // Compute the margin of error.
  const moe = sem * critical
  // Compute the relative margin of error.
  const rme = (moe / mean) * 100 || 0
  return rme
}

module.exports = (benchmark, heapSizeMeasurements, objectCountMeasurements) => {
  const ops = benchmark.hz // Can be null on the first run if it executes really quickly
    ? humanizeNumber(benchmark.hz.toFixed(benchmark.hz < 100 ? 2 : 0))
    : 0
  const marginOfError = benchmark.stats.rme.toFixed(2)
  const runs = pluralize('run', benchmark.stats.sample.length, true)
  let s = `${runs} sampled: ${ops} ops/sec ±${marginOfError}%`
  if (heapSizeMeasurements && heapSizeMeasurements.length) {
    const averageRam = getMean(heapSizeMeasurements)
    const ramMarginOfError = getRme(heapSizeMeasurements, averageRam).toFixed(2)
    s += ` / RAM: ${bytesToSize(averageRam)} ±${ramMarginOfError}%`
  }
  if (objectCountMeasurements && objectCountMeasurements.length) {
    const averageObjectsCount = getMean(objectCountMeasurements)
    const objectsCountMarginOfError = getRme(
      objectCountMeasurements,
      averageObjectsCount
    ).toFixed(2)
    s += ` / Objects: ${averageObjectsCount.toFixed(
      0
    )} ±${objectsCountMarginOfError}%`
  }
  return s
}
