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
ctx.imageSmoothingEnabled = false;

// Emoji characters used for rendering game entities
const EMOJIS = {
    grass: '\u{1F7E9}',
    farmland: '\u{1F7EB}',
    house: '\u{1F3E0}'
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

let houseIndex = 1;
function generateHouseName() {
    return 'House ' + houseIndex++;
}

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

function getHousingCapacity() {
    return houseCount * 5;
}

function isTileOccupied(x, y, ignore) {
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
            name: null
        };
    }
}

// Start with a house in the center so villagers have somewhere to deposit food
const startX = Math.floor(GRID_WIDTH / 2);
const startY = Math.floor(GRID_HEIGHT / 2);
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
        hunger: 100,
        age: 0,
        lifespan: 2000 + Math.floor(Math.random() * 1000),
        name: generateName(),
        emoji: VILLAGER_EMOJIS[Math.floor(Math.random() * VILLAGER_EMOJIS.length)]
    });
    updateCounts();
}

function updateCounts() {
    food = getTotalFood();
    populationCountEl.textContent = villagers.length;
    foodCountEl.textContent = food;
    houseCountEl.textContent = houseCount;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = TILE_SIZE + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw tiles
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const tile = tiles[y][x];
            let emoji = EMOJIS[tile.type];
            if (tile.type === 'farmland' && tile.hasCrop) {
                emoji = tile.cropEmoji;
            }
            ctx.fillText(emoji, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
        }
    }

    // Draw villagers
    for (const v of villagers) {
        ctx.fillText(v.emoji, v.x * TILE_SIZE + TILE_SIZE / 2, v.y * TILE_SIZE + TILE_SIZE / 2);
    }
}

function stepVillager(v, index) {
    v.age++;
    if (v.age >= v.lifespan) {
        villagers.splice(index, 1);
        return;
    }
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

    // Build a house on grass if enough food and population is maxed
    if (!v.carrying && tile.type === 'grass' && food >= 20 && villagers.length >= getHousingCapacity()) {
        if (spendFood(20)) {
            tile.type = 'house';
            tile.hasCrop = false;
            tile.stored = 0;
            tile.name = generateHouseName();
            houseCount++;
            v.task = null;
            v.target = null;
        }
    }

    // Convert grass to farmland when not carrying anything
    if (!v.carrying && tile.type === 'grass') {
        tile.type = 'farmland';
        tile.hasCrop = false;
        tile.cropEmoji = null;
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
    }
}

let spawnTimer = 200;
function gameTick() {
    if (!running) return;

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
    updateCounts();
    draw();
}

function startGame() {
    countHouses();
    addVillager();
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
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
    tooltip.style.left = e.clientX + 10 + 'px';
    tooltip.style.top = e.clientY + 10 + 'px';

    let content = '';
    const villager = villagers.find(v => v.x === x && v.y === y);
    if (villager) {
        content = `<strong>${villager.name}</strong><br>` +
                  `Age: ${villager.age}/${villager.lifespan}<br>` +
                  `Hunger: ${Math.floor(villager.hunger)}`;
    } else if (tiles[y] && tiles[y][x] && tiles[y][x].type === 'house') {
        const house = tiles[y][x];
        content = `<strong>${house.name}</strong><br>` +
                  `Stored Food: ${house.stored}`;
    }

    if (content) {
        tooltip.innerHTML = content;
        tooltip.style.display = 'block';
    } else {
        tooltip.style.display = 'none';
    }
});

canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
});
