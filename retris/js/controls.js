// controls.js - Keyboard and Touch Input Handling

class Controls {
    constructor(game) {
        this.game = game;
        this.enabled = true;
        
        // Key repeat settings
        this.repeatDelay = 170; // Initial delay before repeat
        this.repeatRate = 50;   // Repeat rate
        this.repeatTimers = {};
        this.keysDown = new Set();
        
        // Touch/Swipe settings
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.touchId = null;
        
        // Gesture thresholds
        this.cellSize = 28; // Will be updated
        this.dragThreshold = 20; // Pixels to move before registering as drag
        this.swipeVelocityThreshold = 0.5; // Pixels per ms for hard drop
        this.tapMaxDuration = 200;
        this.tapMaxDistance = 15;
        
        // Track cumulative drag distance for piece movement
        this.dragAccumulatorX = 0;
        this.dragAccumulatorY = 0;
        
        this.setupKeyboardControls();
        this.setupTouchControls();
    }
    
    /**
     * Enable or disable controls
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clearAllRepeats();
        }
    }
    
    /**
     * Clear all key repeat timers
     */
    clearAllRepeats() {
        for (const key in this.repeatTimers) {
            clearInterval(this.repeatTimers[key]);
            clearTimeout(this.repeatTimers[key]);
        }
        this.repeatTimers = {};
        this.keysDown.clear();
    }
    
