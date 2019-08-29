class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    get length() {
        return (this.x ** 2 + this.y ** 2) ** 0.5;
    }

    get dir() {
        return new Vector(this.x / this.length, this.y / this.length);
    }

    vecMul(v) { return v.x * this.x + v.y * this.y; }

    mul(c) {
        return new Vector(this.x * c, this.y * c);
    }

    addToSelf(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

}

class Ball {
    constructor(x = 6, y = 6, vx = 3, ax = 0, ay = 0) {
        this.position = new Vector(x, y);
        this.velocity = Math.random() < 0.5 ? new Vector(vx, vx * Math.random()) : new Vector(vx * Math.random(), vx);
        this.acceleration = new Vector(ax, ay);
        this.mass = 20;
        this.pressure = new Vector(0, 0);
        this.radius = 10;
        this.gridRow = -1;
        this.gridColumn = -1;
        this.neighbors = [];
    }

    dist(b) {
        return ((b.position.x - this.position.x) ** 2
            + (b.position.y - this.position.y) ** 2) ** 0.5;
    }
}

const ctx = document.getElementById('myCanvas').getContext('2d');
const h = 50; // smoothing width
const h3 = h ** 4;
const mu = 1; // viscosity factor

const canvasWidth = 700;
const canvasHeight = 700;

const star = new Image();
star.src = './star.png';

const gridSize = 50;
let grid = new Array(Math.floor(canvasHeight / gridSize) *
    Math.floor(canvasWidth / gridSize));

for (let i = 0; i < grid.length; i++) {
    grid[i] = [];
}

const balls = [];

const numRow = Math.floor(canvasHeight / gridSize);
const numColumn = Math.floor(canvasWidth / gridSize);


/**
 * 
 * @param {Number} r distance from one particle to another
 */
function spikyKernel(r) {
    if (r > h) {
        return 0;
    } else if (r <= 20) {
        return 700 * ((h - 20) ** 3) / (Math.PI * h3);
    }
    return 700 * ((h - r) ** 3) / (Math.PI * h3);
}

/**
 * pressure force of particle a
 * @param {Ball} a current particle
 */
function pressureForce(a) {
    const neighbors = a.neighbors;
    let sum = new Vector(0, 0);
    for (const n of neighbors) {
        if (n.position.x === a.position.x && a.position.y === n.position.y) continue;
        const mul = n.mass * spikyKernel(a.dist(n));
        const vec = new Vector(a.position.x - n.position.x, a.position.y - n.position.y);
        const direction = new Vector(vec.x / vec.length, vec.y / vec.length);
        sum.addToSelf(direction.mul(mul));
    }
    return sum;
}

/**
 * 
 * @param {Number} r distance from one particle to another
 */
function viscosityKernelLaplacian(r) {
    if (r >= h) return 0;
    if (r <= 25) return 0;
    return 45 * (h - r) / (Math.PI * h3);
}

/**
 * viscosity force of particle a
 * @param {Ball} a current particle
 */
function viscosityForce(a) {
    const neighbors = a.neighbors;
    let vx = 0, vy = 0;
    for (const n of neighbors) {
        const mul = mu * n.mass * viscosityKernelLaplacian(a.dist(n));
        vx += (n.velocity.x - a.velocity.x) * mul;
        vy += (n.velocity.y - a.velocity.y) * mul;
    }
    return new Vector(vx, vy);
}

function init(){
    setInterval(callback, 20);
}
let time = 0;

let number = 0;
let counter = 0;

function callback() {
    if (number < 250 && counter % Math.floor(1000 / (1 + balls.length)) === 0) {
        balls.push(new Ball());
        number++;
        counter = 0;
    }

    if (number < 250) {
        counter++;
    }

    // clearRect
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // render
    for (const ball of balls) {
        ctx.drawImage(star, ball.position.x - ball.radius, ball.position.y - ball.radius, ball.radius * 2, ball.radius * 2);
    }
    // update grid
    for (let i = 0; i < grid.length; i++) {
        grid[i].length = 0;
    }

    for (const ball of balls) {
        const idx = Math.floor(ball.position.y / gridSize) * numColumn + Math.floor(ball.position.x / gridSize);
        ball.gridRow = Math.floor(ball.position.y / gridSize);
        ball.gridColumn = Math.floor(ball.position.x / gridSize);
        grid[idx].push(ball);
    }
    // update neighbors
    for (const ball of balls) {
        ball.neighbors.length = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const r = ball.gridRow + i;
                const c = ball.gridColumn + j;
                if (r >= 0 && r < numRow && c >= 0 && c < numColumn) {
                    const temp = grid[r * numColumn + c];
                    if (temp) {
                        for (const g of temp) {
                            ball.neighbors.push(g);
                        }
                    }
                }
            }
        }
    }

    // update acceleration
    for (const ball of balls) {
        ball.acceleration = new Vector(0, 0);
        ball.acceleration.addToSelf(pressureForce(ball));
        ball.acceleration.addToSelf(viscosityForce(ball));
    }

    // update velocity
    for (const ball of balls) {
        ball.velocity.addToSelf(ball.acceleration.mul(0.01));
        ball.position.addToSelf(ball.velocity.mul(0.1));
    }
    for (const ball of balls) {
        if (ball.position.x - ball.radius < 0) {
            ball.position.x = ball.radius;
            ball.velocity.x *= -1;
        }
        if (ball.position.x + ball.radius > canvasWidth) {
            ball.position.x = canvasWidth - ball.radius;
            ball.velocity.x *= -1;
        }
        if (ball.position.y - ball.radius < 0) {
            ball.position.y = ball.radius;
            ball.velocity.y *= -1;
        }
        if (ball.position.y + ball.radius > canvasHeight) {
            ball.position.y = canvasHeight - ball.radius;
            ball.velocity.y *= -1;
        }
    }
}