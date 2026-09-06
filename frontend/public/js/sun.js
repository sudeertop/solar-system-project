import * as THREE from "three";

import {
    OrbitControls
} from "three/addons/controls/OrbitControls.js";

import {
    EffectComposer
} from "three/addons/postprocessing/EffectComposer.js";

import {
    RenderPass
} from "three/addons/postprocessing/RenderPass.js";

import {
    UnrealBloomPass
} from "three/addons/postprocessing/UnrealBloomPass.js";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";
import {
    initSunSpacecraft,
    updateSunSpacecraft
} from "./sun-spacecraft.js";


// ======================================================
// 1. HTML
// ======================================================

const container =
    document.getElementById(
        "sun-scene"
    );

const infoScroll =
    document.getElementById(
        "sun-info-scroll"
    );

const compareEarthButton =
    document.getElementById(
        "compare-earth-button"
    );

if (!container) {
    throw new Error("#sun-scene bulunamadı.");
}


// ======================================================
// 2. SABİTLER
// ======================================================

const SUN_AXIS_TILT_DEG        = 7.25;
const SUN_EQUATORIAL_ROTATION_DAYS = 25.38;


// ======================================================
// 3. SAHNE
// ======================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x02040a);


// ======================================================
// 4. KAMERA
// ======================================================

const camera = new THREE.PerspectiveCamera(

    45,

    Math.max(container.clientWidth, 1)
    /
    Math.max(container.clientHeight, 1),

    0.01,

    300

);

camera.position.set(0, 0.08, 4.35);


// ======================================================
// 5. RENDERER
// ======================================================

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
});

renderer.setSize(
    Math.max(container.clientWidth, 1),
    Math.max(container.clientHeight, 1)
);

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 0.88;

renderer.domElement.style.display = "block";

container.appendChild(renderer.domElement);


// ======================================================
// 6. BLOOM
// ======================================================

const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);

composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(

    new THREE.Vector2(
        Math.max(container.clientWidth, 1),
        Math.max(container.clientHeight, 1)
    ),

    0.35,   // strength
    0.22,   // radius
    0.95    // threshold

);

composer.addPass(bloomPass);


// ======================================================
// 7. ORBIT CONTROLS
// ======================================================

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping  = true;
controls.dampingFactor  = 0.06;
controls.enablePan      = false;
controls.rotateSpeed    = 0.55;
controls.zoomSpeed      = 0.80;
controls.minDistance    = 1.20;
controls.maxDistance    = 18;
controls.target.set(0, 0, 0);
controls.update();


// ======================================================
// 8. IŞIKLAR
// ======================================================

const ambientLight = new THREE.AmbientLight(0xffffff, 0.04);
scene.add(ambientLight);

const sunPointLight = new THREE.PointLight(0xfff1d4, 18, 120, 2);
sunPointLight.position.set(0, 0, 0);
scene.add(sunPointLight);


// ======================================================
// 9. YILDIZ ALANI
// ======================================================

function createStars() {

    const count     = 1900;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {

        const radius = 9 + Math.random() * 38;
        const theta  = Math.random() * Math.PI * 2;
        const phi    = Math.acos(2 * Math.random() - 1);

        positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.cos(phi);
        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
        color:       0xffffff,
        size:        0.020,
        transparent: true,
        opacity:     0.52,
        depthWrite:  false
    });

    const stars  = new THREE.Points(geometry, material);
    stars.name   = "SUN_STAR_FIELD";
    scene.add(stars);

}

createStars();


// ======================================================
// 10. ROOTLAR
// ======================================================

const sunRoot = new THREE.Group();
sunRoot.name  = "SUN_ROOT";
sunRoot.rotation.z = THREE.MathUtils.degToRad(-SUN_AXIS_TILT_DEG);
scene.add(sunRoot);

const sunAtmosphereRoot = new THREE.Group();
sunAtmosphereRoot.name  = "SUN_ATMOSPHERE_ROOT";
scene.add(sunAtmosphereRoot);

