/**
 * Geometric Rush - A modern, simple web game without image assets
 * Uses HTML Canvas and modern JavaScript to create an engaging game experience
 */

// Game configuration and constants
const CONFIG = {
    fps: 60,
    playerSize: 30,
    obstacleMinSize: 20,
    obstacleMaxSize: 60,
    obstacleMinSpeed: 2,
    obstacleMaxSpeed: 8,
    spawnRate: 1500, // milliseconds between obstacle spawns
    colors: {
        player: '#3498db',
        obstacles: ['#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'],
        background: '#2c3e50',
        particleColors: ['#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6']
    }
};

// Game state management
class GameState {
    constructor() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.isRunning = false;
        this.isPaused = false;
        this.obstacles = [];
        this.particles = [];
        this.lastObstacleSpawn = 0;
        this.spawnInterval = CONFIG.spawnRate;
        this.animationFrameId = null;
        this.lastFrameTime = 0;
    }

    reset() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.isRunning = false;
        this.isPaused = false;
        this.obstacles = [];
        this.particles = [];
        this.lastObstacleSpawn = 0;
        this.spawnInterval = CONFIG.spawnRate;
        
        // Update UI
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;
    }

    increaseScore(points = 1) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
        
        // Level up every 10 points
        if (this.score % 10 === 0) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        document.getElementById('level').textContent = this.level;
        
        // Make the game harder as levels progress
        this.spawnInterval = Math.max(300, CONFIG.spawnRate - (this.level * 100));
        
        // Show level up animation/notification
        this.createLevelUpEffect();
    }

    loseLife() {
        this.lives--;
        document.getElementById('lives').textContent = this.lives;
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Create visual effect for losing a life
            this.createLifeLostEffect();
        }
    }

    gameOver() {
        this.isRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.querySelector('.game-over').classList.remove('hidden');
    }

    createLevelUpEffect() {
        // Add visual particles for level up
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        for (let i = 0; i < 30; i++) {
            this.particles.push(new Particle(
                centerX, 
                centerY, 
                Math.random() * 10 + 5,
                CONFIG.colors.particleColors[Math.floor(Math.random() * CONFIG.colors.particleColors.length)],
                Math.random() * 4 - 2,
                Math.random() * 4 - 2,
                1000
            ));
        }
    }

    createLifeLostEffect() {
        // Visual effect for losing a life - red flash
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(231, 76, 60, 0.3)';
        overlay.style.zIndex = '5';
        overlay.style.pointerEvents = 'none';
        document.querySelector('.game-container').appendChild(overlay);
        
        // Remove after animation
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

// Player class for the user-controlled character
class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.size = CONFIG.playerSize;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.speed = 5;
        this.color = CONFIG.colors.player;
        this.moveDirection = { x: 0, y: 0 };
        this.invulnerable = false;
        this.invulnerableTimer = 0;
    }

    update(deltaTime) {
        // Move player based on current direction
        this.x += this.moveDirection.x * this.speed;
        this.y += this.moveDirection.y * this.speed;
        
        // Keep player within canvas bounds
        this.x = Math.max(this.size / 2, Math.min(this.canvas.width - this.size / 2, this.x));
        this.y = Math.max(this.size / 2, Math.min(this.canvas.height - this.size / 2, this.y));
        
        // Handle invulnerability timer
        if (this.invulnerable) {
            this.invulnerableTimer -= deltaTime;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Draw player shape (rotating hexagon)
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5; // Blink when invulnerable
        }
        
        // Draw a hexagon for the player
        const rotationAngle = Date.now() * 0.001; // Slow rotation effect
        ctx.translate(this.x, this.y);
        ctx.rotate(rotationAngle);
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = this.size/2 * Math.cos(angle);
            const y = this.size/2 * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Add a glowing effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }

    makeInvulnerable(duration = 1500) {
        this.invulnerable = true;
        this.invulnerableTimer = duration;
    }

    checkCollision(obstacle) {
        if (this.invulnerable) return false;
        
        // Simple circular collision detection
        const dx = this.x - obstacle.x;
        const dy = this.y - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (this.size / 2 + obstacle.size / 2);
    }
}

