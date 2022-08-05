const path = require('path')
const test = require('ava')
const execa = require('execa')

test('runs benchmark', async (t) => {
  const binPath = path.resolve(__dirname, '../lib/cli.js')
  const fixturePath = path.resolve(__dirname, 'fixtures/benchmark.js')

  const result = await execa(binPath, [fixturePath])

  t.regex(result.stdout, /\d+ runs sampled: [0-9,]+ ops\/sec ±[0-9.]+%/)
})

test('measures RAM', async (t) => {
  const binPath = path.resolve(__dirname, '../lib/cli.js')
  const fixturePath = path.resolve(__dirname, 'fixtures/benchmark.js')

  const result = await execa(binPath, [fixturePath, '-r'])

  t.regex(
    result.stdout,
    /\d+ runs sampled: [0-9,]+ ops\/sec ±[0-9.]+% \/ RAM: [0-9]+ MB ±[0-9.]+% \/ Objects: [0-9]+ ±[0-9.]+%/
  )
})
