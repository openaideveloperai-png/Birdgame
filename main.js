import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const canvas = document.querySelector('#game');
const panel = document.querySelector('#panel');
const enter = document.querySelector('#start');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#050407');
scene.fog = new THREE.FogExp2('#050407', .045);
const camera = new THREE.PerspectiveCamera(60, 1, .1, 90);
const yaw = new THREE.Object3D(), pitch = new THREE.Object3D();
yaw.add(pitch); pitch.add(camera); scene.add(yaw);

scene.add(new THREE.HemisphereLight('#5a3c43', '#030304', .24));
const moon = new THREE.DirectionalLight('#7284aa', .42); moon.position.set(-14, 18, 6); moon.castShadow = true; scene.add(moon);

const plate = new THREE.Mesh(new THREE.BoxGeometry(42, .8, 42), new THREE.MeshStandardMaterial({ color: '#252326', roughness: .92 }));
plate.position.y = -.4; plate.receiveShadow = true; scene.add(plate);
const edge = new THREE.Mesh(new THREE.BoxGeometry(42.4, .2, 42.4), new THREE.MeshStandardMaterial({ color: '#371f25', emissive: '#26090d', emissiveIntensity: .65 }));
edge.position.y = .03; edge.receiveShadow = true; scene.add(edge);

const player = new THREE.Group();
const body = new THREE.Mesh(new THREE.CylinderGeometry(.52, .62, 3.2, 16), new THREE.MeshStandardMaterial({ color: '#d1c7b6', roughness: .75 }));
body.position.y = 1.6; body.castShadow = true; player.add(body);
const head = new THREE.Mesh(new THREE.CylinderGeometry(.58, .53, .65, 16), new THREE.MeshStandardMaterial({ color: '#8f7c70', roughness: 1 }));
head.position.y = 3.52; head.castShadow = true; player.add(head);
const eye = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 8), new THREE.MeshBasicMaterial({ color: '#9e2526' }));
eye.position.set(.48, 3.58, -.2); player.add(eye);
player.position.set(0, .02, 8); scene.add(player);

function addWall(x, z, width, depth) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width, 7, depth), new THREE.MeshStandardMaterial({ color: '#191719', roughness: 1 }));
  wall.position.set(x, 3.5, z); wall.castShadow = wall.receiveShadow = true; scene.add(wall);
}
addWall(0, -20, 42, .5); addWall(-20, 0, .5, 42); addWall(20, 0, .5, 42);
addWall(-7, -8, .6, 13); addWall(7, -3, .6, 10); addWall(0, 11, 12, .6);

const redLights = [];
function lamp(x, z) {
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.14, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff4b3a' })); bulb.position.set(x, 4.9, z); scene.add(bulb);
  const light = new THREE.PointLight('#e6322f', 18, 11, 2); light.position.copy(bulb.position); light.castShadow = true; scene.add(light); redLights.push(light);
}
lamp(-12, -11); lamp(12, -9); lamp(-12, 8); lamp(11, 10);
const exitLight = new THREE.PointLight('#d8e3bc', 8, 13, 2); exitLight.position.set(0, 5, -18.5); scene.add(exitLight);
const exitSign = new THREE.Mesh(new THREE.BoxGeometry(2.4, .55, .08), new THREE.MeshBasicMaterial({ color: '#c7e6a7' })); exitSign.position.copy(exitLight.position); exitSign.position.y += .25; scene.add(exitSign);

const keys = new Set(); let active = false, last = performance.now(), bob = 0;
addEventListener('keydown', e => keys.add(e.code)); addEventListener('keyup', e => keys.delete(e.code));
addEventListener('mousemove', e => { if (active && document.pointerLockElement === canvas) { yaw.rotation.y -= e.movementX * .0024; pitch.rotation.x = THREE.MathUtils.clamp(pitch.rotation.x - e.movementY * .002, -.6, .45); } });
enter.addEventListener('click', () => { active = true; panel.classList.add('hidden'); canvas.requestPointerLock(); });
canvas.addEventListener('click', () => { if (active) canvas.requestPointerLock(); });
function resize() { renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); camera.aspect = canvas.clientWidth / canvas.clientHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
function loop(now) {
  requestAnimationFrame(loop); const dt = Math.min((now - last) / 1000, .05); last = now;
  const flicker = .65 + Math.sin(now * .016) * .18 + Math.random() * .24;
  redLights.forEach((light, i) => light.intensity = (i === 1 && Math.sin(now * .004) > .7 ? .15 : 1) * 18 * flicker);
  if (active) {
    const forward = new THREE.Vector3(Math.sin(yaw.rotation.y), 0, Math.cos(yaw.rotation.y));
    const right = new THREE.Vector3(forward.z, 0, -forward.x); const movement = new THREE.Vector3();
    if (keys.has('KeyW') || keys.has('ArrowUp')) movement.add(forward.clone().negate());
    if (keys.has('KeyS') || keys.has('ArrowDown')) movement.add(forward);
    if (keys.has('KeyA') || keys.has('ArrowLeft')) movement.add(right.clone().negate());
    if (keys.has('KeyD') || keys.has('ArrowRight')) movement.add(right);
    if (movement.lengthSq()) { movement.normalize().multiplyScalar(5 * dt); player.position.add(movement); player.position.x = THREE.MathUtils.clamp(player.position.x, -18.7, 18.7); player.position.z = THREE.MathUtils.clamp(player.position.z, -18.7, 18.7); bob += dt * 9; }
    yaw.position.lerp(new THREE.Vector3(player.position.x, 2.2, player.position.z), .16); camera.position.y = .75 + Math.sin(bob) * .045;
    player.rotation.y = yaw.rotation.y;
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);
