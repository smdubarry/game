const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const foodCountEl = document.getElementById('foodCount');
const populationCountEl = document.getElementById('populationCount');
const houseCountEl = document.getElementById('houseCount');

const TILE_SIZE = 16;
const GRID_WIDTH = Math.floor(canvas.width / TILE_SIZE);
const GRID_HEIGHT = Math.floor(canvas.height / TILE_SIZE);
const TILE_MARGIN = 1;

// Image containing all sprites from the Kenney roguelike/RPG pack
const tileset = new Image();
tileset.src = 'kenney_roguelike-rpg-pack/Spritesheet/roguelikeSheet_transparent.png';
let SHEET_COLS = 57; // default, will be recalculated on load

ctx.imageSmoothingEnabled = false;

// Helper to compute the source position of a tile ID in the spritesheet
function getTilePos(id) {
    const index = id - 1;
    const col = index % SHEET_COLS;
    const row = Math.floor(index / SHEET_COLS);
    return {
        sx: col * (TILE_SIZE + TILE_MARGIN) + TILE_MARGIN,
        sy: row * (TILE_SIZE + TILE_MARGIN) + TILE_MARGIN
    };
}

// Mapping of game elements to sprite IDs from the roguelike sheet
const SPRITE_IDS = {
    grass: 63,
    farmland: 579,
    house: 1218,
    villager: 159
};

let running = true;
let food = 0;
let houseCount = 0;

function countHouses() {
    let count = 0;
    for (let row of tiles) {
        for (let t of row) if (t.type === 'house') count++;
    }
    houseCount = count;
}

function findNearestHouse(x, y, requireFood = false) {
    let best = null;
    let bestDist = Infinity;
    for (let yy = 0; yy < GRID_HEIGHT; yy++) {
        for (let xx = 0; xx < GRID_WIDTH; xx++) {
            if (tiles[yy][xx].type === 'house' && (!requireFood || tiles[yy][xx].stored > 0)) {
                const d = Math.abs(x - xx) + Math.abs(y - yy);
                if (d < bestDist) {
                    bestDist = d;
                    best = { x: xx, y: yy };
                }
            }
        }
    }
    return best;
}

function findNearestCrop(x, y) {
    let best = null;
    let bestDist = Infinity;
    for (let yy = 0; yy < GRID_HEIGHT; yy++) {
        for (let xx = 0; xx < GRID_WIDTH; xx++) {
            const t = tiles[yy][xx];
            if (t.type === 'farmland' && t.hasCrop) {
                const d = Math.abs(x - xx) + Math.abs(y - yy);
                if (d < bestDist) {
                    bestDist = d;
                    best = { x: xx, y: yy };
                }
            }
        }
    }
    return best;
}

function moveTowards(v, target) {
    if (!target) return;
    if (v.x < target.x) v.x++;
    else if (v.x > target.x) v.x--;
    else if (v.y < target.y) v.y++;
    else if (v.y > target.y) v.y--;
}

function getTotalFood() {
    let total = 0;
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const t = tiles[y][x];
            if (t.type === 'house') total += t.stored;
        }
    }
    return total;
}

function spendFood(amount) {
    if (getTotalFood() < amount) return false;
    let remaining = amount;
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const t = tiles[y][x];
            if (t.type === 'house' && t.stored > 0) {
                const use = Math.min(t.stored, remaining);
                t.stored -= use;
                remaining -= use;
                if (remaining <= 0) return true;
            }
        }
    }
    return false;
}

const tiles = [];
for (let y = 0; y < GRID_HEIGHT; y++) {
    tiles[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
        const type = Math.random() < 0.1 ? 'farmland' : 'grass';
        tiles[y][x] = {
            type,
            hasCrop: type === 'farmland',
            stored: 0
        };
    }
}

// Start with a house in the center so villagers have somewhere to deposit food
const startX = Math.floor(GRID_WIDTH / 2);
const startY = Math.floor(GRID_HEIGHT / 2);
tiles[startY][startX].type = 'house';
tiles[startY][startX].hasCrop = false;
tiles[startY][startX].stored = 0;

const villagers = [];
function addVillager(x, y) {
    villagers.push({
        x: x || Math.floor(Math.random() * GRID_WIDTH),
        y: y || Math.floor(Math.random() * GRID_HEIGHT),
        actionTimer: 0,
        carrying: 0,
        task: null,
        target: null,
        hunger: 100
    });
    updateCounts();
}

function updateCounts() {
    food = getTotalFood();
    populationCountEl.textContent = villagers.length;
    foodCountEl.textContent = food;
    houseCountEl.textContent = houseCount;
}

