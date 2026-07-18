import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#game');
const intro = $('#intro');
const completePanel = $('#complete');
const enterButton = $('#enter');
const restartButton = $('#restart');
const interaction = $('#interaction');
const reticle = $('.reticle');
const heldReadout = $('#held-readout');
const scaleReadout = $('#scale');
const objectiveNode = $('#objective');
const toastNode = $('#toast');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;
renderer.shadowMap.autoUpdate = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b0f);
scene.fog = new THREE.FogExp2(0x0c1418, 0.022);

const camera = new THREE.PerspectiveCamera(70, 1, 0.08, 120);
camera.rotation.order = 'YXZ';
scene.add(camera);

const hemi = new THREE.HemisphereLight(0xb9d7df, 0x101216, 0.75);
scene.add(hemi);
scene.add(new THREE.AmbientLight(0x4d6875, 0.38));
const keyLight = new THREE.DirectionalLight(0xffe3b2, 3.1);
keyLight.position.set(-8, 15, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = keyLight.shadow.camera.bottom = -24;
keyLight.shadow.camera.right = keyLight.shadow.camera.top = 24;
keyLight.shadow.bias = -0.00035;
keyLight.shadow.normalBias = 0.025;
scene.add(keyLight);
const coolRim = new THREE.DirectionalLight(0x66c7ff, 1.35);
coolRim.position.set(9, 7, -18);
scene.add(coolRim);

const materials = {
  concrete: new THREE.MeshStandardMaterial({ color: 0x747a75, roughness: 0.92, metalness: 0.04 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x202628, roughness: 0.7, metalness: 0.25 }),
  black: new THREE.MeshStandardMaterial({ color: 0x090c0d, roughness: 0.75 }),
  amber: new THREE.MeshStandardMaterial({ color: 0xffa812, emissive: 0xff8a00, emissiveIntensity: 1.4 }),
  amberDim: new THREE.MeshStandardMaterial({ color: 0x4e3917, emissive: 0x5a2c00, emissiveIntensity: 0.35 }),
  cube: new THREE.MeshStandardMaterial({ color: 0xd8dad3, roughness: 0.34, metalness: 0.18 }),
  white: new THREE.MeshStandardMaterial({ color: 0xe8ece7, roughness: 0.65 }),
  void: new THREE.MeshBasicMaterial({ color: 0x040607 }),
};

const colliders = [];
const interactables = [];
const room = new THREE.Group();
scene.add(room);

function box(name, size, position, material = materials.concrete, collision = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  room.add(mesh);
  if (collision) {
    mesh.updateMatrixWorld();
    colliders.push(mesh);
  }
  return mesh;
}

function strip(position, scale, material = materials.amberDim) {
  return box('guidance strip', scale, position, material, false);
}

// Chamber shell: a wide first room connected to a narrow exit.
box('floor', [24, 1, 38], [0, -0.5, -7]);
box('ceiling', [24, 1, 38], [0, 10.5, -7]);
box('left wall', [1, 11, 38], [-12.5, 5, -7]);
box('right wall', [1, 11, 38], [12.5, 5, -7]);
box('back wall', [24, 11, 1], [0, 5, 12.5]);
box('front wall left', [9, 11, 1], [-7.5, 5, -26.5]);
box('front wall right', [9, 11, 1], [7.5, 5, -26.5]);
box('exit floor', [6, 1, 13], [0, -0.5, -32.5]);
box('exit ceiling', [6, 1, 13], [0, 10.5, -32.5]);
box('exit wall left', [1, 11, 13], [-3.5, 5, -32.5]);
box('exit wall right', [1, 11, 13], [3.5, 5, -32.5]);
box('exit end', [6, 11, 1], [0, 5, -39]);

// Architectural ribs and visual guidance.
for (const z of [9, 1, -7, -15, -23]) {
  box('ceiling rib', [23, 0.28, 0.32], [0, 9.86, z], materials.dark, false);
  box('left rib', [0.28, 9, 0.32], [-11.86, 4.5, z], materials.dark, false);
  box('right rib', [0.28, 9, 0.32], [11.86, 4.5, z], materials.dark, false);
}
for (let z = 8; z > -24; z -= 2) strip([0, 0.04, z], [0.12, 0.03, 1.05]);
for (const x of [-8, 8]) {
  for (const z of [5, -7, -19]) {
    const lamp = new THREE.SpotLight(0xffb64d, 42, 18, Math.PI / 4.8, 0.58, 1.35);
    lamp.position.set(x, 9.2, z);
    lamp.target.position.set(x * 0.72, 0, z - 1.5);
    lamp.castShadow = z === -7;
    lamp.shadow.mapSize.set(512, 512);
    room.add(lamp, lamp.target);
    strip([x, 9.55, z], [1.5, 0.08, 0.08], materials.amber);
  }
}

// Observation window.
box('window recess', [7.8, 4.5, 0.24], [-7.9, 5.4, -25.92], materials.black, false);
const glass = new THREE.Mesh(
  new THREE.PlaneGeometry(7.2, 3.9),
  new THREE.MeshPhysicalMaterial({ color: 0x8ba5a3, transparent: true, opacity: 0.22, roughness: 0.12, transmission: 0.4 })
);
glass.position.set(-7.9, 5.4, -25.77);
room.add(glass);

// Perspective cube with an inset amber core.
const cube = new THREE.Group();
cube.name = 'calibration cube';
const cubeShell = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), materials.cube);
cubeShell.castShadow = cubeShell.receiveShadow = true;
cube.add(cubeShell);
const cubeCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.48), materials.amber);
cubeCore.castShadow = true;
cube.add(cubeCore);
for (const [x, y, z] of [[.81,.58,.58],[.81,.58,-.58],[.81,-.58,.58],[.81,-.58,-.58],[-.81,.58,.58],[-.81,.58,-.58],[-.81,-.58,.58],[-.81,-.58,-.58]]) {
  const cap = new THREE.Mesh(new THREE.BoxGeometry(.08, .26, .26), materials.dark);
  cap.position.set(x, y, z);
  cube.add(cap);
}
cube.position.set(-5.5, 0.85, 3);
cube.userData = { grabbable: true, baseSize: 1.6, scale: 1, velocityY: 0 };
scene.add(cube);
interactables.push(cubeShell);

