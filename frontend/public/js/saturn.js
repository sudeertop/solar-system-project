import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import {
    initSaturnMoons,
    updateSaturnMoons,
    saturnMoonsState
} from "./saturn-moons.js";
// ======================================================
// 1. HTML ELEMENTLERİ
// ======================================================

const container = document.getElementById("saturn-scene");
const infoContent = document.getElementById("info-content");
const loadingMessage = document.getElementById("loading-message");
const ringSelector = document.getElementById("ring-selector");

if (!container) {
    throw new Error("#saturn-scene bulunamadı.");
}

// ======================================================
// 2. DOSYA YOLLARI
// ======================================================

const SATURN_MODEL_URL = "../assets/models/saturn/saturn.glb?v=3";
const SATURN_RING_TEXTURE_URL =
    "../assets/textures/saturn/saturn_rings_texture.png?v=1";

// Texture içten dışa ters görünürse sadece bunu true yap.
const RING_TEXTURE_FLIP_X = false;

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
    Math.max(container.clientWidth, 1) /
        Math.max(container.clientHeight, 1),
    0.01,
    150
);

camera.position.set(0.25, 1.15, 5.8);

// ======================================================
// 5. RENDERER
// ======================================================

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
});

renderer.setSize(
    Math.max(container.clientWidth, 1),
    Math.max(container.clientHeight, 1)
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.domElement.style.display = "block";
renderer.domElement.style.cursor = "grab";
container.appendChild(renderer.domElement);

// ======================================================
// 6. ORBIT CONTROLS
// ======================================================

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.rotateSpeed = 0.52;
controls.zoomSpeed = 0.75;
controls.minDistance = 1.20;
controls.maxDistance = 110;
controls.target.set(0, 0, 0);
controls.update();

// ======================================================
// 7. IŞIKLAR
// ======================================================

const ambientLight = new THREE.AmbientLight(
    0xffffff,
    0.26
);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(
    0xfff1d8,
    3.2
);
sunLight.position.set(5, 2.8, 6.5);
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(
    0xabc9ff,
    0.18
);
fillLight.position.set(-5, 0.8, 2);
scene.add(fillLight);

const hemisphereLight = new THREE.HemisphereLight(
    0xffe7c5,
    0x0c1320,
    0.32
);
scene.add(hemisphereLight);

// ======================================================
// 8. YILDIZ ALANI
// ======================================================

function createStars() {
    const count = 1900;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const radius = 10 + Math.random() * 38;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] =
            radius * Math.sin(phi) * Math.cos(theta);

        positions[i * 3 + 1] =
            radius * Math.cos(phi);

        positions[i * 3 + 2] =
            radius * Math.sin(phi) * Math.sin(theta);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.022,
        transparent: true,
        opacity: 0.62,
        depthWrite: false
    });

    const stars = new THREE.Points(
        geometry,
        material
    );

    stars.name = "STAR_FIELD";
    scene.add(stars);
}

createStars();

// ======================================================
// 9. SATÜRN ROOT'LARI
// ======================================================

const saturnRoot = new THREE.Group();
saturnRoot.name = "SATURN_SYSTEM";
scene.add(saturnRoot);

const saturnBodyRoot = new THREE.Group();
saturnBodyRoot.name = "SATURN_BODY";
saturnRoot.add(saturnBodyRoot);

const ringsRoot = new THREE.Group();
ringsRoot.name = "SATURN_RINGS";
saturnRoot.add(ringsRoot);
// ======================================================
// DÜNYA KARŞILAŞTIRMA SİSTEMİ
// ======================================================

const earthComparisonRoot =
    new THREE.Group();

earthComparisonRoot.name =
    "EARTH_COMPARISON_ROOT";

earthComparisonRoot.visible =
    false;

scene.add(
    earthComparisonRoot
);


const comparisonState = {

    active:
        false,

    earthLoaded:
        false,

    earthObject:
        null,

    previousCameraPosition:
        new THREE.Vector3(),

    previousControlsTarget:
        new THREE.Vector3(),

    previousSaturnPosition:
        new THREE.Vector3()

};
// ======================================================
// 10. SATÜRN FİZİKSEL VERİLERİ
// ======================================================

// ======================================================
// SATÜRN + DÜNYA FİZİKSEL VERİLERİ
// ======================================================

const SATURN_AXIAL_TILT_DEG = 26.73;

const SATURN_EQUATORIAL_RADIUS_KM = 60268;

const SATURN_POLAR_RADIUS_KM = 54364;

const SATURN_POLAR_RATIO =
    SATURN_POLAR_RADIUS_KM /
    SATURN_EQUATORIAL_RADIUS_KM;


// ======================================================
// DÜNYA KARŞILAŞTIRMASI
// ======================================================

const EARTH_EQUATORIAL_RADIUS_KM = 6378.137;

const EARTH_TO_SATURN_RADIUS =
    EARTH_EQUATORIAL_RADIUS_KM /
    SATURN_EQUATORIAL_RADIUS_KM;

const EARTH_MODEL_URL =
    "../assets/models/earth/earth.glb";

saturnRoot.rotation.z =
    THREE.MathUtils.degToRad(
        -SATURN_AXIAL_TILT_DEG
    );

function kmToSceneRadius(km) {
    return km / SATURN_EQUATORIAL_RADIUS_KM;
}

// Görsel texture ana halka sistemini yaklaşık D halkasından
// F halkasının dışına kadar kaplar.
const RING_SYSTEM_INNER_KM = 66900;
const RING_SYSTEM_OUTER_KM = 140500;
const RING_SYSTEM_INNER =
    kmToSceneRadius(RING_SYSTEM_INNER_KM);
const RING_SYSTEM_OUTER =
    kmToSceneRadius(RING_SYSTEM_OUTER_KM);

// ======================================================
// 11. ETKİLEŞİMLİ HALKA VERİLERİ
// ======================================================

