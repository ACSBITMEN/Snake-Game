const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');


// Cargar el spritesheet de la serpiente
const snakeSprite = new Image();
snakeSprite.src = '/assets/Snake-Spritesheet.png';  // Ruta del archivo del spritesheet

// Cargar el spritesheet de comida
const foodSprite = new Image();
foodSprite.src = '/assets/Snake-Food.png';  // Ruta del archivo subido

// Obtener variables CSS para la serpiente
const rootStyles = getComputedStyle(document.documentElement);
const snakeHeadColor = rootStyles.getPropertyValue('--snake-head-color').trim();
const snakeBodyColor = rootStyles.getPropertyValue('--snake-body-color').trim();
const snakeBorderColor = rootStyles.getPropertyValue('--snake-border-color').trim();

// Configuración inicial
const boxSize = 20;  // Tamaño de cada cuadro (parte de la serpiente)
let snake;
let direction;
let speed = 110; // Velocidad inicial de la serpiente (100ms)
let food;
let score;
let game;
let gamePaused = false;
let countdownActive = false;
let tongueState = 0; // Variable para controlar el estado de la lengua - Comienza con la primera fila

// Dimensiones del spritesheet
const snakeSpriteSize = 42;   // Tamaño de las celdas del spritesheet de la serpiente
const fruitSpriteSize = 130;  // Tamaño de las celdas del spritesheet de frutas
const totalColumns = 22;  // Número de columnas en el spritesheet
const middleRow = 0;  // Segunda fila (índice 1)

// Columna actual de la comida
let foodSpriteCol;  // Columna aleatoria para la comida

// Elementos de la interfaz
const scoreDisplay = document.getElementById('score');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
// Obtener referencias al modal y sus elementos
const modal = document.getElementById('gameOverModal');
const closeModal = document.getElementById('closeModal');
const finalScoreDisplay = document.getElementById('finalScore');
const restartGameButton = document.getElementById('restartGame');

// Controlar la serpiente con las teclas de flecha
document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' && direction !== 'RIGHT') {
        direction = 'LEFT';
    } else if (event.key === 'ArrowUp' && direction !== 'DOWN') {
        direction = 'UP';
    } else if (event.key === 'ArrowRight' && direction !== 'LEFT') {
        direction = 'RIGHT';
    } else if (event.key === 'ArrowDown' && direction !== 'UP') {
        direction = 'DOWN';
    }
});

// Función para iniciar el juego
function initGame() {
    speed = 110;  // Velocidad inicial de la serpiente
    // Configuración inicial de la serpiente y otros parámetros
    snake = [{ x: 9 * boxSize, y: 10 * boxSize }];
    direction = 'RIGHT';
    score = 0;
    scoreDisplay.innerText = `Puntuación: ${score}`;
    // Generar posición de comida aleatoria
    generateFoodPosition();

    // Limpiar cualquier intervalo previo
    clearInterval(game);
    gamePaused = false;
    startButton.textContent = 'Pausar';
    restartButton.style.display = 'inline-block';

    countdown(startGame);
}

// Función para pausar el juego
function pauseGame() {
    clearInterval(game);
    gamePaused = true;
    startButton.textContent = 'Reanudar';
}

// Función para reanudar el juego
function resumeGame() {
    gamePaused = false;
    startButton.textContent = 'Pausar';
    countdown(startGame);
}

// Función para iniciar el juego después de la cuenta regresiva
function startGame() {
    game = setInterval(updateGame, speed);
}

// Evento del botón de inicio/pausar/reanudar
startButton.addEventListener('click', () => {
    if (countdownActive) {
        return; // Evitar acciones durante la cuenta regresiva
    }
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
    if (countdownActive) {
        return; // Evitar acciones durante la cuenta regresiva
    }
    clearInterval(game);
    gamePaused = false;
    startButton.textContent = 'Iniciar Juego';
    restartButton.style.display = 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scoreDisplay.innerText = `Puntuación: 0`;
    initGame();
});

