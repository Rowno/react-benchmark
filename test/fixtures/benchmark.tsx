import React from 'react'

console.warn('log message')

interface Props {
  callback?: () => void
}

const Benchmark: React.FC<Props> = ({ callback }: Props) => {
  return <div ref={callback}>Test</div>
}

export default Benchmark
