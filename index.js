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
  // const motor_1 = new five.Servo(9)
  // const motor_2 = new five.Servo(10)
  // const motor_3 = new five.Servo(11)

  const relay_1 = new five.Relay({
    pin: 10, 
    type: 'NC'
  })

  const relay_2 = new five.Relay({
    pin: 11, 
    type: 'NC'
  })

  /* global state */
  let state = {
    pose: {},
    motor_1: false,
    motor_2: false,
    motor_3: false
  }

  function move(motor) {
    const from = 0
    const to = 180
    const t = 500

    motor.open()

    setTimeout(() => {
      motor.close()
    }, t)

    // motor.sweep()

    /* setTimeout(() => {
      motor.to(to, t)
    }, t) */ 
  }

  /* communication to arduino */
  function communicate () {
    if (state.motor_1) {
      move(relay_1)
      // motor_2.stop()
      // motor_3.stop()
    } else if (state.motor_2) {
      move(relay_2)
      // motor_1.stop()
      // motor_3.stop()
    } else if (state.motor_3) {
      move(motor_3)
      // motor_1.stop()
      // motor_2.stop()
    } else if (!state.motor_1 && !state.motor_2 && !state.motor_3) {
      // motor_1.stop()
      // motor_2.stop()
      // motor_3.stop()
    }
  }

  /* state manipulation through pose evaluation */
  function evaluatePose () {
    console.log(state)
    console.log(state.pose.keypoints[0].position.x)

    const width = 600

    if (state.pose.keypoints[0].position.x < 0) {
      state.in_frame = false
    } else {
      state.in_frame = true
    }

    if (state.pose.keypoints[0].score < 0.3) {
      state.motor_1 = false
      state.motor_2 = false
      state.motor_3 = false

      communicate()
    } else if (state.pose.keypoints[0].position.x > 0 && state.pose.keypoints[0].position.x < width / 2) {
      state.motor_1 = true
      state.motor_2 = false

      communicate()
    } else if (state.pose.keypoints[0].position.x > width / 2 && state.pose.keypoints[0].position.x < width) {
      state.motor_1 = false
      state.motor_2 = true

      communicate()
    }

    /* if (state.pose.keypoints[0].score < 0.3) {
      state.motor_1 = false
      state.motor_2 = false
      state.motor_3 = false

      communicate()
    } else if (state.pose.keypoints[0].position.x > 0 && state.pose.keypoints[0].position.x < width / 3) {
      state.motor_1 = true
      state.motor_2 = false
      state.motor_3 = false

      communicate()
    } else if (state.pose.keypoints[0].position.x > width / 3 && state.pose.keypoints[0].position.x < width / 3 + width / 3) {
      state.motor_1 = false
      state.motor_2 = true
      state.motor_3 = false

      communicate()
    } else if (state.pose.keypoints[0].position.x > width / 3 + width / 3 && state.pose.keypoints[0].position.x < width) {
      state.motor_1 = false
      state.motor_2 = false
      state.motor_3 = true

      communicate()
    } */
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