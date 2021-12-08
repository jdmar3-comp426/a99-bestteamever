var Snake = {};

// Configuration
Snake.Config = function () {

    this.pixelSize = 20;

    // Box size (pixels)
    this.boxSize = 15;

    // Initial snake length: N pixels
    this.snakeLength = 3;

    // Snake speed changes (ticks)
    this.levelInterval = 30;

    // The time for treat to be repositioned (ticks)
    this.treatReposition = 30;

    // Increased game speed every level (millis)
    this.levelIncreaseM = 200;

    // Maximum game speed
    this.minInterval = 300;
};

var highestScore = 0;

// Initial game state
Snake.State = function () {
    this.gameOver = false;
    this.paused = false;
    this.level = 1;
    this.score = 0;
    this.ticks = 0;
    this.lastKeyTick = 0;
    this.lastTreatTick = 0;
    this.loopIntervalM = 500;
    this.direction = Snake.Direction.Up;
};

// Const keycodes
Snake.Direction = {
    Up: 38,
    Down: 40,
    Left: 37,
    Right: 39,
};

Snake.KeyCode = {
    Pause: 80,
    Resume: 82,
};

// A point
Snake.Point = function (x, y) {
    this.x = x;
    this.y = y;
};

Snake.Point.prototype.toString = function () {
    return this.x + "," + this.y;
};

Snake.Point.prototype.collide = function (arr) {
    for (let i = 0; i < arr.length; i++) {
        if ((this.x === arr[i].x) && (this.y === arr[i].y)) {
            return true;
        }
    }
    return false;
};

// Game engine
Snake.Game = function (doc, wnd) {
    this.config = new Snake.Config();
    this.state = new Snake.State();

    doc.onkeydown = this.onkeydown.bind(this);

    this.doc = doc;
    this.wnd = wnd;

    this.gridDrawn = false;
    this.boxDrawn = false;

    // Force first loop, to make game more responsive at first
    this.initBox();
    this.initSnake();
    this.drawGrid();
    this.drawBox();
    this.clearSnake();
    this.displayHighScore();
    this.loop();
};

Snake.Game.prototype.initBox = function () {
    var x = 0, y = 0;
    this.box = [];
    // left
    x = 0;
    for (y = 0; y < this.config.boxSize; y++) {
        position = new Snake.Point(x,y);
        this.box.push(position);
    }
    // right
    x = this.config.boxSize - 1;
    for (y = this.config.boxSize - 2; y >= 0; y--) {
        position = new Snake.Point(x,y);
        this.box.push(position);
    }
    // top
    y = this.config.boxSize - 1;
    for (x = 0; x < this.config.boxSize; x++) {
        position = new Snake.Point(x,y);
        this.box.push(position);
    }
    // bottom
    y = 0;
    for (x = this.config.boxSize - 2; x > 0; x--) {
        position = new Snake.Point(x,y);
        this.box.push(position);
    }
};

Snake.Game.prototype.initSnake = function () {
    var x = Math.floor(this.config.boxSize / 2);
    this.snake = [];
    // from head to tail
    for (let i = this.config.snakeLength; i > 0; i--) {
        position = new Snake.Point(x,i);
        this.snake.push(position);
    }
};

// To get the direction of the moving snake
Snake.Game.prototype.shiftSnake = function () {
    var shift = new Snake.Point(0, 0);
    switch (this.state.direction) {
        case Snake.Direction.Left:
            shift.x = -1;
            break;
        case Snake.Direction.Right:
            shift.x = 1;
            break;
        case Snake.Direction.Up:
            shift.y = 1;
            break;
        case Snake.Direction.Down:
            shift.y = -1;
            break;
    }
    return shift;
};

// To move the snake
Snake.Game.prototype.moveSnake = function () {
    // Calculate the position for head
    var head = new Snake.Point(this.snake[0].x, this.snake[0].y),
        shift = this.shiftSnake();
    head.x += shift.x;
    head.y += shift.y;

    // Whether the head collides (treat)
    if (head.collide([this.treat])) {
        // Calculate score
        this.state.score += this.state.level;
        // Remove treat
        const treatImgs = this.doc.getElementsByClassName('treat-img');
        if (treatImgs[0]) {
            treatImgs[0].remove();
        }
        this.drawTreat();
        delete this.treat;
    } else {
        // Remove its tail
        this.snake.pop();
    }

    // Whether the head collides (box)
    if (head.collide(this.box)) {
        this.onGameOver();
    }

    // Whether the head collides (snake)
    if (head.collide(this.snake)) {
        this.onGameOver();
    }

    // New head
    this.snake.unshift(head);

};

// Game over
Snake.Game.prototype.onGameOver = function () {
    this.state.gameOver = true;
    initializeNewGameButton();
    this.updateHighestScore();
    return;
};