function drawSnake() {
    for (let i = 0; i < snake.length; i++) {
        let sx, sy;
        ctx.save();  // Guardamos el contexto para las rotaciones

        if (i === 0) {
            // Cabeza de la serpiente
            sx = 0;  // Primera columna
            sy = 0;  // Primera fila

            // Rotar la cabeza según la dirección actual
            ctx.translate(snake[i].x + boxSize / 2, snake[i].y + boxSize / 2);  // Trasladamos el origen al centro de la cabeza

            if (direction === 'RIGHT') {
                ctx.rotate(-90 * Math.PI / 180);  // Rotar 90 grados a la derecha
            } else if (direction === 'LEFT') {
                ctx.rotate(90 * Math.PI / 180);  // Rotar 90 grados a la izquierda
            } else if (direction === 'UP') {
                ctx.rotate(180 * Math.PI / 180);  // Rotar 180 grados (apuntar hacia arriba)
            }

            // Dibujar la cabeza después de rotarla
            ctx.drawImage(snakeSprite, sx, sy, snakeSpriteSize, snakeSpriteSize, -boxSize / 2, -boxSize / 2, boxSize, boxSize);

        } else if (i === snake.length - 1) {
            // Cola de la serpiente
            sx = 1 * snakeSpriteSize;  // Segunda columna
            sy = 2 * snakeSpriteSize;  // Tercera fila

            // Rotar la cola según la dirección del segmento anterior
            const prevSegment = snake[i - 1];
            ctx.translate(snake[i].x + boxSize / 2, snake[i].y + boxSize / 2);

            if (prevSegment.x < snake[i].x) { // Cola hacia la derecha
                ctx.rotate(-90 * Math.PI / 180);
            } else if (prevSegment.x > snake[i].x) { // Cola hacia la izquierda
                ctx.rotate(90 * Math.PI / 180);
            } else if (prevSegment.y > snake[i].y) { // Cola hacia arriba
                ctx.rotate(180 * Math.PI / 180);
            }

            ctx.drawImage(snakeSprite, sx, sy, snakeSpriteSize, snakeSpriteSize, -boxSize / 2, -boxSize / 2, boxSize, boxSize);

        } else {
            // Curvas o cuerpo recto
            const prevSegment = snake[i - 1];
            const nextSegment = snake[i + 1];

            if (prevSegment.x !== nextSegment.x && prevSegment.y !== nextSegment.y) {
                // Si el segmento anterior y siguiente no están alineados, es una curva
                if (prevSegment.x < snake[i].x && nextSegment.y < snake[i].y || nextSegment.x < snake[i].x && prevSegment.y < snake[i].y) {
                    // Esquina Inferior Derecha
                    sx = 2 * snakeSpriteSize;  // Segunda columna
                    sy = 1 * snakeSpriteSize;  // Primera fila
                } else if (prevSegment.x < snake[i].x && nextSegment.y > snake[i].y || nextSegment.x < snake[i].x && prevSegment.y > snake[i].y) {
                    // Esquina Superior Derecha
                    sx = 2 * snakeSpriteSize;  // Segunda columna
                    sy = 0 * snakeSpriteSize;  // Segunda fila
                } else if (prevSegment.x > snake[i].x && nextSegment.y < snake[i].y || nextSegment.x > snake[i].x && prevSegment.y < snake[i].y) {
                    // Esquina Inferior Izquierda
                    sx = 1 * snakeSpriteSize;  // Tercera columna
                    sy = 1 * snakeSpriteSize;  // Primera fila
                } else {
                    // Esquina Superior Izquierda
                    sx = 1 * snakeSpriteSize;  // Tercera columna
                    sy = 0 * snakeSpriteSize;  // Segunda fila
                }

                ctx.drawImage(snakeSprite, sx, sy, snakeSpriteSize, snakeSpriteSize, snake[i].x, snake[i].y, boxSize, boxSize);

            } else {
                // Cuerpo recto: verificar si está en posición vertical u horizontal
                sx = 2 * snakeSpriteSize;  // Segunda columna (cuerpo recto)
                sy = 2 * snakeSpriteSize;  // Tercera fila

                ctx.translate(snake[i].x + boxSize / 2, snake[i].y + boxSize / 2);  // Trasladamos el origen al centro del cuerpo

                // Si el segmento anterior y siguiente están alineados en la dirección Y, significa que es vertical
                if (prevSegment.x === snake[i].x) {
                    // Cuerpo vertical: no necesita rotación
                } else {
                    // Cuerpo horizontal: rotamos 90 grados
                    ctx.rotate(90 * Math.PI / 180);
                }

                // Dibujar el cuerpo después de verificar si es horizontal o vertical
                ctx.drawImage(snakeSprite, sx, sy, snakeSpriteSize, snakeSpriteSize, -boxSize / 2, -boxSize / 2, boxSize, boxSize);
            }
        }

        ctx.restore();  // Restauramos el contexto después de cada segmento
    }
}



// Función para dibujar la comida usando el spritesheet (solo la fila del medio)
function drawFood() {
    const sx = foodSpriteCol * fruitSpriteSize;  // Solo seleccionamos la columna
    const sy = middleRow * fruitSpriteSize;  // La fila del medio es fija (índice 1)

    // Dibujar la comida en el canvas
    ctx.drawImage(foodSprite, sx, sy, fruitSpriteSize, fruitSpriteSize, food.x, food.y, boxSize, boxSize);
}

