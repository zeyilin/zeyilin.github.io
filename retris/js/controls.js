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
     * Based on Apple Safari documentation: https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/HandlingEvents/HandlingEvents.html
     */
    setupTouchControls() {
        // Wait for DOM to be ready, then setup touch handlers
        const setupTouchHandlers = () => {
            // Per Apple docs: Touch events are delivered to the element that received the original touchstart event
            // We need to attach to the canvas element specifically for proper event delivery
            const canvas = document.getElementById('game-canvas');
            const gameBoardContainer = document.querySelector('.game-board-container');
            
            // Primary target: canvas (where the game is rendered)
            // Fallback: game board container
            const primaryTarget = canvas || gameBoardContainer;
            
            if (!primaryTarget) {
                // Retry if canvas isn't ready yet
                setTimeout(setupTouchHandlers, 100);
                return;
            }
            
            // Remove any existing listeners to avoid duplicates
            if (this.boundTouchStart) {
                primaryTarget.removeEventListener('touchstart', this.boundTouchStart);
            }
            if (this.boundTouchMove) {
                primaryTarget.removeEventListener('touchmove', this.boundTouchMove);
            }
            if (this.boundTouchEnd) {
                primaryTarget.removeEventListener('touchend', this.boundTouchEnd);
                primaryTarget.removeEventListener('touchcancel', this.boundTouchEnd);
            }
            
            // Bind handlers to preserve 'this' context
            // Per Apple docs: preventDefault() must be called to prevent default Safari behavior
            this.boundTouchStart = (e) => this.handleTouchStart(e);
            this.boundTouchMove = (e) => this.handleTouchMove(e);
            this.boundTouchEnd = (e) => this.handleTouchEnd(e);
            
            // Per Apple docs: Use non-passive listeners to allow preventDefault()
            // This is required for iOS 2.0 and later to prevent scrolling/zooming
            const options = { passive: false };
            
            // Register handlers per Apple documentation pattern
            primaryTarget.addEventListener('touchstart', this.boundTouchStart, options);
            primaryTarget.addEventListener('touchmove', this.boundTouchMove, options);
            primaryTarget.addEventListener('touchend', this.boundTouchEnd, options);
            primaryTarget.addEventListener('touchcancel', this.boundTouchEnd, options);
            
            // Mark as setup
            primaryTarget.setAttribute('data-touch-setup', 'true');
        };
        
        // Setup immediately if DOM is ready, otherwise wait
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupTouchHandlers);
        } else {
            // Use setTimeout to ensure canvas is fully initialized
            setTimeout(setupTouchHandlers, 100);
        }
        
        // Retry setup as fallback (in case canvas isn't ready)
        setTimeout(() => {
            const canvas = document.getElementById('game-canvas');
            if (canvas && !canvas.hasAttribute('data-touch-setup')) {
                setupTouchHandlers();
            }
        }, 500);
        
        // Also setup mobile control buttons as backup
        this.setupMobileButtons();
        
        // Update cell size when renderer updates
        this.updateCellSize();
        window.addEventListener('resize', () => this.updateCellSize());
    }
    
    /**
     * Setup mobile control buttons
     */
    setupMobileButtons() {
        // Find all mobile control buttons
        const buttons = document.querySelectorAll('[data-control]');
        
        buttons.forEach(button => {
            // Use touchstart and touchend for maximum cross-browser compatibility
            // Works on Chrome, Firefox, Safari, Edge, and other mobile browsers
            const handleTouch = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleMobileButton(button.dataset.control);
            };
            
            button.addEventListener('touchstart', handleTouch, { passive: false });
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, { passive: false });
            
            // Also support click for desktop testing
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleMobileButton(button.dataset.control);
            });
        });
    }
    
    /**
     * Handle mobile button press
     */
    handleMobileButton(control) {
        if (!this.enabled || this.game.state !== 'playing') return;
        
        switch (control) {
            case 'left':
                this.game.moveLeft();
                break;
            case 'right':
                this.game.moveRight();
                break;
            case 'down':
                this.game.softDrop();
                break;
            case 'rotate':
                this.game.rotate(1);
                break;
            case 'drop':
                this.game.hardDrop();
                break;
        }
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
     * Per Apple docs: preventDefault() must be called to prevent default Safari behavior
     */
    handleTouchStart(e) {
        // Only handle single touch
        if (e.touches.length !== 1) {
            // If multiple touches, cancel any active touch
            this.touchId = null;
            return;
        }
        
        const touch = e.touches[0];
        this.touchId = touch.identifier;
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
        this.touchStartTime = Date.now();
        this.dragAccumulatorX = 0;
        this.dragAccumulatorY = 0;
        
        // Per Apple docs: preventDefault() prevents default Safari behavior (scrolling, zooming)
        // Must be called synchronously in touchstart handler
        e.preventDefault();
        e.stopPropagation();
    }
    
    /**
     * Handle touch move - continuous drag for piece movement
     * Per Apple docs: preventDefault() in touchmove prevents scrolling
     */
    handleTouchMove(e) {
        // Per Apple docs: preventDefault() must be called to prevent scrolling
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.enabled || this.game.state !== 'playing') return;
        if (!this.touchId) return;
        
        // Per Apple docs: Use targetTouches to get touches for the target element
        // Find our tracked touch by identifier
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
    }
    
    /**
     * Handle touch end - detect tap (rotate) or fast swipe (hard drop)
     * Per Apple docs: Use changedTouches to get touches that changed in this event
     */
    handleTouchEnd(e) {
        // Per Apple docs: preventDefault() prevents default behavior
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.enabled || this.game.state !== 'playing') return;
        if (!this.touchId) return;
        
        // Per Apple docs: Use changedTouches to get touches that ended
        // Find the ended touch by identifier
        let touch = null;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === this.touchId) {
                touch = e.changedTouches[i];
                break;
            }
        }
        if (!touch) {
            this.touchId = null;
            return;
        }
        
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
            this.touchId = null;
            return;
        }
        
        // Fast swipe down = hard drop
        if (velocityY > this.swipeVelocityThreshold && deltaY > 50) {
            this.game.hardDrop();
            this.touchId = null;
            return;
        }
        
        // Reset touch tracking
        this.touchId = null;
    }
    
    /**
     * Destroy controls (cleanup)
     */
    destroy() {
        this.clearAllRepeats();
        this.enabled = false;
    }
}