// Receiver plate.
const plate = box('receiver', [4.6, 0.18, 4.6], [6.5, 0.1, -16], materials.amberDim, false);
const plateRing = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.75, 48), materials.amber);
plateRing.rotation.x = -Math.PI / 2;
plateRing.position.set(6.5, 0.205, -16);
room.add(plateRing);

// Exit door.
const door = box('exit door', [5.7, 9, 0.52], [0, 4.5, -26.18], materials.dark, true);
const doorLine = box('door line', [0.08, 7.2, 0.56], [0, 4.5, -25.88], materials.amberDim, false);
let doorOpen = false;

// Fold gate: crossing the frame hops the player across the chamber.
const gate = new THREE.Group();
gate.position.set(-8.2, 0, -11);
room.add(gate);
const gateSurface = new THREE.Mesh(
  new THREE.PlaneGeometry(4.3, 6.2),
  new THREE.MeshBasicMaterial({ color: 0x0b1518, transparent: true, opacity: 0.77, side: THREE.DoubleSide })
);
gateSurface.position.y = 3.1;
gate.add(gateSurface);
for (const spec of [
  [[.22, 6.6, .3], [-2.25, 3.1, 0]],
  [[.22, 6.6, .3], [2.25, 3.1, 0]],
  [[4.72, .22, .3], [0, 6.3, 0]],
]) {
  const piece = new THREE.Mesh(new THREE.BoxGeometry(...spec[0]), materials.amber);
  piece.position.set(...spec[1]);
  gate.add(piece);
}
const gateLight = new THREE.PointLight(0x35d6d0, 4, 7);
gateLight.position.set(0, 3, 1);
gate.add(gateLight);

// Exit marker.
const exitOrb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), materials.amber);
exitOrb.position.set(0, 3.2, -36);
exitOrb.castShadow = true;
scene.add(exitOrb);