// Obstacle class for the objects the player must avoid
class Obstacle {
    constructor(canvas, level) {
        this.canvas = canvas;
        this.size = Math.random() * (CONFIG.obstacleMaxSize - CONFIG.obstacleMinSize) + CONFIG.obstacleMinSize;
        
        // Adjust size based on level (smaller obstacles at higher levels)
        this.size = Math.max(15, this.size - (level * 2));
        
        // Determine spawn position (from edges)
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        
        switch(edge) {
            case 0: // top
                this.x = Math.random() * canvas.width;
                this.y = -this.size;
                break;
            case 1: // right
                this.x = canvas.width + this.size;
                this.y = Math.random() * canvas.height;
                break;
            case 2: // bottom
                this.x = Math.random() * canvas.width;
                this.y = canvas.height + this.size;
                break;
            case 3: // left
                this.x = -this.size;
                this.y = Math.random() * canvas.height;
                break;
        }
        
        // Calculate velocity toward center with some randomness
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        const dx = centerX - this.x;
        const dy = centerY - this.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        
        const speed = Math.random() * (CONFIG.obstacleMaxSpeed - CONFIG.obstacleMinSpeed) + CONFIG.obstacleMinSpeed;
        const speedBoost = 1 + (level * 0.1); // Increase speed with level
        
        this.vx = (dx / magnitude) * speed * speedBoost;
        this.vy = (dy / magnitude) * speed * speedBoost;
        
        // Add some randomness to movement
        this.vx += (Math.random() - 0.5) * 2;
        this.vy += (Math.random() - 0.5) * 2;
        
        // Visual properties
        this.color = CONFIG.colors.obstacles[Math.floor(Math.random() * CONFIG.colors.obstacles.length)];
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.sides = Math.floor(Math.random() * 3) + 3; // 3 to 5 sides
    }

    update(deltaTime) {
        // Move obstacle
        this.x += this.vx;
        this.y += this.vy;
        
        // Rotate obstacle
        this.rotation += this.rotationSpeed;
        
        // Check if obstacle is off-screen
        const isOffScreen = (
            this.x < -this.size * 2 || 
            this.x > this.canvas.width + this.size * 2 || 
            this.y < -this.size * 2 || 
            this.y > this.canvas.height + this.size * 2
        );
        
        return isOffScreen;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.beginPath();
        
        // Draw different shapes based on sides
        if (this.sides === 3) {
            // Triangle
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI * 2 / 3) * i + Math.PI / 6;
                const x = this.size * Math.cos(angle);
                const y = this.size * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        } else if (this.sides === 4) {
            // Square (rotated)
            const size = this.size * 0.7; // Make the square's diagonal equal to size
            ctx.rect(-size/2, -size/2, size, size);
        } else {
            // Pentagon
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                const x = this.size * Math.cos(angle);
                const y = this.size * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        }
        
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}

// Particle effects for visual feedback
class Particle {
    constructor(x, y, size, color, vx, vy, lifetime) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.lifetime = lifetime;
        this.age = 0;
        this.gravity = 0.05;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    }

    update(deltaTime) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.age += deltaTime;
        this.rotation += this.rotationSpeed;
        
        // Fade out based on age
        return this.age >= this.lifetime;
    }

    draw(ctx) {
        const opacity = 1 - (this.age / this.lifetime);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = opacity;
        
        // Draw a small polygon
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const x = this.size * Math.cos(angle);
            const y = this.size * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.restore();
    }
}

