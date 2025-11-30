// game.js - Core Game Logic

class Game {
    constructor() {
        this.board = new Board();
        this.bagRandomizer = new BagRandomizer();
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.state = 'menu'; // menu, playing, paused, gameover
        this.dropInterval = null;
        this.lastDropTime = 0;
        this.lockDelay = 500; // ms before piece locks after landing
        this.lockTimer = null;
        this.isLocking = false;
        
        // Callbacks for events
        this.onScoreUpdate = null;
        this.onLevelUp = null;
        this.onLineClear = null;
        this.onGameOver = null;
        this.onPiecePlace = null;
        
        // Classic NES Tetris scoring: base points × (level + 1)
        // Single: 40, Double: 100, Triple: 300, Tetris: 1200
        this.BASE_POINTS = {
            1: 40,     // Single
            2: 100,    // Double
            3: 300,    // Triple
            4: 1200,   // Tetris!
            softDrop: 1,
            hardDrop: 2
        };
        
        // Classic NES Tetris speed curve (milliseconds per drop)
        // Based on frames per gridcell at 60fps
        this.SPEED_CURVE = {
            0: 800,   // Level 0: 48 frames
            1: 717,   // Level 1: 43 frames
            2: 633,   // Level 2: 38 frames
            3: 550,   // Level 3: 33 frames
            4: 467,   // Level 4: 28 frames
            5: 383,   // Level 5: 23 frames
            6: 300,   // Level 6: 18 frames
            7: 217,   // Level 7: 13 frames
            8: 133,   // Level 8: 8 frames
            9: 100,   // Level 9: 6 frames
            10: 83,   // Level 10-12: 5 frames
            13: 67,   // Level 13-15: 4 frames
            16: 50,   // Level 16-18: 3 frames
            19: 33,   // Level 19-28: 2 frames
            29: 17    // Level 29+: 1 frame (kill screen!)
        };
    }
    
    /**
     * Start a new game
     */
    start() {
        this.board.reset();
        this.bagRandomizer = new BagRandomizer();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.isLocking = false;
        
        // Spawn first pieces
        this.currentPiece = new Tetromino(this.bagRandomizer.next());
        this.nextPiece = new Tetromino(this.bagRandomizer.next());
        
        this.state = 'playing';
        this.startDropTimer();
    }
    
    /**
     * Get drop speed based on level (Classic NES Tetris curve)
     * Gets progressively faster, with level 19+ being extremely fast
     */
    getDropSpeed() {
        const level = this.level - 1; // Convert to 0-indexed for classic compatibility
        
        // Find the appropriate speed from the curve
        if (level >= 29) return this.SPEED_CURVE[29];      // Kill screen speed!
        if (level >= 19) return this.SPEED_CURVE[19];      // 33ms - very fast
        if (level >= 16) return this.SPEED_CURVE[16];      // 50ms
        if (level >= 13) return this.SPEED_CURVE[13];      // 67ms
        if (level >= 10) return this.SPEED_CURVE[10];      // 83ms
        
        // Levels 0-9 have individual speeds
        return this.SPEED_CURVE[level] || this.SPEED_CURVE[9];
    }
    
    /**
     * Start the automatic drop timer
     */
    startDropTimer() {
        this.stopDropTimer();
        this.dropInterval = setInterval(() => {
            if (this.state === 'playing') {
                this.drop();
            }
        }, this.getDropSpeed());
    }
    
    /**
     * Stop the drop timer
     */
    stopDropTimer() {
        if (this.dropInterval) {
            clearInterval(this.dropInterval);
            this.dropInterval = null;
        }
    }
    
    /**
     * Update drop speed (called on level up)
     */
    updateDropSpeed() {
        this.startDropTimer();
    }
    
    /**
     * Automatic drop (called by timer)
     */
    drop() {
        if (!this.moveDown()) {
            this.lockPiece();
        }
    }
    
    /**
     * Move piece left
     */
    moveLeft() {
        if (this.state !== 'playing' || !this.currentPiece) return false;
        
        if (this.board.isValidPosition(this.currentPiece, -1, 0)) {
            this.currentPiece.x--;
            this.resetLockDelay();
            return true;
        }
        return false;
    }
    
    /**
     * Move piece right
     */
    moveRight() {
        if (this.state !== 'playing' || !this.currentPiece) return false;
        
        if (this.board.isValidPosition(this.currentPiece, 1, 0)) {
            this.currentPiece.x++;
            this.resetLockDelay();
            return true;
        }
        return false;
    }
    