// A visible player rig anchors the third-person camera and casts a readable silhouette.
const player = new THREE.Group();
const suit = new THREE.MeshStandardMaterial({ color: 0x26343b, roughness: 0.5, metalness: 0.35 });
const visor = new THREE.MeshStandardMaterial({ color: 0x7ee7ff, emissive: 0x1588aa, emissiveIntensity: 2.6, roughness: 0.18 });
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.72, 5, 10), suit);
torso.position.y = 1.05;
const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 14), suit);
head.position.y = 1.82;
const face = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.08), visor);
face.position.set(0, 1.85, -0.29);
for (const part of [torso, head, face]) {
  part.castShadow = true;
  part.receiveShadow = true;
  player.add(part);
}
scene.add(player);

const state = {
  active: false,
  complete: false,
  yaw: 0,
  pitch: 0,
  position: new THREE.Vector3(0, 1.7, 8),
  held: null,
  holdDistance: 4.2,
  keys: new Set(),
  onPlate: false,
  foldCooldown: 0,
  throwCooldown: 0,
};

const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
const playerRadius = 0.42;
const cubeVelocity = new THREE.Vector3();
let focused = null;
let toastTimer;

function showToast(text) {
  toastNode.textContent = text;
  toastNode.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastNode.classList.remove('show'), 1700);
}

function worldBox(object, expansion = 0) {
  object.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(object).expandByScalar(expansion);
}

function blockedAt(position) {
  const feet = position.y - 1.7;
  const playerBox = new THREE.Box3(
    new THREE.Vector3(position.x - playerRadius, feet + 0.08, position.z - playerRadius),
    new THREE.Vector3(position.x + playerRadius, feet + 1.78, position.z + playerRadius)
  );
  return colliders.some((item) => {
    if (item === door && door.position.y > 9) return false;
    return playerBox.intersectsBox(worldBox(item));
  });
}

function setCamera() {
  player.position.set(state.position.x, 0, state.position.z);
  player.rotation.y = state.yaw;
  const target = state.position.clone().add(new THREE.Vector3(0, 0.15, 0));
  const orbitDistance = 5.8;
  const horizontal = Math.cos(state.pitch) * orbitDistance;
  camera.position.set(
    target.x + Math.sin(state.yaw) * horizontal,
    target.y + 2.05 + Math.sin(-state.pitch) * 3.6,
    target.z + Math.cos(state.yaw) * horizontal
  );
  camera.lookAt(target);
}

function attemptMove(delta) {
  const nextX = state.position.clone();
  nextX.x += delta.x;
  if (!blockedAt(nextX)) state.position.x = nextX.x;
  const nextZ = state.position.clone();
  nextZ.z += delta.z;
  if (!blockedAt(nextZ)) state.position.z = nextZ.z;
}

function updateMovement(dt) {
  const forwardInput = Number(state.keys.has('KeyW') || state.keys.has('ArrowUp')) - Number(state.keys.has('KeyS') || state.keys.has('ArrowDown'));
  const sideInput = Number(state.keys.has('KeyD') || state.keys.has('ArrowRight')) - Number(state.keys.has('KeyA') || state.keys.has('ArrowLeft'));
  const input = new THREE.Vector2(sideInput, forwardInput);
  if (input.lengthSq() > 0) input.normalize();

  const speed = (state.keys.has('ShiftLeft') || state.keys.has('ShiftRight')) ? 7.2 : 4.3;
  const forward = new THREE.Vector3(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
  const right = new THREE.Vector3(Math.cos(state.yaw), 0, -Math.sin(state.yaw));
  const delta = forward.multiplyScalar(input.y).add(right.multiplyScalar(input.x)).multiplyScalar(speed * dt);
  attemptMove(delta);
  if (input.lengthSq() > 0) {
    const targetFacing = Math.atan2(-delta.x, -delta.z);
    player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, targetFacing, 1 - Math.exp(-12 * dt));
  }
}

