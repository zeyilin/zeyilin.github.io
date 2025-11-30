// renderer.js - Canvas Rendering

class Renderer {
    constructor(canvas, nextCanvas, nextCanvasMobile = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nextCanvas = nextCanvas;
        this.nextCtx = nextCanvas.getContext('2d');
        this.nextCanvasMobile = nextCanvasMobile;
        this.nextCtxMobile = nextCanvasMobile ? nextCanvasMobile.getContext('2d') : null;
        
        this.cellSize = 28;
        this.boardWidth = 10;
        this.boardHeight = 20;
        
        // Colors from CSS variables
        this.colors = {
            background: '#232323',
            gridLine: '#2a2a2a',
            gridDot: '#2a2a2a'
        };
        
        this.updateCanvasSize();
    }
    
    /**
     * Set cell size and update canvas dimensions
     */
    setCellSize(size) {
        this.cellSize = size;
        this.updateCanvasSize();
    }
    
    /**
     * Update canvas dimensions based on cell size
     */
    updateCanvasSize() {
        this.canvas.width = this.boardWidth * this.cellSize;
        this.canvas.height = this.boardHeight * this.cellSize;
        
        // Update container size to match
        const container = this.canvas.parentElement;
        if (container) {
            container.style.width = `${this.canvas.width}px`;
            container.style.height = `${this.canvas.height}px`;
        }
    }
    
    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
    }
    
    /**
     * Draw the grid
     */
    drawGrid() {
        this.ctx.strokeStyle = this.colors.gridLine;
        this.ctx.lineWidth = 1;
        
        // Draw grid lines
        for (let x = 1; x < this.boardWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.cellSize + 0.5, 0);
            this.ctx.lineTo(x * this.cellSize + 0.5, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 1; y < this.boardHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.cellSize + 0.5);
            this.ctx.lineTo(this.canvas.width, y * this.cellSize + 0.5);
            this.ctx.stroke();
        }
        
        // Draw center dots in empty cells
        this.ctx.fillStyle = this.colors.gridDot;
        const dotSize = 2;
        for (let y = 0; y < this.boardHeight; y++) {
            for (let x = 0; x < this.boardWidth; x++) {
                const centerX = x * this.cellSize + this.cellSize / 2;
                const centerY = y * this.cellSize + this.cellSize / 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, dotSize / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    /**
     * Draw a single block
     */
    drawBlock(x, y, color, isGhost = false, ctx = this.ctx) {
        const size = this.cellSize;
        const padding = 1;
        
        const pixelX = x * size + padding;
        const pixelY = y * size + padding;
        const blockSize = size - padding * 2;
        
        // Save context state
        ctx.save();
        
        // Ghost piece is transparent
        if (isGhost) {
            ctx.globalAlpha = 0.3;
        }
        
        // Main block fill
        ctx.fillStyle = color;
        ctx.fillRect(pixelX, pixelY, blockSize, blockSize);
        
        // Highlight (top-left edges)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(pixelX, pixelY, blockSize, 2);
        ctx.fillRect(pixelX, pixelY, 2, blockSize);
        
        // Shadow (bottom-right edges)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(pixelX, pixelY + blockSize - 2, blockSize, 2);
        ctx.fillRect(pixelX + blockSize - 2, pixelY, 2, blockSize);
        
        // Glow effect (subtle)
        if (!isGhost) {
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.1;
            ctx.fillRect(pixelX, pixelY, blockSize, blockSize);
        }
        
        // Restore context state
        ctx.restore();
    }
    
    /**
     * Draw the board (placed blocks)
     */
    drawBoard(board) {
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                const color = board.grid[y][x];
                if (color) {
                    this.drawBlock(x, y, color);
                }
            }
        }
    }
    
    /**
     * Draw a tetromino (current piece or ghost)
     */
    drawTetromino(tetromino, ghostY = null) {
        if (!tetromino) return;
        
        // Draw ghost piece first (underneath)
        if (ghostY !== null && ghostY !== tetromino.y) {
            for (let row = 0; row < tetromino.shape.length; row++) {
                for (let col = 0; col < tetromino.shape[row].length; col++) {
                    if (tetromino.shape[row][col]) {
                        const y = ghostY + row;
                        if (y >= 0) {
                            this.drawBlock(
                                tetromino.x + col,
                                y,
                                tetromino.color,
                                true
                            );
                        }
                    }
                }
            }
        }
        
        // Draw actual piece
        for (let row = 0; row < tetromino.shape.length; row++) {
            for (let col = 0; col < tetromino.shape[row].length; col++) {
                if (tetromino.shape[row][col]) {
                    const y = tetromino.y + row;
                    if (y >= 0) {
                        this.drawBlock(
                            tetromino.x + col,
                            y,
                            tetromino.color
                        );
                    }
                }
            }
        }
    }
    
    /**
     * Draw the next piece preview
     */
    drawNextPiece(tetromino) {
        if (!tetromino) return;
        
        // Draw on desktop canvas
        this.drawNextPieceOnCanvas(tetromino, this.nextCanvas, this.nextCtx, 16);
        
        // Draw on mobile canvas if available
        if (this.nextCanvasMobile && this.nextCtxMobile) {
            this.drawNextPieceOnCanvas(tetromino, this.nextCanvasMobile, this.nextCtxMobile, 7);
        }
    }
    
    /**
     * Draw next piece on a specific canvas
     */
    drawNextPieceOnCanvas(tetromino, canvas, ctx, blockSize) {
        // Clear canvas
        ctx.fillStyle = 'transparent';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const shape = tetromino.shape;
        
        // Calculate bounds to center the piece
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    minX = Math.min(minX, col);
                    maxX = Math.max(maxX, col);
                    minY = Math.min(minY, row);
                    maxY = Math.max(maxY, row);
                }
            }
        }
        
        const pieceWidth = (maxX - minX + 1) * blockSize;
        const pieceHeight = (maxY - minY + 1) * blockSize;
        const offsetX = (canvas.width - pieceWidth) / 2 - minX * blockSize;
        const offsetY = (canvas.height - pieceHeight) / 2 - minY * blockSize;
        
        // Draw blocks
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = offsetX + col * blockSize;
                    const y = offsetY + row * blockSize;
                    
                    // Draw block
                    ctx.fillStyle = tetromino.color;
                    ctx.fillRect(x + 1, y + 1, blockSize - 2, blockSize - 2);
                    
                    // Simple highlight
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(x + 1, y + 1, blockSize - 2, 1);
                    ctx.fillRect(x + 1, y + 1, 1, blockSize - 2);
                }
            }
        }
    }
    
    /**
     * Main render function
     */
    render(game) {
        // Clear and draw grid
        this.clear();
        
        // Draw placed blocks
        this.drawBoard(game.board);
        
        // Draw current piece with ghost
        if (game.currentPiece && game.state === 'playing') {
            const ghostY = game.getGhostY();
            this.drawTetromino(game.currentPiece, ghostY);
        } else if (game.currentPiece && game.state === 'paused') {
            // Still show piece when paused but no ghost
            this.drawTetromino(game.currentPiece);
        }
        
        // Draw next piece preview
        if (game.nextPiece) {
            this.drawNextPiece(game.nextPiece);
        }
    }
    
    /**
     * Draw line clear animation
     */
    drawLineClearAnimation(rows, progress) {
        this.ctx.save();
        
        for (const row of rows) {
            const y = row * this.cellSize;
            const height = this.cellSize;
            
            // Flash effect
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * (1 - progress)})`;
            this.ctx.fillRect(0, y, this.canvas.width, height);
        }
        
        this.ctx.restore();
    }
}