const RING_DATA = {
    c: {
        key: "c",
        name: "C Halkası",
        shortName: "C",
        innerKm: 74658,
        outerKm: 92000,
        kicker: "SATÜRN HALKA SİSTEMİ · İÇ BÖLGE",
        description: `
            C Halkası, B Halkası'nın iç tarafında bulunan
            daha soluk ve daha saydam bir halka bölgesidir.
            Parçacık yoğunluğu B Halkası'na göre daha düşüktür.
        `,
        detailTitle: "Neden daha soluk görünüyor?",
        detail: `
            C Halkası'ndaki madde daha seyrek dağıldığı için
            ışığı B Halkası kadar güçlü yansıtmaz. Bu nedenle
            teleskop görüntülerinde daha karanlık ve yarı
            saydam görünür.
        `
    },

    b: {
        key: "b",
        name: "B Halkası",
        shortName: "B",
        innerKm: 92000,
        outerKm: 117580,
        kicker: "SATÜRN HALKA SİSTEMİ · EN YOĞUN BÖLGE",
        description: `
            B Halkası, Satürn'ün ana halka sistemindeki
            en geniş, en parlak ve en yoğun bölgelerden biridir.
        `,
        detailTitle: "Neden bu kadar parlak?",
        detail: `
            B Halkası çok yüksek miktarda su buzu içeren
            parçacık barındırır. Buz parçacıkları Güneş ışığını
            güçlü biçimde yansıttığı için bu bölge oldukça
            parlak görünür.
        `
    },

    cassini: {
        key: "cassini",
        name: "Cassini Bölümü",
        shortName: "CASSINI",
        innerKm: 117580,
        outerKm: 122170,
        kicker: "SATÜRN HALKA SİSTEMİ · A–B ARASI",
        description: `
            Cassini Bölümü, B ve A halkaları arasında bulunan
            belirgin koyu bölgedir.
        `,
        detailTitle: "Gerçekten tamamen boş mu?",
        detail: `
            Hayır. Cassini Bölümü uzaktan bakıldığında bir
            boşluk gibi görünür ancak tamamen boş değildir.
            Burada da halka parçacıkları bulunur; yalnızca
            yoğunluk çevredeki ana halkalara göre daha düşüktür.
        `
    },

    a: {
        key: "a",
        name: "A Halkası",
        shortName: "A",
        innerKm: 122170,
        outerKm: 136775,
        kicker: "SATÜRN HALKA SİSTEMİ · DIŞ ANA HALKA",
        description: `
            A Halkası, Cassini Bölümü'nün dış tarafında bulunan
            ana halka bölgelerinden biridir.
        `,
        detailTitle: "A Halkasında boşluklar var mı?",
        detail: `
            A Halkası tekdüze bir disk değildir. İçinde çok
            sayıda ince halkacık ve boşluk bulunur. En dikkat
            çekici yapılardan biri Encke Boşluğu'dur. Bu
            yapıların biçimlenmesinde küçük uyduların kütleçekim
            etkisi önemli rol oynar.
        `
    },

    f: {
        key: "f",
        name: "F Halkası",
        shortName: "F",
        innerKm: 139900,
        outerKm: 140500,
        kicker: "SATÜRN HALKA SİSTEMİ · İNCE DIŞ HALKA",
        description: `
            F Halkası, ana A Halkası'nın dışında bulunan son
            derece ince ve dinamik bir halka yapısıdır.
        `,
        detailTitle: "Neden bu kadar karmaşık?",
        detail: `
            F Halkası'nın şekli zaman içinde değişebilir.
            Yakınındaki çoban uydular özellikle Prometheus ve
            Pandora, halka parçacıklarının yörüngelerini
            kütleçekimleriyle etkileyerek kıvrımlar ve yoğunluk
            değişimleri oluşturabilir.
        `
    }
};

Object.values(RING_DATA).forEach((ring) => {
    ring.innerRadius = kmToSceneRadius(ring.innerKm);
    ring.outerRadius = kmToSceneRadius(ring.outerKm);
});

// ======================================================
// 12. HALKA STATE
// ======================================================

const ringState = {
    baseRing: null,
    texture: null,
    highlights: {},
    boundaryLines: {},
    hitMeshes: {},
    selected: null,
    hovered: null
};

// ======================================================
// 13. SATÜRN HALKA TEXTURE'I
// ======================================================

const ringTextureLoader = new THREE.TextureLoader();

const ringTexture = ringTextureLoader.load(
    SATURN_RING_TEXTURE_URL,
    () => {
        console.log("Satürn halka texture'ı yüklendi.");
    },
    undefined,
    (error) => {
        console.error(
            "Satürn halka texture'ı yüklenemedi:",
            error
        );
    }
);

ringTexture.colorSpace = THREE.SRGBColorSpace;
ringTexture.wrapS = THREE.ClampToEdgeWrapping;
ringTexture.wrapT = THREE.ClampToEdgeWrapping;
ringTexture.minFilter = THREE.LinearMipmapLinearFilter;
ringTexture.magFilter = THREE.LinearFilter;
ringTexture.anisotropy =
    renderer.capabilities.getMaxAnisotropy();
ringTexture.generateMipmaps = true;
ringState.texture = ringTexture;

// ======================================================
// 14. TEXTURE TABANLI ANA HALKA MATERYALİ
// ======================================================

function createTexturedRingMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            uRingMap: {
                value: ringTexture
            },
            uInnerRadius: {
                value: RING_SYSTEM_INNER
            },
            uOuterRadius: {
                value: RING_SYSTEM_OUTER
            },
            uOpacity: {
                value: 0.96
            },
            uFlipTexture: {
                value: RING_TEXTURE_FLIP_X ? 1 : 0
            }
        },

        vertexShader: `
            varying vec3 vLocalPosition;

            void main() {
                vLocalPosition = position;

                gl_Position =
                    projectionMatrix *
                    modelViewMatrix *
                    vec4(position, 1.0);
            }
        `,

        fragmentShader: `
            uniform sampler2D uRingMap;
            uniform float uInnerRadius;
            uniform float uOuterRadius;
            uniform float uOpacity;
            uniform int uFlipTexture;

            varying vec3 vLocalPosition;

            void main() {
                float radius =
                    length(vLocalPosition.xy);

                float t =
                    (radius - uInnerRadius) /
                    max(
                        uOuterRadius - uInnerRadius,
                        0.0001
                    );

                if (t < 0.0 || t > 1.0) {
                    discard;
                }

                if (uFlipTexture == 1) {
                    t = 1.0 - t;
                }

                vec4 texColor =
                    texture2D(
                        uRingMap,
                        vec2(t, 0.5)
                    );

                float luminance =
                    dot(
                        texColor.rgb,
                        vec3(0.299, 0.587, 0.114)
                    );

                // PNG alpha varsa onu kullanır.
                // JPG / opak siyah arka plan varsa da siyahı
                // doğal biçimde saydamlaştırır.
                float visibleMatter =
                    smoothstep(
                        0.008,
                        0.055,
                        luminance
                    );

                float alpha =
                    texColor.a *
                    visibleMatter *
                    uOpacity;

                if (alpha < 0.008) {
                    discard;
                }

                vec3 color =
                    max(
                        texColor.rgb,
                        vec3(0.006)
                    );

                gl_FragColor =
                    vec4(color, alpha);
            }
        `,

        transparent: true,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false,
        toneMapped: true
    });
}

// ======================================================
// 15. ANA HALKA MESH'İ
// ======================================================