    /**
     * Move piece down
     */
    moveDown() {
        if (this.state !== 'playing' || !this.currentPiece) return false;
        
        if (this.board.isValidPosition(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            return true;
        }
        return false;
    }
    
    /**
     * Soft drop (manual down press)
     * Classic Tetris: 1 point per cell dropped
     */
    softDrop() {
        if (this.moveDown()) {
            this.score += this.BASE_POINTS.softDrop;
            if (this.onScoreUpdate) this.onScoreUpdate(this.score);
            return true;
        }
        return false;
    }
    
    /**
     * Hard drop (instant drop)
     * Awards 2 points per cell (modern addition to classic scoring)
     */
    hardDrop() {
        if (this.state !== 'playing' || !this.currentPiece) return;
        
        let dropDistance = 0;
        while (this.board.isValidPosition(this.currentPiece, 0, 1)) {
            this.currentPiece.y++;
            dropDistance++;
        }
        
        this.score += dropDistance * this.BASE_POINTS.hardDrop;
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        
        this.lockPiece();
    }
    
    /**
     * Rotate piece (with wall kicks)
     */
    rotate(direction = 1) {
        if (this.state !== 'playing' || !this.currentPiece) return false;
        
        // O piece doesn't rotate
        if (this.currentPiece.type === 'O') return false;
        
        const originalRotation = this.currentPiece.rotationIndex;
        const rotations = TETROMINOES[this.currentPiece.type].rotations;
        const newRotation = (originalRotation + direction + rotations.length) % rotations.length;
        
        // Get wall kicks for this rotation
        const kicks = this.currentPiece.getWallKicks(originalRotation, newRotation);
        
        // Try each wall kick
        for (const [kickX, kickY] of kicks) {
            if (this.board.isValidRotation(this.currentPiece, newRotation, kickX, kickY)) {
                this.currentPiece.rotationIndex = newRotation;
                this.currentPiece.shape = deepClone(rotations[newRotation]);
                this.currentPiece.x += kickX;
                this.currentPiece.y += kickY;
                this.resetLockDelay();
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Reset lock delay (when piece moves while touching ground)
     */
    resetLockDelay() {
        if (this.isLocking && this.lockTimer) {
            clearTimeout(this.lockTimer);
            this.lockTimer = null;
            this.isLocking = false;
        }
    }
    
    /**
     * Lock the current piece and spawn next
     */
    lockPiece() {
        if (!this.currentPiece) return;
        
        // Place the piece on the board
        this.board.placeTetromino(this.currentPiece);
        if (this.onPiecePlace) this.onPiecePlace();
        
        // Clear lines and calculate score using Classic NES Tetris formula:
        // points = base_points × (level + 1)
        const linesCleared = this.board.clearLines();
        if (linesCleared > 0) {
            // Classic formula: base × (level + 1)
            // Single: 40 × (level+1), Double: 100 × (level+1)
            // Triple: 300 × (level+1), Tetris: 1200 × (level+1)
            const basePoints = this.BASE_POINTS[linesCleared];
            const points = basePoints * (this.level);
            this.score += points;
            this.lines += linesCleared;
            
            if (this.onLineClear) this.onLineClear(linesCleared, points);
            if (this.onScoreUpdate) this.onScoreUpdate(this.score);
            
            // Level up every 10 lines (classic NES behavior)
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.updateDropSpeed();
                if (this.onLevelUp) this.onLevelUp(this.level);
            }
        }
        
        // Spawn next piece
        this.currentPiece = this.nextPiece;
        this.nextPiece = new Tetromino(this.bagRandomizer.next());
        this.isLocking = false;
        
        // Check game over
        if (!this.board.isValidPosition(this.currentPiece)) {
            this.gameOver();
        }
    }
    
    /**
     * End the game
     */
    gameOver() {
        this.state = 'gameover';
        this.stopDropTimer();
        if (this.lockTimer) {
            clearTimeout(this.lockTimer);
            this.lockTimer = null;
        }
        if (this.onGameOver) this.onGameOver(this.score, this.level, this.lines);
    }
    
    /**
     * Toggle pause
     */
    pause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.stopDropTimer();
        } else if (this.state === 'paused') {
            this.state = 'playing';
            this.startDropTimer();
        }
    }
    
    /**
     * Get ghost piece Y position
     */
    getGhostY() {
        if (!this.currentPiece) return 0;
        return this.board.getGhostPosition(this.currentPiece);
    }
    
    /**
     * Check if piece is at the bottom (for lock delay)
     */
    isAtBottom() {
        if (!this.currentPiece) return false;
        return !this.board.isValidPosition(this.currentPiece, 0, 1);
    }
}

