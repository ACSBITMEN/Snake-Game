// Seleccionar el canvas y el contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Cargar los sprites
const snakeSprite = new Image();
snakeSprite.src = '/assets/Snake-Spritesheet.png';

const foodSprite = new Image();
foodSprite.src = '/assets/Snake-Food.png';

// Variables de estilos CSS (si se usan)
const rootStyles = getComputedStyle(document.documentElement);
const snakeHeadColor = rootStyles.getPropertyValue('--snake-head-color').trim();
const snakeBodyColor = rootStyles.getPropertyValue('--snake-body-color').trim();
const snakeBorderColor = rootStyles.getPropertyValue('--snake-border-color').trim();

// Constantes del juego
const BOX_SIZE = 20; // Tamaño de cada segmento de la serpiente
const INITIAL_SPEED = 110; // Velocidad inicial de la serpiente
const MIN_SPEED = 50; // Velocidad mínima
const SPEED_REDUCTION_PER_POINT = 0.5; // Reducción de velocidad por punto
const SNAKE_SPRITE_SIZE = 42; // Tamaño de las celdas del spritesheet de la serpiente
const FOOD_SPRITE_SIZE = 130; // Tamaño de las celdas del spritesheet de la comida
const TOTAL_COLUMNS = 22; // Número de columnas en el spritesheet de comida
const MIDDLE_ROW = 0; // Índice de la fila del medio en el spritesheet de comida

// Variables del juego
let snake;
let direction;
let speed;
let food;
let score;
let gameInterval;
let gamePaused = false;
let countdownActive = false;

// Columna actual de la comida
let foodSpriteCol;

// Elementos de la interfaz
const scoreDisplay = document.getElementById('score');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
// Obtener referencias al modal y sus elementos
const modal = document.getElementById('gameOverModal');
const finalScoreDisplay = document.getElementById('finalScore');
const restartGameButton = document.getElementById('restartGame');

// Controlar la serpiente con las teclas de flecha
document.addEventListener('keydown', handleKeyDown);

function handleKeyDown(event) {
    if (event.key === 'ArrowLeft' && direction !== 'RIGHT') {
        direction = 'LEFT';
    } else if (event.key === 'ArrowUp' && direction !== 'DOWN') {
        direction = 'UP';
    } else if (event.key === 'ArrowRight' && direction !== 'LEFT') {
        direction = 'RIGHT';
    } else if (event.key === 'ArrowDown' && direction !== 'UP') {
        direction = 'DOWN';
    }
}

function adjustCanvasSize() {
    const containerWidth = main.offsetWidth * 0.9; // 90% del ancho disponible en el main
    const aspectRatio = 660 / 420; // Mantener la relación de aspecto original
    const canvasWidth = Math.min(containerWidth, 660); // No exceder el ancho original
    const canvasHeight = canvasWidth / aspectRatio;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
}

window.addEventListener('resize', adjustCanvasSize);
window.addEventListener('load', () => {
    adjustCanvasSize();
    // Si tienes una función de inicialización del juego, puedes llamarla aquí
});


// Función para iniciar el juego
function initGame() {
    speed = INITIAL_SPEED;
    snake = [{ x: 9 * BOX_SIZE, y: 10 * BOX_SIZE }];
    direction = 'RIGHT';
    score = 0;
    scoreDisplay.innerText = `Puntuación: ${score}`;
    generateFoodPosition();

    // Limpiar cualquier intervalo previo
    clearInterval(gameInterval);
    gamePaused = false;
    startButton.textContent = 'Pausar';
    restartButton.style.display = 'inline-block';

    countdown(startGame);
}

// Función para pausar el juego
function pauseGame() {
    clearInterval(gameInterval);
    gamePaused = true;
    startButton.textContent = 'Reanudar';
    showPausedMessage(); // Mostrar mensaje de "Pausado"
}

// Función para reanudar el juego
function resumeGame() {
    gamePaused = false;
    startButton.textContent = 'Pausar';
    hidePausedMessage(); // Ocultar mensaje de "Pausado"
    startGame();
}

// Función para iniciar el juego después de la cuenta regresiva
function startGame() {
    clearInterval(gameInterval);
    gameInterval = setInterval(updateGame, speed);
}

// Evento del botón de inicio/pausar/reanudar
startButton.addEventListener('click', () => {
    if (countdownActive) return;

    if (startButton.textContent === 'Iniciar Juego') {
        initGame();
    } else if (startButton.textContent === 'Pausar') {
        pauseGame();
    } else if (startButton.textContent === 'Reanudar') {
        resumeGame();
    }
});

