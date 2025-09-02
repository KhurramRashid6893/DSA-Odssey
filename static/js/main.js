import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';

// Get references to our DOM elements
const loadingScreen = document.getElementById('loading-screen');
const infoBox = document.getElementById('info-box');

// 1. Scene, Camera, and Renderer Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 50, 100); // Start camera higher for a better top-down view
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg-canvas'),
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// 2. Lighting and Controls
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Group for interactive stars
const interactiveStarsGroup = new THREE.Group();
scene.add(interactiveStarsGroup);

// Function to create the Sun
function addSun() {
    const sunLight = new THREE.DirectionalLight(0xffffff, 2);
    sunLight.position.set(0, 0, 0); // Position sun at the galaxy's center
    scene.add(sunLight);

    const textureLoader = new THREE.TextureLoader();
    const textureFlare0 = textureLoader.load("https://unpkg.com/three@0.157.0/examples/textures/lensflare/lensflare0.png");
    const textureFlare3 = textureLoader.load("https://unpkg.com/three@0.157.0/examples/textures/lensflare/lensflare3.png");

    const lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(textureFlare0, 700, 0, sunLight.color));
    lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6));
    lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7));
    lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9));
    lensflare.addElement(new LensflareElement(textureFlare3, 70, 1));
    sunLight.add(lensflare);
}

// ## REWRITTEN ##: Function to create a SPIRAL GALAXY
function addGalaxy() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
    });

    const starVertices = [];
    const starColors = [];
    const starSizes = [];

    const baseColor = new THREE.Color("#FFFFFF");
    const accentColor = new THREE.Color("#ADD8E6");

    const galaxyParams = {
        count: 30000,
        radius: 150,
        branches: 4,
        spin: 1.5,
        randomness: 0.5,
        randomnessPower: 3,
    };

    for (let i = 0; i < galaxyParams.count; i++) {
        const radius = Math.random() * galaxyParams.radius;
        const spinAngle = radius * galaxyParams.spin;
        const branchAngle = (i % galaxyParams.branches) / galaxyParams.branches * Math.PI * 2;

        const randomX = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius;
        const randomY = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * 0.2;
        const randomZ = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius;

        const x = Math.cos(branchAngle + spinAngle) * radius + randomX;
        const y = randomY;
        const z = Math.sin(branchAngle + spinAngle) * radius + randomZ;
        
        starVertices.push(x, y, z);

        const color = baseColor.clone().lerp(accentColor, Math.random() * 0.2);
        starColors.push(color.r, color.g, color.b);
        starSizes.push(Math.random() * 1.5 + 0.5);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    starGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
    
    const galaxy = new THREE.Points(starGeometry, starMaterial);
    window.galaxy = galaxy; 
    scene.add(galaxy);
}

// 3. Raycaster for Click Detection (No changes needed here)
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let lastClickedStar = null;

function onPointerClick(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(interactiveStarsGroup.children);

    if (intersects.length > 0) {
        const clickedStar = intersects[0].object;
        if (lastClickedStar !== clickedStar) {
            const dayData = clickedStar.userData;
            infoBox.innerHTML = `
                <h3>Day ${dayData.day}</h3>
                <ul>
                    ${dayData.problems.map(p => `
                        <li>
                            <div class="problem-details">
                                <div class="planet-title">Planet Name:</div>
                                <a href="${p.link}" class="gfg-link" target="_blank">${p.name} ${p.emojis.join(' ')}</a>
                                <a href="${p.twitterPostLink}" class="twitter-link" target="_blank">View Post on 𝕏</a>
                            </div>
                            <span class="difficulty ${p.difficulty.toLowerCase()}">${p.difficulty}</span>
                        </li>
                    `).join('')}
                </ul>
            `;
            infoBox.classList.add('visible');
            lastClickedStar = clickedStar;
        }
    } else {
        infoBox.classList.remove('visible');
        lastClickedStar = null;
    }
}
window.addEventListener('click', onPointerClick);


// 4. Main Initialization Function
async function init() {
    const response = await fetch('/api/journey-data');
    const journeyData = await response.json();

    // ## REWRITTEN ##: Place achievement stars within the galaxy arms
    journeyData.forEach((day, i) => {
        const geometry = new THREE.SphereGeometry(1.5, 30, 30);
        const material = new THREE.MeshStandardMaterial({
            color: day.color,
            emissive: day.color,
            emissiveIntensity: 3,
        });
        const star = new THREE.Mesh(geometry, material);
        
        // Use similar logic to galaxy creation but with a smaller radius
        const radius = 20 + Math.random() * 100; // Place them in the main arms, not the core
        const spinAngle = radius * 0.5;
        const branchAngle = (i % 4) / 4 * Math.PI * 2; // Use 4 main branches

        const x = Math.cos(branchAngle + spinAngle) * radius;
        const y = (Math.random() - 0.5) * 5; // Allow them to be slightly above/below the plane
        const z = Math.sin(branchAngle + spinAngle) * radius;
        
        star.position.set(x, y, z);
        star.userData = day;
        star.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
        );
        interactiveStarsGroup.add(star);
    });
    
    loadingScreen.style.opacity = '0';
    loadingScreen.addEventListener('transitionend', () => loadingScreen.remove());

    addSun();
    addGalaxy();
}

// 5. Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const time = Date.now() * 0.0005; // Slow down time for a more majestic feel
    
    // ## UPDATED ##: Add slow camera rotation for a cinematic orbit
    camera.position.x = Math.sin(time * 0.1) * 100;
    camera.position.z = Math.cos(time * 0.1) * 100;
    camera.lookAt(scene.position); // Ensure camera always looks at the center

    interactiveStarsGroup.children.forEach(star => {
        const pulseTime = Date.now() * 0.001;
        const scale = 1 + Math.sin(pulseTime + star.position.x) * 0.1;
        star.scale.set(scale, scale, scale);
        star.position.add(star.userData.velocity);

        if (star.position.length() > 120) { // Increased boundary
           star.position.negate().multiplyScalar(0.9); // Gently bring it back
        }
    });

    if (window.galaxy) {
        window.galaxy.rotation.y += 0.0003;
    }

    renderer.render(scene, camera);
}

// 6. Handling Window Resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Kick everything off!
init();
animate();
