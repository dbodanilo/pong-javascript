// global variables
//#region
var game = document.querySelector("canvas");
var ctx = game.getContext("2d");

var maxWidth = game.width;
var maxHeight = game.height;

var padWidth = maxWidth / 50;
var padHeight = 3 * padWidth;
var ballVel = padWidth / 2;
var ballAccel = 1.01;

var stdPadVel = 5*padWidth/4;
var stdBallVel = ballVel;

// IMPLEMENT: constant resultant ball velocity
/*
tennisBall.velY = ballVel * ratio * Math.pow(2, 1/2) / 2;
tennisBall.velX = Math.pow(Math.pow(ballVel, 2) - Math.pow(tennisBall.velY, 2), 1/2);
*/

var leftCount = 0;
var rightCount = 0;

var keys = [];

/*
W = 87   I = 73
S = 83   K = 75
*/
var moves = {
    w: 87,
    s: 83,
    i: 73,
    k: 75
};

var tennisBall;
var leftpad;
var rightPad;
//#endregion

// Element definition
//#region
function Element(x, y, w, h, v) {
    this.posX = x;
    this.posY = y;
    this.width = w;
    this.height = h;
    this.velY = v;
}
Element.prototype.draw = function () {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(this.posX, this.posY, this.width, this.height);
}
//#endregion

// Main reason to inherit from Element: common draw() method

// TennisBall definition
//#region
function TennisBall(x, y, w, h, velY, velX) {
    Element.call(this, x, y, w, h, velY);
    this.velX = velX;
}
TennisBall.prototype = Object.create(Element.prototype);
TennisBall.prototype.constructor = TennisBall;

TennisBall.prototype.bounce = function(horizontal) {
    // augment the base for both (x & y) ball velocities
    ballVel *= ballAccel;
    tennisBall.velX *= ballAccel;
    tennisBall.velY *= ballAccel;
    if (horizontal) {
        tennisBall.posX -= tennisBall.velX;
        tennisBall.velX = -tennisBall.velX;
    } else if (!horizontal) {
        tennisBall.posY -= tennisBall.velY;
        tennisBall.velY = -tennisBall.velY;
    }
}
TennisBall.prototype.move = function() {
    this.posX += this.velX;
    this.posY += this.velY;
    canvasBallCollision();
    ballPadCollision("right");
    ballPadCollision("left");
}
//#endregion

// Pad definition
//#region
function Pad(x, y, w, h, v) {
    Element.call(this, x, y, w, h, v);
}
Pad.prototype = Object.create(Element.prototype);
Pad.prototype.constructor = Pad;

Pad.prototype.canvasCollision = function() {
    let topY = this.posY;
    let bottomY = topY + this.height;

    // top collisions
    if (topY <= this.height) {
        this.posY = this.height + this.width;
    }
    // bottom collisions
    else if (bottomY >= (maxHeight - this.height)) {
        this.posY = maxHeight - (2*this.height + this.width);
    }
}
//#endregion

// Movement
//#region
function moveLeftPad(keys) {
    if (keys[moves.w]) {
        leftPad.posY -= leftPad.velY;
    } else if (keys[moves.s]) {
        leftPad.posY += leftPad.velY;
    }
    leftPad.canvasCollision();
}

