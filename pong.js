// #region variable definitions
var game = document.querySelector("canvas");
var ctx = game.getContext("2d");

var width = game.width;
var height = game.height;

var elemWidth = width/50;
var padHeight = 8*elemWidth;
var elemVel = elemWidth/2;

var stdPadVel = 2*elemWidth;
var stdBallVel = elemVel;
var ballAccel = 1.01;

var velFactor = 0;

var leftCount = 0;
var rightCount = 0;

var keys = [];
//#endregion

//#region Element definition
function Element(x, y, w, h, v) {
    this.posX = x;
    this.posY = y;
    this.width = w;
    this.height = h;
    this.velY = v;
}

Element.prototype.draw = function() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(this.posX, this.posY, this.width, this.height);
}
//#endregion

// TennisBall and Pad don't use parameters other than those defined in Element
// Main reason to inherit from Element: common draw() method
//#region TennisBall definition
function TennisBall(x, y, w, h, velY, velX) {
    Element.call(this, x, y, w, h, velY);
    this.velX = velX;
}
TennisBall.prototype = Object.create(Element.prototype);
TennisBall.prototype.constructor = TennisBall;

var tennisBall = new TennisBall(
    width/2 - elemWidth/2,
    height/2 - elemWidth/2,
    elemWidth,
    elemWidth,
    0, // pure horizontal movement initially
    stdBallVel
);
//#endregion

//#region Pad definition
function Pad(x, y, w, h, v) {
    Element.call(this, x, y, w, h, v);
}
Pad.prototype = Object.create(Element.prototype);
Pad.prototype.constructor = Pad;

var leftPad = new Pad(
    width/100, 
    height/2 - padHeight/2, 
    elemWidth, 
    padHeight, 
    stdPadVel
);
var rightPad = new Pad(
    width - (elemWidth + width/100), 
    height/2 - padHeight/2, 
    elemWidth, 
    padHeight, 
    stdPadVel
);
//#endregion

//#region Movement
/*
W = 119 or 87   I = 105 or 73
S = 115 or 83   K = 107 or 75
*/
function moveLeftPad(keys) {
    if (keys[87] || keys[119]) {
        leftPad.posY -= leftPad.velY;
    } else if (keys[83] || keys[115]) {
        leftPad.posY += leftPad.velY;
    }
    canvasPadCollision(leftPad);
}

// Player v Bot
function rightPadBot() {
    let padTopY = rightPad.posY;
    let ballTopY = tennisBall.posY;

    let padMidY = padTopY + rightPad.height/2;
    let ballMidY = ballTopY + tennisBall.height/2;

    if (tennisBall.velX > 0 && tennisBall.posX > width/3) {

        if (ballMidY > padMidY) {
            rightPad.posY += rightPad.velY;
        } else if (ballMidY < padMidY) {
            rightPad.posY -= rightPad.velY;
        } else if (tennisBall.velY > 0) {
            rightPad.posY += rightPad.velY;
        } else if (tennisBall.velY < 0) {
            rightPad.posY -= rightPad.velY;
        }
    }    
    canvasPadCollision(rightPad);
}

setInterval(rightPadBot, 90);

// 2 Players
/* 
function moveRightPad(keys) {
    if (keys[105] || keys[73]) {
        rightPad.posY -= rightPad.velY;
    } else if (keys[107] || keys[75]) {
        rightPad.posY += rightPad.velY;
    }
    canvasPadCollision(rightPad);
}
*/

function getKeys(event) {
    keys[event.which] = event.type == "keydown";
    moveLeftPad(keys);
    // moveRightPad(keys);
}
window.addEventListener("keydown", getKeys);
window.addEventListener("keyup", getKeys);

function moveTennisBall() {
    tennisBall.posX += tennisBall.velX;
    tennisBall.posY += tennisBall.velY;
    canvasBallCollision(tennisBall);
    ballPadCollision("right");
    ballPadCollision("left");
}
//#endregion

//#region Collisions
// automates bounce action
function collideBall(coord) {
    tennisBall.velX *= ballAccel;
    elemVel *= ballAccel;
    if (coord === "y") {
        tennisBall.posY -= tennisBall.velY;
        tennisBall.velY = -tennisBall.velY;
    } else if (coord === "x") {
        tennisBall.posX -= tennisBall.velX;
        tennisBall.velX = -tennisBall.velX;
    }
}