function createBaseRingMesh() {
    const geometry = new THREE.RingGeometry(
        RING_SYSTEM_INNER,
        RING_SYSTEM_OUTER,
        512,
        1
    );

    const material =
        createTexturedRingMaterial();

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.name = "SATURN_TEXTURED_RING_SYSTEM";
    mesh.rotation.x = Math.PI / 2;
    mesh.renderOrder = 2;
    mesh.userData.isSaturnRing = true;

    ringsRoot.add(mesh);
    ringState.baseRing = mesh;

    return mesh;
}

createBaseRingMesh();

// ======================================================
// 16. HALKA HIGHLIGHT MESH'İ
// ======================================================

function createHighlightMesh(ring) {
    const actualWidth =
        ring.outerRadius - ring.innerRadius;

    const minimumVisualWidth =
        ring.key === "f"
            ? 0.028
            : actualWidth;

    const centerRadius =
        (ring.innerRadius + ring.outerRadius) / 2;

    const inner =
        ring.key === "f"
            ? centerRadius - minimumVisualWidth / 2
            : ring.innerRadius;

    const outer =
        ring.key === "f"
            ? centerRadius + minimumVisualWidth / 2
            : ring.outerRadius;

    const geometry = new THREE.RingGeometry(
        inner,
        outer,
        384,
        1
    );

    const material = new THREE.MeshBasicMaterial({
        color: 0x8bdcff,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthTest: true,
        depthWrite: false
    });

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.name =
        `RING_HIGHLIGHT_${ring.key.toUpperCase()}`;
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = 0.003;
    mesh.visible = false;
    mesh.renderOrder = 10;
    mesh.raycast = () => {};

    ringsRoot.add(mesh);
    ringState.highlights[ring.key] = mesh;

    return mesh;
}

// ======================================================
// 17. HALKA SINIR ÇİZGİLERİ
// ======================================================

function createCircleLine(radius) {
    const points = [];
    const segments = 384;

    for (let i = 0; i <= segments; i++) {
        const angle =
            (i / segments) * Math.PI * 2;

        points.push(
            new THREE.Vector3(
                Math.cos(angle) * radius,
                0.006,
                Math.sin(angle) * radius
            )
        );
    }

    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(points);

    const material =
        new THREE.LineBasicMaterial({
            color: 0x8bdcff,
            transparent: true,
            opacity: 0.88,
            depthTest: true,
            depthWrite: false
        });

    const line = new THREE.LineLoop(
        geometry,
        material
    );

    // Grup görünürlüğü seçimle açılıp kapanacak.
    // Çocuk çizgiler görünür kalmalı.
    line.visible = true;
    line.renderOrder = 12;

    return line;
}

function createRingBoundary(ring) {
    const group = new THREE.Group();
    group.name =
        `RING_BOUNDARY_${ring.key.toUpperCase()}`;

    group.add(
        createCircleLine(ring.innerRadius),
        createCircleLine(ring.outerRadius)
    );

    group.visible = false;
    ringsRoot.add(group);
    ringState.boundaryLines[ring.key] = group;

    return group;
}

// ======================================================
// 18. HALKA HITBOX'LARI
// ======================================================

function createRingHitMesh(ring) {
    const actualWidth =
        ring.outerRadius - ring.innerRadius;

    const minimumHitWidth =
        ring.key === "f"
            ? 0.060
            : Math.max(actualWidth, 0.030);

    const centerRadius =
        (ring.innerRadius + ring.outerRadius) / 2;

    const hitInner =
        centerRadius - minimumHitWidth / 2;

    const hitOuter =
        centerRadius + minimumHitWidth / 2;

    const geometry = new THREE.RingGeometry(
        hitInner,
        hitOuter,
        384,
        1
    );

    const material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false
    });

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.name =
        `RING_HIT_${ring.key.toUpperCase()}`;
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = 0.012;
    mesh.userData.ringKey = ring.key;
    mesh.userData.isRingHitTarget = true;
    mesh.renderOrder = 20;

    ringsRoot.add(mesh);
    ringState.hitMeshes[ring.key] = mesh;

    return mesh;
}

Object.values(RING_DATA).forEach((ring) => {
    createHighlightMesh(ring);
    createRingBoundary(ring);
    createRingHitMesh(ring);
});

// ======================================================
// 19. BİLGİ PANELİ - SATÜRN GENEL
// ======================================================

function showSaturnOverview() {
    if (!infoContent) {
        return;
    }

    infoContent.innerHTML = `
        <p class="info-kicker">
            GÜNEŞ SİSTEMİ · 6. GEZEGEN
        </p>

        <h1 class="info-title">
            Satürn
        </h1>

        <p class="info-lead">
            Satürn, Güneş Sistemi'nin ikinci en büyük
            gezegenidir. Büyük ölçüde hidrojen ve helyumdan
            oluşan bir gaz devidir ve belirgin halka sistemiyle
            diğer gezegenlerden kolayca ayırt edilir.
        </p>

        <div class="quick-stats">
            <div class="quick-stat">
                <span>Ekvator çapı</span>
                <strong>≈ 120.536 km</strong>
            </div>

            <div class="quick-stat">
                <span>Güneş'e uzaklık</span>
                <strong>≈ 9,5 AU</strong>
            </div>

            <div class="quick-stat">
                <span>Bir gün</span>
                <strong>≈ 10,7 saat</strong>
            </div>

            <div class="quick-stat">
                <span>Bir yıl</span>
                <strong>≈ 29,4 Dünya yılı</strong>
            </div>

            <div class="quick-stat">
                <span>Eksen eğikliği</span>
                <strong>26,73°</strong>
            </div>

            <div class="quick-stat">
                <span>Gezegen türü</span>
                <strong>Gaz devi</strong>
            </div>
        </div>

        <section class="info-section">
            <h2 class="info-section-title">
                Halkalar neyden oluşuyor?
            </h2>

            <p>
                Satürn'ün halkaları katı ve tek parça diskler
                değildir. Halka sistemi; Satürn çevresinde
                bağımsız yörüngelerde hareket eden çok büyük
                sayıda buz, kaya ve toz parçacığından oluşur.
            </p>
        </section>

        <section class="info-section">
            <h2 class="info-section-title">
                Neden bu kadar belirgin?
            </h2>

            <p>
                Halkalardaki su buzu parçacıkları Güneş ışığını
                güçlü yansıtır. Halka sistemi çok geniş olmasına
                rağmen dikey yönde olağanüstü incedir.
            </p>
        </section>

        <section class="info-section">
            <h2 class="info-section-title">
                Halkaları keşfet
            </h2>

            <p>
                Bir halka bölgesine tıkla veya sağ alttaki
                halka seçimlerini kullan. Seçtiğin bölgenin
                gerçek sınırları 3B model üzerinde vurgulanacak.
            </p>
        </section>

        <div class="info-actions">
            <button
            id="compare-earth-button"
            class="primary-action"
             type="button"
            >
    DÜNYA İLE KARŞILAŞTIR
</button>
        </div>
    `;
    document
    .getElementById(
        "compare-earth-button"
    )
    ?.addEventListener(

        "click",

        enterEarthComparison

    );
}