// Player v Bot
function rightPadBot() {
    setTimeout(rightPadBot, 1000/12);
    let padTopY = rightPad.posY;
    let ballTopY = tennisBall.posY;

    let padMidY = padTopY + rightPad.height / 2;
    let ballMidY = ballTopY + tennisBall.height / 2;

    // pad moves only when the ball comes at its direction, after the first third of the canvas
    if (tennisBall.velX > 0 && tennisBall.posX > maxWidth / 3) {
        let dist = ballMidY - padMidY;
        // ball a lot under pad's center
        if (dist >= 3*stdPadVel/4) {
            rightPad.posY += rightPad.velY;
        // ball a lot above pad's center
        } else if (dist <= -3*stdPadVel/4) {
            rightPad.posY -= rightPad.velY;
        // ball slightly under pad's center, ball y velocity determines movement
        } else if (dist > 0) {
            if (tennisBall.velY >= 0) {
                rightPad.posY += rightPad.velY;
            } else if (tennisBall.velY < 0) {
                rightPad.posY -= rightPad.velY;
            }
        // ball slightly above pad's center, ball y velocity determines movement
        } else if (dist < 0) {
            if (tennisBall.velY <= 0) {
                rightPad.posY -= rightPad.velY;
            } else if (tennisBall.velY > 0) {
                rightPad.posY += rightPad.velY;
            }
        // ball exactly on pad's center
        } else if (dist === 0) {
            if (tennisBall.velY < 0) {
                rightPad.posY -= rightPad.velY;
            } else if (tennisBall.velY > 0) {
                rightPad.posY += rightPad.velY;
            // ball moving horizontally
            } else {
                // does nothing
            }
        }
    }
    rightPad.canvasCollision();
}

// 2 Players
/* 
function moveRightPad(keys) {
    if (keys[105] || keys[73]) {
        rightPad.posY -= rightPad.velY;
    } else if (keys[107] || keys[75]) {
        rightPad.posY += rightPad.velY;
    }
    rightPad.canvasCollision();
}
*/

function getKeys(event) {
    keys[event.which] = event.type == "keydown";
    moveLeftPad(keys);
    // moveRightPad(keys);
}
//#endregion

// Collisions
//#region
function canvasBallCollision() {
    function score(side) {
        if (side === "left" && leftCount < 5) {
            leftCount += 1;
            tennisBall.velX = stdBallVel;
        } else if (side === "right" && rightCount < 5) {
            rightCount += 1;
            tennisBall.velX = -stdBallVel;
        }
        if (leftCount === 5 || rightCount === 5) {
            reset();
        }
        drawScore();
    }
    let leftX = tennisBall.posX;
    let rightX = leftX + tennisBall.width;

    let topY = tennisBall.posY;
    let bottomY = topY + tennisBall.height;

    // top and bottom collisions
    if (topY <= 0 || bottomY >= maxHeight) {
        // vertical collision
        let bounceX = false;
        tennisBall.bounce(bounceX);
    }
    // left and right collisions
    if (leftX <= 0) {
        reset();
        score("right");

    } else if (rightX >= maxWidth) {
        reset();
        score("left");

    }
}

function ballPadCollision(side) {
    // calculates ball's y coordinate to pad's y coordinate ratio
    function relativeY(pad) {
        let padTopY = pad.posY;
        let ballBottomY = tennisBall.posY + tennisBall.height;
        let ballRelY = ballBottomY - padTopY;

        let ratio = ballRelY / (pad.height + tennisBall.height);
        ratio = Math.ceil(100 * ratio) / 100; // precision set at 100th of a pad
        ratio = (2 * ratio - 1);
        return (ratio);
    }

    if (side === "left") {
        let ballLeftX = tennisBall.posX;
        let padRightX = leftPad.posX + leftPad.width;

        let ballTopY = tennisBall.posY;
        let ballBottomY = ballTopY + tennisBall.height;
        let padTopY = leftPad.posY;
        let padBottomY = padTopY + leftPad.height;
        // Compare Y coordinates first
        if (ballBottomY >= padTopY && ballTopY <= padBottomY) {
            // Then compare X coordinates
            if (ballLeftX <= padRightX && ballLeftX >= leftPad.posX) {
                // horizontal collision
                let bounceX = true;
                tennisBall.bounce(bounceX);

                tennisBall.posX = padRightX + 1;
                let ratio = relativeY(leftPad);
                tennisBall.velY = ballVel * ratio * Math.pow(2, 1/2) / 2;
                tennisBall.velX = Math.pow(Math.pow(ballVel, 2) - Math.pow(tennisBall.velY, 2), 1/2);
                console.log(tennisBall.velY, tennisBall.velX);
            }
        }
    } else if (side === "right") {
        let ballRightX = tennisBall.posX + tennisBall.width;
        let padLeftX = rightPad.posX;

        let ballTopY = tennisBall.posY;
        let ballBottomY = ballTopY + tennisBall.height;
        let padTopY = rightPad.posY;
        let padBottomY = padTopY + rightPad.height;
        if (ballBottomY >= padTopY && ballTopY <= padBottomY) {
            if (ballRightX >= padLeftX && ballRightX <= (padLeftX + rightPad.width)) {
                // horizontal collision
                let bounceX = true;
                tennisBall.bounce(bounceX);

                tennisBall.posX = padLeftX - (tennisBall.width + 1);
                let ratio = relativeY(rightPad);
                tennisBall.velY = ballVel * ratio * Math.pow(2, 1/2) / 2;
                tennisBall.velX = -Math.pow(Math.pow(ballVel, 2) - Math.pow(tennisBall.velY, 2), 1/2);
                console.log(tennisBall.velY, tennisBall.velX);
            }
        }
    }
}
//#endregion

