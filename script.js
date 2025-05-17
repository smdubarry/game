const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const foodCountEl = document.getElementById('foodCount');
const populationCountEl = document.getElementById('populationCount');

const TILE_SIZE = 16;
const GRID_WIDTH = Math.floor(canvas.width / TILE_SIZE);
const GRID_HEIGHT = Math.floor(canvas.height / TILE_SIZE);

ctx.imageSmoothingEnabled = false;

function createCheckerboard(c1, c2) {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            g.fillStyle = (x + y) % 2 ? c1 : c2;
            g.fillRect(x, y, 1, 1);
        }
    }
    return c;
}

function createHouseSprite() {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d');
    g.fillStyle = '#a33';
    g.beginPath();
    g.moveTo(1, 7);
    g.lineTo(8, 1);
    g.lineTo(15, 7);
    g.closePath();
    g.fill();
    g.fillStyle = '#888';
    g.fillRect(2, 7, 12, 8);
    g.fillStyle = '#444';
    g.fillRect(7, 10, 2, 5);
    return c;
}

function createVillagerSprite() {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const g = c.getContext('2d');
    g.fillStyle = '#55f';
    g.fillRect(4, 6, 8, 9);
    g.fillStyle = '#dbb';
    g.fillRect(5, 2, 6, 4);
    return c;
}

const sprites = {
    grass: createCheckerboard('#6c6', '#7d7'),
    farmland: createCheckerboard('#b97', '#aa6'),
    house: createHouseSprite(),
    villager: createVillagerSprite()
};

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
            ctx.drawImage(sprites[tile.type], x * TILE_SIZE, y * TILE_SIZE);
        }
    }
    // Draw villagers
    for (const v of villagers) {
        ctx.drawImage(sprites.villager, v.x * TILE_SIZE, v.y * TILE_SIZE);
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
