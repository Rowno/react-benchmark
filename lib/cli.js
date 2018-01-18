#!/usr/bin/env node
'use strict'
const path = require('path')
const puppeteer = require('puppeteer')
const express = require('express')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ora = require('ora')
const pluralize = require('pluralize')
const humanizeNumber = require('humanize-number')
const meow = require('meow')
const tempy = require('tempy')
const sander = require('sander')
const getPort = require('get-port')

const outputPath = tempy.directory()
let server
let browser
let spinner

const cli = meow({
  help: `
  	Usage
  	  $ react-benchmark <path>

    Options
  	  <path>          Path to a JavaScript file that exports the function to be benchmarked.
      --debug, -d     Run a development build instead of a production build to aid debugging.
      --devtools, -t  Run Chrome in windowed mode with the devtools open.
      --version       Prints the version.
      --help          Prints this message.

  	Examples
  	  $ react-benchmark benchmark.js
  `.trim(),
  flags: {
    debug: {
      type: 'boolean',
      default: false,
      alias: 'd'
    },
    devtools: {
      type: 'boolean',
      default: false,
      alias: 't'
    }
  }
})

function compile(userBenchmarkPath, debug) {
  return new Promise((resolve, reject) => {
    const plugins = [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(debug ? 'development' : 'production')
        }
      }),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new HtmlWebpackPlugin()
    ]

    if (!debug) {
      plugins.push(new webpack.optimize.UglifyJsPlugin({ sourceMap: true }))
    }

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
          bundle: path.join(__dirname, 'client/index.js')
        },
        output: {
          path: outputPath,
          filename: '[name].js'
        },
        plugins,
        module: {
          noParse: [/node_modules\/benchmark\//],
          rules: [
            {
              test: /\.js$/,
              exclude: path =>
                path.includes('node_modules') &&
                !path.includes('/react-benchmark/lib/'), // Don't exclude ourselves 😆
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
  if (cli.input.length !== 1) {
    cli.showHelp()
    return
  }

  const userBenchmarkPath = path.resolve(cli.input[0])

  if (!await sander.exists(userBenchmarkPath)) {
    cli.showHelp()
    return
  }

  spinner = ora('Compiling bundle').start()

  await compile(userBenchmarkPath, cli.flags.debug)

  spinner.text = 'Starting server'

  const port = await getPort()
  const app = express()
  app.use(express.static(outputPath))
  server = app.listen(port)

  spinner.text = 'Starting Chrome'

  browser = await puppeteer.launch({ devtools: cli.flags.devtools })
  const page = await browser.newPage()

  browser.on('disconnected', () => {
    browser = null
    gracefulExit()
  })
  browser.on('targetdestroyed', async target => {
    try {
      if ((await target.page()) === page) {
        gracefulExit()
      }
    } catch (err) {
      // Workaround target.page() throwing an error when Chrome is closing
      if (!err.message.includes('No target with given id found undefined')) {
        throw err
      }
    }
  })

  page.on('console', msg => console.log(`console.${msg.type()}:`, msg.text()))
  page.on('pageerror', err => {
    spinner.fail()
    console.error(err.message)
    gracefulExit(true)
  })
  page.on('requestfailed', request => {
    spinner.fail()
    console.error(request.failure().errorText, request.url())
    gracefulExit(true)
  })

  page.exposeFunction('benchmarkProgress', data => {
    const benchmark = JSON.parse(data)
    spinner.text = formatBenchmark(benchmark)
  })

  page.exposeFunction('benchmarkComplete', data => {
    const benchmark = JSON.parse(data)
    spinner.succeed(formatBenchmark(benchmark))

    if (!cli.flags.devtools) {
      gracefulExit()
    }
  })

  spinner.text = 'Starting benchmark'

  await page.goto(`http://localhost:${port}`)
}

main().catch(err => {
  spinner.fail()
  console.error(err)
  gracefulExit(true)
})
