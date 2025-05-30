// Using global THREE object loaded from CDN
// No need for imports since we're using CDN version

// Helper function to create a basic scene
function createScene(containerId) {
    const container = document.getElementById(containerId);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    
    // Set red background for debugging
    scene.background = new THREE.Color(0xff0000);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    return { scene, camera, renderer, controls };
}

// BMW 3D Model
function createBMWScene() {
    const { scene, camera, renderer, controls } = createScene('bmw-3d');
    
    // Create a simple car model (cuboid with rounded corners)
    const geometry = new THREE.BoxGeometry(2, 0.5, 1);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x000000,
        shininess: 100,
        specular: 0x111111
    });
    const car = new THREE.Mesh(geometry, material);
    scene.add(car);
    
    // Position camera
    camera.position.z = 5;
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        car.rotation.y += 0.005;
        controls.update();
        renderer.render(scene, camera);
    }
    
    animate();
}

// SimRacing Rig 3D Model
function createSimRacingScene() {
    const { scene, camera, renderer, controls } = createScene('simracing-3d');
    
    // Create a simple sim rig model (monitor and steering wheel)
    // Monitor
    const monitorGeometry = new THREE.BoxGeometry(2, 1.5, 0.1);
    const monitorMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
    monitor.position.z = 0.5;
    scene.add(monitor);
    
    // Steering wheel
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.z = -0.5;
    scene.add(wheel);
    
    // Position camera
    camera.position.z = 5;
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        wheel.rotation.y += 0.01;
        controls.update();
        renderer.render(scene, camera);
    }
    
    animate();
}

// Aquarium 3D Model
function createAquariumScene() {
    const { scene, camera, renderer, controls } = createScene('aquarium-3d');
    
    // Create aquarium glass
    const glassGeometry = new THREE.BoxGeometry(3, 2, 2);
    const glassMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x000000,
        transparent: true,
        opacity: 0.3
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    scene.add(glass);
    
    // Add some fish
    const fishGeometry = new THREE.TorusKnotGeometry(0.2, 0.05, 64, 8);
    const fishMaterial = new THREE.MeshPhongMaterial({ color: 0x0066ff });
    
    for (let i = 0; i < 5; i++) {
        const fish = new THREE.Mesh(fishGeometry, fishMaterial);
        fish.position.set(
            Math.random() * 2 - 1,
            Math.random() * 1.5 - 0.75,
            Math.random() * 1.5 - 0.75
        );
        scene.add(fish);
    }
    
    // Position camera
    camera.position.z = 5;
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Animate fish
        scene.children.forEach(child => {
            if (child.geometry instanceof THREE.TorusKnotGeometry) {
                child.rotation.y += 0.01;
                child.rotation.z += 0.01;
            }
        });
        
        controls.update();
        renderer.render(scene, camera);
    }
    
    animate();
}

// Crypto 3D Model
function createCryptoScene() {
    const { scene, camera, renderer, controls } = createScene('crypto-3d');
    
    // Create a simple cube with gold material
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xFFD700,  // Gold color
        shininess: 100,
        specular: 0x888888
    });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    // Position camera
    camera.position.z = 5;
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotate cube
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        
        controls.update();
        renderer.render(scene, camera);
    }
    
    animate();
}

// Initialize all scenes when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    createBMWScene();
    createSimRacingScene();
    createAquariumScene();
    createCryptoScene();
});