const spacecraftRoot = new THREE.Group();
spacecraftRoot.name  = "SUN_SPACECRAFT_ROOT";
scene.add(spacecraftRoot);
// ======================================================
// SUN VIEW MODE
// ======================================================

let sunViewMode =
    "sun";


window.addEventListener(
    "sun-spacecraft-mode-change",
    (event) => {

        sunViewMode =
            event.detail?.mode
            ||
            "sun";

    }
);


// ======================================================
// PARKER + SOLAR ORBITER + SOHO
// ======================================================

initSunSpacecraft({

    scene,

    root:
        spacecraftRoot,

    camera,

    renderer,

    controls,

    infoScroll

})
.catch(
    (error) => {

        console.error(
            "Güneş uzay aracı sistemi başlatılamadı:",
            error
        );

    }
);


// ======================================================
// 11. GLB YÜKLE
// ======================================================

const loader = new GLTFLoader();

let sunMesh = null;

loader.load(

    // *** BURAYA KENDİ DOSYA YOLUNU YAZ ***
    "/assets/models/sun/sun.glb",

    (gltf) => {

        const model = gltf.scene;

        // GLB'nin boyutunu normalize et
        // (Blender'dan geldiğine göre ölçeği ayarla)
        const box    = new THREE.Box3().setFromObject(model);
        const size   = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        // Sahne yarıçapımız 1 birim — buna göre ölçekle
        const scaleFactor = 2.0 / maxDim;
        model.scale.setScalar(scaleFactor);

        // Merkeze al
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center.multiplyScalar(scaleFactor));

        // GLB içindeki tüm mesh'leri bul,
        // MeshBasicMaterial'a çevir (kendi ışığını yaymak için)
        model.traverse((child) => {

            if (child.isMesh) {

                sunMesh = child;

                // Eğer texture varsa koru, sadece
                // materyal tipini değiştir
                const oldMat = child.material;

                                // GLB'nin kendi texture'ı yoksa
                // sun_surface.jpg'yi yükle
                const textureLoader =
                    new THREE.TextureLoader();

                const fallbackTexture =
                    textureLoader.load(
                        "/assets/textures/sun/sun_surface.jpg"
                    );

                fallbackTexture.colorSpace =
                    THREE.SRGBColorSpace;

                child.material =
                    new THREE.MeshBasicMaterial({

                        map:
                            oldMat.map
                            ||
                            fallbackTexture,

                        color:
                            new THREE.Color(
                                1.6,
                                1.0,
                                0.5
                            )

                    });

                child.material.needsUpdate = true;

            }

        });

        model.name = "SUN_GLB_MODEL";

        sunRoot.add(model);

        console.log("sun.glb yüklendi.");

    },

    (progress) => {

        if (progress.total > 0) {
            const percent =
                Math.round(
                    (progress.loaded / progress.total) * 100
                );
            console.log(`Güneş yükleniyor: %${percent}`);
        }

    },

    (error) => {
        console.error("sun.glb yüklenemedi:", error);
    }

);


// ======================================================
// 12. HALE — SPRITE TABANLI
// ======================================================

function createRadialGlowTexture(size = 512) {

    const canvas = document.createElement("canvas");
    canvas.width  = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
    );

    gradient.addColorStop(0.0,  "rgba(255,255,255,1.0)");
    gradient.addColorStop(0.18, "rgba(255,255,255,0.55)");
    gradient.addColorStop(0.42, "rgba(255,255,255,0.16)");
    gradient.addColorStop(1.0,  "rgba(255,255,255,0.0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;

}

const glowTexture = createRadialGlowTexture();

// Dış hale
const outerGlowMaterial = new THREE.SpriteMaterial({
    map:         glowTexture,
    color:       0xffb15c,
    transparent: true,
    depthWrite:  false,
    depthTest:   true,
    blending:    THREE.AdditiveBlending,
    opacity:     0.42
});

const outerGlowSprite = new THREE.Sprite(outerGlowMaterial);
outerGlowSprite.scale.set(5.2, 5.2, 1);
outerGlowSprite.name = "SUN_OUTER_GLOW";
sunAtmosphereRoot.add(outerGlowSprite);

