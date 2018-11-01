const express = require('express')
const WebSocket = require('ws')

const five = require('johnny-five')
const board = new five.Board({
  // port: 'COM5'
})

/* stream server setup */
const streamServerSettings = {
  port: 3000,
  staticPath: 'stream'
}
const streamServer = express()

streamServer.use(express.static(streamServerSettings.staticPath))
streamServer.listen(streamServerSettings.port)
console.log('streaming server is running on http://localhost:' + streamServerSettings.port)

/* visualization server setup */
const visualizationServerSettings = {
  port: 3001,
  staticPath: 'visualization'
}
const visualizationServer = express()

visualizationServer.use(express.static(visualizationServerSettings.staticPath))
visualizationServer.listen(visualizationServerSettings.port)
console.log('visualization server is running on http://localhost:' + visualizationServerSettings.port)

/* websocket server setup */
const webSocketServer = new WebSocket.Server({ port: 1717 })

/* initialize arduino board */
board.on('ready', function() {
  this.pinMode(9, five.Pin.PWM)
  this.pinMode(10, five.Pin.PWM)

  /* global state */
  let state = {
    board: this,
    poses: [],
    left: [],
    right: []
  }

  /* communication to arduino */
  function communicate () {
    const self = state.board
    const speedBase = 75
    const speedForEach = 25
    const speedMax = 255

    if (state.left.length === 0 && state.right.length === 0) return

    if (state.left.length === 0) {
      self.analogWrite(9, 0)
      self.analogWrite(10, Math.min(speedBase + state.right.length * speedForEach, speedMax))
    } else if (state.right.length === 0) {
      self.analogWrite(9, Math.min(speedBase + state.left.length * speedForEach, speedMax))
      self.analogWrite(10, 0)
    } else {
      self.analogWrite(9, Math.min(speedBase + state.left.length * speedForEach, speedMax))
      self.analogWrite(10, Math.min(speedBase + state.right.length * speedForEach, speedMax))
    }

    setTimeout(() => {
      self.analogWrite(9, 0)
      self.analogWrite(10, 0)
    }, 100)
  }

  /* state manipulation through pose evaluation */
  function evaluatePoses () {
    const width = 600

    const positions = state.poses.map(pose => Math.floor(pose.keypoints[0].position.x))

    const left = positions.filter(pose => pose > width / 2)
    const right = positions.filter(pose => pose < width / 2)

    console.log(left, right)

    state.left = left
    state.right = right

    communicate()
  }

  /* incoming pose estimation from streaming server */
  webSocketServer.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      webSocketServer.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      })

      const poses = JSON.parse(message)

      state.poses = poses
      evaluatePoses()
    })
  })
})