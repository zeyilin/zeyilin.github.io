// tetromino.js - Tetromino Definitions and Rotation

const TETROMINOES = {
    I: {
        color: '#00d4d4',
        colorName: 'cyan',
        rotations: [
            [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
            [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
            [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
            [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]
        ]
    },
    O: {
        color: '#d4a800',
        colorName: 'yellow',
        rotations: [
            [[1,1],[1,1]]
        ]
    },
    T: {
        color: '#8833cc',
        colorName: 'purple',
        rotations: [
            [[0,1,0],[1,1,1],[0,0,0]],
            [[0,1,0],[0,1,1],[0,1,0]],
            [[0,0,0],[1,1,1],[0,1,0]],
            [[0,1,0],[1,1,0],[0,1,0]]
        ]
    },
    S: {
        color: '#00cc44',
        colorName: 'green',
        rotations: [
            [[0,1,1],[1,1,0],[0,0,0]],
            [[0,1,0],[0,1,1],[0,0,1]],
            [[0,0,0],[0,1,1],[1,1,0]],
            [[1,0,0],[1,1,0],[0,1,0]]
        ]
    },
    Z: {
        color: '#cc3333',
        colorName: 'red',
        rotations: [
            [[1,1,0],[0,1,1],[0,0,0]],
            [[0,0,1],[0,1,1],[0,1,0]],
            [[0,0,0],[1,1,0],[0,1,1]],
            [[0,1,0],[1,1,0],[1,0,0]]
        ]
    },
    J: {
        color: '#3366cc',
        colorName: 'blue',
        rotations: [
            [[1,0,0],[1,1,1],[0,0,0]],
            [[0,1,1],[0,1,0],[0,1,0]],
            [[0,0,0],[1,1,1],[0,0,1]],
            [[0,1,0],[0,1,0],[1,1,0]]
        ]
    },
    L: {
        color: '#cc6600',
        colorName: 'orange',
        rotations: [
            [[0,0,1],[1,1,1],[0,0,0]],
            [[0,1,0],[0,1,0],[0,1,1]],
            [[0,0,0],[1,1,1],[1,0,0]],
            [[1,1,0],[0,1,0],[0,1,0]]
        ]
    }
};

// SRS (Super Rotation System) wall kick data
const WALL_KICKS = {
    'JLSTZ': {
        '0->1': [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
        '1->2': [[0,0], [1,0], [1,-1], [0,2], [1,2]],
        '2->3': [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
        '3->0': [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
        '1->0': [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
        '2->1': [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
        '3->2': [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
        '0->3': [[0,0], [1,0], [1,-1], [0,2], [1,2]]
    },
    'I': {
        '0->1': [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
        '1->2': [[0,0], [-1,0], [2,0], [-1,2], [2,-1]],
        '2->3': [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
        '3->0': [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
        '1->0': [[0,0], [2,0], [-1,0], [2,1], [-1,-2]],
        '2->1': [[0,0], [1,0], [-2,0], [1,-2], [-2,1]],
        '3->2': [[0,0], [-2,0], [1,0], [-2,-1], [1,2]],
        '0->3': [[0,0], [-1,0], [2,0], [-1,2], [2,-1]]
    }
};

class Tetromino {
    constructor(type) {
        this.type = type;
        this.rotationIndex = 0;
        this.shape = deepClone(TETROMINOES[type].rotations[0]);
        this.color = TETROMINOES[type].color;
        this.colorName = TETROMINOES[type].colorName;
        
        // Starting position (centered at top)
        this.x = type === 'O' ? 4 : 3;
        this.y = type === 'I' ? -1 : 0;
    }
    
    /**
     * Get the shape for a specific rotation
     */
    getRotation(index) {
        const rotations = TETROMINOES[this.type].rotations;
        return rotations[index % rotations.length];
    }
    
    /**
     * Rotate the tetromino
     */
    rotate(direction = 1) {
        const rotations = TETROMINOES[this.type].rotations;
        const newIndex = (this.rotationIndex + direction + rotations.length) % rotations.length;
        this.rotationIndex = newIndex;
        this.shape = deepClone(rotations[newIndex]);
    }
    
    /**
     * Get wall kicks for a rotation attempt
     */
    getWallKicks(fromRotation, toRotation) {
        // O piece doesn't need wall kicks
        if (this.type === 'O') return [[0, 0]];
        
        const kickData = this.type === 'I' ? WALL_KICKS['I'] : WALL_KICKS['JLSTZ'];
        const key = `${fromRotation}->${toRotation}`;
        return kickData[key] || [[0, 0]];
    }
    
    /**
     * Get the bounding box of the tetromino
     */
    getBounds() {
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (let row = 0; row < this.shape.length; row++) {
            for (let col = 0; col < this.shape[row].length; col++) {
                if (this.shape[row][col]) {
                    minX = Math.min(minX, col);
                    maxX = Math.max(maxX, col);
                    minY = Math.min(minY, row);
                    maxY = Math.max(maxY, row);
                }
            }
        }
        
        return { minX, maxX, minY, maxY };
    }
}

/**
 * Bag randomizer for fair piece distribution
 */
class BagRandomizer {
    constructor() {
        this.bag = [];
        this.refillBag();
    }
    
    refillBag() {
        this.bag = Object.keys(TETROMINOES);
        // Fisher-Yates shuffle
        for (let i = this.bag.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
        }
    }
    
    next() {
        if (this.bag.length === 0) {
            this.refillBag();
        }
        return this.bag.pop();
    }
    
    peek() {
        if (this.bag.length === 0) {
            this.refillBag();
        }
        return this.bag[this.bag.length - 1];
    }
}

/**
 * Get a random tetromino (simple version without bag)
 */
function getRandomTetromino() {
    const types = Object.keys(TETROMINOES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    return new Tetromino(randomType);
}