// İç hale
const innerGlowMaterial = new THREE.SpriteMaterial({
    map:         glowTexture,
    color:       0xfff2c2,
    transparent: true,
    depthWrite:  false,
    depthTest:   true,
    blending:    THREE.AdditiveBlending,
    opacity:     0.70
});

const innerGlowSprite = new THREE.Sprite(innerGlowMaterial);
innerGlowSprite.scale.set(2.4, 2.4, 1);
innerGlowSprite.name = "SUN_INNER_GLOW";
sunAtmosphereRoot.add(innerGlowSprite);


// ======================================================
// 13. KAMERA GÜNEŞ'İN İÇİNE GİRMESİN
// ======================================================

const sunSafeCenter    = new THREE.Vector3();
const sunSafeDirection = new THREE.Vector3();

function preventCameraEnteringSun() {

    sunRoot.getWorldPosition(
        sunSafeCenter
    );


    sunSafeDirection

        .copy(
            camera.position
        )

        .sub(
            sunSafeCenter
        );


    const safeDistance =
        1.20;


    const distance =
        sunSafeDirection.length();


    // Kameranın fiziksel olarak
    // Güneş'in içine girmesine
    // hiçbir modda izin verme.

    if (
        distance
        <
        safeDistance
    ) {

        if (
            distance
            <
            0.000001
        ) {

            sunSafeDirection.set(
                0,
                0,
                safeDistance
            );

        }

        else {

            sunSafeDirection.setLength(
                safeDistance
            );

        }


        camera.position.copy(

            sunSafeCenter

                .clone()

                .add(
                    sunSafeDirection
                )

        );

    }


    // Ama OrbitControls minDistance
    // yalnızca Güneş keşif modunda
    // 1.20 olsun.
    //
    // Spacecraft modunda
    // sun-spacecraft.js bunu
    // seçilen aracın boyutuna göre
    // 0.10 yapıyor.

    if (
        sunViewMode
        ===
        "sun"
    ) {

        controls.minDistance =
            safeDistance;

    }

}


// ======================================================
// 14. BUTONLAR / PANEL
// ======================================================

if (compareEarthButton) {
    compareEarthButton.addEventListener("click", () => {
        console.log("Güneş × Dünya karşılaştırması sonraki aşamada.");
    });
}

if (infoScroll) {
    infoScroll.scrollTop = 0;
}


// ======================================================
// 15. DÖNÜŞ HIZI
// ======================================================

const SUN_ROTATION_SECONDS  = SUN_EQUATORIAL_ROTATION_DAYS * 86400;
const SUN_ANGULAR_SPEED     = (Math.PI * 2) / SUN_ROTATION_SECONDS;

let previousTime = performance.now();


// ======================================================
// 16. ANİMASYON
// ======================================================

function animateSun(now) {

    requestAnimationFrame(animateSun);

    const delta = Math.min(
        Math.max((now - previousTime) / 1000, 0),
        0.1
    );

    previousTime = now;

    // GLB modeli döndür
    if (sunMesh) {
        sunRoot.rotation.y += delta * SUN_ANGULAR_SPEED;
    }

    // Hale nefes alma
    const glowPulse =
        1.0
        +
        Math.sin(now * 0.0006)
        *
        0.03;

    outerGlowSprite.scale.set(
        5.2 * glowPulse,
        5.2 * glowPulse,
        1
    );
// Parker Solar Probe,
// Solar Orbiter ve SOHO
// gerçek UTC ephemeris update.

    updateSunSpacecraft(
    now
    );
    controls.update();

    preventCameraEnteringSun();

    composer.render();

}


// ======================================================
// 17. BAŞLAT
// ======================================================

requestAnimationFrame(animateSun);


// ======================================================
// 18. RESPONSIVE
// ======================================================

window.addEventListener("resize", () => {

    const width  = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    composer.setSize(width, height);

});


// ======================================================
// 19. HAZIR
// ======================================================

console.log("Güneş sahnesi hazır.");