// Main game class
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = new GameState();
        this.player = new Player(this.canvas);
        
        // Set up canvas dimensions
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Input handling
        this.setupControls();
        
        // UI elements
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.restartButton = document.getElementById('restartButton');
        
        this.setupEventListeners();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    setupEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.pauseButton.addEventListener('click', () => this.togglePause());
        this.restartButton.addEventListener('click', () => this.restart());
    }

    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.state.isRunning || this.state.isPaused) return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                    this.player.moveDirection.y = -1;
                    break;
                case 'ArrowDown':
                case 's':
                    this.player.moveDirection.y = 1;
                    break;
                case 'ArrowLeft':
                case 'a':
                    this.player.moveDirection.x = -1;
                    break;
                case 'ArrowRight':
                case 'd':
                    this.player.moveDirection.x = 1;
                    break;
                case ' ':
                    this.togglePause();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                    if (this.player.moveDirection.y < 0) this.player.moveDirection.y = 0;
                    break;
                case 'ArrowDown':
                case 's':
                    if (this.player.moveDirection.y > 0) this.player.moveDirection.y = 0;
                    break;
                case 'ArrowLeft':
                case 'a':
                    if (this.player.moveDirection.x < 0) this.player.moveDirection.x = 0;
                    break;
                case 'ArrowRight':
                case 'd':
                    if (this.player.moveDirection.x > 0) this.player.moveDirection.x = 0;
                    break;
            }
        });
        
        // Touch controls for mobile
        let touchStartX, touchStartY;
        this.canvas.addEventListener('touchstart', (e) => {
            if (!this.state.isRunning || this.state.isPaused) return;
            
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.state.isRunning || this.state.isPaused) return;
            if (!touchStartX || !touchStartY) return;
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            
            const diffX = touchX - touchStartX;
            const diffY = touchY - touchStartY;
            
            // Simple swipe detection
            if (Math.abs(diffX) > 20 || Math.abs(diffY) > 20) {
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    // Horizontal swipe
                    this.player.moveDirection.x = diffX > 0 ? 1 : -1;
                    this.player.moveDirection.y = 0;
                } else {
                    // Vertical swipe
                    this.player.moveDirection.y = diffY > 0 ? 1 : -1;
                    this.player.moveDirection.x = 0;
                }
                
                // Update touch start for continuous movement
                touchStartX = touchX;
                touchStartY = touchY;
            }
            
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', () => {
            if (!this.state.isRunning) return;
            
            this.player.moveDirection.x = 0;
            this.player.moveDirection.y = 0;
            touchStartX = null;
            touchStartY = null;
        });
    }

    startGame() {
        if (this.state.isRunning) return;
        
        this.state.reset();
        this.state.isRunning = true;
        document.querySelector('.game-over').classList.add('hidden');
        this.startButton.textContent = 'Restart';
        
        this.gameLoop(0);
    }

    restart() {
        if (this.state.animationFrameId) {
            cancelAnimationFrame(this.state.animationFrameId);
        }
        
        this.state.reset();
        this.player = new Player(this.canvas);
        this.startGame();
    }

    togglePause() {
        if (!this.state.isRunning) return;
        
        this.state.isPaused = !this.state.isPaused;
        this.pauseButton.textContent = this.state.isPaused ? 'Resume' : 'Pause';
        
        if (!this.state.isPaused) {
            this.state.lastFrameTime = performance.now();
            this.gameLoop(this.state.lastFrameTime);
        }
    }

    spawnObstacle() {
        this.state.obstacles.push(new Obstacle(this.canvas, this.state.level));
    }

    gameLoop(timestamp) {
        if (!this.state.isRunning) return;
        if (this.state.isPaused) {
            this.state.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }
        
        // Calculate delta time
        const deltaTime = timestamp - this.state.lastFrameTime;
        this.state.lastFrameTime = timestamp;
        
        // Clear canvas
        this.ctx.fillStyle = CONFIG.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Spawn obstacles
        if (timestamp - this.state.lastObstacleSpawn > this.state.spawnInterval) {
            this.spawnObstacle();
            this.state.lastObstacleSpawn = timestamp;
        }
        
        // Update player
        this.player.update(deltaTime);
        
        // Update and draw obstacles
        for (let i = this.state.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.state.obstacles[i];
            const isOffScreen = obstacle.update(deltaTime);
            
            if (isOffScreen) {
                // Remove obstacle and give points
                this.state.obstacles.splice(i, 1);
                this.state.increaseScore();
                continue;
            }
            
            // Check collision with player
            if (this.player.checkCollision(obstacle)) {
                // Create particle explosion
                for (let j = 0; j < 10; j++) {
                    this.state.particles.push(new Particle(
                        obstacle.x,
                        obstacle.y,
                        Math.random() * 8 + 3,
                        obstacle.color,
                        (Math.random() - 0.5) * 5,
                        (Math.random() - 0.5) * 5,
                        800
                    ));
                }
                
                // Remove obstacle and handle collision
                this.state.obstacles.splice(i, 1);
                this.state.loseLife();
                this.player.makeInvulnerable(1500);
            }
            
            // Draw obstacle
            obstacle.draw(this.ctx);
        }
        
        // Update and draw particles
        for (let i = this.state.particles.length - 1; i >= 0; i--) {
            const particle = this.state.particles[i];
            const isDead = particle.update(deltaTime);
            
            if (isDead) {
                this.state.particles.splice(i, 1);
                continue;
            }
            
            particle.draw(this.ctx);
        }
        
        // Draw player
        this.player.draw(this.ctx);
        
        // Draw grid background for visual effect
        this.drawGridBackground();
        
        // Continue game loop
        this.state.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
    }

    drawGridBackground() {
        // Draw a subtle grid pattern in the background
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 40;
        const offsetX = this.player.x % gridSize;
        const offsetY = this.player.y % gridSize;
        
        // Vertical lines
        for (let x = -offsetX; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = -offsetY; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
}

// Start the game when the window loads
window.addEventListener('load', () => {
    const game = new Game();
});