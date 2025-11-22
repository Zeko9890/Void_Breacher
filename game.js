class VoidBreacher {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // menu, playing, gameover
        
        this.resizeCanvas();
        this.setupEventListeners();
        this.resetGame();
        this.gameLoop();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse/touch controls
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
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
    }

    gameOver() {
        this.gameState = 'gameover';
    }

    handleKeyDown(e) {
        this.keys[e.code] = true;
        
        if (e.code === 'Space' && this.gameState === 'playing') {
            this.shoot();
            e.preventDefault();
        }
        
        if (e.code === 'Enter' && this.gameState === 'menu') {
            this.startGame();
        }
        
        if (e.code === 'Enter' && this.gameState === 'gameover') {
            this.startGame();
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Menu buttons
        if (this.gameState === 'menu') {
            // Start button
            if (this.isPointInButton(x, y, this.canvas.width/2 - 75, this.canvas.height/2 + 50, 150, 50)) {
                this.startGame();
            }
        }
        
        // Game over buttons
        else if (this.gameState === 'gameover') {
            // Play again button
            if (this.isPointInButton(x, y, this.canvas.width/2 - 75, this.canvas.height/2 + 80, 150, 50)) {
                this.startGame();
            }
        }
        
        // In-game shooting
        else if (this.gameState === 'playing') {
            this.shoot();
        }
    }

    isPointInButton(x, y, btnX, btnY, btnWidth, btnHeight) {
        return x >= btnX && x <= btnX + btnWidth && 
               y >= btnY && y <= btnY + btnHeight;
    }

    shoot() {
        if (this.gameState !== 'playing') return;
        
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

    drawUI() {
        // Score
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '20px Courier New';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE: ${this.score}`, 20, 40);
        
        // Wave
        this.ctx.fillText(`WAVE: ${this.wave}`, 20, 70);
        
        // Health bar
        const healthPercent = this.player.health / this.player.maxHealth;
        const barWidth = 200;
        const barHeight = 20;
        const barX = this.canvas.width - barWidth - 20;
        const barY = 30;
        
        // Background
        this.ctx.fillStyle = '#330000';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.2 ? '#ffff00' : '#ff0000';
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Health text
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillText(`HEALTH: ${Math.round(this.player.health)}%`, barX, barY - 10);
    }

    drawButton(x, y, width, height, text) {
        // Button background
        this.ctx.fillStyle = 'rgba(0, 50, 0, 0.8)';
        this.ctx.fillRect(x, y, width, height);
        
        // Button border
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Button text
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 20px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, x + width/2, y + height/2);
    }

    drawMenu() {
        this.drawBackground();
        
        // Title
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = 'bold 60px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('VOID BREACHER', this.canvas.width / 2, this.canvas.height / 2 - 100);
        
        this.ctx.font = '20px Courier New';
        this.ctx.fillText('SPACE ARCADE SHOOTER', this.canvas.width / 2, this.canvas.height / 2 - 30);
        
        // Start button
        this.drawButton(this.canvas.width/2 - 75, this.canvas.height/2 + 50, 150, 50, 'START GAME');
        
        // Controls
        this.ctx.font = '16px Courier New';
        this.ctx.fillText('CONTROLS: WASD to move, SPACE to shoot', this.canvas.width / 2, this.canvas.height / 2 + 150);
        this.ctx.fillText('CLICK START or press ENTER to begin', this.canvas.width / 2, this.canvas.height / 2 + 180);
    }

    drawGameOver() {
        this.drawBackground();
        
        // Game Over text
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = 'bold 60px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 100);
        
        // Score
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '30px Courier New';
        this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 - 20);
        this.ctx.fillText(`WAVE REACHED: ${this.wave}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        // Play again button
        this.drawButton(this.canvas.width/2 - 75, this.canvas.height/2 + 80, 150, 50, 'PLAY AGAIN');
        
        this.ctx.font = '16px Courier New';
        this.ctx.fillText('CLICK BUTTON or press ENTER to restart', this.canvas.width / 2, this.canvas.height / 2 + 160);
    }

    draw() {
        this.drawBackground();
        this.drawParticles();
        this.drawEnemies();
        this.drawBullets();
        this.drawPlayer();
        this.drawUI();
    }

    gameLoop() {
        this.update();
        
        if (this.gameState === 'menu') {
            this.drawMenu();
        } else if (this.gameState === 'playing') {
            this.draw();
        } else if (this.gameState === 'gameover') {
            this.drawGameOver();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new VoidBreacher();
});