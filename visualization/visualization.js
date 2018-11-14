const socket = new WebSocket('ws://192.168.2.98:1717')
/* const canvas = document.querySelector('#visualization')
const canvasCtx = canvas.getContext('2d')
const timer = document.querySelector('#timer') */
const api = document.querySelector('#api')


let keys = []
let state = {
  left: [],
  right: []
}

/* websocket handeling */
socket.addEventListener('message', event => {
  const poses = JSON.parse(event.data)
  evaluatePoses(poses)

  /* restartInterval()

  poses.forEach(pose => {
    visualize(pose.keypoints)
  }) */
})

function evaluatePoses (poses) {
  const width = 1280
  const overlap = 150

  const positions = poses.map(pose => Math.floor(pose.keypoints[0].position.x))

  const left = positions.filter(position => position < width / 2 + overlap)
  const right = positions.filter(position => position > width / 2 - overlap)

  console.log(left, right)

  state.left = left
  state.right = right

  api.innerText = JSON.stringify(state, null, 2)
}

/* drawing data onto canvas */
function visualize (keypoints, scale = 1) {
  for (let i = 0; i <= 0; i++) {
    const keypoint = keypoints[i]

    if (keypoint.score < 0.1) {
      continue
    }

    const { y, x } = keypoint.position

    canvasCtx.beginPath()
    canvasCtx.arc(x * scale, y * scale, 8, 0, 2 * Math.PI)
    canvasCtx.fillStyle = 'rgba(255, 255, 255, 1)'
    canvasCtx.fill()
  }
}

function restartInterval() {
  canvasCtx.fillStyle = 'rgba(0, 0, 0, 1)'
  canvasCtx.fillRect(0, 0, 1280, 720)

  const duration = 5 * 1000 + 1000
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