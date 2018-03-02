import path from 'path'
import test from 'ava'
import execa from 'execa'

const CLI_PATH = path.resolve(__dirname, '../lib/cli.js')

test('runs benchmark', async t => {
  const result = await execa(CLI_PATH, ['test/fixtures/benchmark.js'])
  t.false(result.failed)
  t.true(result.stderr.includes('runs sampled'))
})