// Check whether the current score is higher
Snake.Game.prototype.updateHighestScore = function () {
    const currentScore = this.state.score;
    if (currentScore > highestScore) {
        highestScore = currentScore;
        document.getElementById('highest-score').innerHTML = highestScore;
    }
}

// http://stackoverflow.com/questions/1527803/generating-random-numbers-in-javascript-in-a-specific-range
Snake.Game.prototype.randomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Randomly placing a new treat
Snake.Game.prototype.placeTreat = function () {
    if (this.state.ticks - this.state.lastTreatTick >= this.config.treatReposition) {
        delete this.treat;
    }

    if (this.treat) {
        return;
    }
    var x = 0, 
        y = 0, 
        treat = null;
    while (!this.treat) {
        x = this.randomInt(1, this.config.boxSize - 1);
        y = this.randomInt(1, this.config.boxSize - 1);
        treat = new Snake.Point(x, y);
        if (!treat.collide(this.snake) && !treat.collide(this.box)) {
            this.treat = treat;
            this.state.lastTreatTick = this.state.ticks;
        }
    }
};

// Update the states
Snake.Game.prototype.update = function () {
    if (this.state.gameOver || this.state.paused) {
        return;
    }
    this.placeTreat();

    this.moveSnake();

    this.state.ticks = this.state.ticks + 1;

    this.levelIncrease();
};

Snake.Game.prototype.cellID = function (x, y) {
    return 'cell_' + x + '_' + y;
};

