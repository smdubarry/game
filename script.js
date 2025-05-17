const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Size the canvas based on the current window dimensions and ensure the
// dimensions are multiples of the tile size so no empty border is visible.
const desiredWidth = Math.floor(window.innerWidth * 0.95);
const desiredHeight = Math.floor(window.innerHeight * 0.6);
const TILE_SIZE = 16;
const GRID_WIDTH = Math.floor(desiredWidth / TILE_SIZE);
const GRID_HEIGHT = Math.floor(desiredHeight / TILE_SIZE);
canvas.width = GRID_WIDTH * TILE_SIZE;
canvas.height = GRID_HEIGHT * TILE_SIZE;
const foodCountEl = document.getElementById('foodCount');
const populationCountEl = document.getElementById('populationCount');
const houseCountEl = document.getElementById('houseCount');
const timeCountEl = document.getElementById('timeCount');
const logEl = document.getElementById('log');

function log(msg) {
    const div = document.createElement('div');
    div.textContent = `[${ticks}] ${msg}`;
    logEl.prepend(div);
    logEl.scrollTop = 0;
}

// Image containing all sprites from the Kenney roguelike/RPG pack
ctx.imageSmoothingEnabled = false;

// Emoji characters used for rendering game entities
const COLORS = {
    grass: '#5a9c4a', // darker grass
    farmland: '#a07a48', // darker soil
    water: '#5dade2',
    forest: '#2e8b57',
    mountain: '#888888',
    ore: '#b87333'
};

const EMOJIS = {
    house: '\u{1F3E0}',
    tree: '\u{1F333}'
};

const VILLAGER_EMOJIS = [
    '\u{1F3C3}\u{FE0F}\u{200D}\u{2642}\u{FE0F}',
    '\u{1F3C3}\u{FE0F}\u{200D}\u{2640}\u{FE0F}',
    '\u{1F6B4}\u{FE0F}\u{200D}\u{2642}\u{FE0F}',
    '\u{1F6B4}\u{FE0F}\u{200D}\u{2640}\u{FE0F}',
    '\u{1F3CB}\u{FE0F}\u{200D}\u{2642}\u{FE0F}',
    '\u{1F3CB}\u{FE0F}\u{200D}\u{2640}\u{FE0F}',
    '\u{1F93A}',
    '\u{1F93E}\u{200D}\u{2642}\u{FE0F}',
    '\u{1F93E}\u{200D}\u{2640}\u{FE0F}',
    '\u{1F3CC}\u{FE0F}\u{200D}\u{2642}\u{FE0F}',
    '\u{1F3CC}\u{FE0F}\u{200D}\u{2640}\u{FE0F}'
];

const FOOD_EMOJIS = [
    '\u{1F34E}','\u{1F34A}','\u{1F347}','\u{1F353}','\u{1F352}',
    '\u{1F955}','\u{1F33D}','\u{1F954}','\u{1F35E}','\u{1F357}'
];

// Single emoji used for corpses
const CORPSE_EMOJI = "\u{2620}\u{FE0F}";
const NAME_SYLLABLES = [
    'an','bel','cor','dan','el','fin','gar','hal','ith','jor','kel','lim',
    'mor','nal','or','pal','quil','rin','sor','tur','um','vor','wil','xan',
    'yor','zor'
];