function updateFocus() {
  if (state.held || !state.active) {
    focused = null;
  } else {
    const interactionDirection = new THREE.Vector3(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
    raycaster.set(state.position, interactionDirection);
    const hits = raycaster.intersectObjects(interactables, false);
    focused = hits.length && hits[0].distance < 7 ? cube : null;
  }
  reticle.classList.toggle('active', Boolean(focused || state.held));
  interaction.textContent = state.held ? '[ E ] RELEASE OBJECT' : focused ? '[ E ] GRAB OBJECT' : '';
}

function grabOrDrop() {
  if (!state.active) return;
  if (state.held) {
    state.held = null;
    cubeVelocity.set(0, 0, 0);
    heldReadout.classList.remove('visible');
    showToast('OBJECT RELEASED');
    return;
  }
  if (focused) {
    state.held = focused;
    cubeVelocity.set(0, 0, 0);
    const forward = new THREE.Vector3(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
    state.holdDistance = THREE.MathUtils.clamp(focused.position.clone().sub(state.position).dot(forward), 2.2, 8);
    heldReadout.classList.add('visible');
    showToast('PERSPECTIVE LOCK ACQUIRED');
  }
}

function updateHeld(dt) {
  if (!state.held) return;
  const direction = new THREE.Vector3(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
  const target = state.position.clone().add(direction.multiplyScalar(state.holdDistance));
  target.y = Math.max(1.25, 0.8 * cube.userData.scale);

  // Apparent-size conservation: distance from the player becomes physical scale.
  const desiredScale = THREE.MathUtils.clamp(state.holdDistance / 4.2, 0.42, 3.25);
  cube.userData.scale = THREE.MathUtils.damp(cube.userData.scale, desiredScale, 10, dt);
  cube.scale.setScalar(cube.userData.scale);
  cube.position.lerp(target, 1 - Math.exp(-14 * dt));
  cube.rotation.y += dt * 0.55;
  cube.rotation.x += dt * 0.18;
  scaleReadout.textContent = cube.userData.scale.toFixed(2);
}

function settleCube(dt) {
  if (state.held) return;
  const half = 0.8 * cube.userData.scale;
  cubeVelocity.y -= 18 * dt;
  cube.position.addScaledVector(cubeVelocity, dt);
  cubeVelocity.multiplyScalar(Math.exp(-1.7 * dt));

  if (cube.position.y <= half) {
    cube.position.y = half;
    if (cubeVelocity.y < -2) cubeVelocity.y *= -0.24;
    else cubeVelocity.y = 0;
    cubeVelocity.x *= 0.82;
    cubeVelocity.z *= 0.82;
  }
  const xLimit = 11.1 - half;
  const minZ = -38 + half;
  const maxZ = 11.8 - half;
  if (Math.abs(cube.position.x) > xLimit) {
    cube.position.x = THREE.MathUtils.clamp(cube.position.x, -xLimit, xLimit);
    cubeVelocity.x *= -0.35;
  }
  if (cube.position.z < minZ || cube.position.z > maxZ) {
    cube.position.z = THREE.MathUtils.clamp(cube.position.z, minZ, maxZ);
    cubeVelocity.z *= -0.35;
  }
  cube.rotation.x += cubeVelocity.z * dt * 0.35;
  cube.rotation.z -= cubeVelocity.x * dt * 0.35;
}

function throwCube() {
  if (!state.held || !state.active || state.throwCooldown > 0) return;
  const direction = new THREE.Vector3(-Math.sin(state.yaw), 0.08, -Math.cos(state.yaw)).normalize();
  state.held = null;
  state.throwCooldown = 0.45;
  cubeVelocity.copy(direction).multiplyScalar(10.5 / Math.sqrt(cube.userData.scale));
  heldReadout.classList.remove('visible');
  showToast('KINETIC RELEASE');
}

function updatePuzzle(dt) {
  const distanceToPlate = Math.hypot(cube.position.x - plate.position.x, cube.position.z - plate.position.z);
  const nearPlate = !state.held && distanceToPlate < 2.05 && cube.position.y < 3.2;
  const nowOnPlate = nearPlate && cube.userData.scale >= 1.35;
  if (nearPlate && !nowOnPlate && !state.onPlate) objectiveNode.textContent = 'Enlarge the cube to power the receiver';
  if (!nearPlate && !doorOpen) objectiveNode.textContent = 'Place an enlarged cube on the receiver';
  if (nowOnPlate !== state.onPlate) {
    state.onPlate = nowOnPlate;
    if (nowOnPlate) {
      doorOpen = true;
      objectiveNode.textContent = 'Proceed through the open exit';
      showToast('RECEIVER STABLE // EXIT UNLOCKED');
    }
  }
  plateRing.material = state.onPlate ? materials.amber : materials.amberDim;
  const targetDoorY = doorOpen ? 14 : 4.5;
  door.position.y = THREE.MathUtils.damp(door.position.y, targetDoorY, 3.2, dt);
  doorLine.position.y = door.position.y;

  state.foldCooldown = Math.max(0, state.foldCooldown - dt);
  state.throwCooldown = Math.max(0, state.throwCooldown - dt);
  if (state.foldCooldown === 0 && Math.abs(state.position.x + 8.2) < 1.9 && Math.abs(state.position.z + 11) < 0.65) {
    state.position.set(8.2, 1.7, -7);
    state.yaw += Math.PI;
    state.foldCooldown = 1;
    showToast('SPATIAL FOLD TRAVERSED');
  }

  if (doorOpen && state.position.z < -35 && !state.complete) finish();
  exitOrb.rotation.y += dt;
  exitOrb.rotation.x += dt * 0.45;
  exitOrb.position.y = 3.2 + Math.sin(performance.now() * 0.002) * 0.18;
}

function finish() {
  state.complete = true;
  state.active = false;
  document.exitPointerLock?.();
  completePanel.classList.remove('hidden');
}

function start() {
  intro.classList.add('hidden');
  completePanel.classList.add('hidden');
  state.active = true;
  canvas.requestPointerLock?.();
}

function reset() {
  state.position.set(0, 1.7, 8);
  state.yaw = 0;
  state.pitch = 0;
  state.held = null;
  state.complete = false;
  state.onPlate = false;
  state.foldCooldown = 0;
  state.throwCooldown = 0;
  state.keys.clear();
  cube.position.set(-5.5, 0.85, 3);
  cube.rotation.set(0, 0, 0);
  cube.scale.setScalar(1);
  cube.userData.scale = 1;
  cube.userData.velocityY = 0;
  cubeVelocity.set(0, 0, 0);
  doorOpen = false;
  door.position.y = 4.5;
  doorLine.position.y = 4.5;
  objectiveNode.textContent = 'Place an enlarged cube on the receiver';
  heldReadout.classList.remove('visible');
  start();
}

enterButton.addEventListener('click', start);
restartButton.addEventListener('click', reset);
canvas.addEventListener('click', () => {
  if (state.active && document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
});
document.addEventListener('pointerlockchange', () => {
  if (!state.complete) state.active = document.pointerLockElement === canvas;
});
document.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement !== canvas || !state.active) return;
  state.yaw -= event.movementX * 0.0021;
  state.pitch = THREE.MathUtils.clamp(state.pitch - event.movementY * 0.0021, -1.35, 1.35);
});
document.addEventListener('keydown', (event) => {
  state.keys.add(event.code);
  if (event.code === 'KeyE' && !event.repeat) grabOrDrop();
});
document.addEventListener('keyup', (event) => state.keys.delete(event.code));
canvas.addEventListener('mousedown', (event) => {
  if (event.button === 0 && state.held) throwCube();
});
canvas.addEventListener('wheel', (event) => {
  if (!state.held || !state.active) return;
  event.preventDefault();
  state.holdDistance = THREE.MathUtils.clamp(state.holdDistance + Math.sign(event.deltaY) * 0.55, 1.8, 13.5);
}, { passive: false });
addEventListener('blur', () => state.keys.clear());

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
setCamera();

let previous = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - previous) / 1000, 0.05);
  previous = now;
  if (state.active) updateMovement(dt);
  setCamera();
  updateFocus();
  updateHeld(dt);
  settleCube(dt);
  updatePuzzle(dt);
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);
