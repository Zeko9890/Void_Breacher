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
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        // Game controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // UI buttons
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.startGame());
        document.getElementById('menuButton').addEventListener('click', () => this.showMenu());
        document.getElementById('resumeButton').addEventListener('click', () => this.resumeGame());
        document.getElementById('quitButton').addEventListener('click', () => this.showMenu());
        document.getElementById('fullscreenButton').addEventListener('click', () => this.toggleFullscreen());
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resetGame() {
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            width: 24,
            height: 32,
            speed: 7,
            health: 100,
            maxHealth: 100,
            isDashing: false,
            dashCooldown: 0,
            dashDuration: 0,
            invulnerable: 0
        };

        this.bullets = [];
        this.enemyBullets = [];
        this.enemies = [];
        this.particles = [];
        this.explosions = [];
        
        this.keys = {};
        this.score = 0;
        this.wave = 1;
        this.enemySpawnTimer = 0;
        this.shootCooldown = 0;
        
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        this.updateUI();
    }

    startGame() {
        this.resetGame();
        this.gameState = 'playing';
        this.hideAllScreens();
    }

    showMenu() {
        this.gameState = 'menu';
        this.hideAllScreens();
        document.getElementById('mainMenu').classList.remove('hidden');
        this.updateHighScore();
    }

    resumeGame() {
        this.gameState = 'playing';
        this.hideAllScreens();
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('paused').classList.remove('hidden');
        }
    }

    gameOver() {
        this.gameState = 'gameover';
        this.hideAllScreens();
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalWave').textContent = this.wave;
        document.getElementById('gameOver').classList.remove('hidden');
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
        this.updateHighScore();
    }

    hideAllScreens() {
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('gameOver').classList.add('hidden');
        document.getElementById('paused').classList.add('hidden');
    }

    updateHighScore() {
        document.getElementById('highScore').textContent = this.highScore;
    }

    handleKeyDown(e) {
        // Prevent spacebar from scrolling page
        if (e.code === 'Space') {
            e.preventDefault();
        }

        this.keys[e.code] = true;

        // Toggle pause with Escape key
        if (e.code === 'Escape') {
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    dash() {
        if (this.player.dashCooldown <= 0) {
            this.player.isDashing = true;
            this.player.dashDuration = 15;
            this.player.dashCooldown = 90;
            this.player.invulnerable = 15;
            
            // Dash particles
            this.createParticles(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 12, '#ffffff');
        }
    }

    shoot() {
        if (this.shootCooldown <= 0) {
            this.bullets.push({
                x: this.player.x + this.player.width/2 - 2,
                y: this.player.y,
                width: 4,
                height: 12,
                speed: 12
            });
            
            this.shootCooldown = 8;
            
            // Muzzle flash
            this.createParticles(this.player.x + this.player.width/2, this.player.y, 3, '#ffff00');
        }
    }

    updatePlayer(deltaTime) {
        if (this.player.invulnerable > 0) this.player.invulnerable--;
        
        // Handle dash
        if (this.player.isDashing) {
            this.player.dashDuration--;
            if (this.player.dashDuration <= 0) {
                this.player.isDashing = false;
            }
        }
        
        if (this.player.dashCooldown > 0) this.player.dashCooldown--;
        if (this.shootCooldown > 0) this.shootCooldown--;

        // Movement
        let speed = this.player.isDashing ? this.player.speed * 2.5 : this.player.speed;
        let moveX = 0, moveY = 0;
        
        if (this.keys['ArrowUp'] || this.keys['KeyW']) moveY -= speed;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) moveY += speed;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) moveX -= speed;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) moveX += speed;

        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707;
            moveY *= 0.707;
        }

        this.player.x += moveX;
        this.player.y += moveY;

        // Shooting
        if (this.keys['Space']) {
            this.shoot();
        }

        // Dashing
        if (this.keys['ShiftLeft'] && !this.player.isDashing) {
            this.dash();
        }

        // Boundaries
        this.player.x = Math.max(10, Math.min(this.canvas.width - this.player.width - 10, this.player.x));
        this.player.y = Math.max(10, Math.min(this.canvas.height - this.player.height - 10, this.player.y));
    }

    updateBullets() {
        // Player bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].y -= this.bullets[i].speed;
            
            if (this.bullets[i].y < -10) {
                this.bullets.splice(i, 1);
            }
        }

        // Enemy bullets
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            this.enemyBullets[i].y += this.enemyBullets[i].speed;
            
            if (this.enemyBullets[i].y > this.canvas.height + 10) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }

    spawnEnemy() {
        const type = Math.random() < 0.3 ? 'shooter' : 'charger';
        const size = type === 'charger' ? 28 : 22;
        
        this.enemies.push({
            x: Math.random() * (this.canvas.width - size - 20) + 10,
            y: -size,
            width: size,
            height: size,
            speed: type === 'charger' ? 2.5 : 1.8,
            type: type,
            shootTimer: type === 'shooter' ? 90 : 0,
            health: type === 'charger' ? 3 : 1,
            maxHealth: type === 'charger' ? 3 : 1
        });
    }

    updateEnemies() {
        this.enemySpawnTimer--;
        if (this.enemySpawnTimer <= 0) {
            const spawnCount = Math.min(3 + Math.floor(this.wave / 2), 8);
            for (let i = 0; i < spawnCount; i++) {
                setTimeout(() => this.spawnEnemy(), i * 200);
            }
            this.enemySpawnTimer = Math.max(40, 120 - this.wave * 5);
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
                    enemy.shootTimer = 60 + Math.random() * 60;
                }
            }

            // Remove off-screen enemies
            if (enemy.y > this.canvas.height + 50) {
                this.enemies.splice(i, 1);
            }
        }
    }

    enemyShoot(enemy) {
        this.enemyBullets.push({
            x: enemy.x + enemy.width / 2 - 2,
            y: enemy.y + enemy.height,
            width: 4,
            height: 12,
            speed: 5
        });
        
        this.createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height, 3, '#ff4444');
    }

    checkCollisions() {
        // Player vs Enemy Bullets
        this.enemyBullets.forEach((bullet, bulletIndex) => {
            if (this.player.invulnerable <= 0 && this.checkCollision(this.player, bullet)) {
                this.player.health -= 15;
                this.enemyBullets.splice(bulletIndex, 1);
                this.createExplosion(bullet.x, bullet.y, '#ff0000');
                
                if (this.player.health <= 0) {
                    this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#ff0000', 15);
                    this.gameOver();
                }
            }
        });

        // Player Bullets vs Enemies
        this.bullets.forEach((bullet, bulletIndex) => {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if (this.checkCollision(bullet, enemy)) {
                    enemy.health--;
                    
                    if (enemy.health <= 0) {
                        this.score += enemy.type === 'charger' ? 25 : 15;
                        this.enemies.splice(i, 1);
                        this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 
                                           enemy.type === 'charger' ? '#ff00ff' : '#ff4444', 12);
                    } else {
                        this.createParticles(bullet.x, bullet.y, 3, '#ffff00');
                    }
                    
                    this.bullets.splice(bulletIndex, 1);
                    break;
                }
            }
        });

        // Player vs Enemies
        if (this.player.invulnerable <= 0) {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.checkCollision(this.player, enemy)) {
                    this.player.health -= 25;
                    this.enemies.splice(enemyIndex, 1);
                    this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#ff0000', 15);
                    
                    if (this.player.health <= 0) {
                        this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#ff0000', 20);
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
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 20 + Math.random() * 20,
                maxLife: 40,
                color: color,
                size: 1 + Math.random() * 3
            });
        }
    }

    createExplosion(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                maxLife: 30,
                color: color,
                size: 2 + Math.random() * 4
            });
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.life--;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('wave').textContent = this.wave;
        
        // Health bar
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('healthBar').style.width = healthPercent + '%';
        
        // Dash cooldown
        const dashElement = document.getElementById('dashCooldown');
        if (this.player.dashCooldown > 0) {
            const cooldownPercent = (this.player.dashCooldown / 90) * 100;
            dashElement.textContent = Math.ceil(this.player.dashCooldown / 10);
            dashElement.className = 'dash-cooldown';
        } else {
            dashElement.textContent = 'READY';
            dashElement.className = 'dash-ready';
        }
    }

    updateWave() {
        this.wave = Math.floor(this.score / 100) + 1;
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;

        this.updatePlayer(deltaTime);
        this.updateBullets();
        this.updateEnemies();
        this.updateParticles();
        this.checkCollisions();
        this.updateWave();
        this.updateUI();
    }

    drawPlayer() {
        this.ctx.save();
        
        // Player glow when dashing or invulnerable
        if (this.player.isDashing) {
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = 20;
        } else if (this.player.invulnerable > 0) {
            this.ctx.shadowColor = '#8888ff';
            this.ctx.shadowBlur = 15;
        }

        // Draw player ship
        this.ctx.fillStyle = this.player.isDashing ? '#ffffff' : 
                           (this.player.invulnerable > 0 ? '#8888ff' : '#00ffff');
        
        // Ship shape (triangle)
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width/2, this.player.y);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();

        // Engine glow
        if (!this.player.isDashing) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.x + this.player.width/3, this.player.y + this.player.height);
            this.ctx.lineTo(this.player.x + this.player.width/2, this.player.y + this.player.height + 8);
            this.ctx.lineTo(this.player.x + 2*this.player.width/3, this.player.y + this.player.height);
            this.ctx.closePath();
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawBullets() {
        // Player bullets
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        // Enemy bullets
        this.enemyBullets.forEach(bullet => {
            this.ctx.fillStyle = '#ff4444';
            this.ctx.shadowColor = '#ff4444';
            this.ctx.shadowBlur = 8;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });

        this.ctx.shadowBlur = 0;
    }

    drawEnemies() {
        this.enemies.forEach(enemy => {
            this.ctx.save();
            
            // Enemy glow
            this.ctx.shadowColor = enemy.type === 'charger' ? '#ff00ff' : '#ff4444';
            this.ctx.shadowBlur = 15;

            // Enemy color
            this.ctx.fillStyle = enemy.type === 'charger' ? '#ff00ff' : '#ff4444';
            
            if (enemy.type === 'charger') {
                // Charger - diamond shape
                this.ctx.beginPath();
                this.ctx.moveTo(enemy.x + enemy.width/2, enemy.y);
                this.ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height/2);
                this.ctx.lineTo(enemy.x + enemy.width/2, enemy.y + enemy.height);
                this.ctx.lineTo(enemy.x, enemy.y + enemy.height/2);
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                // Shooter - circle
                this.ctx.beginPath();
                this.ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/2, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.save();
            const alpha = p.life / p.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 5;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
            this.ctx.restore();
        });
    }

    drawBackground() {
        // Simple starfield
        for (let i = 0; i < 3; i++) {
            const time = Date.now() * 0.001;
            const x = (time * (20 + i * 10)) % this.canvas.width;
            const y = (time * (15 + i * 8)) % this.canvas.height;
            
            this.ctx.fillStyle = `rgba(100, 100, 255, ${0.3 + i * 0.2})`;
            this.ctx.fillRect(x, y, 2, 2);
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000011';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawBackground();
        this.drawParticles();
        this.drawEnemies();
        this.drawBullets();
        this.drawPlayer();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    gameLoop(currentTime = 0) {
        const deltaTime = Math.min((currentTime - this.lastTime) / 16.67, 2.5); // Cap delta time
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new VoidBreacher();
});

// Prevent context menu on right-click
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});