    /**
     * Setup keyboard controls
     */
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Clear repeats when window loses focus
        window.addEventListener('blur', () => this.clearAllRepeats());
    }
    
    /**
     * Handle key down events
     */
    handleKeyDown(e) {
        // Allow pause even when game isn't playing
        if (e.code === 'KeyP' || e.code === 'Escape') {
            e.preventDefault();
            if (this.game.state === 'playing' || this.game.state === 'paused') {
                this.game.pause();
            }
            return;
        }
        
        if (!this.enabled || this.game.state !== 'playing') return;
        
        // Prevent default for game keys
        const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyS', 'KeyW'];
        if (gameKeys.includes(e.code)) {
            e.preventDefault();
        }
        
        // Ignore if key is already being held
        if (this.keysDown.has(e.code)) return;
        
        // Handle the key press
        this.handleKeyAction(e.code);
        
        // Setup key repeat for movement keys
        if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'KeyA', 'KeyD', 'KeyS'].includes(e.code)) {
            this.keysDown.add(e.code);
            this.setupKeyRepeat(e.code);
        }
    }
    
    /**
     * Handle key up events
     */
    handleKeyUp(e) {
        this.keysDown.delete(e.code);
        
        if (this.repeatTimers[e.code]) {
            clearTimeout(this.repeatTimers[e.code]);
            clearInterval(this.repeatTimers[e.code]);
            delete this.repeatTimers[e.code];
        }
    }
    
    /**
     * Setup key repeat for held keys
     */
    setupKeyRepeat(code) {
        // Clear existing timer
        if (this.repeatTimers[code]) {
            clearTimeout(this.repeatTimers[code]);
            clearInterval(this.repeatTimers[code]);
        }
        
        // Initial delay, then repeat
        this.repeatTimers[code] = setTimeout(() => {
            this.repeatTimers[code] = setInterval(() => {
                if (this.keysDown.has(code) && this.game.state === 'playing') {
                    this.handleKeyAction(code);
                }
            }, this.repeatRate);
        }, this.repeatDelay);
    }
    
    /**
     * Execute action for a key code
     */
    handleKeyAction(code) {
        switch (code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.game.moveLeft();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.game.moveRight();
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.game.softDrop();
                break;
            case 'ArrowUp':
            case 'KeyW':
                this.game.rotate(1);
                break;
            case 'KeyZ':
                this.game.rotate(-1); // Counter-clockwise
                break;
            case 'Space':
                this.game.hardDrop();
                break;
        }
    }
    
    /**
     * Setup touch controls - gesture-based for mobile
     */
    setupTouchControls() {
        // Get the game area for touch handling
        const gameArea = document.querySelector('.game-area');
        const canvas = document.getElementById('game-canvas');
        
        // Use game area or canvas for touch events
        const touchTarget = gameArea || canvas;
        
        if (touchTarget) {
            touchTarget.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            touchTarget.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            touchTarget.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
            touchTarget.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
        }
        
        // Update cell size when renderer updates
        this.updateCellSize();
        window.addEventListener('resize', () => this.updateCellSize());
    }
    
    /**
     * Update cell size from renderer
     */
    updateCellSize() {
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            this.cellSize = canvas.width / 10; // 10 columns
        }
    }
    
    /**
     * Handle touch start
     */
    handleTouchStart(e) {
        if (e.touches.length !== 1) return;
        
        const touch = e.touches[0];
        this.touchId = touch.identifier;
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
        this.touchStartTime = Date.now();
        this.dragAccumulatorX = 0;
        this.dragAccumulatorY = 0;
        
        // Prevent scrolling
        e.preventDefault();
    }
    
    /**
     * Handle touch move - continuous drag for piece movement
     */
    handleTouchMove(e) {
        if (!this.enabled || this.game.state !== 'playing') return;
        
        // Find our tracked touch
        let touch = null;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === this.touchId) {
                touch = e.touches[i];
                break;
            }
        }
        if (!touch) return;
        
        const deltaX = touch.clientX - this.lastTouchX;
        const deltaY = touch.clientY - this.lastTouchY;
        
        // Accumulate drag distance
        this.dragAccumulatorX += deltaX;
        this.dragAccumulatorY += deltaY;
        
        // Move piece when accumulated drag exceeds threshold (based on cell size)
        const moveThreshold = this.cellSize * 0.6; // 60% of cell size feels good
        
        // Horizontal movement
        while (this.dragAccumulatorX >= moveThreshold) {
            this.game.moveRight();
            this.dragAccumulatorX -= moveThreshold;
        }
        while (this.dragAccumulatorX <= -moveThreshold) {
            this.game.moveLeft();
            this.dragAccumulatorX += moveThreshold;
        }
        
        // Vertical movement (soft drop on drag down)
        const dropThreshold = this.cellSize * 0.5;
        while (this.dragAccumulatorY >= dropThreshold) {
            this.game.softDrop();
            this.dragAccumulatorY -= dropThreshold;
        }
        // Reset upward accumulator (no move up)
        if (this.dragAccumulatorY < 0) {
            this.dragAccumulatorY = 0;
        }
        
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
        
        e.preventDefault();
    }
    
    /**
     * Handle touch end - detect tap (rotate) or fast swipe (hard drop)
     */
    handleTouchEnd(e) {
        if (!this.enabled || this.game.state !== 'playing') return;
        
        // Find the ended touch
        let touch = null;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.touchId) {
                touch = e.changedTouches[i];
                break;
            }
        }
        if (!touch) return;
        
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const duration = Date.now() - this.touchStartTime;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Calculate velocity (pixels per ms)
        const velocity = duration > 0 ? distance / duration : 0;
        const velocityY = duration > 0 ? deltaY / duration : 0;
        
        // Tap to rotate (short duration, small movement)
        if (duration < this.tapMaxDuration && distance < this.tapMaxDistance) {
            this.game.rotate(1);
            e.preventDefault();
            return;
        }
        
        // Fast swipe down = hard drop
        if (velocityY > this.swipeVelocityThreshold && deltaY > 50) {
            this.game.hardDrop();
            e.preventDefault();
            return;
        }
        
        // Reset touch tracking
        this.touchId = null;
        e.preventDefault();
    }
    
    /**
     * Destroy controls (cleanup)
     */
    destroy() {
        this.clearAllRepeats();
        this.enabled = false;
    }
}