// ======================================================
// 20. BİLGİ PANELİ - HALKA
// ======================================================

function showRingInfo(ring) {
    if (!infoContent || !ring) {
        return;
    }

    const innerText =
        Math.round(ring.innerKm)
            .toLocaleString("tr-TR");

    const outerText =
        Math.round(ring.outerKm)
            .toLocaleString("tr-TR");

    const widthText =
        Math.round(
            ring.outerKm - ring.innerKm
        ).toLocaleString("tr-TR");

    infoContent.innerHTML = `
        <p class="info-kicker">
            ${ring.kicker}
        </p>

        <h1 class="info-title">
            ${ring.name}
        </h1>

        <p class="info-lead">
            ${ring.description}
        </p>

        <div class="quick-stats">
            <div class="quick-stat">
                <span>İç sınır</span>
                <strong>≈ ${innerText} km</strong>
            </div>

            <div class="quick-stat">
                <span>Dış sınır</span>
                <strong>≈ ${outerText} km</strong>
            </div>

            <div class="quick-stat">
                <span>Yaklaşık genişlik</span>
                <strong>${widthText} km</strong>
            </div>
        </div>

        <section class="info-section">
            <h2 class="info-section-title">
                ${ring.detailTitle}
            </h2>

            <p>
                ${ring.detail}
            </p>
        </section>

        <section class="info-section">
            <h2 class="info-section-title">
                Modeldeki ölçek
            </h2>

            <p>
                Bu bölgenin iç ve dış sınırları 3B modelde
                Satürn'ün ekvator yarıçapına göre orantılı
                biçimde gösteriliyor.
            </p>
        </section>

        <div class="info-actions">
            <button
                id="back-to-saturn"
                class="secondary-action"
                type="button"
            >
                ← SATÜRN BİLGİLERİNE DÖN
            </button>
        </div>
    `;

    document
        .getElementById("back-to-saturn")
        ?.addEventListener(
            "click",
            clearRingSelection
        );
}

// ======================================================
// 21. HALKA SEÇİMİ
// ======================================================

function updateRingSelectorButtons() {
    document
        .querySelectorAll(
            ".ring-selector-button"
        )
        .forEach((button) => {
            const active =
                button.dataset.ring ===
                ringState.selected;

            button.classList.toggle(
                "active",
                active
            );

            button.setAttribute(
                "aria-pressed",
                active ? "true" : "false"
            );
        });
}

function hideAllRingHighlights() {
    Object.values(
        ringState.highlights
    ).forEach((mesh) => {
        mesh.visible = false;
        mesh.material.opacity = 0.18;
    });

    Object.values(
        ringState.boundaryLines
    ).forEach((group) => {
        group.visible = false;
    });
}

function selectRing(key) {
    const ring = RING_DATA[key];

    if (!ring) {
        return;
    }

    ringState.selected = key;
    ringState.hovered = null;
    hideAllRingHighlights();

    const highlight =
        ringState.highlights[key];

    const boundary =
        ringState.boundaryLines[key];

    if (highlight) {
        highlight.visible = true;
        highlight.material.opacity = 0.20;
    }

    if (boundary) {
        boundary.visible = true;
    }

    showRingInfo(ring);
    updateRingSelectorButtons();
}

function clearRingSelection() {
    ringState.selected = null;
    ringState.hovered = null;
    hideAllRingHighlights();
    updateRingSelectorButtons();
    showSaturnOverview();
}

// ======================================================
// 22. HALKA SEÇİCİ BUTONLARI
// ======================================================

document
    .querySelectorAll(
        ".ring-selector-button"
    )
    .forEach((button) => {
        button.setAttribute(
            "aria-pressed",
            "false"
        );

        button.addEventListener(
    "click",
    () => {

        // Uydu yakın planındayken
        // halka butonları çalışmasın.
        if (
            saturnMoonsState.focusMode
            ===
            "moon"
        ) {

            return;

        }

        const key =
            button.dataset.ring;

        if (
            key
        ) {

            selectRing(
                key
            );

        }

    }
);
    });

showSaturnOverview();

// ======================================================
// 23. SATÜRN UI STİLLERİ
// ======================================================

function installSaturnUIStyles() {
    if (
        document.getElementById(
            "saturn-dynamic-style"
        )
    ) {
        return;
    }

    const style = document.createElement("style");
    style.id = "saturn-dynamic-style";

    style.textContent = `
        .ring-selector {
            position: absolute;
            left: 50%;
            right: auto;
            bottom: 40px;
            transform: translateX(-50%);
            z-index: 35;
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 7px 9px;
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 999px;
            background: rgba(3,7,18,0.74);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            pointer-events: auto;
            font-family: Arial, sans-serif;
        }

        .ring-selector-title {
            margin: 0 6px 0 4px;
            color: rgba(255,255,255,0.45);
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.12em;
            user-select: none;
        }

        .ring-selector-button {
            min-width: 34px;
            height: 32px;
            padding: 0 10px;
            border: 1px solid rgba(255,255,255,0.14);
            border-radius: 999px;
            background: transparent;
            color: rgba(255,255,255,0.72);
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.04em;
            cursor: pointer;
            transition:
                background 160ms ease,
                color 160ms ease,
                border-color 160ms ease,
                transform 160ms ease;
        }

        .ring-selector-button:hover {
            color: #ffffff;
            border-color: rgba(139,220,255,0.55);
            background: rgba(139,220,255,0.08);
        }

        .ring-selector-button.active {
            color: #05070c;
            background: #8bdcff;
            border-color: #8bdcff;
        }

        .ring-selector-button:active {
            transform: scale(0.96);
        }

        .primary-action:disabled {
            cursor: default;
            opacity: 0.6;
        }

        @media (max-width: 900px) {
    .ring-selector {
        left: 50%;
        right: auto;
        bottom: 22px;
        transform: translateX(-50%);
    }
}
    `;

    document.head.appendChild(style);
}

installSaturnUIStyles();

if (ringSelector) {
    ringSelector.style.pointerEvents = "auto";

    ringSelector.addEventListener(
        "pointerdown",
        (event) => event.stopPropagation()
    );

    ringSelector.addEventListener(
        "click",
        (event) => event.stopPropagation()
    );
}

// ======================================================
// 24. SATÜRN MODEL STATE
// ======================================================

let saturnLoaded = false;
let saturnModelWrapper = null;
const saturnBodyMeshes = [];

