const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');
const playerScoreElem = document.getElementById('player-score');
const aiScoreElem = document.getElementById('ai-score');
const messageElem = document.getElementById('message');

// Game Constants
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_RADIUS = 9;
const PLAYER_X = 20;
const AI_X = canvas.width - PLAYER_X - PADDLE_WIDTH;
const PADDLE_COLOR = '#ffffff';
const BALL_COLOR = '#00e5ff';
const BALL_TRAIL_COLOR = "#00e5ff33";
const MAX_BALL_SPEED = 10;
const BALL_SPEED_INCREMENT = 0.3;

// Game State
let playerY = (canvas.height - PADDLE_HEIGHT) / 2;
let aiY = (canvas.height - PADDLE_HEIGHT) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 4;
let ballSpeedY = 3;
let ballTrail = [];
let playerScore = 0;
let aiScore = 0;
let serving = false;

// Paddle bounce animation
let playerBounce = false, aiBounce = false;

// Draw functions
function drawRect(x, y, w, h, color, bounce) {
    ctx.save();
    if (bounce) {
        ctx.shadowColor = "#00e5ff";
        ctx.shadowBlur = 18;
    }
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
}

function drawCircle(x, y, r, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function drawNet() {
    ctx.strokeStyle = '#39fff7';
    ctx.setLineDash([9, 13]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawBallTrail() {
    for (let i = 0; i < ballTrail.length; i++) {
        let alpha = (i + 1) / ballTrail.length * 0.5;
        drawCircle(ballTrail[i].x, ballTrail[i].y, BALL_RADIUS, BALL_TRAIL_COLOR, alpha);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background animated lines
    let time = Date.now() * 0.002;
    for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.strokeStyle = `rgba(0,229,255,${0.08 + 0.04 * i})`;
        ctx.lineWidth = 3 + i;
        ctx.beginPath();
        let y = 80 + i * 100 + Math.sin(time + i) * 15;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y + Math.cos(time + i * 2) * 15);
        ctx.stroke();
        ctx.restore();
    }

    // Draw net
    drawNet();

    // Draw paddles
    drawRect(PLAYER_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_COLOR, playerBounce);
    drawRect(AI_X, aiY, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_COLOR, aiBounce);

    // Draw ball trail
    drawBallTrail();

    // Draw ball
    drawCircle(ballX, ballY, BALL_RADIUS, BALL_COLOR);
}

// Collision Detection
function collision(paddleX, paddleY, ballX, ballY) {
    return (
        ballX + BALL_RADIUS > paddleX &&
        ballX - BALL_RADIUS < paddleX + PADDLE_WIDTH &&
        ballY + BALL_RADIUS > paddleY &&
        ballY - BALL_RADIUS < paddleY + PADDLE_HEIGHT
    );
}

// Mouse Control for Player Paddle
canvas.addEventListener('mousemove', function (evt) {
    const rect = canvas.getBoundingClientRect();
    const mouseY = evt.clientY - rect.top;
    playerY = mouseY - PADDLE_HEIGHT / 2;
    if (playerY < 0) playerY = 0;
    if (playerY > canvas.height - PADDLE_HEIGHT) playerY = canvas.height - PADDLE_HEIGHT;
});

// Perfect AI for Right Paddle
function updateAI() {
    const aiCenter = aiY + PADDLE_HEIGHT / 2;
    const target = ballY;
    const speed = 40; // Perfect and fast

    if (aiCenter < target - 1) aiY += speed;
    else if (aiCenter > target + 1) aiY -= speed;

    if (aiY < 0) aiY = 0;
    if (aiY > canvas.height - PADDLE_HEIGHT) aiY = canvas.height - PADDLE_HEIGHT;
}

// Score and Message Handling
function updateScore(winner) {
    if (winner === "player") playerScore++;
    else aiScore++;
    playerScoreElem.textContent = playerScore;
    aiScoreElem.textContent = aiScore;

    if (playerScore === 5 || aiScore === 5) {
        messageElem.textContent = `${playerScore === 5 ? "You" : "AI"} win! Click to restart.`;
        serving = true;
    } else {
        messageElem.textContent = `${winner === "player" ? "You" : "AI"} scored!`;
        serving = true;
        setTimeout(() => { messageElem.textContent = ""; startServe(winner === "player" ? -1 : 1) }, 1200);
    }
}

function startServe(direction = 1) {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = 0;
    ballSpeedY = 0;
    ballTrail = [];
    draw();
    setTimeout(() => {
        ballSpeedX = direction * 4;
        ballSpeedY = 3 * (Math.random() > 0.5 ? 1 : -1);
        serving = false;
    }, 800);
}

canvas.addEventListener('click', () => {
    if (serving && (playerScore === 5 || aiScore === 5)) {
        playerScore = 0; aiScore = 0;
        playerScoreElem.textContent = "0";
        aiScoreElem.textContent = "0";
        messageElem.textContent = "";
        startServe(Math.random() > 0.5 ? 1 : -1);
    }
});

// Game Update
function update() {
    if (serving) return;

    ballX += ballSpeedX;
    ballY += ballSpeedY;

    ballTrail.push({ x: ballX, y: ballY });
    if (ballTrail.length > 12) ballTrail.shift();

    if (ballY - BALL_RADIUS < 0) {
        ballY = BALL_RADIUS;
        ballSpeedY = -ballSpeedY;
    }
    if (ballY + BALL_RADIUS > canvas.height) {
        ballY = canvas.height - BALL_RADIUS;
        ballSpeedY = -ballSpeedY;
    }

    if (collision(PLAYER_X, playerY, ballX, ballY)) {
        ballX = PLAYER_X + PADDLE_WIDTH + BALL_RADIUS;
        ballSpeedX = Math.abs(ballSpeedX) + BALL_SPEED_INCREMENT;
        if (ballSpeedX > MAX_BALL_SPEED) ballSpeedX = MAX_BALL_SPEED;
        let collidePoint = (ballY - (playerY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ballSpeedY = collidePoint * 5;
        playerBounce = true;
        setTimeout(() => playerBounce = false, 200);
    }

    if (collision(AI_X, aiY, ballX, ballY)) {
        ballX = AI_X - BALL_RADIUS;
        ballSpeedX = -Math.abs(ballSpeedX) - BALL_SPEED_INCREMENT;
        if (Math.abs(ballSpeedX) > MAX_BALL_SPEED) ballSpeedX = -MAX_BALL_SPEED;
        let collidePoint = (ballY - (aiY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ballSpeedY = collidePoint * 5;
        aiBounce = true;
        setTimeout(() => aiBounce = false, 200);
    }

    if (ballX - BALL_RADIUS < 0) {
        updateScore("ai");
        startServe(1);
    }
    if (ballX + BALL_RADIUS > canvas.width) {
        updateScore("player");
        startServe(-1);
    }

    updateAI();
}

// Main Loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

startServe(Math.random() > 0.5 ? 1 : -1);
gameLoop();