function canvasPadCollision(pad) {
    let topY = pad.posY;
    let bottomY = topY + pad.height;

    // top collisions
    if (topY <= tennisBall.height) {
        pad.posY = 2*tennisBall.height;
    }
    // bottom collisions
    else if (bottomY >= (height - tennisBall.height)) {
        pad.posY = (height - pad.height) - 2*tennisBall.height;
    }
}

function canvasBallCollision() {
    function score(side) {
        if(side === "left" && leftCount < 5) {
            leftCount += 1;
            tennisBall.velX = stdBallVel;
        } else if(side === "right" && rightCount < 5) {
            rightCount += 1;
            tennisBall.velX = -stdBallVel;
        }
        if (leftCount === 5 || rightCount === 5) {
            resetBall();
        }
        drawScore();
    }
    let leftX = tennisBall.posX;
    let rightX = leftX + tennisBall.width;

    let topY = tennisBall.posY;
    let bottomY = topY + tennisBall.height;

    // top and bottom collisions
    if (topY <= 0 || bottomY >= height) {
        collideBall("y");
    }
    // left and right collisions
    if (leftX <= 0) {
        resetBall();
        score("right");
        // collideBall("x");
        
    } else if(rightX >= width) {
        resetBall();
        score("left");
        // collideBall("x");
        
    }
}

function ballPadCollision(side) {
    // calculates ball's y coordinate to pad's y coordinate ratio
    function relativeY(pad) {
        let padTopY = pad.posY;
        let ballBottomY = tennisBall.posY + tennisBall.height;
        let ballRelY = ballBottomY - padTopY;

        let ratio = ballRelY/(pad.height+tennisBall.height);
        ratio = Math.ceil(100*ratio)/100; // precision set at 100th of a pad
        ratio = (2*ratio - 1);
        return(ratio);
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
            if (ballLeftX <= padRightX) {
                collideBall("x");
                tennisBall.posX = padRightX + 1;
                let ratio = relativeY(leftPad);
                tennisBall.velY = elemVel*ratio;
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
            if (ballRightX >= padLeftX) {
                collideBall("x");
                tennisBall.posX = padLeftX - (tennisBall.width + 1);
                let ratio = relativeY(rightPad);
                tennisBall.velY = elemVel*ratio;
            }
        }
    }
}
//#endregion

//#region Drawings
function drawDashed() {
    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";

    ctx.setLineDash([elemWidth, elemWidth/2]);
    ctx.moveTo(width/2, 0);
    ctx.lineTo(width/2, height);
    ctx.stroke();
}

function drawScore() {

    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";
    ctx.setLineDash([]);
    ctx.font = width/8 + "px Consolas";

    ctx.strokeText(leftCount, width/8, height/4);

    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";
    ctx.setLineDash([]);
    ctx.font = width/8 + "px Consolas";

    ctx.strokeText(rightCount, 6*width/8, height/4);
}

function drawAll() {
    ctx.clearRect(0, 0, width, height);
    
    drawDashed();
    drawScore();

    rightPad.draw();
    leftPad.draw();
    tennisBall.draw();

    moveTennisBall(tennisBall);
    
    window.requestAnimationFrame(drawAll);
}
//#endregion

//#region Resets
function resetBall() {
    tennisBall.posX = width/2 - elemWidth/2;
    tennisBall.posY = height/2 - elemWidth/2;
    tennisBall.velY = 0;

    if (leftCount > 4 || rightCount > 4) {
        (leftCount === 5) ? leftCount = "(:" : rightCount = ":)";
        tennisBall.velX = 0;

    } else if(leftCount !== "W" && rightCount !== "W") {
        tennisBall.velX = stdBallVel;
    }
    resetPads();
}

function resetPads() {
    leftPad.posX = width/100;
    leftPad.posY = height/2 - padHeight/2;

    rightPad.posX = width - (elemWidth + width/100);
    rightPad.posY = height/2 - padHeight/2;
}
//#endregion

function main() {
    resetBall();
    resetPads();
    drawAll();
}

window.addEventListener("load", main);
