// Advanced Three.js Galaxy Sphere Particle System with Post-Processing
class GalaxyVisualizer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.particles = null;
        this.particleSystem = null;
        this.animationSpeed = 0.001;
        this.isAnimating = false;
        this.movementMultiplier = 1; // Default movement multiplier
        this.socket = null;

        this.init();
        this.createGalaxy();
        this.setupSocket();
        this.animate();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 0, 50);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Post-processing setup
        this.setupPostProcessing();

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0x4169E1, 1, 1000);
        pointLight.position.set(0, 0, 500);
        this.scene.add(pointLight);

        // Window resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    async setupPostProcessing() {
        console.log('Setting up post-processing effects...');
        try {
            // Import post-processing modules
            const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
            const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
            const { BloomPass } = await import('three/addons/postprocessing/BloomPass.js');
            const { FilmPass } = await import('three/addons/postprocessing/FilmPass.js');

            // Create composer
            this.composer = new EffectComposer(this.renderer);

            // Add render pass
            const renderPass = new RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);

            // Add bloom pass for glow effect
            const bloomPass = new BloomPass(1.0, 25, 5.0, 256);
            this.composer.addPass(bloomPass);

            // Add film pass for additional visual effects
            const filmPass = new FilmPass(0.35, 0.025, 648, false);
            this.composer.addPass(filmPass);

            console.log('Post-processing effects initialized');
        } catch (error) {
            console.error('Error setting up post-processing:', error);
            this.composer = null;
        }
    }



    createGalaxy() {
        const count = 3000;
        const spacing = 1;

        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });

        this.particleSystem = new THREE.InstancedMesh(geometry, material, count);

        const temp = new THREE.Object3D();

        for (let i = 0; i < count; i++) {
            // Spherical galaxy distribution
            const radius = Math.cbrt(Math.random()) * (30 * spacing);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            temp.position.set(x, y, z);
            temp.scale.setScalar(Math.random() * 0.15 + 0.1);
            temp.updateMatrix();

            this.particleSystem.setMatrixAt(i, temp.matrix);
        }

        this.particleSystem.instanceMatrix.needsUpdate = true;
        this.scene.add(this.particleSystem);
    }

    setupSocket() {
        this.socket = io();
        console.log('Socket.io initialized');

        this.socket.on('speech_start', () => {
            this.isAnimating = true;
            this.animationSpeed = 0.015;
            this.movementMultiplier = 2;
            this.particleSystem.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            this.updateStatus('Listening... 🔴');
        });

        this.socket.on('speech_end', () => {
            this.isAnimating = false;
            this.animationSpeed = 0.004;
            this.movementMultiplier = 0.3;
            this.particleSystem.material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
            this.updateStatus('Processing... 🔵');
        });

        this.socket.on('ai_response_start', () => {
            this.isAnimating = true;
            this.animationSpeed = 0.012;
            this.movementMultiplier = 30;
            this.particleSystem.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            this.updateStatus('Speaking... 🟢');
        });

        this.socket.on('ai_response_end', () => {
            this.isAnimating = false;
            this.animationSpeed = 0.001;
            this.movementMultiplier = 1;
            this.particleSystem.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            this.updateStatus('Ready 🎨');
        });
    }

    updateStatus(status) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        if (this.particleSystem) {
            // Individual particle movement
            const dummy = new THREE.Object3D();

            for (let i = 0; i < this.particleSystem.count; i++) {
                this.particleSystem.getMatrixAt(i, dummy.matrix);
                dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

                // Movement with multiplier
                const offsetX = Math.sin(time * 0.5 + i * 0.1) * 0.5 * 0.01 * this.movementMultiplier;
                const offsetY = Math.cos(time * 0.3 + i * 0.15) * 0.3 * 0.01 * this.movementMultiplier;
                const offsetZ = Math.sin(time * 0.7 + i * 0.05) * 0.4 * 0.01 * this.movementMultiplier;

                dummy.position.x += offsetX;
                dummy.position.y += offsetY;
                dummy.position.z += offsetZ;

                // Processing contraction effect
                if (this.movementMultiplier < 0.5) {
                    const distanceFromCenter = Math.sqrt(
                        dummy.position.x * dummy.position.x +
                        dummy.position.y * dummy.position.y +
                        dummy.position.z * dummy.position.z
                    );

                    if (distanceFromCenter > 5) {
                        const contractionFactor = 0.98;
                        dummy.position.x *= contractionFactor;
                        dummy.position.y *= contractionFactor;
                        dummy.position.z *= contractionFactor;
                    }
                }

                dummy.updateMatrix();
                this.particleSystem.setMatrixAt(i, dummy.matrix);
            }

            this.particleSystem.instanceMatrix.needsUpdate = true;

            if (this.isAnimating) {
                this.particleSystem.rotation.y += this.animationSpeed;
                this.particleSystem.rotation.x += this.animationSpeed * 0.3;

                const scale = 1 + Math.sin(time * 3) * 0.1;
                this.particleSystem.scale.setScalar(scale);
            } else {
                const breathingScale = 1 + Math.sin(time * 0.5) * 0.05;
                this.particleSystem.scale.setScalar(breathingScale);
            }

            // Camera orbiting
            this.camera.position.x = Math.cos(time * 0.1) * 15;
            this.camera.position.z = 50 + Math.sin(time * 0.1) * 10;
            this.camera.lookAt(0, 0, 0);
        }

        // Render with post-processing effects
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new GalaxyVisualizer();
});
