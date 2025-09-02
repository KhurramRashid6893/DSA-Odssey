import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';

// Get references to our DOM elements
const loadingScreen = document.getElementById('loading-screen');
const infoBox = document.getElementById('info-box');

// 1. Scene, Camera, and Renderer Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 40);
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

// Function to create the Sun with lens flare
function addSun() {
    const sunLight = new THREE.DirectionalLight(0xffffff, 2);
    sunLight.position.set(50, 20, -50);
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

// ## UPDATED ##: Function to add a more natural, varied galaxy
function addGalaxy() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true, // Use per-vertex colors
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true, // Distant points are smaller
    });

    const starVertices = [];
    const starColors = [];
    const starSizes = [];

    const baseColor = new THREE.Color("#FFFFFF");
    const accentColor = new THREE.Color("#ADD8E6"); // Light blue

    for (let i = 0; i < 20000; i++) {
        const distance = Math.random() * 200;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * distance;
        const y = THREE.MathUtils.randFloatSpread(8);
        const z = Math.sin(angle) * distance;
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

// 3. Raycaster for Click Detection
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

    journeyData.forEach((day, i) => {
        const geometry = new THREE.SphereGeometry(0.55, 30, 30);
        const material = new THREE.MeshStandardMaterial({
            color: day.color,
            emissive: day.color,
            emissiveIntensity: 3,
        });
        const star = new THREE.Mesh(geometry, material);
        
        const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(100));
        star.position.set(x, y, z);
        star.userData = day;
        
        // ## NEW ##: Assign a random velocity for drifting
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

    const time = Date.now() * 0.001;
    
    interactiveStarsGroup.children.forEach(star => {
        // Pulsing effect
        const scale = 1 + Math.sin(time + star.position.x) * 0.1;
        star.scale.set(scale, scale, scale);

        // ## NEW ##: Drifting motion
        star.position.add(star.userData.velocity);

        // Boundary check to keep stars from drifting away forever
        if (star.position.length() > 60) {
           star.position.negate(); // Invert position to bring it back
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
