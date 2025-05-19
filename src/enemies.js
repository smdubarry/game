import { tiles, GRID_WIDTH, GRID_HEIGHT, CORPSE_EMOJI } from './tiles.js';
import { villagers } from './villager.js';

export const enemies = [];
export const ENEMY_EMOJI = '\u{1F479}';

export function spawnEnemy(log) {
    let ex = Math.floor(Math.random() * GRID_WIDTH);
    let ey = Math.floor(Math.random() * GRID_HEIGHT);
    let attempts = 0;
    while (tiles[ey][ex].type === 'water' && attempts < 100) {
        ex = Math.floor(Math.random() * GRID_WIDTH);
        ey = Math.floor(Math.random() * GRID_HEIGHT);
        attempts++;
    }
    enemies.push({ x: ex, y: ey, health: 30, emoji: ENEMY_EMOJI });
    if (log) log('An enemy has spawned');
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

function moveTowards(e, target) {
    if (!target) return;
    if (e.x === target.x && e.y === target.y) return;
    const step = findPathStep(e.x, e.y, target.x, target.y);
    if (!step) return;
    if (tiles[step.y][step.x].type !== 'water') {
        e.x = step.x;
        e.y = step.y;
    }
}

export function stepEnemy(e, index, log) {
    if (e.health <= 0) {
        tiles[e.y][e.x].corpseEmoji = CORPSE_EMOJI;
        enemies.splice(index, 1);
        if (log) log('An enemy died');
        return;
    }
    const target = villagers[0] ? villagers.reduce((best, v) => {
        const d = Math.abs(e.x - v.x) + Math.abs(e.y - v.y);
        if (!best || d < best.dist) return { v, dist: d };
        return best;
    }, null)?.v : null;
    if (target) moveTowards(e, target);
}
