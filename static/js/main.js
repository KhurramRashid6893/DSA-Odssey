import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Get references to our DOM elements
const loadingScreen = document.getElementById('loading-screen');
const infoBox = document.getElementById('info-box');

// 1. Scene, Camera, and Renderer Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 30);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg-canvas'),
    antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// 2. Lighting and Controls
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1.5);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// ## NEW ##: Group for interactive stars
const interactiveStarsGroup = new THREE.Group();
scene.add(interactiveStarsGroup);

// ## NEW ##: Function to add the background starfield
function addStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        opacity: 0.5,
    });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = THREE.MathUtils.randFloatSpread(200);
        const y = THREE.MathUtils.randFloatSpread(200);
        const z = THREE.MathUtils.randFloatSpread(200);
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starfield = new THREE.Points(starGeometry, starMaterial);
    scene.add(starfield);
}

// 3. Raycaster for Click Detection
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let lastClickedStar = null;

function onPointerClick(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    // ## UPDATED ##: Now only checks for clicks on the interactive stars
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

        // ## UPDATED ##: Add star to the interactive group instead of the main scene
        interactiveStarsGroup.add(star);
    });
    
    loadingScreen.style.opacity = '0';
    loadingScreen.addEventListener('transitionend', () => loadingScreen.remove());

    // Call the function to add the background stars
    addStarfield();
}

// 5. Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
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