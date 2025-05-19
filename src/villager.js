import { tiles, GRID_WIDTH, GRID_HEIGHT, FOOD_EMOJIS, CORPSE_EMOJI } from './tiles.js';

export const villagers = [];
export let houseCount = 0;
export let farmlandCount = 0;
export let deathCount = 0;
export const FARMLAND_PER_VILLAGER = 2;
export const HOUSE_SPAWN_TIME = 200;

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

const NAME_SYLLABLES = [
    'an','bel','cor','dan','el','fin','gar','hal','ith','jor','kel','lim',
    'mor','nal','or','pal','quil','rin','sor','tur','um','vor','wil','xan',
    'yor','zor'
];

export function generateName() {
    const count = 2 + Math.floor(Math.random() * 2);
    let name = '';
    for (let i = 0; i < count; i++) {
        name += NAME_SYLLABLES[Math.floor(Math.random() * NAME_SYLLABLES.length)];
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
}

const HOUSE_PREFIXES = ['Oak', 'Pine', 'Maple', 'Stone', 'River', 'Hill', 'Wind', 'Sun', 'Moon', 'Star', 'Iron', 'Golden', 'Silver', 'Copper', 'Shadow', 'Bright'];
const HOUSE_SUFFIXES = ['Haven', 'Hall', 'Cottage', 'Lodge', 'Manor', 'House', 'Den', 'Retreat', 'Sanctum', 'Hold', 'Grove', 'Keep'];
export function generateHouseName() {
    const pre = HOUSE_PREFIXES[Math.floor(Math.random() * HOUSE_PREFIXES.length)];
    const suf = HOUSE_SUFFIXES[Math.floor(Math.random() * HOUSE_SUFFIXES.length)];
    return `${pre} ${suf}`;
}

export function countHouses() {
    let count = 0;
    for (let row of tiles) {
        for (let t of row) if (t.type === 'house') count++;
    }
    houseCount = count;
    return count;
}

export function countFarmland() {
    let count = 0;
    for (let row of tiles) {
        for (let t of row) if (t.type === 'farmland') count++;
    }
    farmlandCount = count;
    return count;
}

export function getHousingCapacity() {
    return houseCount * 5;
}

export function getRandomHousePos() {
    const houses = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (tiles[y][x].type === 'house') houses.push({ x, y });
        }
    }
    if (houses.length === 0) return null;
    return houses[Math.floor(Math.random() * houses.length)];
}

