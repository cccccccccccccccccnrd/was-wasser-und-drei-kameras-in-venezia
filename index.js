const express = require('express')
const WebSocket = require('ws')

const five = require('johnny-five')
const board = new five.Board({
  port: 'COM5'
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
board.on('ready', () => {
  const controller = five.Motor.SHIELD_CONFIGS.ADAFRUIT_V1

  const motor = new five.Motor(controller.M1)

  /* global state */
  let state = {
    pose: {},
    motor: 50
  }

  communicate()

  /* communication to arduino */
  function communicate () {
    if (state.motor) {
      motor.forward(state.motor)
    }
  }

  /* state manipulation through pose evaluation */
  function evaluatePose () {
<<<<<<< HEAD
    if (state.pose.keypoints[4].score > 0.2) {
      // state.relay = true
      state.motor = 100
=======
    if (state.pose.keypoints[10].score > 0.2) {
      state.relay = true
>>>>>>> 2a7ee4f8352734bf7aae941b1348978943280049
      communicate()
    } else {
      // state.relay = false
      state.motor = 50
      communicate()
    }
  }

  /* incoming pose estimation from streaming server */
  webSocketServer.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      webSocketServer.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message)
        }
      })

      const pose = JSON.parse(message)

      state.pose = pose
      evaluatePose()
    })
  })
})