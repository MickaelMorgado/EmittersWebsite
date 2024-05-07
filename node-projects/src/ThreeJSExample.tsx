import * as THREE from 'three';

function ThreeJSExample() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    let renderer = document.querySelector('#threejs-canvas') as HTMLCanvasElement | null;
    if (!renderer) {
        renderer = document.createElement('canvas');
        renderer.id = 'threejs-canvas';
        document.body.appendChild(renderer);
    }

    const threeRenderer = new THREE.WebGLRenderer({ canvas: renderer });

    threeRenderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    function animate() {
        requestAnimationFrame(animate);

        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;

        threeRenderer.render(scene, camera);
    }

    animate();

    return null;
}

export default ThreeJSExample;