// ======================================================
// 25. MODEL MATERYALLERİNİ İYİLEŞTİR
// ======================================================

function improveSaturnMaterials(model) {
    const anisotropy =
        renderer.capabilities
            .getMaxAnisotropy();

    model.traverse((object) => {
        if (!object.isMesh) {
            return;
        }

        const materials =
            Array.isArray(object.material)
                ? object.material
                : [object.material];

        materials.forEach((material) => {
            if (!material) {
                return;
            }

            if (material.map) {
                material.map.colorSpace =
                    THREE.SRGBColorSpace;

                material.map.anisotropy =
                    anisotropy;

                material.map.minFilter =
                    THREE.LinearMipmapLinearFilter;

                material.map.magFilter =
                    THREE.LinearFilter;

                material.map.needsUpdate = true;
            }

            // Gezegen tamamen opak olsun ki arkadaki
            // halka Satürn'ün içinden görünmesin.
            material.transparent = false;
            material.opacity = 1;
            material.depthTest = true;
            material.depthWrite = true;
            material.side = THREE.FrontSide;

            // Satürn yüzeyi plastik gibi parlamasın.
            if ("roughness" in material) {
                material.roughness = Math.max(
                    material.roughness ?? 0.65,
                    0.58
                );
            }

            if ("metalness" in material) {
                material.metalness = 0;
            }

            material.needsUpdate = true;
        });
    });
}

// ======================================================
// 26. GLB İÇİNDE HALKA TESPİTİ
// ======================================================

function meshLooksLikeEmbeddedRing(mesh) {
    if (
        !mesh ||
        !mesh.isMesh ||
        !mesh.geometry
    ) {
        return false;
    }

    const objectName =
        `${mesh.name || ""} ${mesh.parent?.name || ""}`
            .toLowerCase();

    if (
        objectName.includes("ring") ||
        objectName.includes("rings") ||
        objectName.includes("halo")
    ) {
        return true;
    }

    mesh.geometry.computeBoundingBox();
    const localBox = mesh.geometry.boundingBox;

    if (!localBox) {
        return false;
    }

    const size = localBox.getSize(
        new THREE.Vector3()
    );

    const dimensions = [
        Math.abs(size.x),
        Math.abs(size.y),
        Math.abs(size.z)
    ].sort((a, b) => a - b);

    const smallest = dimensions[0];
    const middle = dimensions[1];
    const largest = dimensions[2];

    if (largest < 0.000001) {
        return false;
    }

    const flatness = smallest / largest;
    const broadness = middle / largest;

    return (
        flatness < 0.08 &&
        broadness > 0.72
    );
}

function hideEmbeddedSaturnRings(model) {
    let hiddenCount = 0;
    saturnBodyMeshes.length = 0;

    model.traverse((object) => {
        if (!object.isMesh) {
            return;
        }

        if (meshLooksLikeEmbeddedRing(object)) {
            object.visible = false;
            object.userData.hiddenEmbeddedRing = true;
            hiddenCount++;
            return;
        }

        saturnBodyMeshes.push(object);
    });

    console.log(
        `Satürn GLB içinden ${hiddenCount} halka mesh'i gizlendi.`
    );

    return hiddenCount;
}

// ======================================================
// 27. GÖVDE BOUNDING BOX
// ======================================================

function calculateVisibleBodyBox(model) {
    model.updateMatrixWorld(true);

    const totalBox = new THREE.Box3();
    totalBox.makeEmpty();

    model.traverse((object) => {
        if (
            !object.isMesh ||
            !object.visible ||
            object.userData.hiddenEmbeddedRing
        ) {
            return;
        }

        if (!object.geometry.boundingBox) {
            object.geometry.computeBoundingBox();
        }

        if (!object.geometry.boundingBox) {
            return;
        }

        const objectBox =
            object.geometry.boundingBox.clone();

        objectBox.applyMatrix4(
            object.matrixWorld
        );

        totalBox.union(objectBox);
    });

    return totalBox;
}

// ======================================================
// 28. SATÜRN MODELİNİ NORMALIZE ET
// ======================================================

function normalizeSaturnModel(model) {
    model.updateMatrixWorld(true);

    let box = calculateVisibleBodyBox(model);

    if (box.isEmpty()) {
        console.warn(
            "Satürn gövde bounding box bulunamadı."
        );

        const fallback = new THREE.Group();
        fallback.add(model);
        return fallback;
    }

    const initialCenter = box.getCenter(
        new THREE.Vector3()
    );

    model.position.x -= initialCenter.x;
    model.position.y -= initialCenter.y;
    model.position.z -= initialCenter.z;
    model.updateMatrixWorld(true);

    box = calculateVisibleBodyBox(model);

    const size = box.getSize(
        new THREE.Vector3()
    );

    // glTF / Three tarafında Y yukarı kabul ediyoruz.
    const equatorialDiameter = Math.max(
        Math.abs(size.x),
        Math.abs(size.z)
    );

    const polarDiameter = Math.abs(size.y);

    const wrapper = new THREE.Group();
    wrapper.name = "SATURN_MODEL_WRAPPER";
    wrapper.add(model);

    if (equatorialDiameter > 0.000001) {
        const globalScale =
            2 / equatorialDiameter;

        wrapper.scale.setScalar(globalScale);
    }

    const existingPolarRatio =
        equatorialDiameter > 0.000001
            ? polarDiameter /
              equatorialDiameter
            : 1;

    console.log(
        "Satürn model polar/ekvator oranı:",
        existingPolarRatio.toFixed(3)
    );

    if (existingPolarRatio > 0.97) {
        wrapper.scale.y *=
            SATURN_POLAR_RATIO;

        console.log(
            "Satürn fiziksel basıklığı modele uygulandı."
        );
    } else {
        console.log(
            "Model zaten basık; ikinci kez basıklık uygulanmadı."
        );
    }

    return wrapper;
}

// ======================================================
// DÜNYA KARŞILAŞTIRMA MODELİ
// ======================================================

function normalizeEarthComparisonModel(
    model
) {

    model.updateMatrixWorld(true);


    const box =
        new THREE.Box3()
            .setFromObject(model);


    const center =
        box.getCenter(
            new THREE.Vector3()
        );


    const size =
        box.getSize(
            new THREE.Vector3()
        );


    model.position.sub(
        center
    );


    const diameter =
        Math.max(
            size.x,
            size.y,
            size.z
        );


    const desiredDiameter =
        EARTH_TO_SATURN_RADIUS
        *
        2;


    const wrapper =
        new THREE.Group();


    wrapper.name =
        "EARTH_COMPARISON_MODEL";


    wrapper.add(
        model
    );


    if (
        diameter > 0.000001
    ) {

        const scale =
            desiredDiameter
            /
            diameter;


        wrapper.scale.setScalar(
            scale
        );

    }


    return wrapper;

}


