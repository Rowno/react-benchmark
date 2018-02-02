#!/usr/bin/env node
'use strict'
const ora = require('ora')
const meow = require('meow')
const { formatBenchmark } = require('./utils')
const Benchmark = require('./index')

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

  const filepath = cli.input[0]
  const { debug, devtools } = cli.flags

  spinner = ora().start()

  const benchmark = new Benchmark()

  benchmark.on('webpack', () => {
    spinner.text = 'Compiling bundle'
  })

  benchmark.on('server', () => {
    spinner.text = 'Starting server'
  })

  benchmark.on('chrome', () => {
    spinner.text = 'Starting Chrome'
  })

  benchmark.on('start', () => {
    spinner.text = 'Starting benchmark'
  })

  benchmark.on('progress', benchmark => {
    spinner.text = formatBenchmark(benchmark)
  })

  const result = await benchmark.run(filepath, { debug, devtools })

  spinner.succeed(formatBenchmark(result))
}

main().catch(err => {
  if (spinner) {
    spinner.fail()
  }
  console.error(err)
  process.exitCode = 1
})