// Función para generar una nueva posición de comida
function generateFoodPosition() {
    // Generar una posición aleatoria para la comida en el canvas
    food = {
        x: Math.floor(Math.random() * (canvas.width / boxSize)) * boxSize,
        y: Math.floor(Math.random() * (canvas.height / boxSize)) * boxSize
    };

    // Elegir una comida aleatoria de la fila del medio (segunda fila)
    foodSpriteCol = Math.floor(Math.random() * totalColumns);  // Solo cambiamos la columna
}

// Función para calcular la velocidad en función del puntaje
function calculateSpeed(score) {
    const minSpeed = 50;  // Velocidad mínima (máximo de velocidad)
    const speedReduction = 1;  // Cada vez que se gana un punto, se reducirá el intervalo en 1ms
    let newSpeed = speed - (score * speedReduction);
    return Math.max(newSpeed, minSpeed);  // No permitir que la velocidad sea menor a minSpeed
}

// Función para reiniciar el juego con nueva velocidad
function updateGameSpeed() {
    clearInterval(game);  // Limpiar el intervalo anterior
    speed = calculateSpeed(score);  // Calcular nueva velocidad en función del puntaje
    game = setInterval(updateGame, speed);  // Reiniciar el juego con la nueva velocidad
}

// Función principal del juego
function updateGame() {
    // Posición actual de la cabeza de la serpiente
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    // Actualizar la posición de acuerdo con la dirección
    if (direction === 'LEFT') snakeX -= boxSize;
    if (direction === 'UP') snakeY -= boxSize;
    if (direction === 'RIGHT') snakeX += boxSize;
    if (direction === 'DOWN') snakeY += boxSize;

    // Crear nueva cabeza
    const newHead = { x: snakeX, y: snakeY };

    // Verificar si la serpiente choca con los bordes
    if (snakeX < 0 || snakeY < 0 || snakeX >= canvas.width || snakeY >= canvas.height) {
        clearInterval(game);
        showGameOverModal(score);  // Mostrar el modal en lugar de alert
        speed = 110;  // Restablecer la velocidad inicial
        startButton.textContent = 'Iniciar Juego';
        restartButton.style.display = 'none';
        return;
    }

    // Verificar si la serpiente choca consigo misma
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
            clearInterval(game);
            showGameOverModal(score);  // Mostrar el modal en lugar de alert
            startButton.textContent = 'Iniciar Juego';
            restartButton.style.display = 'none';
            return;
        }
    }

    // Añadir nueva cabeza al inicio de la serpiente
    snake.unshift(newHead);

    // Verificar si la serpiente ha comido la comida
    if (snakeX === food.x && snakeY === food.y) {
        score++;
        scoreDisplay.innerText = `Puntuación: ${score}`;
        generateFoodPosition();  // Generar nueva comida
        updateGameSpeed();  // Incrementar la velocidad a medida que la puntuación sube
    } else {
        snake.pop();  // Eliminar la cola si no ha comido
    }

    // Borrar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar la comida y la serpiente
    drawFood();
    drawSnake();
}

// Función de cuenta regresiva
function countdown(callback) {
    let count = 3;
    countdownActive = true;
    // Deshabilitar botones
    startButton.disabled = true;
    restartButton.disabled = true;

    const countdownText = document.createElement('div');
    countdownText.id = 'countdown';
    countdownText.style.position = 'absolute';
    countdownText.style.top = '50%';
    countdownText.style.left = '50%';
    countdownText.style.transform = 'translate(-50%, -50%)';
    countdownText.style.fontSize = '72px';
    countdownText.style.color = 'white';
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
                // Habilitar botones
                startButton.disabled = false;
                restartButton.disabled = false;
                callback();
            }, 500);
        }
    }, 1000);
}

// Función para mostrar el modal con el puntaje final
function showGameOverModal(score) {
    finalScoreDisplay.innerText = `Puntuación final: ${score}`;
    modal.style.display = 'block';  // Mostrar el modal
}

// Función para cerrar el modal
closeModal.onclick = function () {
    modal.style.display = 'none';
}

// También cerrar el modal si el usuario hace clic fuera de la caja modal
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}


// Función para reiniciar el juego desde el modal
restartGameButton.onclick = function () {
    modal.style.display = 'none';  // Ocultar el modal
    restartButton.click();  // Simular el clic en el botón de reinicio del juego
}