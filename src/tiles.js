export const TILE_SIZE = 16;

const desiredWidth = Math.floor(window.innerWidth * 0.95);
const desiredHeight = Math.floor(window.innerHeight * 0.6);
export const GRID_WIDTH = Math.floor(desiredWidth / TILE_SIZE);
export const GRID_HEIGHT = Math.floor(desiredHeight / TILE_SIZE);

export const COLORS = {
    grass: '#5a9c4a',
    farmland: '#a07a48',
    water: '#5dade2',
    forest: '#2e8b57',
    mountain: '#888888',
    ore: '#b87333'
};

export const EMOJIS = {
    house: '\u{1F3E0}',
    tree: '\u{1F333}'
};

export const FOOD_EMOJIS = [
    '\u{1F34E}','\u{1F34A}','\u{1F347}','\u{1F353}','\u{1F352}',
    '\u{1F955}','\u{1F33D}','\u{1F954}','\u{1F35E}','\u{1F357}'
];

export const CORPSE_EMOJI = "\u{2620}\u{FE0F}";

export const tiles = [];
for (let y = 0; y < GRID_HEIGHT; y++) {
    tiles[y] = [];
    for (let x = 0; x < GRID_WIDTH; x++) {
        tiles[y][x] = {
            type: 'grass',
            hasCrop: false,
            cropEmoji: null,
            targeted: false,
            houseTargeted: false,
            stored: 0,
            wood: 0,
            name: null,
            corpseEmoji: null,
            corpseName: null,
            hasTree: false,
            treeTimer: 0,
            spawnTimer: 200
        };
    }
}

export function randomWalkTerrain(type, walkers, steps) {
    for (let i = 0; i < walkers; i++) {
        let x = Math.floor(Math.random() * GRID_WIDTH);
        let y = Math.floor(Math.random() * GRID_HEIGHT);
        for (let j = 0; j < steps; j++) {
            if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
                tiles[y][x].type = type;
                tiles[y][x].hasTree = type === 'forest';
                tiles[y][x].treeTimer = 0;
            }
            const dir = Math.floor(Math.random() * 4);
            if (dir === 0 && x > 0) x--;
            else if (dir === 1 && x < GRID_WIDTH - 1) x++;
            else if (dir === 2 && y > 0) y--;
            else if (dir === 3 && y < GRID_HEIGHT - 1) y++;
        }
    }
}

export function generateLandscape() {
    randomWalkTerrain('water', 5, 250);
    randomWalkTerrain('forest', 8, 300);
    randomWalkTerrain('mountain', 6, 180);
    randomWalkTerrain('ore', 2, 80);
}
