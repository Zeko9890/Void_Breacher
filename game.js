class VoidBreacher {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // menu, playing, paused, gameover
        
        this.resizeCanvas();
        this.setupEventListeners();
        this.resetGame();
        this.lastTime = 0;
        this.gameLoop();
        
        // Draw initial game state
        this.drawMenu();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Button events
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.startGame());
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resetGame() {
        this.player = {
            x: this.canvas.width / 2 - 15,
            y: this.canvas.height - 100,
            width: 30,
            height: 40,
            speed: 8,
            health: 100,
            maxHealth: 100
        };

        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.stars = [];
        
        this.keys = {};
        this.score = 0;
        this.wave = 1;
        this.enemySpawnTimer = 0;
        
        // Create background stars
        this.createStars();
        
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        this.updateUI();
    }

    createStars() {
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.1
            });
        }
    }

    startGame() {
        this.resetGame();
        this.gameState = 'playing';
        this.hideGameOver();
        this.updateButtonStates();
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
        this.updateButtonStates();
    }

    gameOver() {
        this.gameState = 'gameover';
        this.showGameOver();
        this.updateButtonStates();
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
    }

    updateButtonStates() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.gameState === 'playing') {
            startBtn.classList.add('hidden');
            pauseBtn.classList.remove('hidden');
        } else {
            startBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
        }
    }

    showGameOver() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalWave').textContent = this.wave;
        document.getElementById('gameOver').classList.remove('hidden');
    }

    hideGameOver() {
        document.getElementById('gameOver').classList.add('hidden');
    }

    handleKeyDown(e) {
        this.keys[e.code] = true;
        
        if (e.code === 'Space' && this.gameState === 'playing') {
            this.shoot();
            e.preventDefault();
        }
        
        if (e.code === 'Escape') {
            this.pauseGame();
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    shoot() {
        this.bullets.push({
            x: this.player.x + this.player.width / 2 - 2,
            y: this.player.y,
            width: 4,
            height: 12,
            speed: 12
        });
    }

    updatePlayer() {
        if (this.keys['ArrowUp'] || this.keys['KeyW']) this.player.y -= this.player.speed;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) this.player.y += this.player.speed;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.player.x -= this.player.speed;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.player.x += this.player.speed;

        // Boundaries
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, this.player.y));
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].y -= this.bullets[i].speed;
            
            if (this.bullets[i].y < -10) {
                this.bullets.splice(i, 1);
            }
        }
    }

    spawnEnemy() {
        this.enemies.push({
            x: Math.random() * (this.canvas.width - 30),
            y: -30,
            width: 25,
            height: 25,
            speed: 2 + Math.random() * 2,
            health: 1
        });
    }

    updateEnemies() {
        this.enemySpawnTimer--;
        if (this.enemySpawnTimer <= 0) {
            this.spawnEnemy();
            this.enemySpawnTimer = Math.max(20, 60 - this.wave * 3);
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.y += enemy.speed;

            if (enemy.y > this.canvas.height + 50) {
                this.enemies.splice(i, 1);
            }
        }
    }

    updateStars() {
        for (let i = 0; i < this.stars.length; i++) {
            this.stars[i].y += this.stars[i].speed;
            if (this.stars[i].y > this.canvas.height) {
                this.stars[i].y = 0;
                this.stars[i].x = Math.random() * this.canvas.width;
            }
        }
    }

    checkCollisions() {
        // Player Bullets vs Enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (this.checkCollision(this.bullets[i], this.enemies[j])) {
                    this.score += 10;
                    this.enemies.splice(j, 1);
                    this.bullets.splice(i, 1);
                    this.createExplosion(this.bullets[i].x, this.bullets[i].y);
                    break;
                }
            }
        }

        // Player vs Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.enemies[i])) {
                this.player.health -= 10;
                this.enemies.splice(i, 1);
                this.createExplosion(this.player.x + this.player.width/2, this.player.y);
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    createExplosion(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('highScore').textContent = this.highScore;
        
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('healthBar').style.width = healthPercent + '%';
        document.getElementById('healthText').textContent = Math.round(healthPercent) + '%';
    }

    updateWave() {
        this.wave = Math.floor(this.score / 100) + 1;
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.updateStars();
        this.updateParticles();
        this.checkCollisions();
        this.updateWave();
        this.updateUI();
    }

    drawBackground() {
        // Draw space background
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawPlayer() {
        this.ctx.fillStyle = '#00ffff';
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 15;
        
        // Draw player as a triangle (spaceship)
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width/2, this.player.y);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
    }

    drawBullets() {
        this.ctx.fillStyle = '#ffff00';
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 8;
        
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        this.ctx.shadowBlur = 0;
    }

    drawEnemies() {
        this.ctx.fillStyle = '#ff4444';
        this.ctx.shadowColor = '#ff4444';
        this.ctx.shadowBlur = 10;
        
        this.enemies.forEach(enemy => {
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
        
        this.ctx.shadowBlur = 0;
    }

    drawParticles() {
        this.ctx.fillStyle = '#ff8800';
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life / 30;
            this.ctx.fillRect(p.x, p.y, 3, 3);
        });
        this.ctx.globalAlpha = 1;
    }

    drawMenu() {
        this.drawBackground();
        
        // Draw title
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('VOID BREACHER', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '20px Courier New';
        this.ctx.fillText('Click START to begin!', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    draw() {
        this.drawBackground();
        this.drawParticles();
        this.drawEnemies();
        this.drawBullets();
        this.drawPlayer();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    gameLoop(currentTime = 0) {
        const deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 2.5);
        this.lastTime = currentTime;

        this.update(deltaTime);
        
        if (this.gameState === 'menu') {
            this.drawMenu();
        } else if (this.gameState === 'playing' || this.gameState === 'paused') {
            this.draw();
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new VoidBreacher();
});