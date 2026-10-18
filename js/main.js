// --- Global Variables ---
let scene, camera, renderer;
let imagesGroup;
let targetRotation = 0;
let currentRotation = 0;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

const radius = 32; // Much wider radius so it spreads across the screen
// Minimum number of photos as requested to match the spacious diagonal look
const numImages = 12;

const textureLoader = new THREE.TextureLoader();
// Using the provided image instead of the dog
const placeholderTexture = textureLoader.load('images/placeholder.jpg');

init();
animate();

function init() {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();

    // Fog removed so pictures in the back don't look transparent or lose their color
    // scene.fog = new THREE.FogExp2(0xf4ebd8, 0.02);

    // Telephoto lens effect: smaller FOV (20) and camera pushed far back (120)
    // This compresses depth, keeping pictures on the back side almost the same size as the front
    camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 120;
    camera.position.y = 0;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    imagesGroup = new THREE.Group();
    scene.add(imagesGroup);

    // Create 3D Text Title so it sits perfectly in the center of the 3D volume
    const titleMesh = createCenterTitle();
    scene.add(titleMesh);

    // Significantly increased image sizes
    const geometry = new THREE.PlaneGeometry(8, 10.6);
    const material = new THREE.MeshBasicMaterial({
        map: placeholderTexture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1
    });

    // The "Cylinder" is actually a spiral/helix to create that diagonal line
    const numWraps = 1;
    const spiralHeight = 50; // Tuned for the new telephoto zoom level

    for (let i = 0; i < numImages; i++) {
        const mesh = new THREE.Mesh(geometry, material);

        mesh.userData = {
            cylinderPos: new THREE.Vector3(),
            cylinderRot: new THREE.Euler(),
            spherePos: new THREE.Vector3(),
            sphereRot: new THREE.Euler()
        };

        // 1. --- Spiral/Diagonal Cylinder Math ---
        const cylAngle = (i / numImages) * Math.PI * 2 * numWraps;
        mesh.userData.cylinderPos.x = Math.sin(cylAngle) * radius;
        // Map Y to create the strong diagonal line from bottom to top
        mesh.userData.cylinderPos.y = ((i / numImages) - 0.5) * spiralHeight;
        mesh.userData.cylinderPos.z = Math.cos(cylAngle) * radius;
        // Face outward from the center
        mesh.userData.cylinderRot.y = cylAngle;

        // 2. --- Sphere Math ---
        const phi = Math.acos(-1 + (2 * i) / numImages);
        const theta = Math.sqrt(numImages * Math.PI) * phi;
        mesh.userData.spherePos.x = radius * Math.cos(theta) * Math.sin(phi);
        mesh.userData.spherePos.y = radius * Math.sin(theta) * Math.sin(phi);
        mesh.userData.spherePos.z = radius * Math.cos(phi);

        mesh.position.copy(mesh.userData.spherePos);
        // Look outward for sphere since we are outside it
        mesh.lookAt(mesh.userData.spherePos.clone().multiplyScalar(2));
        mesh.userData.sphereRot.copy(mesh.rotation);

        // Set Initial State to Cylinder (Spiral)
        mesh.position.copy(mesh.userData.cylinderPos);
        mesh.rotation.copy(mesh.userData.cylinderRot);

        imagesGroup.add(mesh);
    }

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('wheel', onMouseWheel);
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    // Layout Buttons
    document.getElementById('btn-cylinder').addEventListener('click', () => changeLayout('cylinder'));
    document.getElementById('btn-sphere').addEventListener('click', () => changeLayout('sphere'));
}

function createCenterTitle() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#3e3b34';
    // Lighter weight (300) for elegance
    ctx.font = 'normal 300 110px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FrameStory', 512, 230);

    ctx.fillStyle = '#7d776a';
    // Much smaller subtitle relative to the title for a minimal look
    ctx.font = 'normal 400 20px "Space Grotesk", sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('THE FLOATING GALLERY', 512, 305);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    
    // Scale it down significantly in the 3D space to make it look minimal
    const planeGeom = new THREE.PlaneGeometry(28, 14);
    const planeMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthWrite: false // crucial for transparent textures so they don't block things behind them
    });

    const mesh = new THREE.Mesh(planeGeom, planeMat);
    mesh.position.set(0, 0, 0);
    return mesh;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseWheel(event) {
    // Scroll left/right rotates the cylinder
    targetRotation += event.deltaY * 0.002;
}

function onPointerDown(event) {
    isDragging = true;
    let clientX = event.clientX || event.touches[0].clientX;
    previousMousePosition = { x: clientX };
}

function onPointerMove(event) {
    if (!isDragging) return;
    let clientX = event.clientX || event.touches[0].clientX;
    const deltaMove = clientX - previousMousePosition.x;
    targetRotation -= deltaMove * 0.005;
    previousMousePosition = { x: clientX };
}

function onPointerUp(event) {
    isDragging = false;
}

function animate() {
    requestAnimationFrame(animate);

    currentRotation += (targetRotation - currentRotation) * 0.05;
    imagesGroup.rotation.y = currentRotation;

    if (!isDragging && Math.abs(targetRotation - currentRotation) < 0.001) {
        targetRotation += 0.001;
    }

    renderer.render(scene, camera);
}

function changeLayout(type) {
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');

    const duration = 2.5;

    imagesGroup.children.forEach((mesh, i) => {
        const targetPos = type === 'cylinder' ? mesh.userData.cylinderPos : mesh.userData.spherePos;
        const targetRot = type === 'cylinder' ? mesh.userData.cylinderRot : mesh.userData.sphereRot;

        const delay = i * 0.05;

        gsap.to(mesh.position, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: duration,
            ease: "power3.inOut",
            delay: delay
        });

        gsap.to(mesh.rotation, {
            x: targetRot.x,
            y: targetRot.y,
            z: targetRot.z,
            duration: duration,
            ease: "power3.inOut",
            delay: delay
        });
    });
}
