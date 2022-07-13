#!/usr/bin/env node
'use strict'
require('source-map-support').install()
const ora = require('ora')
const meow = require('meow')
const formatBenchmark = require('./format-benchmark')
const ReactBenchmark = require('.')

const cli = meow({
  help: `
Usage
  $ react-benchmark <path>

Options
  <path>          Path to a JavaScript or TypeScript file that exports the function to be benchmarked.
  --debug, -d     Run a development build instead of a production build to aid debugging.
  --devtools, -t  Run Chrome in windowed mode with the devtools open.
  --cpuThrottle=X Run Chrome with CPU throttled X times.
  --version       Prints the version.
  --help          Prints this message.

Examples
  $ react-benchmark benchmark.js
  `.trim(),
  flags: {
    debug: {
      type: 'boolean',
      default: false,
      alias: 'd',
    },
    devtools: {
      type: 'boolean',
      default: false,
      alias: 't',
    },
    cpuThrottle: {
      type: 'number',
      default: 1,
    },
  },
})

let spinner

async function main() {
  if (cli.input.length !== 1) {
    cli.showHelp()
    return
  }

  const [filepath] = cli.input
  const { debug, devtools, cpuThrottle } = cli.flags

  spinner = ora().start()

  const reactBenchmark = new ReactBenchmark()

  reactBenchmark.on('webpack', () => {
    // Add trailing spaces so that if ts-loader console.log's something it's easier to read
    spinner.text = 'Compiling bundle  '
  })

  reactBenchmark.on('server', () => {
    spinner.text = 'Starting server  '
  })

  reactBenchmark.on('chrome', () => {
    spinner.text = 'Starting Chrome  '
  })

  reactBenchmark.on('start', () => {
    spinner.text = 'Starting benchmark  '
  })

  reactBenchmark.on('progress', (benchmark) => {
    spinner.text = formatBenchmark(benchmark)
  })

  reactBenchmark.on('console', (log) => {
    spinner.clear()
    // Log to stderr so that stdout only contains the final output
    console.error(`console.${log.type}: ${log.text}`)
    spinner.render()
  })

  const result = await reactBenchmark.run(filepath, {
    debug,
    devtools,
    cpuThrottle,
  })

  spinner.stop()
  console.log(formatBenchmark(result))
}

main().catch((error) => {
  if (spinner) {
    spinner.fail()
  }

  console.error(error)
  process.exitCode = 1
})
