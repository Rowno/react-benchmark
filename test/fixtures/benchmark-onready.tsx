import React, { useState, useEffect } from 'react'

type BenchmarkProps = {
  onReady: () => void
}

const BenchmarkOnReady: React.FC<BenchmarkProps> = ({ onReady }) => {
  if (!onReady) {
    throw new Error('onReady has not been passed from react-benchmark')
  }
  const NODES_COUNT = 2
  const [nodes, setNodes] = useState<React.ReactNode[]>([])
  const getNodes = (numberOfNodes: number, page: number) => {
    const newNodes: React.ReactNode[] = []
    for (let i = numberOfNodes * (page + 1); i > numberOfNodes * page; i--) {
      newNodes.push(
        <p key={i}>
          {i} bottles of beer on the wall
          <br />
          {i} bottles of beer!
          <br />
          Take one down, pass it around
          <br />
          {i - 1} bottles of beer on the wall!
        </p>
      )
    }
    return newNodes
  }
  const addDefferedNodes = (
    nodesCount: number,
    page: number,
    timeout: number
  ) => {
    setTimeout(() => {
      setNodes((n) => [...n, ...getNodes(nodesCount, page)])
    }, timeout)
  }

  useEffect(() => {
    addDefferedNodes(NODES_COUNT, 1, 1)
  })
  useEffect(() => {
    if (nodes.length === NODES_COUNT) {
      onReady()
    }
  }, [nodes, onReady])
  return <div>{nodes}</div>
}

export default BenchmarkOnReady
