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
        this.preventZoom();
        
        // Check if instructions should be shown on first visit
        this.checkFirstVisit();
    }
    
    /**
     * Prevent zoom gestures on mobile
     */
    preventZoom() {
        // Track touches to prevent double-tap zoom
        let lastTouchEnd = 0;
        let touchStartTime = 0;
        
        // Prevent double-tap zoom - ONLY on non-interactive elements
        document.addEventListener('touchend', (e) => {
            const target = e.target;
            const isButton = target.tagName === 'BUTTON' || 
                           target.closest('button') !== null ||
                           target.closest('[data-action]') !== null ||
                           target.closest('[data-control]') !== null ||
                           target.tagName === 'INPUT' ||
                           target.closest('input') !== null ||
                           target.closest('form') !== null;
            
            // NEVER prevent default on buttons - let them work normally
            if (isButton) {
                return;
            }
            
            // Only prevent double-tap on non-interactive areas
            const now = Date.now();
            if (now - lastTouchEnd <= 300 && now - touchStartTime < 500) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false, capture: false });
        
        // Track touch start time
        document.addEventListener('touchstart', (e) => {
            const target = e.target;
            const isButton = target.tagName === 'BUTTON' || 
                           target.closest('button') !== null ||
                           target.closest('[data-action]') !== null;
            
            if (!isButton) {
                touchStartTime = Date.now();
            }
        }, { passive: true });
        
        // Prevent pinch zoom - ONLY on non-interactive elements
        document.addEventListener('touchmove', (e) => {
            const target = e.target;
            const isButton = target.tagName === 'BUTTON' || 
                           target.closest('button') !== null ||
                           target.closest('[data-action]') !== null;
            
            // NEVER prevent on buttons
            if (isButton) {
                return;
            }
            
            // Only prevent multi-touch (pinch) on non-interactive areas
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false, capture: false });
        
        // Prevent gesture events (pinch zoom on iOS)
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        }, { passive: false });
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
            
            // Displays
            levelDisplay: document.getElementById('level-display'),
            scoreDisplay: document.getElementById('score-display'),
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
            this.elements.nextCanvas
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
        // Action buttons (data-action attribute) - Works on both desktop and mobile
        document.querySelectorAll('[data-action]').forEach(btn => {
            const handleAction = () => {
                this.handleAction(btn.dataset.action);
            };
            
            // Click handler for desktop (always works)
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAction();
            });
            
            // Touch handler for mobile (only if touch is supported)
            if ('ontouchstart' in window) {
                btn.addEventListener('touchstart', (e) => {
                    e.stopPropagation(); // Prevent from reaching document-level handlers
                    e.preventDefault(); // Prevent any default behavior
                    handleAction();
                }, { passive: false, capture: true });
            }
        });
        
        // Menu buttons
        if (this.elements.menuBtn) {
            const handleMenu = () => {
                this.handleMenuPress();
            };
            
            // Click handler for desktop
            this.elements.menuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMenu();
            });
            
            // Touch handler for mobile (only if touch is supported)
            if ('ontouchstart' in window) {
                this.elements.menuBtn.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleMenu();
                }, { passive: false, capture: true });
            }
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
            const gameArea = document.querySelector('.game-area');
            const gameBoardContainer = document.querySelector('.game-board-container');
            const sidebar = document.querySelector('.sidebar');
            
            if (!gameArea || !gameBoardContainer) {
                setTimeout(updateCellSize, 100);
                return;
            }
            
            // Get actual available space
            const gameAreaRect = gameArea.getBoundingClientRect();
            const sidebarWidth = sidebar ? sidebar.offsetWidth : 0;
            const gameContainer = document.querySelector('.game-container');
            const containerPadding = gameContainer ? 
                (parseInt(getComputedStyle(gameContainer).paddingLeft) || 0) * 2 : 0;
            const gap = gameContainer ? 
                (parseInt(getComputedStyle(gameContainer).gap) || 0) : 0;
            
            // Calculate available space for game board
            const availableWidth = gameAreaRect.width - (containerPadding + gap);
            const availableHeight = gameAreaRect.height;
            
            // Board dimensions: 10 columns, 20 rows
            const boardWidth = 10;
            const boardHeight = 20;
            
            // Calculate cell size based on available space
            const cellByWidth = Math.floor(availableWidth / boardWidth);
            const cellByHeight = Math.floor(availableHeight / boardHeight);
            
            // Use the smaller dimension to ensure board fits
            let cellSize = Math.min(cellByWidth, cellByHeight);
            
            // Apply constraints
            if (window.innerWidth <= 768) {
                // Mobile: ensure minimum playability
                cellSize = Math.max(cellSize, 20);
                cellSize = Math.min(cellSize, 35); // Max size for mobile
            } else if (window.innerWidth <= 1024) {
                // Tablet
                cellSize = Math.max(cellSize, 22);
                cellSize = Math.min(cellSize, 30);
            } else {
                // Desktop: maximize size
                cellSize = Math.max(cellSize, 24);
                cellSize = Math.min(cellSize, 40);
            }
            
            if (this.renderer && cellSize > 0) {
                this.renderer.setCellSize(cellSize);
                // Re-render if game is active
                if (this.game.state === 'playing' || this.game.state === 'paused') {
                    this.renderer.render(this.game);
                }
            }
        }, 100);
        
        window.addEventListener('resize', updateCellSize);
        // Also update when game starts
        const originalStartGame = this.startGame.bind(this);
        this.startGame = () => {
            originalStartGame();
            setTimeout(updateCellSize, 50);
        };
        updateCellSize();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

