var Snake = {};

// Configuration
Snake.Config = function () {
    // Pixel size
    this.pixel_size = 20;

    // Box size (pixels)
    this.box_size = 15;

    // Snake length (pixels)
    this.snake_length = 3;

    // Every now and then (interval should be configurable from code)
    // snake gains speed, ie. level is increased.
    this.interval_ticks = 30;

    // If snake wonders for too long (30 sec for instance) treat
    // is repositioned.
    this.reposition_ticks = 30;

    // Game speed is increased by N millis with each level.
    this.speedChange_millis = 200;

    // Maximum game speed is N millis.
    this.minSpeed_millis = 300;
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
    for (let i = 0; i < arr.length; i++) {
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
    this.loop();
};

Snake.Game.prototype.initBox = function () {
    if (this.box) {
        return;
    }
    var x = 0, y = 0;
    this.box = [];
    // left
    x = 0;
    for (y = 0; y < this.config.box_size; y++) {
        this.box.push(new Snake.Point(x, y));
    }
    // top
    y = this.config.box_size - 1;
    for (x = 0; x < this.config.box_size; x++) {
        this.box.push(new Snake.Point(x, y));
    }
    // right
    x = this.config.box_size - 1;
    for (y = this.config.box_size - 2; y >= 0; y--) {
        this.box.push(new Snake.Point(x, y));
    }
    // bottom
    y = 0;
    for (x = this.config.box_size - 2; x > 0; x = x - 1) {
        this.box.push(new Snake.Point(x, y));
    }
};

Snake.Game.prototype.initSnake = function () {
    if (this.snake) {
        return;
    }
    var i = 0,
        x = Math.floor(this.config.box_size / 2);
    this.snake = [];
    // from head to tail
    for (i = this.config.snake_length; i > 0; i--) {
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
    // new head
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
    return;
};

Snake.Game.prototype.getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

Snake.Game.prototype.placeTreat = function () {
    if (this.state.ticks - this.state.lastTreatTick >= this.config.reposition_ticks) {
        delete this.treat;
    }

    if (this.treat) {
        return;
    }
    var x = 0, y = 0, treat = null;
    while (!this.treat) {
        x = this.getRandomInt(1, this.config.box_size - 1);
        y = this.getRandomInt(1, this.config.box_size - 1);
        treat = new Snake.Point(x, y);
        if (!treat.collides(this.snake) && !treat.collides(this.box)) {
            this.treat = treat;
            this.state.lastTreatTick = this.state.ticks;
        }
    }
};

Snake.Game.prototype.update = function () {
    this.initBox();
    this.initSnake();

    if (this.state.paused) {
        return;
    }

    if (this.state.gameOver) {
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

Snake.Game.prototype.drawGrid = function () {
    if (this.gridDrawn) {
        return;
    }
    var i = 0,
        j = 0,
        topMargin = 200,
        div = null;
    for (i = 0; i < this.config.box_size; i++) {
        for (j = 0; j < this.config.box_size; j++) {
            div = this.doc.createElement('div');
            div.className = 'cell';
            div.style.width = this.config.pixel_size + 'px';
            div.style.height = this.config.pixel_size + 'px';
            div.style.left = (i * this.config.pixel_size) + 'px';
            div.style.top = topMargin + (j * this.config.pixel_size) + 'px';
            div.id = this.cellID(i, this.config.box_size - j - 1);
            this.doc.body.appendChild(div);
        }
    }
    this.gridDrawn = true;
};

Snake.Game.prototype.drawBox = function () {
    if (this.boxDrawn) {
        return;
    }
    var i = 0,
        div = null,
        pt = null;
    for (i = 0; i < this.box.length; i = i + 1) {
        pt = this.box[i];
        div = this.doc.getElementById(this.cellID(pt.x, pt.y));
        div.className = 'cell box';
    }
    this.boxDrawn = true;
};

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
    for (i = 0; i < existing.length; i = i + 1) {
        // if the cell is required, leave it as is.
        // else, "delete" it
        if (!requiredIDs[existing[i].id]) {
            div = this.doc.getElementById(existing[i].id);
            div.className = 'cell';
        } else {
            // mark it as not missing
            delete requiredIDs[existing[i].id];
        }
    }
    // draw missing cell(s)
    for (id in requiredIDs) {
        if (requiredIDs.hasOwnProperty(id)) {
            div = this.doc.getElementById(id);
            div.className = 'cell snake';

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
        //remove drawn treats and draw new
        // const treatImgs = this.doc.getElementsByClassName('treat-img');
        // if (treatImgs[0]) {
        //     treatImgs[0].remove();
        // }
        div = this.doc.getElementById(requiredID);
        div.className = 'cell treat';
        div.innerHTML = `
            <img class="treat-img" src="images/${imageName}" alt="" style="width: ${this.config.pixel_size
            }px; height: ${this.config.pixel_size}px">
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
    return "PRESS P TO PAUSE";
};

Snake.Game.prototype.drawHUD = function () {
    this.doc.getElementById("level").innerHTML = this.state.level;
    this.doc.getElementById("score").innerHTML = this.state.score;
    this.doc.getElementById("state").innerHTML = this.stateDescription();
};

Snake.Game.prototype.draw = function () {
    this.drawHUD();

    if (this.state.gameOver) {
        return;
    }

    this.drawGrid();

    this.drawBox();

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
    this.state.loopIntervalMillis = this.state.loopIntervalMillis - this.config.speedChange_millis;
    if (this.state.loopIntervalMillis < this.config.minSpeed_millis) {
        this.state.loopIntervalMillis = this.config.minSpeed_millis;
    }
};

Snake.Game.prototype.loop = function () {
    this.update();
    this.draw();
    this.wnd.setTimeout(this.loop.bind(this), this.state.loopIntervalMillis);
};

const startNewGameButton = document.getElementById("new-game-button");

startNewGameButton.addEventListener("click", createNewGame);

function createNewGame() {
    document.game = new Snake.Game(document, window);
    startNewGameButton.style.display = "none";
}