function improveEarthComparisonMaterials(
    model
) {

    const anisotropy =
        renderer
            .capabilities
            .getMaxAnisotropy();


    model.traverse(
        (object) => {

            if (
                !object.isMesh
            ) {

                return;

            }


            const materials =

                Array.isArray(
                    object.material
                )

                    ?

                    object.material

                    :

                    [
                        object.material
                    ];


            materials.forEach(
                (material) => {

                    if (
                        !material
                    ) {

                        return;

                    }


                    if (
                        material.map
                    ) {

                        material.map.colorSpace =
                            THREE.SRGBColorSpace;

                        material.map.anisotropy =
                            anisotropy;

                        material.map.needsUpdate =
                            true;

                    }


                    material.depthTest =
                        true;

                    material.depthWrite =
                        true;

                    material.needsUpdate =
                        true;

                }
            );

        }
    );

}


const earthComparisonLoader =
    new GLTFLoader();


earthComparisonLoader.load(

    EARTH_MODEL_URL,


    (gltf) => {

        const earthModel =
            gltf.scene;


        improveEarthComparisonMaterials(
            earthModel
        );


        const wrapper =
            normalizeEarthComparisonModel(
                earthModel
            );


        earthComparisonRoot.add(
            wrapper
        );


        comparisonState.earthObject =
            wrapper;


        comparisonState.earthLoaded =
            true;


        console.log(
            "Dünya karşılaştırma modeli hazır."
        );

    },


    undefined,


    (error) => {

        console.error(
            "Dünya karşılaştırma modeli yüklenemedi:",
            error
        );

    }

);
// ======================================================
// DÜNYA KARŞILAŞTIRMA MODU
// ======================================================

function enterEarthComparison() {

    if (
        !comparisonState.earthLoaded
    ) {

        console.warn(
            "Dünya modeli henüz hazır değil."
        );

        return;

    }


    comparisonState.active =
        true;


    // Mevcut kamera konumunu sakla.

    comparisonState
        .previousCameraPosition
        .copy(
            camera.position
        );


    comparisonState
        .previousControlsTarget
        .copy(
            controls.target
        );


    comparisonState
        .previousSaturnPosition
        .copy(
            saturnRoot.position
        );


    // ===============================================
    // UYDULARI VE HALKALARI KARŞILAŞTIRMA SIRASINDA
    // GİZLE
    // ===============================================

    ringsRoot.visible =
        true;


    const moonRoot =
        saturnRoot.getObjectByName(
            "SATURN_MOONS_ROOT"
        );


    if (
        moonRoot
    ) {

        moonRoot.visible =
            false;

    }


    // ===============================================
    // SATÜRN SOLA
    // ===============================================

    saturnRoot.position.set(
        -0.45,
        0,
        0
    );


    // ===============================================
    // DÜNYA SAĞA
    // ===============================================

    earthComparisonRoot.position.set(
        1.05,
        0,
        0
    );


    earthComparisonRoot.visible =
        true;


    // ===============================================
    // KAMERA
    // ===============================================

    controls.target.set(
        0.15,
        0,
        0
    );


    camera.position.set(
        0.15,
        0.35,
        4.5
    );


    controls.minDistance =
        2.4;


    controls.maxDistance =
        12;


    controls.update();


    showEarthComparisonInfo();

}


function exitEarthComparison() {

    comparisonState.active =
        false;


    earthComparisonRoot.visible =
        false;


    ringsRoot.visible =
        true;


    const moonRoot =
        saturnRoot.getObjectByName(
            "SATURN_MOONS_ROOT"
        );


    if (
        moonRoot
    ) {

        moonRoot.visible =
            true;

    }


    saturnRoot.position.copy(

        comparisonState
            .previousSaturnPosition

    );


    camera.position.copy(

        comparisonState
            .previousCameraPosition

    );


    controls.target.copy(

        comparisonState
            .previousControlsTarget

    );


    controls.minDistance =
        1.08;


    controls.maxDistance =
        120;


    controls.update();


    showSaturnOverview();

}
function showEarthComparisonInfo() {

    if (
        !infoContent
    ) {
        return;
    }


    infoContent.innerHTML = `

        <p class="info-kicker">
            GERÇEK BOYUT ORANI
        </p>


        <h1 class="info-title">
            Satürn × Dünya
        </h1>


        <p class="info-lead">

            Modeller aynı ölçek sistemi içinde
            gösteriliyor. Satürn'ün ekvator çapı
            Dünya'nın çapının yaklaşık 9,45 katıdır.
            Hacim olarak ise Satürn'ün içine yaklaşık
            764 Dünya sığabilir. Yaklaşıp uzaklaşarak
            boyut farkını doğrudan inceleyebilirsin.

        </p>


        <table class="compare-table">

            <thead>

                <tr>

                    <th>
                        Özellik
                    </th>

                    <th>
                        Satürn
                    </th>

                    <th>
                        Dünya
                    </th>

                </tr>

            </thead>


            <tbody>

                <tr>

                    <td>
                        Çap
                    </td>

                    <td>
                        <strong>
                            120.536 km
                        </strong>
                    </td>

                    <td>
                        <strong>
                            12.756 km
                        </strong>
                    </td>

                </tr>


                <tr>

                    <td>
                        Kütle
                    </td>

                    <td>
                        5,68 × 10²⁶ kg
                    </td>

                    <td>
                        5,97 × 10²⁴ kg
                    </td>

                </tr>


                <tr>

                    <td>
                        Yerçekimi
                    </td>

                    <td>
                        10,44 m/s²
                    </td>

                    <td>
                        9,8 m/s²
                    </td>

                </tr>


                <tr>

                    <td>
                        Dönüş süresi
                    </td>

                    <td>
                        ≈ 10,7 saat
                    </td>

                    <td>
                        ≈ 23,9 saat
                    </td>

                </tr>


                <tr>

                    <td>
                        Yörünge süresi
                    </td>

                    <td>
                        ≈ 29,4 Dünya yılı
                    </td>

                    <td>
                        ≈ 365,25 gün
                    </td>

                </tr>


                <tr>

                    <td>
                        Ortalama sıcaklık
                    </td>

                    <td>
                        ≈ −178 °C
                    </td>

                    <td>
                        ≈ +15 °C
                    </td>

                </tr>


                <tr>

                    <td>
                        Atmosfer
                    </td>

                    <td>
                        Hidrojen + Helyum
                    </td>

                    <td>
                        Azot + Oksijen
                    </td>

                </tr>


                <tr>

                    <td>
                        Hacim
                    </td>

                    <td>
                        <strong>
                            ≈ 764 Dünya
                        </strong>
                    </td>

                    <td>
                        1 Dünya
                    </td>

                </tr>

            </tbody>

        </table>


        <div class="info-actions">

            <button
                id="exit-earth-comparison"
                class="secondary-action"
                type="button"
            >

                ← SATÜRN KEŞİF MODUNA DÖN

            </button>

        </div>

    `;


    document
        .getElementById(
            "exit-earth-comparison"
        )
        ?.addEventListener(

            "click",

            exitEarthComparison

        );

}
// ======================================================
// 29. GLTF / DRACO LOADER
// ======================================================

