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
        
        // Touch settings
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.minSwipeDistance = 30;
        this.tapMaxDuration = 200;
        
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
     * Setup touch controls
     */
    setupTouchControls() {
        // Touch buttons
        document.querySelectorAll('[data-control]').forEach(btn => {
            // Prevent default touch behavior
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleTouchControl(btn.dataset.control);
            }, { passive: false });
            
            // Also handle click for non-touch devices testing
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleTouchControl(btn.dataset.control);
            });
            
            // Setup touch repeat for movement buttons
            let repeatTimer = null;
            const startRepeat = (control) => {
                repeatTimer = setTimeout(() => {
                    repeatTimer = setInterval(() => {
                        if (this.game.state === 'playing') {
                            this.handleTouchControl(control);
                        }
                    }, this.repeatRate);
                }, this.repeatDelay);
            };
            
            const stopRepeat = () => {
                if (repeatTimer) {
                    clearTimeout(repeatTimer);
                    clearInterval(repeatTimer);
                    repeatTimer = null;
                }
            };
            
            if (['left', 'right', 'down'].includes(btn.dataset.control)) {
                btn.addEventListener('touchstart', () => startRepeat(btn.dataset.control), { passive: true });
                btn.addEventListener('touchend', stopRepeat, { passive: true });
                btn.addEventListener('touchcancel', stopRepeat, { passive: true });
            }
        });
        
        // Swipe controls on game canvas
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.addEventListener('touchstart', (e) => this.handleCanvasTouchStart(e), { passive: true });
            canvas.addEventListener('touchend', (e) => this.handleCanvasTouchEnd(e), { passive: true });
        }
    }
    
    /**
     * Handle touch control button press
     */
    handleTouchControl(control) {
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
     * Handle touch start on canvas
     */
    handleCanvasTouchStart(e) {
        if (e.touches.length === 1) {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            this.touchStartTime = Date.now();
        }
    }
    
    /**
     * Handle touch end on canvas (swipe gestures)
     */
    handleCanvasTouchEnd(e) {
        if (!this.enabled || this.game.state !== 'playing') return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const duration = Date.now() - this.touchStartTime;
        
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        // Tap to rotate
        if (absX < this.minSwipeDistance && absY < this.minSwipeDistance && duration < this.tapMaxDuration) {
            this.game.rotate(1);
            return;
        }
        
        // Swipe detection
        if (absX > absY && absX >= this.minSwipeDistance) {
            // Horizontal swipe
            if (deltaX > 0) {
                this.game.moveRight();
            } else {
                this.game.moveLeft();
            }
        } else if (absY >= this.minSwipeDistance) {
            // Vertical swipe
            if (deltaY > 0) {
                this.game.softDrop();
            } else {
                this.game.hardDrop();
            }
        }
    }
    
    /**
     * Destroy controls (cleanup)
     */
    destroy() {
        this.clearAllRepeats();
        this.enabled = false;
    }
}

