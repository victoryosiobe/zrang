let canvas, x, y, center, NBallInterval, HPBallInterval, frozenScore,
  frozenHealth = 100,
  frozenDynTime = 1500,
  frozenDynTimeDecay = 10,
  frozenDynTimeLimit = 500,
  frozenRadius = 15,
  frozenSpeed = 2,
  frozenHPBallTime = 300,
  frozenMultiGen = 5,
  frozenMultiGenIncrement = 0.5,
  frozenMultiGenLimit = 20,
  frozenDamage = 10,
  frozenMemoryClearTime = 1000,
  frozenShift = 60,
  frozenAIReleaseScore = 100,
  frozenPositiveBallRadius = 10,
  frozenPositiveBallSpeed = 8,
  frozenNearStrikeDistance = 5,
  health = frozenHealth,
  dynTime = frozenDynTime,
  mainRadius = frozenRadius,
  speed = frozenSpeed,
  shift = frozenShift,
  HPBallTime = frozenHPBallTime,
  PColor = "#0068FF",
  AIColor = "#00A9FF",
  NABallColor = "#FF0036",
  PPBallColor = "#0068FF",
  AIBallColor = "#00A9FF",
  score = 0,
  multiGen = 0,
  pauseSignal = false,
  endGameSignal = false,
  NBallArr = [],
  PBallArr = [],
  HPBallArr = []

canvas = document.getElementById('can')
canvas.addEventListener("click", click)
canvas.width = window.innerWidth
canvas.height = window.innerHeight
const ctx = canvas.getContext('2d');
center = { //center of canvas
  x: canvas.width / 2,
  y: canvas.height / 2
}

let player = new Player(center.x, center.y, mainRadius, PColor) //main ball
let Hplayer = new AI(center.x, center.y, mainRadius, AIColor, shift) //helper ball
let displayX = new display() //other elements not part of game

function init() {
  setInterval(NABallGen, dynTime) //generate negative ball on interval
  setInterval(HPBallGen, HPBallTime) //generate helper ball on interval
  animate(); // Start the animation
  memoryHandler() //handle game memory
}

