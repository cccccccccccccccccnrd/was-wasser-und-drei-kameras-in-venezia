const socket = new WebSocket('ws://localhost:1717')
const canvas = document.querySelector('#visualization')
const canvasCtx = canvas.getContext('2d')
const timer = document.querySelector('#timer')

let keys = []

/* websocket handeling */
socket.addEventListener('message', event => {
  const poses = JSON.parse(event.data)

  restartInterval()

  poses.forEach(pose => {
    visualize(pose.keypoints)
  })
})

/* drawing data onto canvas */
function visualize (keypoints, scale = 1) {
  for (let i = 0; i <= 0; i++) {
    const keypoint = keypoints[i]

    if (keypoint.score < 0.1) {
      continue
    }

    const { y, x } = keypoint.position

    canvasCtx.beginPath()
    canvasCtx.arc(x * scale, y * scale, 3, 0, 2 * Math.PI)
    canvasCtx.fillStyle = 'rgba(0, 0, 0, 1)'
    canvasCtx.fill()
  }
}

function restartInterval() {
  canvasCtx.fillStyle = 'rgba(255, 255, 255, 1)'
  canvasCtx.fillRect(0, 0, 1280, 720)

  const duration = 2000 + 500
  let time = duration

  const countdown = setInterval(() => {
    time = time - 10
    timer.innerText = time
  }, 10)

  setTimeout(() => {
    timer.innerText = '0'
    clearInterval(countdown)
  }, duration)
}