//#region Drawings
function drawDashed() {
    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";

    ctx.setLineDash([padWidth, padWidth / 2]);
    ctx.moveTo(maxWidth / 2, 0);
    ctx.lineTo(maxWidth / 2, maxHeight);
    ctx.stroke();
}

function drawScore() {

    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";
    ctx.setLineDash([]);
    ctx.font = maxWidth / 8 + "px Consolas";

    ctx.strokeText(leftCount, maxWidth / 8, maxHeight / 4);

    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";
    ctx.setLineDash([]);
    ctx.font = maxWidth / 8 + "px Consolas";

    ctx.strokeText(rightCount, 6 * maxWidth / 8, maxHeight / 4);
}

function drawAll() {
    if (leftCount !== "(:" && rightCount !== ":)") {
        window.requestAnimationFrame(drawAll);
    }

    ctx.clearRect(0, 0, maxWidth, maxHeight);

    drawDashed();
    drawScore();

    rightPad.draw();
    leftPad.draw();
    tennisBall.draw();

    tennisBall.move();
}
//#endregion

// Resets
//#region

tennisBall = new TennisBall(0, 0, 0, 0, 0, 0);
leftPad = new Pad(0, 0, 0, 0, 0);
rightPad = new Pad(0, 0, 0, 0, 0);

function resetBall() {
    tennisBall.posX = maxWidth / 2 - padWidth / 4;
    tennisBall.posY = maxHeight / 2 - padWidth / 4;
    tennisBall.width = padWidth / 2;
    tennisBall.height = padWidth / 2;
    tennisBall.velY = 0; // pure horizontal movement initially
    tennisBall.velX = stdBallVel;

    if (leftCount > 4 || rightCount > 4) {
        (leftCount === 5) ? leftCount = "(:" : rightCount = ":)";
        tennisBall.velX = 0;

    } else if (leftCount !== "(:" && rightCount !== ":)") {
        tennisBall.velX = stdBallVel;
    }
}

function resetPads() {
    leftPad.posX = maxWidth / 10;
    leftPad.posY = maxHeight / 2 - padHeight / 2;
    leftPad.width = padHeight / 3;
    leftPad.height = padHeight;
    leftPad.velY = stdPadVel;

    rightPad.posX = maxWidth - (padWidth + maxWidth / 10);
    rightPad.posY = leftPad.posY;
    rightPad.width = leftPad.width;
    rightPad.height = leftPad.height;
    rightPad.velY = leftPad.velY;
}

function reset() {
    resetBall();
    resetPads();

    if (window.onkeydown || window.onkeyup) {
        window.removeEventListener("keydown", getKeys);
        window.removeEventListener("keyup", getKeys);
    }
}
//#endregion

function start() {
    reset();
    rightPadBot();

    if (!window.onkeydown || !window.onkeyup) {
        window.addEventListener("keydown", getKeys);
        window.addEventListener("keyup", getKeys);
    }

    drawAll();
}

window.addEventListener("load", start);