function click(e) {
  pauseClick(e.x, e.y)
  if (!endGameSignal) {
    PPBallGen(e.x, e.y) //generate 
  } else restartClick(e.x, e.y)
}
//✅
function Player(x, y, radius, color) { //Player, You
  this.x = center.x
  this.y = center.y
  this.radius = radius
  this.color = color
  this.draw = function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Draw the ball
    ctx.lineWidth = 2
    ctx.fillStyle = this.color
    ctx.fill()
    ctx.closePath();
  }
  this.update = function() {
    const collideFnX = collideFn.bind(this)
    collideFnX((index) => {
      health -= frozenDamage
      NBallArr[index].stopDraw = true
    }, this.radius)
    this.draw()
  }
}
//✅
function AI(x, y, radius, color, shift) { //helper, AI
  this.shift = shift
  this.x = center.x
  this.y = center.y - this.shift
  this.radius = radius
  this.color = color
  this.target = { x: 0, y: 0 }
  this.draw = function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Draw the ball
    ctx.lineWidth = 2
    ctx.fillStyle = this.color
    ctx.fill()
    ctx.closePath();
  }
  this.update = function() {
    const collideFnX = collideFn.bind(this)
    collideFnX((index) => {
      NBallArr[index].stopDraw = true
    }, this.radius)
    this.draw()
  }
}
//✅
function HPBall(x, y, radius, speed, color, shift) { //helper positive ball
  this.shift = shift
  this.x = x
  this.y = y - this.shift
  this.radius = radius
  this.speed = speed
  this.color = color
  this.deleteReady = false
  this.target = { x: undefined, y: undefined }
  const hasTarget = () => (this.target.x === undefined && this.target.y === undefined) ? false : true

  this.draw = function() {
    if (this.stopDraw) return
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Draw the ball
    ctx.lineWidth = 2
    ctx.fillStyle = this.color
    ctx.fill()
    ctx.closePath();
  }

  this.AITarget = function() {
    if (NBallArr.length > 0 && !hasTarget()) { //find target on random
      const NBallArrFiltered = NBallArr.filter(_ => _.x !== undefined || _.y !== undefined)
      if (NBallArrFiltered.length > 0) {
        const NBallElem = NBallArrFiltered[Math.floor(Math.random() * NBallArrFiltered.length)]
        this.target.x = NBallElem.x
        this.target.y = NBallElem.y
      }
    }

    const travelInDirection = () => {
      if (!hasTarget()) {
        this.stopDraw = true
        return
      }
      const dx = this.target.x - center.x
      const dy = this.target.y - (center.y - this.shift)
      const dist = distance(this.target.x, this.target.y, center.x, (center.y - this.shift))
      const angle = calcAngleDegrees(dx, dy)
      this.x += this.speed * Math.cos(angle);
      this.y += this.speed * Math.sin(angle);
      this.draw()
    }

    const collideFnX = collideFn.bind(this)
    if (hasTarget()) collideFnX((index) => {
      score++
      NBallArr[index].stopDraw = true
      this.stopDraw = true
    }, this.radius)

    const strayBallFnX = strayBallFn.bind(this)
    if (hasTarget()) strayBallFnX(() => {
      this.stopDraw = true
    }, this.radius)

    travelInDirection()

    if (this.stopDraw) {
      this.x = undefined
      this.y = undefined
      this.deleteReady = true
    }
  }
}
//✅
function PPBall(x2, y2, radius, speed, color) { //Player Positive ball
  this.x = center.x
  this.y = center.y
  this.target = { x: 0, y: 0 }
  this.target.x = x2
  this.target.y = y2
  this.radius = radius
  this.speed = speed
  this.color = color
  this.stopDraw = false
  this.deleteReady = false

  this.draw = function() {
    if (this.stopDraw) return
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Draw the ball
    ctx.lineWidth = 2
    ctx.fillStyle = this.color
    ctx.fill()
    ctx.closePath();
  }

  this.moveToTarget = function() {
    const collideFnX = collideFn.bind(this)
    collideFnX((index) => {
      ++score
      NBallArr[index].stopDraw = true
      this.stopDraw = true
    }, this.radius)

    const strayBallFnX = strayBallFn.bind(this)
    strayBallFnX(() => {
      this.stopDraw = true
    }, this.radius)

    const dx = this.target.x - center.x
    const dy = this.target.y - center.y
    //const dist = distance(this.target.x, this.target.y, center.x, center.y)
    const angle = calcAngleDegrees(dx, dy)
    this.x += this.speed * Math.cos(angle);
    this.y += this.speed * Math.sin(angle);
    this.draw()

    if (this.stopDraw) {
      this.x = undefined
      this.y = undefined
      this.deleteReady = true
    }
  }
}
//✅
function NABall(x, y, radius, speed, color) { //negative automatic ball
  this.x = x
  this.y = y
  this.radius = radius
  this.speed = speed
  this.color = color
  this.stopDraw = false
  this.deleteReady = false
  this.draw = function() {
    if (this.stopDraw) return
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Draw the ball
    ctx.strokeStyle = this.color
    ctx.stroke()
    ctx.closePath();
  }

  this.moveToCenter = function() {
    const dx = center.x - this.x;
    const dy = center.y - this.y;
    const dist = distance(this.x, this.y, center.x, center.y)
    if (dist > (this.radius * 2)) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
      this.draw()
    } else this.stopDraw = true

    if (this.stopDraw) {
      this.x = undefined
      this.y = undefined
      this.deleteReady = true
    }
  }
}
//✅
function NABallGen() { //Negative Balls Genertion
  if (!(endGameSignal || pauseSignal)) {
    NABallsCordinatesGen()

    function NABallsCordinatesGen() { //done to avoid overlap of balls on generation
      if (randomBinary() === 0) {
        x = randomBinary() * canvas.width; // Initial x position, either 0 or the end of canvas
        y = canvas.height * Math.random(); // Initial y position
      }
      else {
        x = canvas.width * Math.random(); // Initial x position
        y = randomBinary() * canvas.height; // Initial y position, either 0 or end of canvas.
      }
    }

    const collideFnX = collideFn.bind(this)
    collideFnX(() => { //avoid overlap
      NABallsCordinatesGen()
      return -1 //restart loop, check again
    }, mainRadius)

    NBallArr.push(new NABall(x, y, mainRadius, speed, NABallColor))
    if (!(dynTime <= frozenDynTimeLimit)) dynTime -= frozenDynTimeDecay
    if (!(frozenMultiGen >= frozenMultiGenLimit)) frozenMultiGen += frozenMultiGenIncrement

    if (multiGen === 0) {
      multiGen = Math.floor(Math.random() * Math.round(frozenMultiGen))
      for (let i = 0; i < multiGen; i++) NABallGen()
    }
    else multiGen--
  }
}
//✅
function PPBallGen(x, y) { //Positive Balls Generation
  PBallArr.push(new PPBall(x, y, frozenPositiveBallRadius, frozenPositiveBallSpeed, PPBallColor))
}
//✅
function HPBallGen() { //Helper Positive Ball Generation 
  if (!(endGameSignal || pauseSignal)) {
    HPBallArr.push(new HPBall(center.x, center.y, frozenPositiveBallRadius, frozenPositiveBallSpeed, AIBallColor, shift))
  }
}
//✅
function animate() {
  if (pauseSignal === false) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    if (!(health > 0)) {
      frozenScore = score
      endGame()
    }
    if (endGameSignal === false) {
      player.update()
      displayX.navigation()
      for (let i = 0; i < NBallArr.length; i++) NBallArr[i].moveToCenter()
      for (let i = 0; i < PBallArr.length; i++) PBallArr[i].moveToTarget()
      if (score >= frozenAIReleaseScore) { //helper activated
        Hplayer.update()
        for (let i = 0; i < HPBallArr.length; i++) HPBallArr[i].AITarget()
      }
    }
  }
  requestAnimationFrame(animate)
}