function drawTile(id, dx, dy) {
    const { sx, sy } = getTilePos(id);
    ctx.drawImage(tileset, sx, sy, TILE_SIZE, TILE_SIZE, dx, dy, TILE_SIZE, TILE_SIZE);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw tiles
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const tile = tiles[y][x];
            drawTile(SPRITE_IDS[tile.type], x * TILE_SIZE, y * TILE_SIZE);
        }
    }
    // Draw villagers
    for (const v of villagers) {
        drawTile(SPRITE_IDS.villager, v.x * TILE_SIZE, v.y * TILE_SIZE);
    }
}

function stepVillager(v, index) {
    if (v.actionTimer > 0) {
        v.actionTimer--;
        return;
    }

    v.hunger -= 0.05;
    if (v.hunger <= 0) {
        villagers.splice(index, 1);
        return;
    }

    const tile = tiles[v.y][v.x];

    // Deposit carried food at a house
    if (v.carrying && tile.type === 'house') {
        tile.stored += v.carrying;
        v.carrying = 0;
        v.task = null;
        v.target = null;
    }

    // Build a house on grass if enough food
    if (!v.carrying && tile.type === 'grass' && food >= 20) {
        if (spendFood(20)) {
            tile.type = 'house';
            tile.hasCrop = false;
            tile.stored = 0;
            v.task = null;
            v.target = null;
        }
    }

    // Eat if hungry
    if (v.hunger < 50 || v.task === 'eat') {
        if (tile.type === 'house' && tile.stored > 0) {
            tile.stored--;
            v.hunger = 100;
            v.task = null;
            v.target = null;
        } else {
            if (!v.target || tiles[v.target.y][v.target.x].type !== 'house' || tiles[v.target.y][v.target.x].stored <= 0) {
                v.target = findNearestHouse(v.x, v.y, true);
            }
            moveTowards(v, v.target);
            v.task = 'eat';
        }
        return;
    }

    // If carrying food, head to nearest house
    if (v.carrying) {
        if (!v.target || tiles[v.target.y][v.target.x].type !== 'house') {
            v.target = findNearestHouse(v.x, v.y);
        }
        moveTowards(v, v.target);
        return;
    }

    // If not carrying, find nearest farmland with crops
    if (!v.task) {
        v.target = findNearestCrop(v.x, v.y);
        v.task = v.target ? 'gather' : 'wander';
    }

    if (v.task === 'gather') {
        if (!v.target) {
            v.task = null;
        } else if (v.x === v.target.x && v.y === v.target.y) {
            const targetTile = tiles[v.y][v.x];
            if (targetTile.type === 'farmland' && targetTile.hasCrop) {
                targetTile.hasCrop = false;
                targetTile.type = 'grass';
                v.carrying = 1;
            }
            v.task = null;
            v.target = null;
        } else {
            moveTowards(v, v.target);
        }
    } else {
        // Wander randomly when no task
        const dir = Math.floor(Math.random() * 4);
        if (dir === 0 && v.x > 0) v.x--;
        if (dir === 1 && v.x < GRID_WIDTH - 1) v.x++;
        if (dir === 2 && v.y > 0) v.y--;
        if (dir === 3 && v.y < GRID_HEIGHT - 1) v.y++;
        v.task = null;
    }
}

let spawnTimer = 200;
function gameTick() {
    if (!running) return;

    // Grow food on farmland and occasionally convert grass to new farmland
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const t = tiles[y][x];
            if (t.type === 'farmland') {
                if (!t.hasCrop && Math.random() < 0.05) {
                    t.hasCrop = true;
                }
            } else if (t.type === 'grass') {
                if (Math.random() < 0.001) {
                    t.type = 'farmland';
                    t.hasCrop = true;
                }
            }
        }
    }

    for (let i = villagers.length - 1; i >= 0; i--) {
        stepVillager(villagers[i], i);
    }

    spawnTimer--;
    if (spawnTimer <= 0) {
        const choices = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const t = tiles[y][x];
                if (t.type === 'house' && t.stored > 0) choices.push({ x, y, t });
            }
        }
        if (choices.length > 0) {
            const h = choices[Math.floor(Math.random() * choices.length)];
            h.t.stored--;
            addVillager(h.x, h.y);
        }
        spawnTimer = 200;
    }

    countHouses();
    updateCounts();
    draw();
}

function startGame() {
    SHEET_COLS = Math.floor((tileset.width + TILE_MARGIN) / (TILE_SIZE + TILE_MARGIN));
    countHouses();
    addVillager();
    setInterval(gameTick, 100);
}

tileset.addEventListener('load', startGame);

document.getElementById('toggleSim').addEventListener('click', () => {
    running = !running;
    document.getElementById('toggleSim').textContent = running ? 'Pause' : 'Resume';
});

document.getElementById('addVillager').addEventListener('click', () => {
    addVillager();
});
