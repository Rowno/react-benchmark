#!/usr/bin/env node
'use strict'
const path = require('path')
const puppeteer = require('puppeteer')
const express = require('express')
const webpack = require('webpack')
const logUpdate = require('log-update')
const pluralize = require('pluralize')
const humanizeNumber = require('humanize-number')
const meow = require('meow')
const tempy = require('tempy')
const cpFile = require('cp-file')

const PORT = 9010
const outputPath = tempy.directory()
let server
let browser

const cli = meow(`
	Usage
	  $ react-benchmark <path>

  Options
	  <path> Path to a JavaScript file that exports the function to be benchmarked.

	Examples
	  $ react-benchmark benchmark.js
`)

const userBenchmarkPath = path.resolve(cli.input[0])

function compile() {
  return new Promise((resolve, reject) => {
    webpack(
      {
        devtool: 'source-map',
        context: __dirname,
        resolve: {
          alias: {
            'react-benchmark-user-benchmark': userBenchmarkPath
          }
        },
        entry: {
          compiled: path.join(__dirname, 'client/index.js')
        },
        output: {
          path: outputPath,
          filename: '[name].js'
        },
        plugins: [
          new webpack.DefinePlugin({
            'process.env': {
              NODE_ENV: JSON.stringify('production')
            }
          }),
          new webpack.optimize.ModuleConcatenationPlugin(),
          new webpack.optimize.UglifyJsPlugin({ sourceMap: true })
        ],
        module: {
          noParse: [/node_modules\/benchmark/],
          rules: [
            {
              test: /\.js$/,
              exclude: /node_modules/,
              loader: 'babel-loader'
            }
          ]
        }
      },
      (err, stats) => {
        const info = stats.toJson()

        if (stats.hasWarnings()) {
          console.warn(info.warnings)
        }

        if (err || stats.hasErrors()) {
          return reject(err || info.errors[0])
        }

        resolve()
      }
    )
  })
}

function formatBenchmark(benchmark) {
  const ops = humanizeNumber(benchmark.hz.toFixed(benchmark.hz < 100 ? 2 : 0))
  const marginOfError = benchmark.stats.rme.toFixed(2)
  const runs = pluralize('run', benchmark.stats.sample.length, true)
  return `${ops} ops/sec ±${marginOfError}% (${runs} sampled)`
}

function gracefulExit(didError = false) {
  if (didError) {
    process.exitCode = 1
  }

  if (browser) {
    browser.close()
  }

  if (server) {
    server.close()
  }
}

async function main() {
  logUpdate('Compiling bundle...')

  await Promise.all([
    cpFile(
      path.join(__dirname, 'client/index.html'),
      path.join(outputPath, 'index.html')
    ),
    compile()
  ])

  logUpdate('Starting server...')

  const app = express()
  app.use(express.static(outputPath))
  server = app.listen(PORT)

  logUpdate('Starting Chrome...')

  browser = await puppeteer.launch({ devtools: false })
  const page = await browser.newPage()

  page.on('console', msg => console.log(`console.${msg.type()}:`, msg.text()))
  page.on('pageerror', err => {
    console.error('pageerror:', err.message)
    gracefulExit(true)
  })
  page.on('requestfailed', request => {
    console.error(request.failure().errorText, request.url())
    gracefulExit(true)
  })

  page.exposeFunction('benchmarkProgress', data => {
    const benchmark = JSON.parse(data)
    logUpdate(formatBenchmark(benchmark))
  })

  page.exposeFunction('benchmarkComplete', data => {
    const benchmark = JSON.parse(data)
    logUpdate(formatBenchmark(benchmark))

    logUpdate.done()

    gracefulExit()
  })

  await page.goto(`http://localhost:${PORT}`)
}

main().catch(err => {
  console.error(err)
  gracefulExit(true)
})
