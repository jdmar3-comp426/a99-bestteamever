var Snake = {};

// Configuration
Snake.Config = function () {
    // Pixel size.
    this.pixelSize = 20;

    // Box size in pixels
    this.boxSize = 15;

    // Snake is initially drawn using N pixels.
    this.snakeLength = 3;

    // Every now and then (interval should be configurable from code)
    // snake gains speed, ie. level is increased.
    // We use loop ticks as interval, not millis, since the game can
    // be paused and resumed.
    this.levelIntervalTicks = 30;

    // If snake wonders for too long (30 sec for instance) treat
    // is repositioned.
    // We use loop ticks as interval, not millis, since the game can
    // be paused and resumed.
    this.treatRepositionTicks = 30;

    // Game speed is increased by N millis with each level.
    this.levelIncreaseMillis = 200;

    // Maximum game speed is N millis.
    this.minimumLoopIntervalMillis = 300;
};

// Initial game state
Snake.State = function () {
    this.level = 1;
    this.score = 0;
    this.gameOver = false;
    this.paused = false;
    this.loopIntervalMillis = 500;
    this.direction = Snake.Direction.Up;
    this.ticks = 0;
    this.lastKeyTick = 0;
    this.lastTreatTick = 0;
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

// Point represents a point on the screen (x, y)
Snake.Point = function (x, y) {
    this.x = x;
    this.y = y;
};

Snake.Point.prototype.toString = function () {
    return this.x + "," + this.y;
};

Snake.Point.prototype.collides = function (arr) {
    var i;
    for (i = 0; i < arr.length; i = i + 1) {
        if (this.x === arr[i].x && this.y === arr[i].y) {
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
    for (y = 0; y < this.config.boxSize; y = y + 1) {
        this.box.push(new Snake.Point(x, y));
    }
    // top
    y = this.config.boxSize - 1;
    for (x = 0; x < this.config.boxSize; x = x + 1) {
        this.box.push(new Snake.Point(x, y));
    }
    // right
    x = this.config.boxSize - 1;
    for (y = this.config.boxSize - 2; y >= 0; y = y - 1) {
        this.box.push(new Snake.Point(x, y));
    }
    // bottom
    y = 0;
    for (x = this.config.boxSize - 2; x > 0; x = x - 1) {
        this.box.push(new Snake.Point(x, y));
    }
};

Snake.Game.prototype.initSnake = function () {
    var i = 0,
        x = Math.floor(this.config.boxSize / 2);
    this.snake = [];
    // from head to tail
    for (i = this.config.snakeLength; i > 0; i = i - 1) {
        this.snake.push(new Snake.Point(x, i));
    }
};

Snake.Game.prototype.calculateShift = function () {
    var shift = new Snake.Point(0, 0);
    switch (this.state.direction) {
        case Snake.Direction.Up:
            shift.y = 1;
            break;
        case Snake.Direction.Down:
            shift.y = -1;
            break;
        case Snake.Direction.Left:
            shift.x = -1;
            break;
        case Snake.Direction.Right:
            shift.x = 1;
            break;
    }
    return shift;
};

Snake.Game.prototype.moveSnake = function () {
    // Calculate new head
    var head = new Snake.Point(this.snake[0].x, this.snake[0].y),
        shift = this.calculateShift();
    head.x = head.x + shift.x;
    head.y = head.y + shift.y;

    // Check if head collides with treat
    if (head.collides([this.treat])) {
        // Leave tail in place, as treat was eaten
        // Give score, according to level
        this.state.score = this.state.score + this.state.level;
        const treatImgs = this.doc.getElementsByClassName('treat-img');
        if (treatImgs[0]) {
            treatImgs[0].remove();
        }
        this.drawTreat();
        delete this.treat;
    } else {
        // Remove tail, as treat was not eaten
        this.snake.pop();
    }

    // Check if head collides with box
    if (head.collides(this.box)) {
        this.onGameOver();
    }

    // Check if head collides with snake itself
    if (head.collides(this.snake)) {
        this.onGameOver();
    }

    // Set new head
    this.snake.unshift(head);

};

Snake.Game.prototype.onGameOver = function () {
    this.state.gameOver = true;
    startNewGameButton.style.display = "block";
    var button = document.createElement('div');
    button.innerHTML = `<button id="new-game-button">New Game</button>`;
    button.addEventListener("click", createNewGame);
    document.body.appendChild(button);

    return;
};

Snake.Game.prototype.updateHighestScore = function () {
    const currentScore = this.state.score;
}

// http://stackoverflow.com/questions/1527803/generating-random-numbers-in-javascript-in-a-specific-range
Snake.Game.prototype.getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

Snake.Game.prototype.placeTreat = function () {
    if (this.state.ticks - this.state.lastTreatTick >= this.config.treatRepositionTicks) {
        delete this.treat;
    }

    if (this.treat) {
        return;
    }
    var x = 0, y = 0, treat = null;
    while (!this.treat) {
        x = this.getRandomInt(1, this.config.boxSize - 1);
        y = this.getRandomInt(1, this.config.boxSize - 1);
        treat = new Snake.Point(x, y);
        if (!treat.collides(this.snake) && !treat.collides(this.box)) {
            this.treat = treat;
            this.state.lastTreatTick = this.state.ticks;
        }
    }
};

Snake.Game.prototype.update = function () {
    if (this.state.gameOver || this.state.paused) {
        return;
    }
    this.placeTreat();

    this.moveSnake();

    this.state.ticks = this.state.ticks + 1;

    this.increaseLevel();
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


Snake.Game.prototype.drawGrid = function () {
    document.body.innerHTML = `
    <div id="hud">
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
        
    </div>`;
    var i = 0,
        j = 0,
        topMargin = 200,
        div = null;
    for (i = 0; i < this.config.boxSize; i = i + 1) {
        for (j = 0; j < this.config.boxSize; j = j + 1) {
            div = this.doc.createElement('div');
            div.className = 'cell';
            div.style.width = this.config.pixelSize + 'px';
            div.style.height = this.config.pixelSize + 'px';
            div.style.left = (i * this.config.pixelSize) + 'px';
            div.style.top = topMargin + (j * this.config.pixelSize) + 'px';
            div.id = this.cellID(i, this.config.boxSize - j - 1);
            this.doc.body.appendChild(div);
        }
    }
};

Snake.Game.prototype.drawBox = function () {
    var i = 0,
        div = null,
        pt = null;
    for (i = 0; i < this.box.length; i = i + 1) {
        pt = this.box[i];
        div = this.doc.getElementById(this.cellID(pt.x, pt.y));
        div.className = 'cell box';
    }
};

Snake.Game.prototype.fetchHighScore = function () {
    return -1;
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
        case Snake.Direction.Right:
            deg = -90;
            break;
        case Snake.Direction.Down:
            deg = 0;
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
    if (!existing) return;
    for (i = 0; i < existing.length; i = i + 1) {
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
        existing = this.doc.getElementsByClassName('snake'),
        requiredIDs = {};
    // lookup required cells
    for (i = 0; i < this.snake.length; i = i + 1) {
        requiredIDs[this.cellID(this.snake[i].x, this.snake[i].y)] = true;
    }
    // check existing cells
    this.clearSnake();
    // draw missing cell(s)
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
    // If there's no treat, remove it from display
    if (!this.treat && existing.length) {
        existing[0].className = 'cell';
        existing[0].innerHTML = '';
        return;
    }
    if (!this.treat) {
        return;
    }
    // If there's a treat, check if its the same as displayed.
    requiredID = this.cellID(this.treat.x, this.treat.y);

    const allImageNames = ['apple.png', 'banana.png', 'old-well.png'];
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
    }
    if (this.state.paused) {
        return "PAUSED (PRESS R TO RESUME)";
    }
    //return "PRESS P TO PAUSE";
    return '';
};

Snake.Game.prototype.drawHUD = function () {
    this.doc.getElementById("level").innerHTML = this.state.level;
    this.doc.getElementById("score").innerHTML = this.state.score;
    this.doc.getElementById("state").innerHTML = this.stateDescription();
};

Snake.Game.prototype.draw = function () {
    if (this.state.gameOver || this.state.paused) {
        return;
    }
    this.drawHUD();

    this.drawSnake();

    this.drawTreat();
};

Snake.Game.prototype.onkeydown = function (evt) {
    if (this.state.gameOver) {
        return;
    }
    if (this.state.lastKeyTick === this.state.ticks) {
        // Dont allow multiple keys in same tick
        return;
    }
    var code = evt.keyCode;
    if ((Snake.Direction.Up === code && Snake.Direction.Down !== this.state.direction)
        || (Snake.Direction.Down === code && Snake.Direction.Up !== this.state.direction)
        || (Snake.Direction.Left === code && Snake.Direction.Right !== this.state.direction)
        || (Snake.Direction.Right === code && Snake.Direction.Left !== this.state.direction)) {
        this.state.direction = code;
        this.state.lastKeyTick = this.state.ticks;
    } else if (Snake.KeyCode.Pause === code) {
        this.state.paused = true;
    } else if (Snake.KeyCode.Resume === code) {
        this.state.paused = false;
    }
    return true;
};

Snake.Game.prototype.increaseLevel = function () {
    if (this.state.ticks % this.config.levelIntervalTicks !== 0) {
        return;
    }

    this.state.level = this.state.level + 1;

    // Set new loop interval, but not less than n millis
    this.state.loopIntervalMillis = this.state.loopIntervalMillis - this.config.levelIncreaseMillis;
    if (this.state.loopIntervalMillis < this.config.minimumLoopIntervalMillis) {
        this.state.loopIntervalMillis = this.config.minimumLoopIntervalMillis;
    }
};

Snake.Game.prototype.loop = function () {
    if (this.state.gameOver || this.state.paused) {
        return;
    }
    this.update();
    this.draw();
    this.wnd.setTimeout(this.loop.bind(this), this.state.loopIntervalMillis);
};

function createNewGame() {
    if (document.game) delete document.game;
    document.game = new Snake.Game(document, window);
    startNewGameButton.style.display = "none";
}

let startNewGameButton;
window.onload = function () {
    startNewGameButton = document.getElementById("new-game-button");
    startNewGameButton.addEventListener("click", createNewGame);
}











