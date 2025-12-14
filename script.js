const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const overlayRestart = document.getElementById("overlayRestart");

const scoreEl = document.getElementById("score");
const speedEl = document.getElementById("speed");
const stateEl = document.getElementById("state");

const GRID_SIZE = 24;
const CELL = canvas.width / GRID_SIZE;
const BASE_DELAY = 170;
const MIN_DELAY = 70;
const SPEED_STEP = 7;

const STATE = {
  READY: "Ready",
  RUNNING: "Playing",
  PAUSED: "Paused",
  OVER: "Game Over",
};

let snake = [];
let direction = { x: 1, y: 0 };
let queuedDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let score = 0;
let delay = BASE_DELAY;
let loopHandle = null;
let gameState = STATE.READY;

function resetGame() {
  snake = [
    { x: Math.floor(GRID_SIZE / 2) - 1, y: Math.floor(GRID_SIZE / 2) },
    { x: Math.floor(GRID_SIZE / 2) - 2, y: Math.floor(GRID_SIZE / 2) },
    { x: Math.floor(GRID_SIZE / 2) - 3, y: Math.floor(GRID_SIZE / 2) },
  ];
  direction = { x: 1, y: 0 };
  queuedDirection = { ...direction };
  score = 0;
  delay = BASE_DELAY;
  placeFood();
  updateSpeedLabel();
  updateScoreLabel();
  setGameState(STATE.READY);
  overlay.hidden = true;
  draw();
}

function setGameState(newState) {
  gameState = newState;
  stateEl.textContent = newState;
}

function startGame() {
  if (gameState === STATE.RUNNING) return;
  if (gameState === STATE.OVER) {
    resetGame();
  }
  setGameState(STATE.RUNNING);
  scheduleNextTick();
}

function pauseGame() {
  if (gameState !== STATE.RUNNING) return;
  clearTimeout(loopHandle);
  loopHandle = null;
  setGameState(STATE.PAUSED);
}

function scheduleNextTick() {
  clearTimeout(loopHandle);
  loopHandle = setTimeout(tick, delay);
}

function tick() {
  if (gameState !== STATE.RUNNING) return;
  direction = queuedDirection;
  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (isOutOfBounds(newHead) || isOnSnake(newHead)) {
    return endGame(
      isOutOfBounds(newHead) ? "You hit a wall!" : "You crashed into yourself!"
    );
  }

  snake.unshift(newHead);
  const ateFood = newHead.x === food.x && newHead.y === food.y;

  if (ateFood) {
    score += 10;
    updateScoreLabel();
    speedUp();
    placeFood();
  } else {
    snake.pop();
  }

  draw();
  scheduleNextTick();
}

function endGame(message) {
  clearTimeout(loopHandle);
  loopHandle = null;
  setGameState(STATE.OVER);
  overlay.hidden = false;
  overlayTitle.textContent = "Game Over";
  overlayMessage.textContent = `${message} Score: ${score}.`;
}

function updateScoreLabel() {
  scoreEl.textContent = score;
}

function speedUp() {
  delay = Math.max(MIN_DELAY, delay - SPEED_STEP);
  updateSpeedLabel();
}

function updateSpeedLabel() {
  const multiplier = (BASE_DELAY / delay).toFixed(1);
  speedEl.textContent = `${multiplier}x`;
}

function placeFood() {
  const openCells = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!isOnSnake({ x, y })) {
        openCells.push({ x, y });
      }
    }
  }
  if (!openCells.length) {
    return endGame("You filled the board! Incredible!");
  }
  food = openCells[Math.floor(Math.random() * openCells.length)];
}

function isOnSnake(position) {
  return snake.some((segment) => segment.x === position.x && segment.y === position.y);
}

function isOutOfBounds(position) {
  return (
    position.x < 0 ||
    position.x >= GRID_SIZE ||
    position.y < 0 ||
    position.y >= GRID_SIZE
  );
}

function handleDirectionChange(event) {
  const key = event.key.toLowerCase();
  const mapping = {
    arrowup: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    arrowdown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    arrowleft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    arrowright: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
  };

  if (key === " ") {
    if (gameState === STATE.RUNNING) {
      pauseGame();
    } else {
      startGame();
    }
    return;
  }

  const next = mapping[key];
  if (!next) return;

  const isOpposite = direction.x + next.x === 0 && direction.y + next.y === 0;
  if (!isOpposite) {
    queuedDirection = next;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  drawSnake();
}

function drawGrid() {
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    const offset = i * CELL;
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(canvas.width, offset);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const x = segment.x * CELL;
    const y = segment.y * CELL;

    const gradient = ctx.createLinearGradient(x, y, x + CELL, y + CELL);
    gradient.addColorStop(0, "#3dff97");
    gradient.addColorStop(1, "#21d465");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, CELL - 4, CELL - 4, 6);
    ctx.fill();

    if (index === 0) {
      ctx.fillStyle = "#0d1117";
      const eyeSize = CELL * 0.12;
      const offsetX = direction.x === 0 ? eyeSize * 2 : 0;
      const offsetY = direction.y === 0 ? eyeSize * 2 : 0;
      ctx.beginPath();
      ctx.arc(x + CELL / 2 - eyeSize + offsetX, y + CELL / 2 - eyeSize + offsetY, eyeSize, 0, Math.PI * 2);
      ctx.arc(x + CELL / 2 + eyeSize + offsetX, y + CELL / 2 + eyeSize + offsetY, eyeSize, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawFood() {
  const x = food.x * CELL;
  const y = food.y * CELL;
  const gradient = ctx.createRadialGradient(
    x + CELL / 2,
    y + CELL / 2,
    2,
    x + CELL / 2,
    y + CELL / 2,
    CELL / 2
  );
  gradient.addColorStop(0, "#ff8aa1");
  gradient.addColorStop(1, "#ff4d6d");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(x + 4, y + 4, CELL - 8, CELL - 8, 6);
  ctx.fill();
}

function addListeners() {
  document.addEventListener("keydown", handleDirectionChange);
  startBtn.addEventListener("click", startGame);
  pauseBtn.addEventListener("click", pauseGame);
  restartBtn.addEventListener("click", () => {
    resetGame();
    startGame();
  });
  overlayRestart.addEventListener("click", () => {
    resetGame();
    startGame();
  });
}

addListeners();
resetGame();