// Evento del botón de reiniciar
restartButton.addEventListener('click', () => {
    if (countdownActive) return;

    clearInterval(gameInterval);
    gamePaused = false;
    hidePausedMessage(); // Ocultar el mensaje de "Pausado" si está visible
    startButton.textContent = 'Iniciar Juego';
    restartButton.style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scoreDisplay.innerText = `Puntuación: 0`;
    initGame();
});

function drawSnake() {
    for (let i = 0; i < snake.length; i++) {
        let sx, sy;
        ctx.save();

        if (i === 0) {
            // Cabeza de la serpiente
            sx = 0;
            sy = 0;

            // Rotar la cabeza según la dirección actual
            ctx.translate(snake[i].x + BOX_SIZE / 2, snake[i].y + BOX_SIZE / 2);

            if (direction === 'RIGHT') {
                ctx.rotate(-90 * Math.PI / 180);
            } else if (direction === 'LEFT') {
                ctx.rotate(90 * Math.PI / 180);
            } else if (direction === 'UP') {
                ctx.rotate(180 * Math.PI / 180);
            }

            ctx.drawImage(snakeSprite, sx, sy, SNAKE_SPRITE_SIZE, SNAKE_SPRITE_SIZE, -BOX_SIZE / 2, -BOX_SIZE / 2, BOX_SIZE, BOX_SIZE);

        } else if (i === snake.length - 1) {
            // Cola de la serpiente
            sx = 1 * SNAKE_SPRITE_SIZE;
            sy = 2 * SNAKE_SPRITE_SIZE;

            const prevSegment = snake[i - 1];
            ctx.translate(snake[i].x + BOX_SIZE / 2, snake[i].y + BOX_SIZE / 2);

            if (prevSegment.x < snake[i].x) {
                ctx.rotate(-90 * Math.PI / 180);
            } else if (prevSegment.x > snake[i].x) {
                ctx.rotate(90 * Math.PI / 180);
            } else if (prevSegment.y > snake[i].y) {
                ctx.rotate(180 * Math.PI / 180);
            }

            ctx.drawImage(snakeSprite, sx, sy, SNAKE_SPRITE_SIZE, SNAKE_SPRITE_SIZE, -BOX_SIZE / 2, -BOX_SIZE / 2, BOX_SIZE, BOX_SIZE);

        } else {
            // Curvas o cuerpo recto
            const prevSegment = snake[i - 1];
            const nextSegment = snake[i + 1];

            if (prevSegment.x !== nextSegment.x && prevSegment.y !== nextSegment.y) {
                // Es una curva
                if ((prevSegment.x < snake[i].x && nextSegment.y < snake[i].y) || (nextSegment.x < snake[i].x && prevSegment.y < snake[i].y)) {
                    // Esquina Inferior Derecha
                    sx = 2 * SNAKE_SPRITE_SIZE;
                    sy = 1 * SNAKE_SPRITE_SIZE;
                } else if ((prevSegment.x < snake[i].x && nextSegment.y > snake[i].y) || (nextSegment.x < snake[i].x && prevSegment.y > snake[i].y)) {
                    // Esquina Superior Derecha
                    sx = 2 * SNAKE_SPRITE_SIZE;
                    sy = 0 * SNAKE_SPRITE_SIZE;
                } else if ((prevSegment.x > snake[i].x && nextSegment.y < snake[i].y) || (nextSegment.x > snake[i].x && prevSegment.y < snake[i].y)) {
                    // Esquina Inferior Izquierda
                    sx = 1 * SNAKE_SPRITE_SIZE;
                    sy = 1 * SNAKE_SPRITE_SIZE;
                } else {
                    // Esquina Superior Izquierda
                    sx = 1 * SNAKE_SPRITE_SIZE;
                    sy = 0 * SNAKE_SPRITE_SIZE;
                }

                ctx.drawImage(snakeSprite, sx, sy, SNAKE_SPRITE_SIZE, SNAKE_SPRITE_SIZE, snake[i].x, snake[i].y, BOX_SIZE, BOX_SIZE);

            } else {
                // Cuerpo recto
                sx = 2 * SNAKE_SPRITE_SIZE;
                sy = 2 * SNAKE_SPRITE_SIZE;

                ctx.translate(snake[i].x + BOX_SIZE / 2, snake[i].y + BOX_SIZE / 2);

                if (prevSegment.x === snake[i].x) {
                    // Vertical
                } else {
                    // Horizontal
                    ctx.rotate(90 * Math.PI / 180);
                }

                ctx.drawImage(snakeSprite, sx, sy, SNAKE_SPRITE_SIZE, SNAKE_SPRITE_SIZE, -BOX_SIZE / 2, -BOX_SIZE / 2, BOX_SIZE, BOX_SIZE);
            }
        }

        ctx.restore();
    }
}

