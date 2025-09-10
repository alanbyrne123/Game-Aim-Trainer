// Aim Trainer Game with Mouse Pull Mechanics
class AimTrainer {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.timeLeft = 60;
        this.streak = 0;
        this.bestStreak = 0;
        
        // Game settings
        this.difficulty = 'medium';
        this.shakeIntensity = 50;
        this.targetSize = 40;
        this.targetSpeed = 2;
        this.spawnRate = 2000; // milliseconds
        
        // Mouse shake mechanics
        this.mouseShakeActive = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.shakeOffset = { x: 0, y: 0 };
        this.shakeTime = 0;
        
        // Targets
        this.targets = [];
        this.lastSpawnTime = 0;
        
        // Game loop
        this.gameLoop = null;
        this.timer = null;
        
        // Canvas dimensions
        this.canvasWidth = this.canvas.width;
        this.canvasHeight = this.canvas.height;
        
        this.initializeEventListeners();
        this.updateUI();
    }
    
    initializeEventListeners() {
        // Game control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.startGame());
        document.getElementById('mainMenuBtn').addEventListener('click', () => this.showMainMenu());
        
        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.difficulty = e.target.dataset.difficulty;
                this.updateDifficultySettings();
            });
        });
        
        // Mouse shake intensity slider
        const shakeSlider = document.getElementById('shakeIntensity');
        const shakeValue = document.getElementById('shakeValue');
        shakeSlider.addEventListener('input', (e) => {
            this.shakeIntensity = parseInt(e.target.value);
            shakeValue.textContent = this.shakeIntensity + '%';
        });
        
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.togglePause();
                } else if (this.gameState === 'menu') {
                    this.startGame();
                }
            } else if (e.code === 'Escape') {
                if (this.gameState === 'playing') {
                    this.togglePause();
                }
            }
        });
    }
    
    updateDifficultySettings() {
        switch (this.difficulty) {
            case 'easy':
                this.targetSize = 50;
                this.targetSpeed = 1;
                this.spawnRate = 2500;
                break;
            case 'medium':
                this.targetSize = 40;
                this.targetSpeed = 2;
                this.spawnRate = 2000;
                break;
            case 'hard':
                this.targetSize = 30;
                this.targetSpeed = 3;
                this.spawnRate = 1500;
                break;
        }
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.timeLeft = 60;
        this.streak = 0;
        this.bestStreak = 0;
        this.targets = [];
        this.mouseShakeActive = true;
        
        this.updateUI();
        this.hideGameOverScreen();
        
        // Start game loop
        this.gameLoop = setInterval(() => this.update(), 16); // ~60 FPS
        
        // Start timer
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateUI();
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
        
        // Start mouse shake effect
        this.startMouseShake();
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            clearInterval(this.gameLoop);
            clearInterval(this.timer);
            this.stopMouseShake();
            document.body.classList.add('game-paused');
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.gameLoop = setInterval(() => this.update(), 16);
            this.timer = setInterval(() => {
                this.timeLeft--;
                this.updateUI();
                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            }, 1000);
            this.startMouseShake();
            document.body.classList.remove('game-paused');
        }
        this.updateUI();
    }
    
    resetGame() {
        this.gameState = 'menu';
        this.score = 0;
        this.hits = 0;
        this.misses = 0;
        this.timeLeft = 60;
        this.streak = 0;
        this.bestStreak = 0;
        this.targets = [];
        
        clearInterval(this.gameLoop);
        clearInterval(this.timer);
        this.stopMouseShake();
        document.body.classList.remove('game-paused');
        
        this.updateUI();
        this.hideGameOverScreen();
        this.render();
    }
    
    endGame() {
        this.gameState = 'gameOver';
        clearInterval(this.gameLoop);
        clearInterval(this.timer);
        this.stopMouseShake();
        document.body.classList.remove('game-paused');
        
        this.showGameOverScreen();
        this.updateUI();
    }
    
    showMainMenu() {
        this.resetGame();
    }
    
    startMouseShake() {
        this.mouseShakeActive = true;
        this.shakeOffset = { x: 0, y: 0 };
        this.shakeTime = 0;
    }
    
    stopMouseShake() {
        this.mouseShakeActive = false;
        this.shakeOffset = { x: 0, y: 0 };
    }
    
    updateMouseShake() {
        if (!this.mouseShakeActive || this.shakeIntensity === 0) return;
        
        this.shakeTime += 0.1;
        
        // Create shake effect using sine waves with different frequencies
        const shakeAmount = this.shakeIntensity / 10; // Scale down the intensity
        const shakeX = Math.sin(this.shakeTime * 15) * shakeAmount + 
                      Math.sin(this.shakeTime * 23) * shakeAmount * 0.5;
        const shakeY = Math.cos(this.shakeTime * 17) * shakeAmount + 
                      Math.cos(this.shakeTime * 19) * shakeAmount * 0.5;
        
        this.shakeOffset = { x: shakeX, y: shakeY };
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.lastMousePos = {
            x: e.clientX,
            y: e.clientY
        };
    }
    
    handleCanvasClick(e) {
        if (this.gameState !== 'playing') return;
        
        const rect = this.canvas.getBoundingClientRect();
        let clickX = e.clientX - rect.left;
        let clickY = e.clientY - rect.top;
        
        // Apply mouse shake offset to click position
        if (this.mouseShakeActive) {
            clickX += this.shakeOffset.x;
            clickY += this.shakeOffset.y;
        }
        
        // Check if click hit any target
        let hit = false;
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            const distance = Math.sqrt(
                Math.pow(clickX - target.x, 2) + Math.pow(clickY - target.y, 2)
            );
            
            if (distance <= target.size / 2) {
                // Hit!
                this.hitTarget(i);
                hit = true;
                break;
            }
        }
        
        if (!hit) {
            this.misses++;
            this.streak = 0;
        }
        
        this.updateUI();
    }
    
    hitTarget(index) {
        const target = this.targets[index];
        
        // Calculate score based on target size and streak
        const baseScore = Math.max(10, 50 - target.size);
        const streakBonus = this.streak * 5;
        const score = baseScore + streakBonus;
        
        this.score += score;
        this.hits++;
        this.streak++;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
        
        // Remove target
        this.targets.splice(index, 1);
        
        // Create hit effect
        this.createHitEffect(target.x, target.y);
    }
    
    createHitEffect(x, y) {
        // Create visual hit effect on canvas instead of DOM
        this.ctx.save();
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = 'radial-gradient(circle, #ffff00 0%, #ff8800 100%)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // Fade out effect
        let alpha = 1;
        const fadeOut = () => {
            alpha -= 0.05;
            if (alpha > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = '#ffff00';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 20 * (1 - alpha), 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
                requestAnimationFrame(fadeOut);
            }
        };
        requestAnimationFrame(fadeOut);
    }
    
    spawnTarget() {
        const now = Date.now();
        if (now - this.lastSpawnTime < this.spawnRate) return;
        
        const size = this.targetSize + (Math.random() - 0.5) * 10;
        const x = size + Math.random() * (this.canvasWidth - size * 2);
        const y = size + Math.random() * (this.canvasHeight - size * 2);
        
        const target = {
            x: x,
            y: y,
            size: size,
            vx: (Math.random() - 0.5) * this.targetSpeed * 2,
            vy: (Math.random() - 0.5) * this.targetSpeed * 2,
            life: 5000 + Math.random() * 3000, // 5-8 seconds
            maxLife: 5000 + Math.random() * 3000,
            created: now
        };
        
        this.targets.push(target);
        this.lastSpawnTime = now;
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update mouse shake
        this.updateMouseShake();
        
        // Spawn new targets
        this.spawnTarget();
        
        // Update existing targets
        const now = Date.now();
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            
            // Update position
            target.x += target.vx;
            target.y += target.vy;
            
            // Bounce off walls
            if (target.x <= target.size / 2 || target.x >= this.canvasWidth - target.size / 2) {
                target.vx = -target.vx;
            }
            if (target.y <= target.size / 2 || target.y >= this.canvasHeight - target.size / 2) {
                target.vy = -target.vy;
            }
            
            // Keep within bounds
            target.x = Math.max(target.size / 2, Math.min(this.canvasWidth - target.size / 2, target.x));
            target.y = Math.max(target.size / 2, Math.min(this.canvasHeight - target.size / 2, target.y));
            
            // Remove expired targets
            if (now - target.created > target.life) {
                this.targets.splice(i, 1);
                this.misses++;
                this.streak = 0;
            }
        }
        
        this.render();
    }
    
    render() {
        // Clear canvas completely
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw targets
        this.targets.forEach(target => {
            const now = Date.now();
            const age = now - target.created;
            const lifeRatio = age / target.maxLife;
            
            // Fade out as target ages
            const alpha = Math.max(0.3, 1 - lifeRatio * 0.7);
            
            // Draw target
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            // Outer ring
            this.ctx.beginPath();
            this.ctx.arc(target.x, target.y, target.size / 2, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fill();
            this.ctx.strokeStyle = '#cc0000';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // Inner circle
            this.ctx.beginPath();
            this.ctx.arc(target.x, target.y, target.size / 4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fill();
            
            this.ctx.restore();
        });
        
        // Draw crosshair only if mouse is over canvas
        if (this.lastMousePos.x && this.lastMousePos.y) {
            this.ctx.save();
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 2;
            this.ctx.shadowColor = '#00ff00';
            this.ctx.shadowBlur = 10;
            
            const crosshairSize = 15;
            const rect = this.canvas.getBoundingClientRect();
            let centerX = this.lastMousePos.x - rect.left;
            let centerY = this.lastMousePos.y - rect.top;
            
            // Apply mouse shake offset to crosshair position
            if (this.mouseShakeActive) {
                centerX += this.shakeOffset.x;
                centerY += this.shakeOffset.y;
            }
            
            // Only draw if mouse is within canvas bounds
            if (centerX >= 0 && centerX <= this.canvasWidth && centerY >= 0 && centerY <= this.canvasHeight) {
                // Vertical line
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY - crosshairSize);
                this.ctx.lineTo(centerX, centerY + crosshairSize);
                this.ctx.stroke();
                
                // Horizontal line
                this.ctx.beginPath();
                this.ctx.moveTo(centerX - crosshairSize, centerY);
                this.ctx.lineTo(centerX + crosshairSize, centerY);
                this.ctx.stroke();
                
                // Draw shake indicator
                if (this.mouseShakeActive && this.shakeIntensity > 0) {
                    this.ctx.save();
                    this.ctx.strokeStyle = '#ff6b6b';
                    this.ctx.lineWidth = 1;
                    this.ctx.setLineDash([3, 3]);
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.lastMousePos.x - rect.left, this.lastMousePos.y - rect.top);
                    this.ctx.lineTo(centerX, centerY);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
            
            this.ctx.restore();
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('hits').textContent = this.hits;
        document.getElementById('time').textContent = this.timeLeft;
        
        const accuracy = this.hits + this.misses > 0 ? 
            Math.round((this.hits / (this.hits + this.misses)) * 100) : 0;
        document.getElementById('accuracy').textContent = accuracy + '%';
        
        // Update button states
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.gameState === 'menu') {
            startBtn.textContent = 'START GAME';
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        } else if (this.gameState === 'playing') {
            startBtn.disabled = true;
            pauseBtn.textContent = 'PAUSE';
            pauseBtn.disabled = false;
        } else if (this.gameState === 'paused') {
            startBtn.disabled = true;
            pauseBtn.textContent = 'RESUME';
            pauseBtn.disabled = false;
        }
    }
    
    showGameOverScreen() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHits').textContent = this.hits;
        document.getElementById('finalStreak').textContent = this.bestStreak;
        
        const accuracy = this.hits + this.misses > 0 ? 
            Math.round((this.hits / (this.hits + this.misses)) * 100) : 0;
        document.getElementById('finalAccuracy').textContent = accuracy + '%';
        
        document.getElementById('gameOverScreen').classList.add('active');
    }
    
    hideGameOverScreen() {
        document.getElementById('gameOverScreen').classList.remove('active');
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AimTrainer();
});
