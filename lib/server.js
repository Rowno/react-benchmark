'use strict'
const express = require('express')
const getPort = require('get-port')

module.exports = class Server {
  constructor() {
    this.server = null
  }

  async start(assetsPath) {
    const port = await getPort()
    const app = express()

    app.use(express.static(assetsPath))

    return new Promise(resolve => {
      this.server = app.listen(port, () => resolve(port))
    })
  }

  stop() {
    return new Promise(resolve => {
      if (this.server) {
        this.server.close(() => {
          this.server = null
          resolve()
        })
      } else {
        resolve()
      }
    })
  }
}