function drawFood() {
    const sx = foodSpriteCol * FOOD_SPRITE_SIZE;
    const sy = MIDDLE_ROW * FOOD_SPRITE_SIZE;

    ctx.drawImage(foodSprite, sx, sy, FOOD_SPRITE_SIZE, FOOD_SPRITE_SIZE, food.x, food.y, BOX_SIZE, BOX_SIZE);
}

function generateFoodPosition() {
    do {
        food = {
            x: Math.floor(Math.random() * (canvas.width / BOX_SIZE)) * BOX_SIZE,
            y: Math.floor(Math.random() * (canvas.height / BOX_SIZE)) * BOX_SIZE
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));

    foodSpriteCol = Math.floor(Math.random() * TOTAL_COLUMNS);
}

function calculateSpeed(score) {
    const newSpeed = INITIAL_SPEED - (score * SPEED_REDUCTION_PER_POINT);
    return Math.max(newSpeed, MIN_SPEED);
}

function updateGameSpeed() {
    clearInterval(gameInterval);
    speed = calculateSpeed(score);
    gameInterval = setInterval(updateGame, speed);
}

function updateGame() {
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction === 'LEFT') snakeX -= BOX_SIZE;
    if (direction === 'UP') snakeY -= BOX_SIZE;
    if (direction === 'RIGHT') snakeX += BOX_SIZE;
    if (direction === 'DOWN') snakeY += BOX_SIZE;

    const newHead = { x: snakeX, y: snakeY };

    // Verificar colisión con bordes
    if (snakeX < 0 || snakeY < 0 || snakeX >= canvas.width || snakeY >= canvas.height) {
        gameOver();
        return;
    }

    // Añadir nueva cabeza a la serpiente
    snake.unshift(newHead);

    // Verificar colisión con sí misma (excluyendo la cabeza)
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
            gameOver();
            return;
        }
    }

    // Verificar si ha comido la comida
    if (snakeX === food.x && snakeY === food.y) {
        score++;
        scoreDisplay.innerText = `Puntuación: ${score}`;
        generateFoodPosition();
        updateGameSpeed();
    } else {
        snake.pop();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawFood();
    drawSnake();
}

function gameOver() {
    clearInterval(gameInterval);
    showGameOverModal(score);
    speed = INITIAL_SPEED;
    startButton.textContent = 'Iniciar Juego';
    restartButton.style.display = 'none';
}

// Función de cuenta regresiva
function countdown(callback) {
    let count = 3;
    countdownActive = true;
    startButton.disabled = true;
    restartButton.disabled = true;

    const countdownText = document.createElement('div');
    countdownText.id = 'countdown';
    countdownText.classList.add('countdown-text'); // Usamos clase CSS
    document.body.appendChild(countdownText);

    const interval = setInterval(() => {
        if (count > 0) {
            countdownText.textContent = count;
            count--;
        } else {
            clearInterval(interval);
            countdownText.textContent = '¡Go!';
            setTimeout(() => {
                document.body.removeChild(countdownText);
                countdownActive = false;
                startButton.disabled = false;
                restartButton.disabled = false;
                callback();
            }, 500);
        }
    }, 1000);
}

// Función para mostrar el mensaje de "Pausado"
function showPausedMessage() {
    const pausedText = document.createElement('div');
    pausedText.id = 'pausedText';
    pausedText.classList.add('paused-text');
    pausedText.textContent = 'Pausa';
    document.body.appendChild(pausedText);
}

// Función para ocultar el mensaje de "Pausado"
function hidePausedMessage() {
    const pausedText = document.getElementById('pausedText');
    if (pausedText) {
        document.body.removeChild(pausedText);
    }
}

// Función para mostrar el modal con el puntaje final
function showGameOverModal(score) {
    finalScoreDisplay.innerText = `Puntuación final: ${score}`;
    modal.style.display = 'block';
}

// Cerrar el modal al hacer clic fuera de él
window.addEventListener('click', function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});

// Reiniciar el juego desde el modal
restartGameButton.addEventListener('click', function() {
    modal.style.display = 'none';
    restartButton.click();
});

