class VoidBreacher {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // menu, playing, gameover
        
        this.setupEventListeners();
        this.resetGame();
        this.gameLoop();
    }

    setupEventListeners() {
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.startGame());
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    resetGame() {
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            width: 20,
            height: 20,
            speed: 5,
            health: 100,
            isDashing: false,
            dashCooldown: 0,
            dashDuration: 0,
            invulnerable: 0
        };

        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        
        this.keys = {};
        this.score = 0;
        this.wave = 1;
        this.enemySpawnTimer = 0;
        
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
    }

    startGame() {
        this.resetGame();
        this.gameState = 'playing';
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
    }

    gameOver() {
        this.gameState = 'gameover';
        document.getElementById('finalScore').textContent = `Score: ${this.score}`;
        document.getElementById('gameOver').classList.remove('hidden');
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
    }

    handleKeyDown(e) {
        this.keys[e.code] = true;
        
        if (e.code === 'Space' && this.gameState === 'playing') {
            this.shoot();
        }
        
        if (e.code === 'ShiftLeft' && this.gameState === 'playing' && this.player.dashCooldown <= 0) {
            this.dash();
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    dash() {
        this.player.isDashing = true;
        this.player.dashDuration = 10;
        this.player.dashCooldown = 60;
        this.player.invulnerable = 10;
    }

    shoot() {
        this.bullets.push({
            x: this.player.x,
            y: this.player.y - 10,
            width: 4,
            height: 12,
            speed: 10
        });
    }

    updatePlayer() {
        if (this.player.invulnerable > 0) this.player.invulnerable--;
        
        // Handle dash
        if (this.player.isDashing) {
            this.player.dashDuration--;
            if (this.player.dashDuration <= 0) {
                this.player.isDashing = false;
            }
        }
        
        if (this.player.dashCooldown > 0) this.player.dashCooldown--;

        // Movement
        let speed = this.player.isDashing ? this.player.speed * 2 : this.player.speed;
        
        if (this.keys['ArrowUp'] || this.keys['KeyW']) this.player.y -= speed;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) this.player.y += speed;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.player.x -= speed;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.player.x += speed;

        // Boundaries
        this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height - this.player.height, this.player.y));
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].y -= this.bullets[i].speed;
            
            // Remove off-screen bullets
            if (this.bullets[i].y < -10) {
                this.bullets.splice(i, 1);
            }
        }
    }

    spawnEnemy() {
        const type = Math.random() < 0.3 ? 'shooter' : 'charger';
        
        this.enemies.push({
            x: Math.random() * (this.canvas.width - 30),
            y: -30,
            width: 20,
            height: 20,
            speed: type === 'charger' ? 2 : 1,
            type: type,
            shootTimer: type === 'shooter' ? 60 : 0,
            health: type === 'charger' ? 2 : 1
        });
    }

    updateEnemies() {
        this.enemySpawnTimer--;
        if (this.enemySpawnTimer <= 0) {
            this.spawnEnemy();
            this.enemySpawnTimer = Math.max(20, 60 - this.wave * 2);
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Enemy AI
            if (enemy.type === 'charger') {
                // Move toward player
                const dx = this.player.x - enemy.x;
                const dy = this.player.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    enemy.x += (dx / dist) * enemy.speed;
                    enemy.y += (dy / dist) * enemy.speed;
                }
            } else {
                // Shooter moves down and shoots
                enemy.y += enemy.speed;
                enemy.shootTimer--;
                
                if (enemy.shootTimer <= 0) {
                    this.enemyShoot(enemy);
                    enemy.shootTimer = 90;
                }
            }

            // Remove off-screen enemies
            if (enemy.y > this.canvas.height + 50) {
                this.enemies.splice(i, 1);
            }
        }
    }

    enemyShoot(enemy) {
        this.bullets.push({
            x: enemy.x + enemy.width / 2 - 2,
            y: enemy.y + enemy.height,
            width: 4,
            height: 12,
            speed: -4,
            isEnemy: true
        });
    }

    checkCollisions() {
        // Player vs Enemy Bullets
        this.bullets.forEach((bullet, bulletIndex) => {
            if (bullet.isEnemy && this.player.invulnerable <= 0) {
                if (this.checkCollision(this.player, bullet)) {
                    this.player.health -= 10;
                    this.bullets.splice(bulletIndex, 1);
                    this.createParticles(bullet.x, bullet.y, 5, '#ff0000');
                    
                    if (this.player.health <= 0) {
                        this.gameOver();
                    }
                }
            }
        });

        // Player Bullets vs Enemies
        this.bullets.forEach((bullet, bulletIndex) => {
            if (!bullet.isEnemy) {
                this.enemies.forEach((enemy, enemyIndex) => {
                    if (this.checkCollision(bullet, enemy)) {
                        enemy.health--;
                        
                        if (enemy.health <= 0) {
                            this.score += enemy.type === 'charger' ? 20 : 10;
                            this.enemies.splice(enemyIndex, 1);
                            this.createParticles(enemy.x, enemy.y, 8, '#00ff00');
                        }
                        
                        this.bullets.splice(bulletIndex, 1);
                    }
                });
            }
        });

        // Player vs Enemies
        if (this.player.invulnerable <= 0) {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.checkCollision(this.player, enemy)) {
                    this.player.health -= 20;
                    this.enemies.splice(enemyIndex, 1);
                    this.createParticles(enemy.x, enemy.y, 8, '#ff0000');
                    
                    if (this.player.health <= 0) {
                        this.gameOver();
                    }
                }
            });
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 30,
                color: color
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
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('health').textContent = `Health: ${this.player.health}`;
        document.getElementById('highScore').textContent = `High Score: ${this.highScore}`;
        
        const dashText = this.player.dashCooldown > 0 ? 
            `Dash: ${Math.ceil(this.player.dashCooldown / 10)}` : 'Dash: Ready';
        document.getElementById('dashCooldown').textContent = dashText;
    }

    updateWave() {
        this.wave = Math.floor(this.score / 100) + 1;
    }

    update() {
        if (this.gameState !== 'playing') return;

        this.updatePlayer();
        this.updateBullets();
        this.updateEnemies();
        this.updateParticles();
        this.checkCollisions();
        this.updateWave();
        this.updateUI();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw player
        this.ctx.fillStyle = this.player.invulnerable > 0 ? '#8888ff' : '#00ffff';
        if (this.player.isDashing) {
            this.ctx.fillStyle = '#ffffff';
        }
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

        // Draw bullets
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.isEnemy ? '#ff4444' : '#ffff00';
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        // Draw enemies
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = enemy.type === 'charger' ? '#ff00ff' : '#ff4444';
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });

        // Draw particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 30;
            this.ctx.fillRect(p.x, p.y, 2, 2);
            this.ctx.globalAlpha = 1;
        });

        // Draw wave info
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '16px Courier New';
        this.ctx.fillText(`Wave: ${this.wave}`, 10, this.canvas.height - 10);
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new VoidBreacher();
});