import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const canvas = document.querySelector('#game');
const scoreNode = document.querySelector('#score');
const panel = document.querySelector('#panel');
const title = document.querySelector('#title');
const message = document.querySelector('#message');
const startButton = document.querySelector('#start');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#70c5df');
scene.fog = new THREE.Fog('#70c5df', 25, 90);
const camera = new THREE.PerspectiveCamera(52, 1, .1, 120);
camera.position.set(0, 3.5, 15);
camera.lookAt(0, 2, -14);

scene.add(new THREE.HemisphereLight('#d9fbff', '#294f52', 2.2));
const sun = new THREE.DirectionalLight('#fff2c0', 2.6);
sun.position.set(-12, 18, 12); sun.castShadow = true; scene.add(sun);

const bird = new THREE.Group();
const yellow = new THREE.MeshStandardMaterial({ color: '#ffd64f', roughness: .7 });
const orange = new THREE.MeshStandardMaterial({ color: '#f38b38', roughness: .7 });
const black = new THREE.MeshStandardMaterial({ color: '#182432' });
const body = new THREE.Mesh(new THREE.SphereGeometry(.54, 16, 12), yellow); body.scale.set(1.18, .82, .86); bird.add(body);
const wing = new THREE.Mesh(new THREE.SphereGeometry(.38, 12, 8), orange); wing.scale.set(1.35, .24, .8); wing.position.set(-.08, -.08, .48); bird.add(wing);
const beak = new THREE.Mesh(new THREE.ConeGeometry(.22, .52, 4), orange); beak.rotation.z = -Math.PI / 2; beak.position.set(.72, .03, 0); bird.add(beak);
for (const z of [-.26, .26]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), black); eye.position.set(.32, .22, z); bird.add(eye); }
bird.position.set(-2, 2.3, 0); bird.castShadow = true; scene.add(bird);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), new THREE.MeshStandardMaterial({ color: '#3f9e75', roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -5; ground.receiveShadow = true; scene.add(ground);

const cloudMaterial = new THREE.MeshStandardMaterial({ color: '#f2fdff', roughness: .9 });
for (let i = 0; i < 16; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(1 + Math.random(), 10, 8), cloudMaterial); c.scale.y = .45; c.position.set((Math.random() - .5) * 35, 4 + Math.random() * 12, -22 - Math.random() * 65); scene.add(c); }

const obstacles = [];
const rockMaterial = new THREE.MeshStandardMaterial({ color: '#416f70', roughness: 1, flatShading: true });
function addObstacle(z) {
  const group = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 2.2, 1, 7), rockMaterial);
    mesh.castShadow = mesh.receiveShadow = true; group.add(mesh);
  }
  setGap(group, -1 + Math.random() * 6);
  group.position.set((Math.random() - .5) * 2.2 + 1.5, 0, z); group.userData.passed = false; scene.add(group); obstacles.push(group);
}
function setGap(group, center) {
  const bottomHeight = center + 5.2, topHeight = 10 - center;
  const [bottom, top] = group.children;
  bottom.scale.y = bottomHeight; bottom.position.y = -5 + bottomHeight / 2;
  top.scale.y = topHeight; top.position.y = center + 5.2 + 4.2 + topHeight / 2;
  group.userData.gapCenter = center;
}
for (let i = 0; i < 5; i++) addObstacle(-14 - i * 13);

let started = false, gameOver = false, velocity = 0, score = 0, previous = performance.now();
function reset() {
  started = true; gameOver = false; velocity = 0; score = 0; scoreNode.textContent = score; bird.position.set(-2, 2.3, 0); bird.rotation.set(0, 0, 0);
  obstacles.forEach((o, i) => { o.position.z = -14 - i * 13; o.userData.passed = false; }); panel.classList.add('hidden');
}
function flap() { if (!started || gameOver) reset(); velocity = .125; }
function endGame() { gameOver = true; started = false; title.textContent = `Score: ${score}`; message.textContent = 'The canyon won this round. Tap Fly or press Space to take another run.'; startButton.textContent = 'Fly again'; panel.classList.remove('hidden'); }
function resize() { const { clientWidth:w, clientHeight:h } = canvas; renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); } });
canvas.addEventListener('pointerdown', flap); startButton.addEventListener('click', reset);

function loop(now) {
  requestAnimationFrame(loop); const dt = Math.min((now - previous) / 16.67, 2); previous = now;
  if (started) {
    velocity -= .008 * dt; bird.position.y += velocity * dt; bird.rotation.z = THREE.MathUtils.lerp(bird.rotation.z, velocity * 4.5, .1);
    wing.rotation.x = Math.sin(now * .025) * .55;
    for (const o of obstacles) {
      o.position.z += .19 * dt;
      if (o.position.z > 12) { const rear = Math.min(...obstacles.map(x => x.position.z)); o.position.z = rear - 13; setGap(o, -1 + Math.random() * 6); o.userData.passed = false; }
      const dz = Math.abs(o.position.z); const dx = Math.abs(o.position.x - bird.position.x);
      if (!o.userData.passed && o.position.z > .3) { o.userData.passed = true; score++; scoreNode.textContent = score; }
      if (dz < 1.1 && dx < 2 && Math.abs(bird.position.y - o.userData.gapCenter) > 2.15) endGame();
    }
    if (bird.position.y < -4.35 || bird.position.y > 9.3) endGame();
  } else if (!gameOver) { bird.position.y = 2.3 + Math.sin(now * .003) * .22; wing.rotation.x = Math.sin(now * .01) * .25; }
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);
