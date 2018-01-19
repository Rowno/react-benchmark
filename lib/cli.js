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
const { gracefulExit, formatBenchmark } = require('./utils')

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

  const outputPath = tempy.directory()
  spinner = ora('Compiling bundle').start()

  await webpack.compile(outputPath, userBenchmarkPath, cli.flags.debug)

  spinner.text = 'Starting server'

  const port = await server.start(outputPath)

  spinner.text = 'Starting Chrome'

  browser.on('start', () => {
    spinner.text = 'Starting benchmark'
  })
  browser.on('progress', benchmark => {
    spinner.text = formatBenchmark(benchmark)
  })
  browser.on('close', () => {
    gracefulExit()
  })
  browser.on('complete', benchmark => {
    spinner.succeed(formatBenchmark(benchmark))
    gracefulExit()
  })
  browser.on('error', err => {
    spinner.fail()
    console.error(err)
    gracefulExit(true)
  })

  await browser.start(port, cli.flags.devtools)
}

main().catch(err => {
  spinner.fail()
  console.error(err)
  gracefulExit(true)
})