const saturnDracoLoader = new DRACOLoader();
saturnDracoLoader.setDecoderPath(
    "https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/libs/draco/"
);

const saturnLoader = new GLTFLoader();
saturnLoader.setDRACOLoader(
    saturnDracoLoader
);

saturnLoader.load(
    SATURN_MODEL_URL,

    (gltf) => {
        const model = gltf.scene;

        console.group("Satürn GLB meshleri");
        model.traverse((object) => {
            if (object.isMesh) {
                console.log(
                    object.name || "(isimsiz mesh)"
                );
            }
        });
        console.groupEnd();

        improveSaturnMaterials(model);
        hideEmbeddedSaturnRings(model);

        saturnModelWrapper =
    normalizeSaturnModel(model);

saturnBodyRoot.add(
    saturnModelWrapper
);

saturnLoaded = true;


// ======================================================
// SATÜRN UYDULARINI BAŞLAT
// ======================================================

initSaturnMoons({

    scene,
    saturnRoot,
    renderer,
    camera,
    controls,
    infoContent

})
    .then(() => {

        console.log(
            "Satürn uydu sistemi hazır."
        );

    })
    .catch((error) => {

        console.error(
            "Satürn uyduları başlatılamadı:",
            error
        );

    });


loadingMessage?.remove();

console.log(
    "Satürn modeli yüklendi."
);
    },

    (progress) => {
        if (
            !loadingMessage ||
            !progress.total
        ) {
            return;
        }

        const percent = Math.round(
            (progress.loaded /
                progress.total) *
                100
        );

        loadingMessage.textContent =
            `Satürn modeli yükleniyor · %${percent}`;
    },

    (error) => {
        console.error(
            "Satürn modeli yüklenemedi:",
            error
        );

        if (loadingMessage) {
            loadingMessage.textContent =
                "Satürn modeli yüklenemedi.";
        }
    }
);

// ======================================================
// 30. RAYCASTER
// ======================================================

const saturnRaycaster = new THREE.Raycaster();
const saturnPointer = new THREE.Vector2();

function updateSaturnPointer(event) {
    const rect =
        renderer.domElement
            .getBoundingClientRect();

    saturnPointer.x =
        ((event.clientX - rect.left) /
            rect.width) *
            2 -
        1;

    saturnPointer.y =
        -(
            (event.clientY - rect.top) /
            rect.height
        ) *
            2 +
        1;
}

function getRingUnderPointer() {
    saturnRaycaster.setFromCamera(
        saturnPointer,
        camera
    );

    const hitTargets = Object.values(
        ringState.hitMeshes
    );

    const hits =
        saturnRaycaster.intersectObjects(
            hitTargets,
            false
        );

    if (hits.length === 0) {
        return null;
    }

    return (
        hits[0].object.userData.ringKey ||
        null
    );
}

// ======================================================
// 31. HOVER
// ======================================================

function clearPreviousRingHover() {
    const previousKey = ringState.hovered;

    if (!previousKey) {
        return;
    }

    if (
        previousKey !==
        ringState.selected
    ) {
        const previousHighlight =
            ringState.highlights[
                previousKey
            ];

        if (previousHighlight) {
            previousHighlight.visible = false;
            previousHighlight.material.opacity = 0.18;
        }
    }

    ringState.hovered = null;
}

renderer.domElement.addEventListener(
    "pointermove",
    (event) => {
        if (
    saturnMoonsState.focusMode
    ===
    "moon"
) {

    clearPreviousRingHover();

    renderer
        .domElement
        .style
        .cursor =
        "grab";

    return;

}
        updateSaturnPointer(event);

        const key = getRingUnderPointer();

        if (
            ringState.hovered &&
            ringState.hovered !== key
        ) {
            clearPreviousRingHover();
        }

        if (!key) {
            renderer.domElement.style.cursor =
                "grab";
            return;
        }

        ringState.hovered = key;
        renderer.domElement.style.cursor =
            "pointer";

        if (key === ringState.selected) {
            return;
        }

        const highlight =
            ringState.highlights[key];

        if (highlight) {
            highlight.visible = true;
            highlight.material.opacity = 0.075;
        }
    }
);

renderer.domElement.addEventListener(
    "pointerleave",
    () => {
        clearPreviousRingHover();
        renderer.domElement.style.cursor =
            "grab";
    }
);

// ======================================================
// 32. DRAG İLE CLICK'İ AYIR
// ======================================================

const pointerDownPosition = {
    x: 0,
    y: 0
};

let pointerWasDragged = false;

renderer.domElement.addEventListener(
    "pointerdown",
    (event) => {
        pointerDownPosition.x =
            event.clientX;
        pointerDownPosition.y =
            event.clientY;
        pointerWasDragged = false;
    }
);

renderer.domElement.addEventListener(
    "pointermove",
    (event) => {
        const dx =
            event.clientX -
            pointerDownPosition.x;

        const dy =
            event.clientY -
            pointerDownPosition.y;

        const distance = Math.sqrt(
            dx * dx + dy * dy
        );

        if (distance > 6) {
            pointerWasDragged = true;
        }
    }
);

// ======================================================
// 33. CLICK
// ======================================================

renderer.domElement.addEventListener(
    "click",
    (event) => {
        if (
    saturnMoonsState.focusMode
    ===
    "moon"
) {

    return;

}
        if (pointerWasDragged) {
            pointerWasDragged = false;
            return;
        }

        updateSaturnPointer(event);

        const key = getRingUnderPointer();

        if (key) {
            selectRing(key);
            return;
        }

        // Halka seçilmediyse Satürn gövdesine
        // tıklayınca ana bilgi paneline dön.
        if (
            saturnLoaded &&
            saturnBodyMeshes.length > 0
        ) {
            saturnRaycaster.setFromCamera(
                saturnPointer,
                camera
            );

            const bodyHits =
                saturnRaycaster
                    .intersectObjects(
                        saturnBodyMeshes,
                        true
                    );

            if (bodyHits.length > 0) {
                clearRingSelection();
            }
        }
    }
);

// ======================================================
// 34. KAMERA SATÜRN'ÜN İÇİNE GİRMESİN
// ======================================================

