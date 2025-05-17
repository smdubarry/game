import { TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, COLORS, EMOJIS, FOOD_EMOJIS, tiles, generateLandscape } from './tiles.js';
import { villagers, addVillager, stepVillager, countHouses, countFarmland, getHousingCapacity, getTotalFood, getTotalWood, generateHouseName, houseCount, farmlandCount, deathCount, getRandomHousePos } from './villager.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = GRID_WIDTH * TILE_SIZE;
canvas.height = GRID_HEIGHT * TILE_SIZE;
ctx.imageSmoothingEnabled = false;

const foodCountEl = document.getElementById('foodCount');
const woodCountEl = document.getElementById('woodCount');
const populationCountEl = document.getElementById('populationCount');
const deathCountEl = document.getElementById('deathCount');
const houseCountEl = document.getElementById('houseCount');
const farmlandCountEl = document.getElementById('farmlandCount');
const timeCountEl = document.getElementById('timeCount');
const logEl = document.getElementById('log');

function log(msg) {
    const div = document.createElement('div');
    div.textContent = `[${ticks}] ${msg}`;
    logEl.prepend(div);
    logEl.scrollTop = 0;
}

let running = true;
let ticks = 0;
let spawnTimer = 200;

generateLandscape();

let startX = Math.floor(Math.random() * GRID_WIDTH);
let startY = Math.floor(Math.random() * GRID_HEIGHT);
while (tiles[startY][startX].type !== 'grass') {
    startX = Math.floor(Math.random() * GRID_WIDTH);
    startY = Math.floor(Math.random() * GRID_HEIGHT);
}
tiles[startY][startX].type = 'house';
tiles[startY][startX].hasCrop = false;
tiles[startY][startX].stored = 0;
tiles[startY][startX].wood = 0;
tiles[startY][startX].name = generateHouseName();
tiles[startY][startX].cropEmoji = null;

function updateCounts() {
    const food = getTotalFood();
    const wood = getTotalWood();
    populationCountEl.textContent = villagers.length;
    foodCountEl.textContent = food;
    woodCountEl.textContent = wood;
    deathCountEl.textContent = deathCount;
    houseCountEl.textContent = houseCount;
    farmlandCountEl.textContent = farmlandCount;
    timeCountEl.textContent = ticks;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = TILE_SIZE + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

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
                if (tile.hasTree) {
                    ctx.fillText(EMOJIS.tree, x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
                }
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

    for (const v of villagers) {
        ctx.fillText(v.emoji, v.x * TILE_SIZE + TILE_SIZE / 2, v.y * TILE_SIZE + TILE_SIZE / 2);
    }
}

function growCrops() {
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
}

function regrowTrees() {
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const t = tiles[y][x];
            if (t.type === 'forest' && !t.hasTree) {
                if (t.treeTimer > 0) {
                    t.treeTimer--;
                }
                if (t.treeTimer <= 0) {
                    t.hasTree = true;
                }
            }
        }
    }
}

function gameTick() {
    if (!running) return;

    ticks++;
    growCrops();
    regrowTrees();

    for (let i = villagers.length - 1; i >= 0; i--) {
        stepVillager(villagers[i], i, ticks, log);
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
            addVillager(h.x, h.y, log);
        }
        spawnTimer = 200;
    }

    countHouses();
    countFarmland();
    updateCounts();
    draw();
    updateTooltip();
}

export function startGame() {
    countHouses();
    countFarmland();
    addVillager(startX, startY, log);
    setInterval(gameTick, 100);
}

const tooltip = document.getElementById('tooltip');
let hoverX = null;
let hoverY = null;
let hoverScreenX = 0;
let hoverScreenY = 0;
let hovering = false;

function updateTooltip() {
    if (!hovering) return;
    if (hoverX === null || hoverY === null || hoverX < 0 || hoverY < 0 || hoverX >= GRID_WIDTH || hoverY >= GRID_HEIGHT) {
        tooltip.style.display = 'none';
        return;
    }
    const tile = tiles[hoverY][hoverX];
    const lines = [];
    if (tile.type === 'house') {
        lines.push(`<strong>${tile.name}</strong>`, `Stored Food: ${tile.stored}`, `Stored Wood: ${tile.wood}`);
    } else if (tile.type === 'farmland') {
        let info = 'Farmland';
        if (tile.hasCrop) info += ` - Crop: ${tile.cropEmoji}`;
        lines.push(info);
    } else if (tile.type === 'water') {
        lines.push('Water');
    } else if (tile.type === 'forest') {
        lines.push(tile.hasTree ? 'Forest' : 'Forest (empty)');
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

document.getElementById('toggleSim').addEventListener('click', () => {
    running = !running;
    document.getElementById('toggleSim').textContent = running ? 'Pause' : 'Resume';
});

document.getElementById('addVillager').addEventListener('click', () => {
    const pos = getRandomHousePos();
    if (pos) {
        addVillager(pos.x, pos.y, log);
    } else {
        addVillager(undefined, undefined, log);
    }
});