function isTileOccupied(x, y) {
    if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) return true;
    if (tiles[y][x].type === 'water') return true;
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
            if (t.type === 'farmland' && t.hasCrop && !t.targeted) {
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
            const t = tiles[yy][xx];
            if (t.type === 'grass' && !t.targeted) {
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

function findNearestForest(x, y) {
    let best = null;
    let bestDist = Infinity;
    for (let yy = 0; yy < GRID_HEIGHT; yy++) {
        for (let xx = 0; xx < GRID_WIDTH; xx++) {
            const t = tiles[yy][xx];
            if (t.type === 'forest' && t.hasTree && !t.targeted) {
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

function findNearestGrassForHouse(x, y) {
    let best = null;
    let bestDist = Infinity;
    for (let yy = 0; yy < GRID_HEIGHT; yy++) {
        for (let xx = 0; xx < GRID_WIDTH; xx++) {
            const t = tiles[yy][xx];
            if (t.type === 'grass' && !t.houseTargeted) {
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

function findPathStep(sx, sy, tx, ty) {
    if (sx === tx && sy === ty) return null;
    const visited = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(false));
    const prev = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null));
    const queue = [{ x: sx, y: sy }];
    visited[sy][sx] = true;
    const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
    ];
    while (queue.length) {
        const { x, y } = queue.shift();
        if (x === tx && y === ty) break;
        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= GRID_WIDTH || ny >= GRID_HEIGHT) continue;
            if (visited[ny][nx]) continue;
            if (tiles[ny][nx].type === 'water') continue;
            visited[ny][nx] = true;
            prev[ny][nx] = { x, y };
            queue.push({ x: nx, y: ny });
        }
    }
    if (!visited[ty][tx]) return null;
    let cx = tx;
    let cy = ty;
    while (prev[cy][cx] && !(prev[cy][cx].x === sx && prev[cy][cx].y === sy)) {
        const p = prev[cy][cx];
        cx = p.x;
        cy = p.y;
    }
    return { x: cx, y: cy };
}

function moveTowards(v, target) {
    if (!target) return;
    if (v.x === target.x && v.y === target.y) return;
    const step = findPathStep(v.x, v.y, target.x, target.y);
    if (!step) {
        releaseTarget(v);
        v.target = null;
        v.task = null;
        return;
    }
    if (!isTileOccupied(step.x, step.y)) {
        v.x = step.x;
        v.y = step.y;
    }
}

function releaseTarget(v) {
    if (v.target) {
        const t = tiles[v.target.y]?.[v.target.x];
        if (t && t.targeted) {
            t.targeted = false;
        }
    }
}

function bfsNearest(sx, sy, predicate) {
    const visited = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(false));
    const queue = [{ x: sx, y: sy, dist: 0 }];
    visited[sy][sx] = true;
    const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
    ];
    while (queue.length) {
        const { x, y, dist } = queue.shift();
        if (predicate(tiles[y][x], x, y)) return { x, y, dist };
        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= GRID_WIDTH || ny >= GRID_HEIGHT) continue;
            if (visited[ny][nx]) continue;
            if (tiles[ny][nx].type === 'water') continue;
            visited[ny][nx] = true;
            queue.push({ x: nx, y: ny, dist: dist + 1 });
        }
    }
    return null;
}

function findNearestFoodSource(x, y) {
    return bfsNearest(x, y, (t) => t.type === 'house' && t.stored > 0 && !t.targeted);
}

function findNearestCropTile(x, y) {
    return bfsNearest(x, y, (t) => t.type === 'farmland' && t.hasCrop && !t.targeted);
}

function findNearestHousePath(x, y) {
    return bfsNearest(x, y, (t) => t.type === 'house');
}

export function getTotalFood() {
    let total = 0;
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const t = tiles[y][x];
            if (t.type === 'house') total += t.stored;
        }
    }
    return total;
}

export function getTotalWood() {
    let total = 0;
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const t = tiles[y][x];
            if (t.type === 'house') total += t.wood;
        }
    }
    return total;
}

export function spendFood(amount) {
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

export function spendWood(amount) {
    if (getTotalWood() < amount) return false;
    let remaining = amount;
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            const t = tiles[y][x];
            if (t.type === 'house' && t.wood > 0) {
                const use = Math.min(t.wood, remaining);
                t.wood -= use;
                remaining -= use;
                if (remaining <= 0) return true;
            }
        }
    }
    return false;
}

export function addVillager(x, y, log, ignoreLimit = false) {
    if (!ignoreLimit && villagers.length >= getHousingCapacity()) return;
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
        carryingFood: 0,
        task: null,
        target: null,
        status: 'waiting',
        health: 100,
        age: 0,
        name: generateName(),
        emoji: VILLAGER_EMOJIS[Math.floor(Math.random() * VILLAGER_EMOJIS.length)]
    });
    if (log) log(`${villagers[villagers.length-1].name} has joined the colony`);
}

