const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const foodCountEl = document.getElementById('foodCount');
const populationCountEl = document.getElementById('populationCount');

const TILE_SIZE = 20;
const GRID_WIDTH = Math.floor(canvas.width / TILE_SIZE);
const GRID_HEIGHT = Math.floor(canvas.height / TILE_SIZE);

let running = true;
let food = 0;

const tiles = [];
for (let y = 0; y < GRID_HEIGHT; y++) {
    tiles[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
        tiles[y][x] = {
            type: Math.random() < 0.1 ? 'farmland' : 'grass'
        };
    }
}

const villagers = [];
function addVillager(x, y) {
    villagers.push({
        x: x || Math.floor(Math.random() * GRID_WIDTH),
        y: y || Math.floor(Math.random() * GRID_HEIGHT),
        actionTimer: 0
    });
    updateCounts();
}

function updateCounts() {
    populationCountEl.textContent = villagers.length;
    foodCountEl.textContent = food;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw tiles
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const tile = tiles[y][x];
            if (tile.type === 'farmland') {
                ctx.fillStyle = '#8f8';
            } else if (tile.type === 'house') {
                ctx.fillStyle = '#888';
            } else {
                ctx.fillStyle = '#6c6';
            }
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
    // Draw villagers
    ctx.fillStyle = '#55f';
    for (const v of villagers) {
        ctx.beginPath();
        ctx.arc(v.x * TILE_SIZE + TILE_SIZE/2, v.y * TILE_SIZE + TILE_SIZE/2, TILE_SIZE/2 - 2, 0, Math.PI*2);
        ctx.fill();
    }
}

function stepVillager(v) {
    if (v.actionTimer > 0) {
        v.actionTimer--;
        return;
    }
    const tile = tiles[v.y][v.x];
    if (tile.type === 'farmland') {
        food += 1;
    }
    if (tile.type === 'grass' && food >= 20) {
        tile.type = 'house';
        food -= 20;
    }
    // Move randomly
    const dir = Math.floor(Math.random() * 4);
    if (dir === 0 && v.x > 0) v.x--;
    if (dir === 1 && v.x < GRID_WIDTH-1) v.x++;
    if (dir === 2 && v.y > 0) v.y--;
    if (dir === 3 && v.y < GRID_HEIGHT-1) v.y++;
}

let spawnTimer = 200;
function gameTick() {
    if (!running) return;

    for (const v of villagers) {
        stepVillager(v);
    }

    spawnTimer--;
    if (spawnTimer <= 0 && food >= 5) {
        addVillager();
        food -= 5;
        spawnTimer = 200;
    }

    updateCounts();
    draw();
}

addVillager();
setInterval(gameTick, 100);

document.getElementById('toggleSim').addEventListener('click', () => {
    running = !running;
    document.getElementById('toggleSim').textContent = running ? 'Pause' : 'Resume';
});

document.getElementById('addVillager').addEventListener('click', () => {
    addVillager();
});
