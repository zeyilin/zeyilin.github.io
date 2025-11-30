// board.js - Game Board Management

class Board {
    constructor(width = 10, height = 20) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
        this.clearedLines = []; // Track recently cleared lines for animation
    }
    
    /**
     * Create an empty grid
     */
    createEmptyGrid() {
        return Array.from({ length: this.height }, () => 
            Array(this.width).fill(null)
        );
    }
    
    /**
     * Reset the board
     */
    reset() {
        this.grid = this.createEmptyGrid();
        this.clearedLines = [];
    }
    
    /**
     * Check if a tetromino position is valid
     */
    isValidPosition(tetromino, offsetX = 0, offsetY = 0) {
        for (let row = 0; row < tetromino.shape.length; row++) {
            for (let col = 0; col < tetromino.shape[row].length; col++) {
                if (tetromino.shape[row][col]) {
                    const newX = tetromino.x + col + offsetX;
                    const newY = tetromino.y + row + offsetY;
                    
                    // Check horizontal bounds
                    if (newX < 0 || newX >= this.width) {
                        return false;
                    }
                    
                    // Check bottom bound
                    if (newY >= this.height) {
                        return false;
                    }
                    
                    // Check collision with placed blocks (ignore if above board)
                    if (newY >= 0 && this.grid[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    /**
     * Check if a specific rotation is valid (with wall kicks)
     */
    isValidRotation(tetromino, newRotationIndex, kickX, kickY) {
        const tempTetromino = {
            x: tetromino.x + kickX,
            y: tetromino.y + kickY,
            shape: TETROMINOES[tetromino.type].rotations[newRotationIndex]
        };
        return this.isValidPosition(tempTetromino);
    }
    
    /**
     * Place a tetromino on the board
     */
    placeTetromino(tetromino) {
        for (let row = 0; row < tetromino.shape.length; row++) {
            for (let col = 0; col < tetromino.shape[row].length; col++) {
                if (tetromino.shape[row][col]) {
                    const x = tetromino.x + col;
                    const y = tetromino.y + row;
                    if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
                        this.grid[y][x] = tetromino.color;
                    }
                }
            }
        }
    }
    
    /**
     * Check for and clear complete lines
     */
    clearLines() {
        let linesCleared = 0;
        this.clearedLines = [];
        const newGrid = [];
        
        for (let row = this.height - 1; row >= 0; row--) {
            if (this.grid[row].every(cell => cell !== null)) {
                linesCleared++;
                this.clearedLines.push(row);
            } else {
                newGrid.unshift([...this.grid[row]]);
            }
        }
        
        // Add empty rows at top
        while (newGrid.length < this.height) {
            newGrid.unshift(Array(this.width).fill(null));
        }
        
        this.grid = newGrid;
        return linesCleared;
    }
    
    /**
     * Get the Y position where a piece would land (ghost piece)
     */
    getGhostPosition(tetromino) {
        let ghostY = tetromino.y;
        while (this.isValidPosition(tetromino, 0, ghostY - tetromino.y + 1)) {
            ghostY++;
        }
        return ghostY;
    }
    
    /**
     * Check if the game is over (pieces stacked to top)
     */
    isGameOver(tetromino) {
        return !this.isValidPosition(tetromino);
    }
    
    /**
     * Get the height of the stack at a specific column
     */
    getColumnHeight(col) {
        for (let row = 0; row < this.height; row++) {
            if (this.grid[row][col] !== null) {
                return this.height - row;
            }
        }
        return 0;
    }
    
    /**
     * Get the maximum stack height
     */
    getMaxHeight() {
        let maxHeight = 0;
        for (let col = 0; col < this.width; col++) {
            maxHeight = Math.max(maxHeight, this.getColumnHeight(col));
        }
        return maxHeight;
    }
    
    /**
     * Count the number of holes (empty cells with blocks above)
     */
    countHoles() {
        let holes = 0;
        for (let col = 0; col < this.width; col++) {
            let foundBlock = false;
            for (let row = 0; row < this.height; row++) {
                if (this.grid[row][col] !== null) {
                    foundBlock = true;
                } else if (foundBlock) {
                    holes++;
                }
            }
        }
        return holes;
    }
}

