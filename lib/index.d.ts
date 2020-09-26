import Benchmark from 'benchmark'
import EventEmitter from 'events'

export interface Log {
  type: string
  text: string
}

export interface RunOptions {
  /**
   * Run a development build instead of a production build to aid debugging.
   * @default false
   */
  debug?: boolean
  /**
   * Run Chrome in windowed mode with the devtools open.
   * @default false
   */
  devtools?: boolean
}

export default class ReactBenchmark extends EventEmitter {
  /**
   * Starts the benchmark.
   * @param filepath Path to the benchmark file to run.
   * @param options Optional object containing additional options.
   * @returns A Promise that will resolve to a [Benchmark](https://benchmarkjs.com/docs) object containing the stats once the benchmark has been completed.
   */
  run(filepath: string, options?: RunOptions): Promise<Benchmark>

  /** Fired when the Webpack build has started. */
  on(event: 'webpack', callback: () => void): void
  /** Fired when the webserver has started. */
  on(event: 'server', callback: () => void): void
  /** Fired when Chrome has launched. */
  on(event: 'chrome', callback: () => void): void
  /** Fired when the actual benchmark starts. */
  on(event: 'start', callback: () => void): void
  /** Fired every time a benchmark cycle has been completed. */
  on(event: 'progress', callback: (benchmark: Benchmark) => void): void
  /** Fired every time something is logged to Chrome՚s console. */
  on(event: 'console', callback: (log: Log) => void): void
}
