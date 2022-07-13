const path = require('path')
const test = require('ava')
const execa = require('execa')

const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

test('runs benchmark', async (t) => {
  const binPath = path.resolve(__dirname, '../lib/cli.js')
  const fixturePath = path.resolve(__dirname, 'fixtures/benchmark.js')

  const result = await execa(binPath, [fixturePath])

  t.regex(result.stdout, /[0-9,]+ ops\/sec ±[0-9.]+% \(\d+ runs sampled\)/)
})

test('throttles CPU', async (t) => {
  const getOpsSec = (resultString) => {
    return parseInt(
      resultString.match(/([\d,]+) ops\/sec/)[1].replace(/,/g, '')
    )
  }
  const binPath = path.resolve(__dirname, '../lib/cli.js')
  const fixturePath = path.resolve(__dirname, 'fixtures/benchmark.js')

  const woutT = (await execa(binPath, [fixturePath])).stdout
  await sleep(100) // sometimes port is still in use
  const withT = (await execa(binPath, [fixturePath, '--cpuThrottle=4'])).stdout

  // difference should be more then 2 times
  t.assert(
    getOpsSec(woutT) - getOpsSec(withT) > getOpsSec(woutT) / 2,
    'The difference between throttled and not throttled execution is less then normal'
  )
})
