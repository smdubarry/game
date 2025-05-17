import { tiles, GRID_WIDTH, GRID_HEIGHT, FOOD_EMOJIS, CORPSE_EMOJI } from './tiles.js';

export const villagers = [];
export let houseCount = 0;
export let farmlandCount = 0;

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
    if (!isTileOccupied(newX, newY)) {
        v.x = newX;
        v.y = newY;
    }
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

export function addVillager(x, y, log) {
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
    if (log) log(`${villagers[villagers.length-1].name} has joined the colony`);
}

export function stepVillager(v, index, ticks, log) {
    v.age++;
    if (v.actionTimer > 0) {
        v.actionTimer--;
        return;
    }

    if (ticks % 5 === 0) {
        v.health -= 1;
    }
    if (v.health <= 0) {
        if (log) log(`${v.name} died`);
        tiles[v.y][v.x].corpseEmoji = CORPSE_EMOJI;
        tiles[v.y][v.x].corpseName = v.name;
        villagers.splice(index, 1);
        return;
    }

    const tile = tiles[v.y][v.x];
    let status = 'idle';

    if (v.carrying && tile.type === 'house') {
        tile.stored += v.carrying;
        v.carrying = 0;
        v.task = null;
        v.target = null;
        status = 'depositing';
    }

    if (!v.carrying && tile.type === 'grass' && getTotalFood() >= 20 && villagers.length >= getHousingCapacity()) {
        if (spendFood(20)) {
            tile.type = 'house';
            tile.hasCrop = false;
            tile.stored = 0;
            tile.name = generateHouseName();
            houseCount++;
            if (log) log(`${v.name} built ${tile.name}`);
            v.task = null;
            v.target = null;
            status = 'building';
        }
    }

    const needed = farmlandCount < villagers.length;
    if (!v.carrying && needed) {
        if (tile.type === 'grass') {
            tile.type = 'farmland';
            tile.hasCrop = false;
            tile.cropEmoji = null;
            farmlandCount++;
            if (log) log(`${v.name} prepared farmland`);
            v.task = null;
            v.target = null;
            status = 'working';
        } else {
            if (!v.target || v.task !== 'make_farmland' || tiles[v.target.y][v.target.x].type !== 'grass') {
                v.target = findNearestGrass(v.x, v.y);
            }
            if (v.target) {
                moveTowards(v, v.target);
                v.task = 'make_farmland';
                status = 'seeking farmland site';
            }
            v.status = status;
            return;
        }
    }

    if (v.health < 90 || v.task === 'eat') {
        if (getTotalFood() > 0) {
            if (tile.type === 'house' && tile.stored > 0) {
                tile.stored--;
                v.health = 100;
                if (log) log(`${v.name} ate at ${tile.name}`);
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
            v.status = status;
            return;
        } else if (farmlandCount < villagers.length) {
            if (!v.target || v.task !== 'make_farmland' || tiles[v.target.y][v.target.x].type !== 'grass') {
                v.target = findNearestGrass(v.x, v.y);
            }
            if (v.target) {
                moveTowards(v, v.target);
                v.task = 'make_farmland';
                status = 'seeking farmland site';
            }
            v.status = status;
            return;
        }
    }

    if (v.carrying) {
        if (!v.target || tiles[v.target.y][v.target.x].type !== 'house') {
            v.target = findNearestHouse(v.x, v.y);
        }
        moveTowards(v, v.target);
        status = 'returning food';
        v.status = status;
        return;
    }

    if (!v.task) {
        v.target = findNearestCrop(v.x, v.y);
        v.task = v.target ? 'gather' : 'wait';
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
        if (v.task === 'wait') {
            status = 'waiting';
        } else {
            const dir = Math.floor(Math.random() * 4);
            if (dir === 0 && v.x > 0 && !isTileOccupied(v.x - 1, v.y)) v.x--;
            if (dir === 1 && v.x < GRID_WIDTH - 1 && !isTileOccupied(v.x + 1, v.y)) v.x++;
            if (dir === 2 && v.y > 0 && !isTileOccupied(v.x, v.y - 1)) v.y--;
            if (dir === 3 && v.y < GRID_HEIGHT - 1 && !isTileOccupied(v.x, v.y + 1)) v.y++;
            v.task = null;
            status = 'wandering';
        }
    }
    v.status = status;
}
