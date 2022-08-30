import "./style.css";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let clock,
  mixer,
  actions,
  activeAction,
  previousAction,
  player,
  smoothness = 0.09,
  speed = 3;

const api = { state: "Walking" };

// Scene
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xe0e0e0, 20, 100);

clock = new THREE.Clock();

function fadeToAction(name, duration) {
  previousAction = activeAction;
  activeAction = actions[name];
  if (previousAction === activeAction) return;

  if (previousAction !== activeAction) {
    previousAction.fadeOut(duration);
  }

  activeAction
    .reset()
    .setEffectiveTimeScale(1)
    .setEffectiveWeight(1)
    .fadeIn(duration)
    .play();
}

function createGUI(model, animations) {
  const states = [
    "Idle",
    "Walking",
    "Running",
    "Dance",
    "Death",
    "Sitting",
    "Standing",
  ];
  const emotes = ["Jump", "Yes", "No", "Wave", "Punch", "ThumbsUp"];

  // gui = new GUI();

  mixer = new THREE.AnimationMixer(model);

  actions = {};

  for (let i = 0; i < animations.length; i++) {
    const clip = animations[i];
    const action = mixer.clipAction(clip);
    actions[clip.name] = action;

    if (emotes.indexOf(clip.name) >= 0 || states.indexOf(clip.name) >= 4) {
      action.clampWhenFinished = true;
      action.loop = THREE.LoopOnce;
    }
  }

  // states

  // const statesFolder = gui.addFolder("States");

  // const clipCtrl = statesFolder.add(api, "state").options(states);

  // clipCtrl.onChange(function () {
  //   fadeToAction(api.state, 0.5);
  // });

  // statesFolder.open();

  // emotes

  // const emoteFolder = gui.addFolder("Emotes");

  function createEmoteCallback(name) {
    api[name] = function () {
      fadeToAction(name, 0.2);

      mixer.addEventListener("finished", restoreState);
    };

    // emoteFolder.add(api, name);
  }

  function restoreState() {
    mixer.removeEventListener("finished", restoreState);

    fadeToAction(api.state, 0.2);
  }

  for (let i = 0; i < emotes.length; i++) {
    createEmoteCallback(emotes[i]);
  }

  activeAction = actions["Idle"];

  activeAction.play();
}

// Sizes
const sizes = {
  width: document.body.clientWidth,
  height: document.body.clientHeight,
};

// Foundation
// const grassTexture = new THREE.TextureLoader().load("grass.jpeg");
const normalTexture = new THREE.TextureLoader().load("normal.jpg");

const geometry = new THREE.BoxGeometry(150, 1, 150);
const material = new THREE.MeshStandardMaterial({
  color: 0x3131318a,
  normalMap: normalTexture,
  opacity: 0,
});
const mesh = new THREE.Mesh(geometry, material);

mesh.position.x = 0;
mesh.position.y = 0;
mesh.position.z = 0;

scene.add(mesh);

// Player
// const playerGeometry = new THREE.BoxGeometry(10, 10, 10);
// const playerMaterial = new THREE.MeshStandardMaterial({
//   color: 0xfff00f,
// })
// const playerMesh = new THREE.Mesh(
//   new THREE.BoxGeometry(10, 10, 10),
//   new THREE.MeshStandardMaterial({
//     color: 0xfff00f,
//   })
// );
// scene.add(playerMesh);

const loader = new GLTFLoader();
loader.load(
  "./RobotExpressive.glb",
  function (gltf) {
    player = gltf.scene;
    scene.add(player);

    createGUI(player, gltf.animations);
  },
  undefined,
  function (e) {
    console.error(e);
  }
);

function movePlayer(e) {
  switch (e.key) {
    case "w":
      const targetPositionW = player.position.clone();
      targetPositionW.z += speed;

      player.position.lerp(targetPositionW, smoothness);
      player.rotation.y = 0;

      fadeToAction("Walking", 0.2);

      break;
    case "s":
      const targetPositionS = player.position.clone();
      targetPositionS.z -= speed;

      player.position.lerp(targetPositionS, smoothness);

      player.rotation.y = 60;

      fadeToAction("Walking", 0.2);

      break;
    case "a":
      const targetPositionA = player.position.clone();
      targetPositionA.x -= speed;

      player.position.lerp(targetPositionA, smoothness);
      player.rotation.y = 30;

      fadeToAction("Walking", 0.2);

      break;
    case "d":
      const targetPositionD = player.position.clone();
      targetPositionD.x += speed;

      player.position.lerp(targetPositionD, smoothness);

      player.rotation.y = 20;

      fadeToAction("Walking", 0.2);

      break;
    default:
      fadeToAction("Idle", 0.2);

      break;
  }
}

document.onkeydown = movePlayer;
document.onkeyup = () => {
  // activeAction = actions["Idle"];

  fadeToAction("Idle");
};

// document.onkeypress =  (e) {
//   e = e || window.event;
//   // use e.keyCode
// };

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.y = 10;
camera.position.x = 10;

scene.add(camera);

// Renderer

const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas });

renderer.setPixelRatio(2);
renderer.setSize(sizes.width, sizes.height);
camera.position.setZ(30);

renderer.render(scene, camera);

// Config
const pointLight = new THREE.PointLight(0xffffff);
pointLight.position.set(5, 5, 5);
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);
const controls = new OrbitControls(camera, renderer.domElement);
const gridHelper = new THREE.GridHelper(150, 150);

scene.add(gridHelper);

function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  const [x, y, z] = Array(3)
    .fill()
    .map(() => THREE.MathUtils.randFloatSpread(100));

  star.position.set(x, y, z);
  scene.add(star);
}

Array(200).fill().forEach(addStar);

function animate() {
  const dt = clock.getDelta();

  if (mixer) mixer.update(dt);

  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  controls.update();
}

animate();
