import path from 'path'
import test from 'ava'
import execa from 'execa'

test('runs benchmark', async t => {
  const binPath = path.resolve(__dirname, '../lib/cli.js')
  const fixturePath = path.resolve(__dirname, 'fixtures/benchmark.js')

  const result = await execa(binPath, [fixturePath])

  t.regex(result.stdout, /[0-9,]+ ops\/sec ±[0-9.]+% \(\d+ runs sampled\)/)
})