//https://stackoverflow.com/questions/1484506/random-color-generator
Snake.Game.prototype.getRandomColor = function () {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

const bodyInitialHTML = `
<div id="hud">
    <button id="logout" class="w-button-normal">Logout</button>
    <div>
        Level: <span id="level">0</span>
    </div>
    <div>
        Score: <span id="score">0</span>
    </div>
    <div>
        Highest Score: <span id="highest-score">0</span>
    </div>
    <div>
        <span id="state"></span>
    </div>
</div>
<div id="board"></div>`

Snake.Game.prototype.drawGrid = function () {
    document.body.innerHTML = bodyInitialHTML;
    initializeLogoutButton();
    var i = 0,
        j = 0,
        topMargin = 200,
        div = null;
    for (i = 0; i < this.config.boxSize; i++) {
        for (j = 0; j < this.config.boxSize; j++) {
            div = this.doc.createElement('div');
            div.className = 'cell';
            div.style.position = 'absolute';
            div.style.width = this.config.pixelSize + 'px';
            div.style.height = this.config.pixelSize + 'px';
            div.style.left = (i * this.config.pixelSize) + 'px';
            div.style.top = topMargin + (j * this.config.pixelSize) + 'px';
            div.id = this.cellID(i, this.config.boxSize - j - 1);
            document.getElementById('board').appendChild(div);
        }
    }
};

Snake.Game.prototype.drawBox = function () {
    var i = 0,
        div = null,
        pt = null;
    for (i = 0; i < this.box.length; i++) {
        pt = this.box[i];
        div = this.doc.getElementById(this.cellID(pt.x, pt.y));
        div.className = 'cell box';
    }
};

Snake.Game.prototype.fetchHighScore = function () {
    return highestScore;
}

Snake.Game.prototype.displayHighScore = function () {
    const highestScore = this.fetchHighScore();
    document.getElementById('highest-score').innerHTML = highestScore;
}

Snake.Game.prototype.drawSnakeBody = function (element) {
    element.className = 'cell snake snake-body';
    element.innerHTML = '';
    element.style['background-color'] = this.getRandomColor();
}

Snake.Game.prototype.drawSnakeHead = function (element) {
    element.className = 'cell snake snake-head';

    var deg = 0;
    switch (this.state.direction) {
        case Snake.Direction.Up:
            deg = 180;
            break;
        case Snake.Direction.Down:
            deg = 0;
            break;
        case Snake.Direction.Right:
            deg = -90;
            break;
        case Snake.Direction.Left:
            deg = 90;
            break;
    }

    element.innerHTML = `<img id="snake-head-img" src="images/snake.png" alt="" style="width: ${this.config.pixelSize}px; height: ${this.config.pixelSize}px; transform: rotate(${deg}deg)">`;
    element.style['background-color'] = 'transparent';
}


Snake.Game.prototype.clearSnake = function () {
    const existing = this.doc.getElementsByClassName('snake');
    if (!existing) {
        return;
    }
    for (let i = 0; i < existing.length; i++) {
        div = this.doc.getElementById(existing[i].id);
        this.clearSnakePart(div);
    }
}

Snake.Game.prototype.clearSnakePart = function (div) {
    div.className = 'cell';
    div.innerHTML = '';
    div.style['background-color'] = 'transparent';
}

Snake.Game.prototype.drawSnake = function () {
    var i = 0,
        id = null,
        div = null,
        requiredIDs = {};
    for (i = 0; i < this.snake.length; i++) {
        requiredIDs[this.cellID(this.snake[i].x, this.snake[i].y)] = true;
    }
    // check existing cells
    this.clearSnake();
    // draw missing cells
    var isHead = true;
    for (id in requiredIDs) {
        if (requiredIDs.hasOwnProperty(id)) {
            div = this.doc.getElementById(id);
            if (isHead) {
                this.drawSnakeHead(div);
                isHead = false;
            } else {
                this.drawSnakeBody(div);
            }
        }
    }
};

Snake.Game.prototype.drawTreat = function () {
    var div = 0,
        requiredID = null,
        existing = this.doc.getElementsByClassName('treat');
    // If there's no treat, remove it
    if (!this.treat && existing.length) {
        existing[0].className = 'cell';
        existing[0].innerHTML = '';
        return;
    }
    if (!this.treat) {
        return;
    }
    // If there's a treat, check if it's the same as display
    requiredID = this.cellID(this.treat.x, this.treat.y);

    const allImageNames = ['apple.png', 'banana.png', 'old-well.png', 'cherries.png', 'corn.png', 'grapes.png', 'pepper.png', 'pumpkin.png', 'strawberry.png'];
    const randomId = Math.floor(Math.random() * allImageNames.length);
    const imageName = allImageNames[randomId];

    if (existing[0]) {
        //already drawn
    } else {
        div = this.doc.getElementById(requiredID);
        div.className = 'cell treat';
        div.innerHTML = `
            <img class="treat-img" src="images/${imageName}" alt="" style="width: ${this.config.pixelSize}px; height: ${this.config.pixelSize}px">
            `;
    }
};

Snake.Game.prototype.stateDescription = function () {
    if (this.state.gameOver) {
        return "GAME OVER";
    } else if (this.state.paused) {
        return "PAUSED (PRESS R TO RESUME)";
    } else {
        return '';
    }

};

Snake.Game.prototype.drawHUD = function () {
    this.doc.getElementById("level").innerHTML = this.state.level;
    this.doc.getElementById("score").innerHTML = this.state.score;
    this.doc.getElementById("state").innerHTML = this.stateDescription();
};

Snake.Game.prototype.draw = function () {
    if (this.state.gameOver) return;

    this.drawHUD();

    this.drawSnake();

    this.drawTreat();
};

Snake.Game.prototype.onkeydown = function (evt) {
    if (this.state.gameOver) {
        return;
    }
    if (this.state.lastKeyTick === this.state.ticks) {
        // Do not allow multiple keys
        return;
    }
    var kcode = evt.keyCode;
    if ((Snake.Direction.Up === kcode && Snake.Direction.Down !== this.state.direction)
        || (Snake.Direction.Down === kcode && Snake.Direction.Up !== this.state.direction)
        || (Snake.Direction.Left === kcode && Snake.Direction.Right !== this.state.direction)
        || (Snake.Direction.Right === kcode && Snake.Direction.Left !== this.state.direction)) {
        this.state.direction = kcode;
        this.state.lastKeyTick = this.state.ticks;
    } else if (Snake.KeyCode.Pause === kcode) {
        this.state.paused = true;
    } else if (Snake.KeyCode.Resume === kcode) {
        this.state.paused = false;
    }
    return true;
};

Snake.Game.prototype.levelIncrease = function () {
    if (this.state.ticks % this.config.levelInterval !== 0) {
        return;
    }

    this.state.level++;

    // New loop interval
    this.state.loopIntervalM -= this.config.levelIncreaseM;
    if (this.state.loopIntervalM < this.config.minInterval) {
        this.state.loopIntervalM = this.config.minInterval;
    }
};

Snake.Game.prototype.loop = function () {
    if (this.state.gameOver || this.state.paused) {
        return;
    }
    this.update();
    this.draw();
    this.wnd.setTimeout(this.loop.bind(this), this.state.loopIntervalM);
};

function createNewGame() {
    if (document.game) delete document.game;
    document.game = new Snake.Game(document, window);
}

function initializeNewGameButton() {
    var startNewGameButton = document.createElement('div');
    startNewGameButton.innerHTML = `<button id="new-game-button" class="w-button-normal">New Game</button>`;
    startNewGameButton.addEventListener("click", createNewGame);
    document.body.appendChild(startNewGameButton);
}

function initializeLogoutButton() {
    document.getElementById('logout').addEventListener('click', () => {
        location.href = '../content/index_login.html'
    })
}

window.onload = function () {
    initializeNewGameButton();
}