const findMin = (arr) => Math.min(...arr);

function calcAngleDegrees(x, y) {
  return Math.atan2(y, x)
}

function restartClick(x, y) {
  let rect = { x: displayX.RBx, y: displayX.RBy, width: displayX.RBwidth, height: displayX.RBheight };
  if ((x > rect.x && x < rect.x + rect.width) && (y > rect.y && y < (rect.y + rect.height))) { // Check if the click is inside the rectangle
    restart()
  }
}

function pauseClick(x, y) {
  let rect = { x: displayX.PBx, y: displayX.PBy, width: displayX.PBwidth, height: displayX.PBheight };
  if ((x > rect.x && x < rect.x + rect.width) && (y > rect.y && y < (rect.y + rect.height))) { // Check if the click is inside the rectangle
    pauseGame()
  }
}

function remarker(score) {
  if (score >= 500) return "The Beast! ☠️"
  else if (score >= 400) return "Undisputed Champ! 🏆"
  else if (score >= 300) return "Above 90% of people. 🎉"
  else if (score >= 200) return "Amazing 💥"
  else if (score >= 100) return "Splendid ✅"
  else if (score >= 50) return "Great Job 🤝"
  else if (score >= 10) return "Nice One 😉"
  else if (score <= 10) return "You Can Improve 🔁"
}

function memoryHandler() {
  const memoryClearInterval = setInterval(() => {
    if (endGameSignal || pauseSignal) clearInterval(memoryClearInterval)
    for (let i = 0; i < NBallArr.length; i++)
      if (NBallArr[i].deleteReady) NBallArr.splice(i, 1) //remove ball from array

    for (let i = 0; i < PBallArr.length; i++)
      if (PBallArr[i].deleteReady) PBallArr.splice(i, 1) //remove ball from array

    for (let i = 0; i < HPBallArr.length; i++)
      if (HPBallArr[i].deleteReady) HPBallArr.splice(i, 1) //remove ball from array
  }, frozenMemoryClearTime)
}