export function stepVillager(v, index, ticks, log) {
    v.age++;
    if (ticks % 5 === 0) {
        v.health -= 1;
    }
    if (v.health <= 0) {
        if (log) log(`${v.name} died`);
        releaseTarget(v);
        tiles[v.y][v.x].corpseEmoji = CORPSE_EMOJI;
        tiles[v.y][v.x].corpseName = v.name;
        villagers.splice(index, 1);
        deathCount++;
        return;
    }

    const tile = tiles[v.y][v.x];

    // deposit carried food when at a house
    if (v.carryingFood && tile.type === 'house') {
        tile.stored += v.carryingFood;
        v.carryingFood = 0;
        releaseTarget(v);
        v.task = null;
        v.target = null;
        v.status = 'waiting';
    }

    // handle current task
    if (v.status === 'seeking food') {
        if (tile.type === 'house' && tile.stored > 0) {
            tile.stored--;
            v.health = 100;
            releaseTarget(v);
            v.task = null;
            v.target = null;
            v.status = 'waiting';
            return;
        }
        if (!v.target || tiles[v.target.y][v.target.x].type !== 'house' || tiles[v.target.y][v.target.x].stored <= 0) {
            releaseTarget(v);
            v.target = findNearestFoodSource(v.x, v.y);
            if (v.target) tiles[v.target.y][v.target.x].targeted = true;
        }
        moveTowards(v, v.target);
        v.task = 'eat';
        return;
    }

    if (v.status === 'preparing farmland') {
        if (v.x === v.target?.x && v.y === v.target?.y) {
            const t = tiles[v.y][v.x];
            if (t.type === 'grass') {
                t.type = 'farmland';
                t.hasCrop = false;
                t.cropEmoji = null;
                farmlandCount++;
            }
            t.targeted = false;
            v.target = null;
            v.task = null;
            v.status = 'waiting';
            return;
        }
        if (!v.target || tiles[v.target.y][v.target.x].type !== 'grass') {
            releaseTarget(v);
            v.target = findNearestGrass(v.x, v.y);
            if (v.target) tiles[v.target.y][v.target.x].targeted = true;
        }
        moveTowards(v, v.target);
        v.task = 'prepare';
        return;
    }

    if (v.status === 'harvesting crop') {
        if (v.carryingFood) {
            if (!v.target || tiles[v.target.y][v.target.x].type !== 'house') {
                releaseTarget(v);
                v.target = findNearestHousePath(v.x, v.y);
            }
            moveTowards(v, v.target);
            v.task = 'deposit';
            return;
        }
        if (!v.target || v.task !== 'harvest' || !tiles[v.target.y][v.target.x].hasCrop) {
            releaseTarget(v);
            v.target = findNearestCropTile(v.x, v.y);
            if (v.target) tiles[v.target.y][v.target.x].targeted = true;
        }
        if (v.target) {
            if (v.x === v.target.x && v.y === v.target.y) {
                const t = tiles[v.y][v.x];
                if (t.type === 'farmland' && t.hasCrop) {
                    t.hasCrop = false;
                    t.cropEmoji = null;
                    v.carryingFood = 1;
                }
                t.targeted = false;
                v.target = null;
                v.task = null;
            } else {
                moveTowards(v, v.target);
                v.task = 'harvest';
            }
            return;
        }
        v.status = 'waiting';
    }

    // choose a new task when waiting
    if (v.status !== 'waiting' && v.status !== 'idle') {
        return;
    }

    if (v.health < 90) {
        v.status = 'seeking food';
        return;
    }

    const preparing = villagers.filter(vv => vv.status === 'preparing farmland').length;
    if (farmlandCount + preparing < villagers.length * FARMLAND_PER_VILLAGER) {
        releaseTarget(v);
        v.target = findNearestGrass(v.x, v.y);
        if (v.target) {
            tiles[v.target.y][v.target.x].targeted = true;
            v.task = 'prepare';
            v.status = 'preparing farmland';
            moveTowards(v, v.target);
            return;
        }
    }

    // harvest crops if any
    releaseTarget(v);
    v.target = findNearestCropTile(v.x, v.y);
    if (v.target) {
        tiles[v.target.y][v.target.x].targeted = true;
        v.task = 'harvest';
        v.status = 'harvesting crop';
        moveTowards(v, v.target);
        return;
    }

    // nothing to do
    v.task = null;
    v.status = 'waiting';
}
