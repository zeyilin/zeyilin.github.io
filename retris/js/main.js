// main.js - App Initialization and State Management

class App {
    constructor() {
        this.game = new Game();
        this.storage = new Storage();
        this.renderer = null;
        this.controls = null;
        this.animationId = null;
        
        // DOM elements cache
        this.elements = {};
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        this.cacheElements();
        this.setupRenderer();
        this.setupControls();
        this.setupGameCallbacks();
        this.setupMenuListeners();
        this.setupResponsive();
        
        // Check if instructions should be shown on first visit
        this.checkFirstVisit();
    }
    
    /**
     * Check if this is first visit and show instructions
     */
    checkFirstVisit() {
        // Always show menu - instructions are now in about page
        this.showScreen('menu');
    }
    
    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        this.elements = {
            // Canvases
            gameCanvas: document.getElementById('game-canvas'),
            nextCanvas: document.getElementById('next-canvas'),
            nextCanvasMobile: document.getElementById('next-canvas-mobile'),
            
            // Displays
            levelDisplay: document.getElementById('level-display'),
            scoreDisplay: document.getElementById('score-display'),
            mobileLevelDisplay: document.getElementById('mobile-level'),
            mobileScoreDisplay: document.getElementById('mobile-score'),
            finalScoreDisplay: document.getElementById('final-score'),
            
            // Screens
            screens: {
                menu: document.getElementById('screen-menu'),
                game: document.getElementById('screen-game'),
                gameover: document.getElementById('screen-gameover'),
                highscores: document.getElementById('screen-highscores'),
                about: document.getElementById('screen-about')
            },
            
            // Overlays
            pauseOverlay: document.getElementById('pause-overlay'),
            
            // Forms
            scoreForm: document.getElementById('score-form'),
            playerNameInput: document.getElementById('player-name'),
            
            // Containers
            scoresList: document.getElementById('scores-list'),
            
            // Buttons
            menuBtn: document.getElementById('menu-btn'),
            menuBtnMobile: document.getElementById('menu-btn-mobile'),
            
            // Touch hint
            touchHint: document.getElementById('touch-hint')
        };
    }
    
    /**
     * Setup the renderer
     */
    setupRenderer() {
        this.renderer = new Renderer(
            this.elements.gameCanvas,
            this.elements.nextCanvas,
            this.elements.nextCanvasMobile
        );
    }
    
    /**
     * Setup controls
     */
    setupControls() {
        this.controls = new Controls(this.game);
    }
    
    /**
     * Setup game event callbacks
     */
    setupGameCallbacks() {
        this.game.onScoreUpdate = (score) => {
            this.updateDisplay();
        };
        
        this.game.onLevelUp = (level) => {
            this.updateDisplay();
            // Add pulse animation to level display
            if (this.elements.levelDisplay) {
                this.elements.levelDisplay.classList.add('level-up');
                setTimeout(() => {
                    this.elements.levelDisplay.classList.remove('level-up');
                }, 600);
            }
        };
        
        this.game.onLineClear = (lines, points) => {
            // Could add visual feedback here
        };
        
        this.game.onGameOver = (score, level, lines) => {
            this.handleGameOver(score, level, lines);
        };
    }
    
    /**
     * Setup menu and UI event listeners
     */
    setupMenuListeners() {
        // Action buttons (data-action attribute)
        document.querySelectorAll('[data-action]').forEach(btn => {
            const handleAction = () => {
                this.handleAction(btn.dataset.action);
            };
            
            // Add both click and touch handlers for iOS compatibility
            btn.addEventListener('click', handleAction);
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAction();
            }, { passive: false });
        });
        
        // Menu buttons
        if (this.elements.menuBtn) {
            const handleMenu = () => {
                this.handleMenuPress();
            };
            this.elements.menuBtn.addEventListener('click', handleMenu);
            this.elements.menuBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMenu();
            }, { passive: false });
        }
        
        if (this.elements.menuBtnMobile) {
            const handleMenu = () => {
                this.handleMenuPress();
            };
            this.elements.menuBtnMobile.addEventListener('click', handleMenu);
            this.elements.menuBtnMobile.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMenu();
            }, { passive: false });
        }
        
        // Score form submission
        if (this.elements.scoreForm) {
            this.elements.scoreForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleScoreSubmit();
            });
        }
        
    }
    
    /**
     * Handle menu button press
     */
    handleMenuPress() {
        if (this.game.state === 'playing') {
            this.game.pause();
            this.updatePauseOverlay();
        }
        this.showScreen('menu');
    }
    
    /**
     * Handle action button clicks
     */
    handleAction(action) {
        switch (action) {
            case 'new-game':
                this.startGame();
                break;
            case 'high-scores':
                this.showScreen('highscores');
                this.renderHighScores();
                break;
            case 'about':
                this.showScreen('about');
                break;
            case 'play-again':
                this.startGame();
                break;
            case 'main-menu':
                this.showScreen('menu');
                break;
        }
    }
    
    /**
     * Start a new game
     */
    startGame() {
        this.game.start();
        this.showScreen('game');
        this.updateDisplay();
        this.updatePauseOverlay();
        this.showTouchHint();
        // Re-setup touch controls when game starts (for iPhone Safari)
        if (this.controls && typeof this.controls.setupTouchControls === 'function') {
            // Small delay to ensure canvas is rendered
            setTimeout(() => {
                this.controls.setupTouchControls();
            }, 100);
        }
        this.gameLoop();
    }
    
    /**
     * Show touch hint on mobile devices
     */
    showTouchHint() {
        // Only show on touch devices and if not shown before this session
        if (!this.elements.touchHint) return;
        if (!('ontouchstart' in window)) return;
        if (this.touchHintShown) return;
        
        this.touchHintShown = true;
        this.elements.touchHint.classList.add('visible');
        
        // Hide after 3 seconds
        setTimeout(() => {
            this.elements.touchHint.classList.remove('visible');
        }, 3000);
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        if (this.game.state === 'gameover') {
            return;
        }
        
        // Render the game
        this.renderer.render(this.game);
        
        // Update pause overlay if needed
        this.updatePauseOverlay();
        
        // Continue loop
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Stop the game loop
     */
    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Handle game over
     */
    handleGameOver(score, level, lines) {
        this.stopGameLoop();
        
        // Final render
        this.renderer.render(this.game);
        
        // Update final score display
        if (this.elements.finalScoreDisplay) {
            this.elements.finalScoreDisplay.textContent = formatNumber(score);
        }
        
        // Clear the name input
        if (this.elements.playerNameInput) {
            this.elements.playerNameInput.value = '';
        }
        
        // Show game over screen
        setTimeout(() => {
            this.showScreen('gameover');
        }, 500);
    }
    
    /**
     * Handle score form submission
     */
    handleScoreSubmit() {
        const name = this.elements.playerNameInput.value.trim();
        if (name) {
            this.storage.saveScore(name, this.game.score, this.game.level);
            this.showScreen('highscores');
            this.renderHighScores();
        }
    }
    
    /**
     * Update score and level displays
     */
    updateDisplay() {
        const score = formatNumber(this.game.score);
        const level = this.game.level;
        
        // Desktop displays
        if (this.elements.levelDisplay) {
            this.elements.levelDisplay.textContent = level;
        }
        if (this.elements.scoreDisplay) {
            this.elements.scoreDisplay.textContent = score;
        }
        
        // Mobile displays
        if (this.elements.mobileLevelDisplay) {
            this.elements.mobileLevelDisplay.textContent = level;
        }
        if (this.elements.mobileScoreDisplay) {
            this.elements.mobileScoreDisplay.textContent = score;
        }
    }
    
    /**
     * Update pause overlay visibility
     */
    updatePauseOverlay() {
        if (this.elements.pauseOverlay) {
            this.elements.pauseOverlay.classList.toggle('hidden', this.game.state !== 'paused');
        }
    }
    
    /**
     * Show a specific screen
     */
    showScreen(screenId) {
        Object.values(this.elements.screens).forEach(screen => {
            if (screen) screen.classList.remove('active');
        });
        
        const targetScreen = this.elements.screens[screenId];
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
        
        // Handle game loop based on screen
        if (screenId !== 'game' && this.game.state === 'playing') {
            // Keep game running in background when showing menu
        }
    }
    
    /**
     * Render high scores list
     */
    renderHighScores() {
        const container = this.elements.scoresList;
        if (!container) return;
        
        const scores = this.storage.getScores();
        
        if (scores.length === 0) {
            container.innerHTML = '<p class="no-scores">No scores yet. Play to set a record!</p>';
            return;
        }
        
        container.innerHTML = scores.map((score, index) => `
            <div class="score-row">
                <span class="score-rank">${index + 1}.</span>
                <span class="score-name">${sanitize(score.name)}</span>
                <span class="score-value">${formatNumber(score.score)}</span>
            </div>
        `).join('');
    }
    
    /**
     * Setup responsive behavior
     */
    setupResponsive() {
        const updateCellSize = debounce(() => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            let cellSize;
            
            if (width <= 768) {
                // Mobile: fit to available height considering header and controls
                const availableHeight = height - 150; // Rough estimate for header + controls
                const availableWidth = width - 20;
                
                const cellByHeight = Math.floor(availableHeight / 20);
                const cellByWidth = Math.floor(availableWidth / 10);
                
                cellSize = Math.min(cellByHeight, cellByWidth, 32);
                cellSize = Math.max(cellSize, 20); // Minimum size
            } else if (width <= 1024) {
                // Tablet
                cellSize = 24;
            } else {
                // Desktop
                cellSize = 28;
            }
            
            if (this.renderer) {
                this.renderer.setCellSize(cellSize);
                // Re-render if game is active
                if (this.game.state === 'playing' || this.game.state === 'paused') {
                    this.renderer.render(this.game);
                }
            }
        }, 100);
        
        window.addEventListener('resize', updateCellSize);
        updateCellSize();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