function randomBinary() {
  return Math.floor(Math.random() * 2)
}

function distance(x1, y1, x2, y2) {
  const xDist = Math.abs(x1 - x2)
  const yDist = Math.abs(y1 - y2)
  return Math.sqrt(xDist * xDist + yDist * yDist)
}

function collideFn(fnRun, radius, px) {

  for (let j = 0; j < NBallArr.length; j++) {
    if (NBallArr[j].stopDraw) continue //at times, before NABalls are tarnished, something like score updates before it, causing a jump in score. Especially from helper ball, but this fixed it. Don't Touch.
    if (distance(this.x, this.y, NBallArr[j].x, NBallArr[j].y) <= (radius * 2) + frozenNearStrikeDistance) {
      const rerun = fnRun(j)
      if (rerun === -1) j = -1
    }
  }
}

function strayBallFn(fnRun, radius) { //detect balls that missed. This is used to instill memory management
  if (((this.x + radius < 0) || (this.x + radius > canvas.width)) || ((this.y + radius < 0) || (this.y + radius > canvas.height))) fnRun() //  console.log("A stray X OR Y Ball, OR Both")
}


function pauseAction() {
  pauseModal.style.display = "block"
}

function unPause() {
  pauseSignal = false
  closeModal()
}

function closeModal() {
  document.getElementById('pause').style.display = 'none';
}

function pauseGame() {
  pauseSignal = true
  document.getElementById('pause').style.display = 'block';
}

function play() {
  document.getElementById('start').style.display = 'none';
  init()
}

function restart() {
  endGameSignal = false
  document.getElementById('performance').style.display = 'none';

}

function endGame() {
  displayX.endGame()
  document.getElementById('score').textContent = frozenScore
  document.getElementById('remark').textContent = remarker(frozenScore)
  document.getElementById('performance').style.display = 'block';
}

function display() {
  this.pauseBtn = function() {
    const width = 5
    const height = 20
    const shift = 10
    this.PBx = 0
    this.PBy = 0
    this.PBwidth = width + (width + shift + shift + shift + width)
    this.PBheight = shift + height
    ctx.beginPath();
    ctx.lineWidth = 3
    ctx.fillStyle = "white"
    ctx.rect(width + shift, shift, width, height);
    ctx.fill();
    ctx.closePath()
    ctx.beginPath();
    ctx.lineWidth = 3
    ctx.fillStyle = "white"
    ctx.rect(width + shift + shift, shift, width, height);
    ctx.fill();
    ctx.closePath()
  }
  this.scoreVisualize = function() {
    ctx.beginPath();
    ctx.fillStyle = "white"
    ctx.font = "2rem Arial";
    ctx.textBaseline = "top";
    ctx.textAlign = 'center';
    ctx.fillText(score, center.x, 10);
    ctx.closePath()
  }
  this.navigation = function() {
    const shift = 4
    const width = 100
    const height = 20 - shift
    ctx.beginPath();
    ctx.lineWidth = 3
    ctx.strokeStyle = "white"
    ctx.rect(canvas.width - width - 10, 10, width, height + shift);
    ctx.stroke();
    ctx.closePath()
    ctx.beginPath();
    ctx.rect(canvas.width - width - 10, 10 + (shift / 2), health, height);
    ctx.fillStyle = "#00C996"
    ctx.fill();
    this.pauseBtn()
    this.scoreVisualize()
  }
  this.endGame = function() {
    endGameSignal = true
    NBallArr = []
    PBallArr = []
    HPBallArr = []
    health = frozenHealth
    score = 0
    speed = frozenSpeed
    dynTime = frozenDynTime
    HPBallTime = frozenHPBallTime
  }
}