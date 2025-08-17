/**
 * Moving wireframe grid background using Three.js
 * Renders a rotating grid helper with slight blur.
 */
(function() {
  // Scene, camera, renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(0, 50, 100);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.top = '0';
  renderer.domElement.style.left = '0';
  renderer.domElement.style.zIndex = '-1';
  renderer.domElement.style.filter = 'blur(2px)';
  document.body.appendChild(renderer.domElement);

  // Grid helper
  const size = 1000;
  const divisions = 100;
  const grid = new THREE.GridHelper(size, divisions, 0x00ff00, 0x00ff00);
  grid.material.opacity = 0.15;
  grid.material.transparent = true;
  scene.add(grid);

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    grid.rotation.z += 0.0008; // slow rotation
    renderer.render(scene, camera);
  }
  animate();

  // Handle resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