function generateName() {
    const count = 2 + Math.floor(Math.random() * 2);
    let name = '';
    for (let i = 0; i < count; i++) {
        name += NAME_SYLLABLES[Math.floor(Math.random() * NAME_SYLLABLES.length)];
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
}

const HOUSE_PREFIXES = ['Oak', 'Pine', 'Maple', 'Stone', 'River', 'Hill', 'Wind', 'Sun', 'Moon', 'Star', 'Iron', 'Golden', 'Silver', 'Copper', 'Shadow', 'Bright'];
const HOUSE_SUFFIXES = ['Haven', 'Hall', 'Cottage', 'Lodge', 'Manor', 'House', 'Den', 'Retreat', 'Sanctum', 'Hold', 'Grove', 'Keep'];
function generateHouseName() {
    const pre = HOUSE_PREFIXES[Math.floor(Math.random() * HOUSE_PREFIXES.length)];
    const suf = HOUSE_SUFFIXES[Math.floor(Math.random() * HOUSE_SUFFIXES.length)];
    return `${pre} ${suf}`;
}

let running = true;
let food = 0;
let houseCount = 0;
let farmlandCount = 0;
let ticks = 0;

function countHouses() {
    let count = 0;
    for (let row of tiles) {
        for (let t of row) if (t.type === 'house') count++;
    }
    houseCount = count;
}

function countFarmland() {
    let count = 0;
    for (let row of tiles) {
        for (let t of row) if (t.type === 'farmland') count++;
    }
    farmlandCount = count;
}

function getHousingCapacity() {
    return houseCount * 5;
}

function isTileOccupied(x, y, ignore) {
    if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return true;
    if (tiles[y][x].type === 'water') return true;
    for (const v of villagers) {
        if (v === ignore) continue;
        if (v.x === x && v.y === y) return true;
    }
    return false;
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

function findNearestGrass(x, y) {
    let best = null;
    let bestDist = Infinity;
    for (let yy = 0; yy < GRID_HEIGHT; yy++) {
        for (let xx = 0; xx < GRID_WIDTH; xx++) {
            if (tiles[yy][xx].type === 'grass') {
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
    let newX = v.x;
    let newY = v.y;
    if (v.x < target.x) newX++;
    else if (v.x > target.x) newX--;
    else if (v.y < target.y) newY++;
    else if (v.y > target.y) newY--;
    if (!isTileOccupied(newX, newY, v)) {
        v.x = newX;
        v.y = newY;
    }
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
        tiles[y][x] = {
            type: 'grass',
            hasCrop: false,
            cropEmoji: null,
            stored: 0,
            name: null,
            corpseEmoji: null,
            corpseName: null
        };
    }
}

function randomWalkTerrain(type, walkers, steps) {
    for (let i = 0; i < walkers; i++) {
        let x = Math.floor(Math.random() * GRID_WIDTH);
        let y = Math.floor(Math.random() * GRID_HEIGHT);
        for (let j = 0; j < steps; j++) {
            if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
                tiles[y][x].type = type;
            }
            const dir = Math.floor(Math.random() * 4);
            if (dir === 0 && x > 0) x--;
            else if (dir === 1 && x < GRID_WIDTH - 1) x++;
            else if (dir === 2 && y > 0) y--;
            else if (dir === 3 && y < GRID_HEIGHT - 1) y++;
        }
    }
}

function generateLandscape() {
    randomWalkTerrain('water', 5, 250);
    randomWalkTerrain('forest', 8, 300);
    randomWalkTerrain('mountain', 6, 180);
    // Fewer walkers and steps to make ore deposits rarer
    randomWalkTerrain('ore', 2, 80);
}

generateLandscape();

// Place the starting house on a random grass tile
let startX = Math.floor(Math.random() * GRID_WIDTH);
let startY = Math.floor(Math.random() * GRID_HEIGHT);
while (tiles[startY][startX].type !== 'grass') {
    startX = Math.floor(Math.random() * GRID_WIDTH);
    startY = Math.floor(Math.random() * GRID_HEIGHT);
}
tiles[startY][startX].type = 'house';
tiles[startY][startX].hasCrop = false;
tiles[startY][startX].stored = 0;
tiles[startY][startX].name = generateHouseName();
tiles[startY][startX].cropEmoji = null;



const villagers = [];
function addVillager(x, y) {
    if (villagers.length >= getHousingCapacity()) return;
    let vx = x !== undefined ? x : Math.floor(Math.random() * GRID_WIDTH);
    let vy = y !== undefined ? y : Math.floor(Math.random() * GRID_HEIGHT);
    let attempts = 0;
    while (isTileOccupied(vx, vy) && attempts < 100) {
        vx = Math.floor(Math.random() * GRID_WIDTH);
        vy = Math.floor(Math.random() * GRID_HEIGHT);
        attempts++;
    }
    villagers.push({
        x: vx,
        y: vy,
        actionTimer: 0,
        carrying: 0,
        task: null,
        target: null,
        status: 'idle',
        health: 100,
        age: 0,
        name: generateName(),
        emoji: VILLAGER_EMOJIS[Math.floor(Math.random() * VILLAGER_EMOJIS.length)]
    });
    log(`${villagers[villagers.length-1].name} has joined the colony`);
    updateCounts();
}

function updateCounts() {
    food = getTotalFood();
    populationCountEl.textContent = villagers.length;
    foodCountEl.textContent = food;
    houseCountEl.textContent = houseCount;
    timeCountEl.textContent = ticks;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = TILE_SIZE + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw tiles using colors instead of square emojis
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const tile = tiles[y][x];
            if (tile.type === 'grass') {
                ctx.fillStyle = COLORS.grass;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (tile.type === 'farmland') {
                ctx.fillStyle = COLORS.farmland;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                if (tile.hasCrop) {
                    ctx.fillText(tile.cropEmoji, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                }
            } else if (tile.type === 'water') {
                ctx.fillStyle = COLORS.water;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (tile.type === 'forest') {
                ctx.fillStyle = COLORS.forest;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.fillText(EMOJIS.tree, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
            } else if (tile.type === 'mountain') {
                ctx.fillStyle = COLORS.mountain;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (tile.type === 'ore') {
                ctx.fillStyle = COLORS.ore;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (tile.type === 'house') {
                ctx.fillStyle = COLORS.grass;
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.fillText(EMOJIS.house, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
            }
            if (tile.corpseEmoji) {
                ctx.fillText(tile.corpseEmoji, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
            }
        }
    }

    // Draw villagers
    for (const v of villagers) {
        ctx.fillText(v.emoji, v.x * TILE_SIZE + TILE_SIZE / 2, v.y * TILE_SIZE + TILE_SIZE / 2);
    }
}

function stepVillager(v, index) {
    v.age++;
    if (v.actionTimer > 0) {
        v.actionTimer--;
        return;
    }

    v.health -= 1;
    if (v.health <= 0) {
        log(`${v.name} died`);
        tiles[v.y][v.x].corpseEmoji = CORPSE_EMOJI;
        tiles[v.y][v.x].corpseName = v.name;
        villagers.splice(index, 1);
        return;
    }

    const tile = tiles[v.y][v.x];
    let status = 'idle';

    // Deposit carried food at a house
    if (v.carrying && tile.type === 'house') {
        tile.stored += v.carrying;
        v.carrying = 0;
        v.task = null;
        v.target = null;
        status = 'depositing';
    }

    // Build a house on grass if enough food and population is maxed
    if (!v.carrying && tile.type === 'grass' && food >= 20 && villagers.length >= getHousingCapacity()) {
        if (spendFood(20)) {
            tile.type = 'house';
            tile.hasCrop = false;
            tile.stored = 0;
            tile.name = generateHouseName();
            houseCount++;
            log(`${v.name} built ${tile.name}`);
            v.task = null;
            v.target = null;
            status = 'building';
        }
    }

    const farmlandNeeded = (farmlandCount < villagers.length) || (food < villagers.length * 2);
    // Seek out and convert grass to farmland when needed
    if (!v.carrying && farmlandNeeded) {
        if (tile.type === 'grass') {
            if (food === 0 || spendFood(5)) {
                tile.type = 'farmland';
                tile.hasCrop = false;
                tile.cropEmoji = null;
                farmlandCount++;
                log(`${v.name} prepared farmland`);
                v.task = null;
                v.target = null;
                status = 'working';
            }
        } else {
            if (!v.target || v.task !== 'make_farmland' || tiles[v.target.y][v.target.x].type !== 'grass') {
                v.target = findNearestGrass(v.x, v.y);
            }
            if (v.target) {
                moveTowards(v, v.target);
                v.task = 'make_farmland';
                status = 'seeking farmland site';
            }
            return;
        }
    }

    // Eat if hungry
    if (v.health < 90 || v.task === 'eat') {
        if (food > 0) {
            if (tile.type === 'house' && tile.stored > 0) {
                tile.stored--;
                v.health = 100;
                log(`${v.name} ate at ${tile.name}`);
                v.task = null;
                v.target = null;
                status = 'eating';
            } else {
                if (!v.target || tiles[v.target.y][v.target.x].type !== 'house' || tiles[v.target.y][v.target.x].stored <= 0) {
                    v.target = findNearestHouse(v.x, v.y, true);
                }
                moveTowards(v, v.target);
                v.task = 'eat';
                status = 'seeking food';
            }
        } else {
            if (!v.target || v.task !== 'make_farmland' || tiles[v.target.y][v.target.x].type !== 'grass') {
                v.target = findNearestGrass(v.x, v.y);
            }
            if (v.target) {
                moveTowards(v, v.target);
                v.task = 'make_farmland';
                status = 'seeking farmland site';
            }
        }
        return;
    }

    // If carrying food, head to nearest house
    if (v.carrying) {
        if (!v.target || tiles[v.target.y][v.target.x].type !== 'house') {
            v.target = findNearestHouse(v.x, v.y);
        }
        moveTowards(v, v.target);
        status = 'returning food';
        return;
    }

    // If not carrying, find nearest farmland with crops
    if (!v.task) {
        v.target = findNearestCrop(v.x, v.y);
        v.task = v.target ? 'gather' : 'wander';
    }

    if (v.task === 'gather') {
        status = 'gathering';
        if (!v.target) {
            v.task = null;
        } else if (v.x === v.target.x && v.y === v.target.y) {
            const targetTile = tiles[v.y][v.x];
            if (targetTile.type === 'farmland' && targetTile.hasCrop) {
                targetTile.hasCrop = false;
                targetTile.cropEmoji = null;
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
        if (dir === 0 && v.x > 0 && !isTileOccupied(v.x - 1, v.y, v)) v.x--;
        if (dir === 1 && v.x < GRID_WIDTH - 1 && !isTileOccupied(v.x + 1, v.y, v)) v.x++;
        if (dir === 2 && v.y > 0 && !isTileOccupied(v.x, v.y - 1, v)) v.y--;
        if (dir === 3 && v.y < GRID_HEIGHT - 1 && !isTileOccupied(v.x, v.y + 1, v)) v.y++;
        v.task = null;
        status = 'wandering';
    }
    v.status = status;
}

let spawnTimer = 200;
function gameTick() {
    if (!running) return;

    ticks++;

    // Grow food on farmland tiles
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const t = tiles[y][x];
            if (t.type === 'farmland') {
                if (!t.hasCrop && Math.random() < 0.02) {
                    t.hasCrop = true;
                    t.cropEmoji = FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];
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
        if (choices.length > 0 && villagers.length < getHousingCapacity()) {
            const h = choices[Math.floor(Math.random() * choices.length)];
            h.t.stored--;
            addVillager(h.x, h.y);
        }
        spawnTimer = 200;
    }

    countHouses();
    countFarmland();
    updateCounts();
    draw();
    updateTooltip();
}

function startGame() {
    countHouses();
    countFarmland();
    addVillager(startX, startY);
    setInterval(gameTick, 100);
}

startGame();

document.getElementById('toggleSim').addEventListener('click', () => {
    running = !running;
    document.getElementById('toggleSim').textContent = running ? 'Pause' : 'Resume';
});

document.getElementById('addVillager').addEventListener('click', () => {
    addVillager();
});

const tooltip = document.getElementById('tooltip');
let hoverX = null;
let hoverY = null;
let hoverScreenX = 0;
let hoverScreenY = 0;
let hovering = false;

function updateTooltip() {
    if (!hovering) return;
    if (hoverX === null || hoverY === null ||
        hoverX < 0 || hoverY < 0 ||
        hoverX >= GRID_WIDTH || hoverY >= GRID_HEIGHT) {
        tooltip.style.display = 'none';
        return;
    }

    const tile = tiles[hoverY][hoverX];
    const lines = [];

    if (tile.type === 'house') {
        lines.push(`<strong>${tile.name}</strong>`, `Stored Food: ${tile.stored}`);
    } else if (tile.type === 'farmland') {
        let info = 'Farmland';
        if (tile.hasCrop) info += ` - Crop: ${tile.cropEmoji}`;
        lines.push(info);
    } else if (tile.type === 'water') {
        lines.push('Water');
    } else if (tile.type === 'forest') {
        lines.push('Forest');
    } else if (tile.type === 'mountain') {
        lines.push('Mountain');
    } else if (tile.type === 'ore') {
        lines.push('Ore Deposit');
    } else {
        lines.push('Grass');
    }
    if (tile.corpseEmoji) {
        const name = tile.corpseName ? ` of ${tile.corpseName}` : '';
        lines.push(`Corpse${name}: ${tile.corpseEmoji}`);
    }

    const here = villagers.filter(v => v.x === hoverX && v.y === hoverY);
    for (const v of here) {
        lines.push(`<strong>${v.name}</strong> ${v.emoji}`,
                   `Age: ${v.age}`,
                   `Health: ${Math.floor(v.health)}`,
                   `Status: ${v.status}`);
    }

    const content = lines.join('<br>');
    if (content) {
        tooltip.innerHTML = content;
        tooltip.style.left = hoverScreenX + 10 + 'px';
        tooltip.style.top = hoverScreenY + 10 + 'px';
        tooltip.style.display = 'block';
    } else {
        tooltip.style.display = 'none';
    }
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    hoverX = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    hoverY = Math.floor((e.clientY - rect.top) / TILE_SIZE);
    hoverScreenX = e.clientX;
    hoverScreenY = e.clientY;
    hovering = true;
    updateTooltip();
});

canvas.addEventListener('mouseleave', () => {
    hovering = false;
    tooltip.style.display = 'none';
});
