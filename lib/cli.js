#!/usr/bin/env node
'use strict'
const path = require('path')
const ora = require('ora')
const meow = require('meow')
const tempy = require('tempy')
const sander = require('sander')
const webpack = require('./webpack')
const server = require('./server')
const browser = require('./browser')
const { formatBenchmark } = require('./utils')

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

let spinner

function exit(didError = false) {
  if (didError) {
    process.exitCode = 1
  }

  browser.stop()
  server.stop()
}

async function main() {
  if (cli.input.length !== 1) {
    cli.showHelp()
    return
  }

  const { debug, devtools } = cli.flags
  const benchmarkPath = path.resolve(cli.input[0])

  if (!await sander.exists(benchmarkPath)) {
    console.error('Benchmark file doesn՚t exist')
    process.exitCode = 2
    return
  }

  const outputPath = tempy.directory()
  spinner = ora('Compiling bundle').start()

  await webpack.compile(outputPath, benchmarkPath, debug)

  spinner.text = 'Starting server'

  const port = await server.start(outputPath)

  spinner.text = 'Starting Chrome'

  browser.on('start', () => {
    spinner.text = 'Starting benchmark'
  })
  browser.on('progress', benchmark => {
    spinner.text = formatBenchmark(benchmark)
  })
  browser.on('close', () => exit())
  browser.on('complete', benchmark => {
    if (!devtools) {
      exit()
    }
    spinner.succeed(formatBenchmark(benchmark))
  })
  browser.on('error', err => {
    spinner.fail()
    console.error(err)
    exit(true)
  })

  await browser.start(port, devtools)
}

main().catch(err => {
  if (spinner) {
    spinner.fail()
  }
  console.error(err)
  exit(true)
})