const SATURN_CAMERA_EQUATOR_RADIUS = 1.035;
const SATURN_CAMERA_POLAR_RADIUS =
    SATURN_POLAR_RATIO + 0.035;

const saturnCameraLocal =
    new THREE.Vector3();

const saturnCameraCorrectedLocal =
    new THREE.Vector3();

function preventCameraEnteringSaturn() {
    if (!saturnLoaded) {
        return;
    }

    saturnCameraLocal.copy(
        camera.position
    );

    saturnRoot.worldToLocal(
        saturnCameraLocal
    );

    const x =
        saturnCameraLocal.x /
        SATURN_CAMERA_EQUATOR_RADIUS;

    const y =
        saturnCameraLocal.y /
        SATURN_CAMERA_POLAR_RADIUS;

    const z =
        saturnCameraLocal.z /
        SATURN_CAMERA_EQUATOR_RADIUS;

    const ellipsoidDistance = Math.sqrt(
        x * x + y * y + z * z
    );

    if (ellipsoidDistance >= 1) {
        return;
    }

    if (ellipsoidDistance < 0.000001) {
        saturnCameraCorrectedLocal.set(
            0,
            0,
            SATURN_CAMERA_EQUATOR_RADIUS
        );
    } else {
        const multiplier =
            1 / ellipsoidDistance;

        saturnCameraCorrectedLocal
            .copy(saturnCameraLocal)
            .multiplyScalar(multiplier);
    }

    saturnCameraCorrectedLocal
        .multiplyScalar(1.004);

    saturnRoot.localToWorld(
        saturnCameraCorrectedLocal
    );

    camera.position.copy(
        saturnCameraCorrectedLocal
    );
}

// ======================================================
// 35. SEÇİLİ HALKA GÖRÜNÜMÜNÜ KORU
// ======================================================

function maintainSelectedRingHighlight() {
    if (!ringState.selected) {
        return;
    }

    const highlight =
        ringState.highlights[
            ringState.selected
        ];

    if (highlight) {
        highlight.visible = true;
        highlight.material.opacity = 0.20;
    }

    const boundary =
        ringState.boundaryLines[
            ringState.selected
        ];

    if (boundary) {
        boundary.visible = true;
    }
}

// ======================================================
// 36. BAŞLANGIÇ GÖRÜNÜMÜ
// ======================================================

function setSaturnInitialView() {
    camera.position.set(
        0.25,
        1.15,
        5.8
    );

    controls.target.set(0, 0, 0);
    controls.update();
}

setSaturnInitialView();

// ======================================================
// 37. ANİMASYON
// ======================================================

const saturnClock = new THREE.Clock();

function animateSaturn(
    now
) {

    function animateSaturn(
    now
) {

    // ==================================================
    // SONRAKİ FRAME'İ İSTE
    // ==================================================

    requestAnimationFrame(
        animateSaturn
    );


    // ==================================================
    // FRAME SÜRESİ
    // ==================================================

    saturnClock.getDelta();


    // ==================================================
    // MOUSE İLE DÖNDÜRME / ZOOM
    // ==================================================

    controls.update();


    // ==================================================
    // SATÜRN UYDULARINI HAREKET ETTİR
    // ==================================================

    updateSaturnMoons(
        now
    );


    // ==================================================
    // KAMERA SATÜRN'ÜN İÇİNE GİRMESİN
    // ==================================================

    preventCameraEnteringSaturn();


    // ==================================================
    // DÜNYA KARŞILAŞTIRMASINDAYSA
    // KAMERA DÜNYA'NIN İÇİNE GİRMESİN
    // ==================================================

    preventCameraEnteringComparisonEarth();


    // ==================================================
    // SEÇİLEN HALKA VURGUSUNU KORU
    // ==================================================

    maintainSelectedRingHighlight();


    // ==================================================
    // SAHNEYİ ÇİZ
    // ==================================================

    renderer.render(
        scene,
        camera
    );

}


// ======================================================
// ANİMASYONU İLK KEZ BAŞLAT
// ======================================================

requestAnimationFrame(
    animateSaturn
);


    saturnClock.getDelta();


    // ==================================================
    // CONTROLS
    // ==================================================

    controls.update();


    // ==================================================
    // SATÜRN UYDULARI
    // ==================================================

    updateSaturnMoons(
        now
    );


    // ==================================================
    // SATÜRN KAMERA ÇARPIŞMASI
    // ==================================================

    preventCameraEnteringSaturn();
    function preventCameraEnteringComparisonEarth() {

    if (
        !comparisonState.active
        ||
        !comparisonState.earthObject
    ) {

        return;

    }


    const earthWorldPosition =
        new THREE.Vector3();


    comparisonState
        .earthObject
        .getWorldPosition(
            earthWorldPosition
        );


    const offset =

        camera
            .position
            .clone()
            .sub(
                earthWorldPosition
            );


    const safeRadius =

        EARTH_TO_SATURN_RADIUS
        *
        1.12;


    if (
        offset.length()
        >=
        safeRadius
    ) {

        return;

    }


    if (
        offset.length()
        <
        0.000001
    ) {

        offset.set(
            0,
            0,
            safeRadius
        );

    }

    else {

        offset.setLength(
            safeRadius
        );

    }


    camera.position.copy(

        earthWorldPosition
            .clone()
            .add(
                offset
            )

    );

}


    // ==================================================
    // HALKA SEÇİMİ
    // ==================================================

    maintainSelectedRingHighlight();


    // ==================================================
    // RENDER
    // ==================================================

    renderer.render(
        scene,
        camera
    );

}


requestAnimationFrame(
    animateSaturn
);

// ======================================================
// 38. RESPONSIVE
// ======================================================

window.addEventListener(
    "resize",
    () => {
        const width = Math.max(
            container.clientWidth,
            1
        );

        const height = Math.max(
            container.clientHeight,
            1
        );

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(
            width,
            height
        );

        renderer.setPixelRatio(
            Math.min(
                window.devicePixelRatio,
                2
            )
        );
    }
);

// ======================================================
// 39. SEKMEYE GERİ DÖNÜLDÜĞÜNDE
// ======================================================

document.addEventListener(
    "visibilitychange",
    () => {
        if (document.hidden) {
            return;
        }

        controls.update();
        preventCameraEnteringSaturn();
    }
);

// ======================================================
// 40. DEBUG
// ======================================================

console.log(
    "Satürn sahnesi başlatıldı."
);

console.table(
    Object.values(RING_DATA).map(
        (ring) => ({
            halka: ring.name,
            icKm: ring.innerKm,
            disKm: ring.outerKm,
            icScene:
                ring.innerRadius.toFixed(3),
            disScene:
                ring.outerRadius.toFixed(3)
        })
    )
);