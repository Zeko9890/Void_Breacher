class ThreeBackground {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.particles = null;
        this.stars = null;
        
        this.init();
        this.animate();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.getElementById('threeBackground').appendChild(this.renderer.domElement);

        // Camera position
        this.camera.position.z = 50;

        // Create nebula particles
        this.createNebula();
        this.createStarfield();
        this.createGrid();

        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createNebula() {
        const particleCount = 5000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            // Spherical distribution
            const radius = Math.random() * 100 + 20;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);

            // Color based on position
            colors[i] = Math.random() * 0.3 + 0.1;     // R
            colors[i + 1] = Math.random() * 0.5 + 0.3; // G
            colors[i + 2] = Math.random() * 0.8 + 0.2; // B
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createStarfield() {
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 2000;
            positions[i + 1] = (Math.random() - 0.5) * 2000;
            positions[i + 2] = (Math.random() - 0.5) * 1000;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            size: 1.5,
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });

        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    }

    createGrid() {
        const gridSize = 100;
        const gridDivisions = 20;
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x00ff00, 0x008800);
        gridHelper.position.y = -20;
        this.scene.add(gridHelper);

        // Add some rotating geometric objects
        const geometry = new THREE.IcosahedronGeometry(10, 0);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            wireframe: true,
            transparent: true,
            opacity: 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(30, 10, -50);
        this.scene.add(mesh);
        this.mesh = mesh;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate particles
        if (this.particles) {
            this.particles.rotation.x += 0.0005;
            this.particles.rotation.y += 0.001;
        }

        // Rotate mesh
        if (this.mesh) {
            this.mesh.rotation.x += 0.01;
            this.mesh.rotation.y += 0.005;
        }

        // Pulse effect
        const time = Date.now() * 0.001;
        if (this.particles) {
            this.particles.material.opacity = 0.4 + Math.sin(time) * 0.2;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

class VoidBreacher {
    constructor() {
        this.threeBg = new ThreeBackground();
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu';
        
        this.resizeCanvas();
        this.setupEventListeners();
        this.resetGame();
        this.lastTime = 0;
        this.startTime = 0;
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
        document.getElementById('retryButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.startGame());
        document.getElementById('menuButton').addEventListener('click', () => this.showMenu());
        document.getElementById('resumeButton').addEventListener('click', () => this.resumeGame());
        document.getElementById('quitButton').addEventListener('click', () => this.showMenu());
        document.getElementById('pauseButton').addEventListener('click', () => this.pauseGame());
        document.getElementById('fullscreenButton').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('controlsButton').addEventListener('click', () => this.showControls());
        document.getElementById('backButton').addEventListener('click',