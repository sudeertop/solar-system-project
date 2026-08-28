import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { initLRO, lroState } from "./lro.js";

// ======================================================
// 1. HTML ELEMENTLERİ
// ======================================================

const container = document.getElementById("moon-scene");
const infoContent = document.getElementById("info-content");
const loadingMessage = document.getElementById("loading-message");
const compareLabels = document.getElementById("compare-labels");

if (!container) {
    throw new Error("#moon-scene bulunamadı.");
}

// ======================================================
// 2. SAHNE + KAMERA + RENDERER
// ======================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02040a);

const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.01,
    100
);

camera.position.set(0, 0, 3.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.domElement.style.display = "block";
container.appendChild(renderer.domElement);

// ======================================================
// 3. ORBIT CONTROLS
// ======================================================

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 1.6;
controls.maxDistance = 18;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.8;
controls.target.set(0, 0, 0);
controls.update();

// ======================================================
// 4. IŞIKLAR
// ======================================================

scene.add(new THREE.AmbientLight(0xffffff, 0.52));

const hemisphereLight = new THREE.HemisphereLight(
    0xdbeafe,
    0x29384e,
    0.75
);
scene.add(hemisphereLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
mainLight.position.set(3, 3, 5);
scene.add(mainLight);

const leftFill = new THREE.DirectionalLight(0xb9d9ff, 0.3);
leftFill.position.set(-5, 1, 3);
scene.add(leftFill);

// ======================================================
// 5. YILDIZLAR
// ======================================================

function createStars() {
    const count = 1700;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const radius = 8 + Math.random() * 28;
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
        new THREE.BufferAttribute(
            positions,
            3
        )
    );

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.024,
        transparent: true,
        opacity: 0.65
    });

    scene.add(
        new THREE.Points(
            geometry,
            material
        )
    );
}

createStars();

// ======================================================
// 6. AY + DÜNYA GRUPLARI
// ======================================================

const moonRoot = new THREE.Group();

scene.add(
    moonRoot
);

// LRO artık Ay'ın çocuğu.
// Ay hareket ederse LRO ve yörüngesi de onunla hareket eder.

initLRO(
    moonRoot,
    renderer,
    camera,
    controls
);

const earthRoot =
    new THREE.Group();

earthRoot.visible =
    false;

scene.add(
    earthRoot
);

let moonLoaded =
    false;

let earthLoaded =
    false;

let compareMode =
    false;

// ======================================================
// 7. GENEL VERİLER
// ======================================================

const MOON_DIAMETER =
    3474.8;

const EARTH_DIAMETER =
    12756;

const EARTH_MOON_SIZE_RATIO =
    EARTH_DIAMETER /
    MOON_DIAMETER;

// ======================================================
// 8. SOL PANEL — AY GENEL BİLGİSİ
// ======================================================

function showMoonOverview() {

    if (!infoContent) {
        return;
    }

    infoContent.innerHTML = `

        <p class="info-kicker">
            DÜNYA'NIN DOĞAL UYDUSU
        </p>

        <h1 class="info-title">
            Ay
        </h1>

        <p class="info-lead">

            Dünya'nın tek doğal uydusu olan Ay,
            gezegenimizin oluşumundan kısa süre sonra
            şekillendi ve Güneş Sistemi'nin milyarlarca
            yıllık çarpışma geçmişini yüzeyinde korudu.

        </p>

        <div class="quick-stats">

            <div class="quick-stat">
                <span>Yaş</span>
                <strong>≈ 4,5 milyar yıl</strong>
            </div>

            <div class="quick-stat">
                <span>Çap</span>
                <strong>3.474,8 km</strong>
            </div>

            <div class="quick-stat">
                <span>Kütle</span>
                <strong>7,35 × 10²² kg</strong>
            </div>

            <div class="quick-stat">
                <span>Yerçekimi</span>
                <strong>1,62 m/s²</strong>
            </div>

            <div class="quick-stat">
                <span>Dünya'ya uzaklık</span>
                <strong>≈ 384.400 km</strong>
            </div>

            <div class="quick-stat">
                <span>Sıcaklık</span>
                <strong>−173 °C / +127 °C</strong>
            </div>

        </div>

        <section class="info-section">

            <h2 class="info-section-title">
                Ay nasıl oluştu?
            </h2>

            <p>

                En güçlü oluşum modeli, genç Dünya'ya
                Mars büyüklüğünde bir gök cisminin
                çarpmasıyla uzaya savrulan maddelerin
                zamanla birleşerek Ay'ı oluşturduğunu
                öne sürer. Yeni oluşan Ay'ın yüzeyi
                başlangıçta büyük ölçüde erimiş haldeydi.

            </p>

        </section>

        <section class="info-section">

            <h2 class="info-section-title">
                Kraterler nasıl oluştu?
            </h2>

            <p>

                Asteroitler, meteoroidler ve
                kuyrukluyıldızlar çok yüksek hızlarla
                Ay yüzeyine çarptığında kayaçları
                parçalar ve yüzeyden dışarı savurur.
                Ay'da yoğun bir atmosfer, yağmur,
                rüzgâr ve Dünya'daki kadar etkin
                yüzey yenileme süreçleri bulunmadığı
                için bu izler milyarlarca yıl boyunca
                korunabilir.

            </p>

        </section>

        <div class="info-actions">

            <button
                id="compare-button"
                class="primary-action"
                type="button"
                ${earthLoaded ? "" : "disabled"}
            >

                ${
                    earthLoaded
                        ?
                        "DÜNYA İLE KARŞILAŞTIR"
                        :
                        "DÜNYA MODELİ YÜKLENİYOR"
                }

            </button>

        </div>

    `;

    const compareButton =
        document.getElementById(
            "compare-button"
        );

    if (
        compareButton
        &&
        earthLoaded
    ) {

        compareButton.addEventListener(
            "click",
            enterCompareMode
        );

    }
}


// LRO panelindeki
// "Ay bilgilerine dön" butonu bunu tetikliyor.
//
// ÖNEMLİ:
// Bu listener showMoonOverview fonksiyonunun DIŞINDA.

window.addEventListener(
    "moon-overview-requested",
    () => {

        showMoonOverview();

    }
);

// ======================================================
// 9. KRATER PANELİ
// ======================================================

function showCraterInfo(
    crater
) {

    if (
        compareMode
        ||
        !infoContent
    ) {

        return;

    }

    const locationText =
        createLocationText(
            crater.latitude,
            crater.longitude
        );

    infoContent.innerHTML = `

        <p class="info-kicker">
            AY YÜZEYİ · ÇARPMA KRATERİ
        </p>

        <h1 class="info-title">
            ${crater.name}
        </h1>

        <p class="crater-coordinate">
            ${locationText}
        </p>

        <div class="quick-stats">

            <div class="quick-stat">

                <span>
                    Çap
                </span>

                <strong>
                    ${crater.diameter} km
                </strong>

            </div>

            <div class="quick-stat">

                <span>
                    Enlem
                </span>

                <strong>

                    ${formatCoordinate(
                        crater.latitude,
                        "N",
                        "S"
                    )}

                </strong>

            </div>

            <div class="quick-stat">

                <span>
                    Boylam
                </span>

                <strong>

                    ${formatCoordinate(
                        crater.longitude,
                        "E",
                        "W"
                    )}

                </strong>

            </div>

        </div>

        <section class="info-section">

            <h2 class="info-section-title">
                Bu krateri keşfet
            </h2>

            <p>
                ${crater.description}
            </p>

        </section>

        <div class="info-actions">

            <button
                id="back-to-moon"
                class="secondary-action"
                type="button"
            >

                ← AY BİLGİLERİNE DÖN

            </button>

        </div>

    `;

    document
        .getElementById(
            "back-to-moon"
        )
        ?.addEventListener(
            "click",
            showMoonOverview
        );
}

// ======================================================
// 10. KARŞILAŞTIRMA PANELİ
// ======================================================

function showComparisonInfo() {

    if (!infoContent) {
        return;
    }

    infoContent.innerHTML = `

        <p class="info-kicker">
            GERÇEK BOYUT ORANI
        </p>

        <h1 class="info-title">
            Ay × Dünya
        </h1>

        <p class="info-lead">

            Modeller aynı ölçek sistemi içinde
            gösteriliyor. Dünya'nın çapı Ay'ın
            çapının yaklaşık 3,67 katıdır.
            Yaklaşıp uzaklaşarak boyut farkını
            doğrudan inceleyebilirsin.

        </p>

        <table class="compare-table">

            <thead>

                <tr>

                    <th>
                        Özellik
                    </th>

                    <th>
                        Ay
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
                            3.474,8 km
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
                        7,35 × 10²² kg
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
                        1,62 m/s²
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
                        ≈ 27,3 gün
                    </td>

                    <td>
                        ≈ 23,9 saat
                    </td>

                </tr>

                <tr>

                    <td>
                        Sıcaklık
                    </td>

                    <td>
                        −173 / +127 °C
                    </td>

                    <td>
                        −88 / +58 °C
                    </td>

                </tr>

                <tr>

                    <td>
                        Atmosfer
                    </td>

                    <td>
                        Çok ince ekzosfer
                    </td>

                    <td>
                        Yoğun atmosfer
                    </td>

                </tr>

            </tbody>

        </table>

        <div class="info-actions">

            <button
                id="exit-compare"
                class="secondary-action"
                type="button"
            >

                ← AY KEŞİF MODUNA DÖN

            </button>

        </div>

    `;

    document
        .getElementById(
            "exit-compare"
        )
        ?.addEventListener(
            "click",
            exitCompareMode
        );
}

// ======================================================
// 11. KARŞILAŞTIRMA MODU
// ======================================================

function enterCompareMode() {

    if (!earthLoaded) {
        return;
    }

    compareMode =
        true;

    if (
        lroState.root
    ) {

        lroState.root.visible =
            false;

    }

    earthRoot.visible =
        true;

    moonRoot.position.set(
        -2.8,
        0,
        0
    );

    earthRoot.position.set(
        2.1,
        0,
        0
    );

    earthRoot.scale.setScalar(
        EARTH_MOON_SIZE_RATIO
    );

    controls.target.set(
        1.0,
        0,
        0
    );

    camera.position.set(
        1.0,
        0,
        12.5
    );

    controls.minDistance =
        6;

    controls.maxDistance =
        25;

    controls.update();

    compareLabels?.classList.add(
        "visible"
    );

    compareLabels?.setAttribute(
        "aria-hidden",
        "false"
    );

    showComparisonInfo();
}

function exitCompareMode() {

    compareMode =
        false;

    if (
        lroState.root
    ) {

        lroState.root.visible =
            true;

    }

    earthRoot.visible =
        false;

    earthRoot.scale.setScalar(
        1
    );

    moonRoot.position.set(
        0,
        0,
        0
    );

    earthRoot.position.set(
        0,
        0,
        0
    );

    controls.target.set(
        0,
        0,
        0
    );

    camera.position.set(
        0,
        0,
        3.5
    );

    controls.minDistance =
        1.6;

    controls.maxDistance =
        18;

    controls.update();

    compareLabels?.classList.remove(
        "visible"
    );

    compareLabels?.setAttribute(
        "aria-hidden",
        "true"
    );

    showMoonOverview();
}

// ======================================================
// 12. KOORDİNAT YARDIMCILARI
// ======================================================

function formatCoordinate(
    value,
    positive,
    negative
) {

    const direction =
        value >= 0
            ?
            positive
            :
            negative;

    return (
        `${Math.abs(value).toFixed(1)}° ${direction}`
    );
}

function createLocationText(
    latitude,
    longitude
) {

    return (

        formatCoordinate(
            latitude,
            "Kuzey",
            "Güney"
        )

        +

        " · "

        +

        formatCoordinate(
            longitude,
            "Doğu",
            "Batı"
        )

    );
}

function latLonToVector3(
    latitude,
    longitude,
    radius = 1.018
) {

    const lat =
        THREE.MathUtils.degToRad(
            latitude
        );

    const lon =
        THREE.MathUtils.degToRad(
            longitude
        );

    return new THREE.Vector3(

        radius
        *
        Math.cos(lat)
        *
        Math.sin(lon),

        radius
        *
        Math.sin(lat),

        radius
        *
        Math.cos(lat)
        *
        Math.cos(lon)

    );
}

// ======================================================
// 13. KRATER MARKERLARI
// ======================================================

const craterMarkers =
    [];

let hoveredMarker =
    null;

function createCraterMarker(
    crater
) {

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width =
        512;

    canvas.height =
        150;

    const context =
        canvas.getContext(
            "2d"
        );

    // ==================================================
    // NOKTA
    // ==================================================

    context.strokeStyle =
        "rgba(255,255,255,0.8)";

    context.lineWidth =
        3;

    context.beginPath();

    context.arc(
        80,
        40,
        13,
        0,
        Math.PI * 2
    );

    context.stroke();

    context.fillStyle =
        "#ffffff";

    context.shadowColor =
        "#ffffff";

    context.shadowBlur =
        12;

    context.beginPath();

    context.arc(
        80,
        40,
        5,
        0,
        Math.PI * 2
    );

    context.fill();

    context.shadowBlur =
        0;

    // ==================================================
    // KRATER ADI
    // ==================================================

    context.font =
        "600 35px Arial";

    context.textAlign =
        "left";

    context.textBaseline =
        "middle";

    context.strokeStyle =
        "rgba(2,4,10,0.95)";

    context.lineWidth =
        8;

    context.strokeText(
        crater.name,
        115,
        42
    );

    context.fillStyle =
        "#ffffff";

    context.fillText(
        crater.name,
        115,
        42
    );

    // ==================================================
    // THREE.JS SPRITE
    // ==================================================

    const texture =
        new THREE.CanvasTexture(
            canvas
        );

    texture.colorSpace =
        THREE.SRGBColorSpace;

    const material =
        new THREE.SpriteMaterial({

            map:
                texture,

            transparent:
                true,

            depthTest:
                false,

            depthWrite:
                false

        });

    const sprite =
        new THREE.Sprite(
            material
        );

    sprite.position.copy(

        latLonToVector3(

            crater.latitude,

            crater.longitude

        )

    );

    sprite.scale.set(
        0.52,
        0.15,
        1
    );

    sprite.center.set(
        0.15,
        0.72
    );

    sprite.userData.crater =
        crater;

    sprite.visible =
        false;

    sprite.renderOrder =
        20;

    moonRoot.add(
        sprite
    );

    craterMarkers.push(
        sprite
    );
}

// ======================================================
// KRATER VERİLERİNİ JSON'DAN AL
// ======================================================
async function loadCraters() {

    try {

        const response =
            await fetch(
                "../assets/data/moon-craters.json"
            );


        if (
            !response.ok
        ) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        const craters =
            Array.isArray(data)

                ?

                data

                :

                data.craters;


        if (
            !Array.isArray(craters)
        ) {

            throw new Error(
                "Krater listesi bulunamadı."
            );

        }


        craters.forEach(
            createCraterMarker
        );


        console.log(
            `${craters.length} krater yüklendi.`
        );

    }


    catch (error) {

        console.error(
            "Krater verileri yüklenemedi:",
            error
        );

    }

}


loadCraters();


// ======================================================
// 14. MODEL YARDIMCILARI
// ======================================================

function normalizeModel(
    model
) {

    model.updateMatrixWorld(
        true
    );


    const box =
        new THREE.Box3()
            .setFromObject(
                model
            );


    const size =
        box.getSize(
            new THREE.Vector3()
        );


    const center =
        box.getCenter(
            new THREE.Vector3()
        );


    model.position.sub(
        center
    );


    const largestSide =
        Math.max(

            size.x,

            size.y,

            size.z

        );


    const wrapper =
        new THREE.Group();


    wrapper.add(
        model
    );


    wrapper.scale.setScalar(
        2 / largestSide
    );


    return wrapper;

}


function improveModelMaterials(
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


                    material.needsUpdate =
                        true;

                }

            );

        }

    );

}


// ======================================================
// 15. AY MODELİ
// ======================================================

const loader =
    new GLTFLoader();


loader.load(

    "../assets/models/moon/moon.glb",


    // ==================================================
    // MODEL YÜKLENDİ
    // ==================================================

    (gltf) => {

        const moonModel =
            gltf.scene;


        improveModelMaterials(
            moonModel
        );


        const normalizedMoon =
            normalizeModel(
                moonModel
            );


        // Daha önce doğruladığımız yön.
        //
        // Modeli döndürüyoruz.
        // Krater koordinatları moonRoot üzerinde
        // kalmaya devam ediyor.

        normalizedMoon.rotation.y =

            THREE.MathUtils.degToRad(
                -90
            );


        moonRoot.add(
            normalizedMoon
        );


        moonLoaded =
            true;


        loadingMessage?.remove();


        console.log(
            "Ay modeli yüklendi."
        );

    },


    // ==================================================
    // YÜKLENME DURUMU
    // ==================================================

    (progress) => {

        if (
            !progress.total
            ||
            !loadingMessage
        ) {

            return;

        }


        const percent =

            Math.round(

                progress.loaded

                /

                progress.total

                *

                100

            );


        loadingMessage.textContent =

            `Ay modeli yükleniyor · %${percent}`;

    },


    // ==================================================
    // HATA
    // ==================================================

    (error) => {

        console.error(
            "Ay modeli yüklenemedi:",
            error
        );


        if (
            loadingMessage
        ) {

            loadingMessage.textContent =
                "Ay modeli yüklenemedi.";

        }

    }

);


// ======================================================
// 16. DÜNYA MODELİ
// ======================================================

loader.load(

    "../assets/models/earth/earth.glb",


    (gltf) => {

        const earthModel =
            gltf.scene;


        improveModelMaterials(
            earthModel
        );


        const normalizedEarth =
            normalizeModel(
                earthModel
            );


        earthRoot.add(
            normalizedEarth
        );


        earthLoaded =
            true;


        if (
            !compareMode
            &&
            !lroState.inspecting
        ) {

            showMoonOverview();

        }


        console.log(
            "Dünya modeli yüklendi."
        );

    },


    undefined,


    (error) => {

        console.error(
            "Dünya modeli yüklenemedi:",
            error
        );

    }

);


// ======================================================
// 17. RAYCASTER — KRATERLER
// ======================================================

const raycaster =
    new THREE.Raycaster();


const pointer =
    new THREE.Vector2();


function updatePointer(
    event
) {

    const rect =

        renderer
            .domElement
            .getBoundingClientRect();


    pointer.x =

        (
            (
                event.clientX
                -
                rect.left
            )

            /

            rect.width
        )

        *

        2

        -

        1;


    pointer.y =

        -

        (
            (
                event.clientY
                -
                rect.top
            )

            /

            rect.height
        )

        *

        2

        +

        1;

}


// ======================================================
// 18. KRATER HOVER
// ======================================================

renderer.domElement.addEventListener(

    "pointermove",


    (event) => {

        // Dünya karşılaştırmasında
        // kraterlerle etkileşim yok.
        //
        // Aynı şekilde LRO incelerken de
        // Ay yüzey markerları devre dışı.

        if (
            compareMode
            ||
            lroState.inspecting
        ) {

            renderer
                .domElement
                .style
                .cursor =
                "grab";


            hoveredMarker =
                null;


            return;

        }


        updatePointer(
            event
        );


        raycaster.setFromCamera(
            pointer,
            camera
        );


        const visibleMarkers =

            craterMarkers.filter(

                (marker) =>
                    marker.visible

            );


        const hits =

            raycaster.intersectObjects(
                visibleMarkers,
                false
            );


        hoveredMarker =

            hits.length > 0

                ?

                hits[0].object

                :

                null;


        renderer
            .domElement
            .style
            .cursor =

            hoveredMarker

                ?

                "pointer"

                :

                "grab";

    }

);


// ======================================================
// 19. KRATER TIKLAMA
// ======================================================

renderer.domElement.addEventListener(

    "click",


    (event) => {

        if (
            compareMode
            ||
            lroState.inspecting
        ) {

            return;

        }


        updatePointer(
            event
        );


        raycaster.setFromCamera(
            pointer,
            camera
        );


        const visibleMarkers =

            craterMarkers.filter(

                (marker) =>
                    marker.visible

            );


        const hits =

            raycaster.intersectObjects(
                visibleMarkers,
                false
            );


        if (
            hits.length === 0
        ) {

            return;

        }


        const crater =

            hits[0]
                .object
                .userData
                .crater;


        if (
            crater
        ) {

            showCraterInfo(
                crater
            );

        }

    }

);


// ======================================================
// 20. MARKER ÖN / ARKA YÜZ KONTROLÜ
// ======================================================

const markerWorld =
    new THREE.Vector3();


const moonWorld =
    new THREE.Vector3();


const surfaceDirection =
    new THREE.Vector3();


const cameraDirection =
    new THREE.Vector3();


function updateMarkerVisibility() {

    // ==================================================
    // MARKERLARIN KAPALI OLDUĞU DURUMLAR
    // ==================================================

    if (
        !moonLoaded
        ||
        compareMode
        ||
        lroState.inspecting
    ) {

        craterMarkers.forEach(

            (marker) => {

                marker.visible =
                    false;

            }

        );


        hoveredMarker =
            null;


        return;

    }


    // ==================================================
    // AY MERKEZİ
    // ==================================================

    moonRoot.getWorldPosition(
        moonWorld
    );


    // ==================================================
    // AY MERKEZİNDEN KAMERAYA YÖN
    // ==================================================

    cameraDirection

        .copy(
            camera.position
        )

        .sub(
            moonWorld
        )

        .normalize();


    // ==================================================
    // HER MARKER İÇİN ÖN / ARKA YÜZ
    // ==================================================

    craterMarkers.forEach(

        (marker) => {

            marker.getWorldPosition(
                markerWorld
            );


            surfaceDirection

                .copy(
                    markerWorld
                )

                .sub(
                    moonWorld
                )

                .normalize();


            const facing =

                surfaceDirection.dot(
                    cameraDirection
                );


            marker.visible =

                facing > 0.09;

        }

    );

}


// ======================================================
// 21. MARKER BOYUTU — ZOOMA GÖRE
// ======================================================

function updateMarkerScale() {

    if (
        compareMode
        ||
        lroState.inspecting
    ) {

        return;

    }


    const cameraDistance =

        camera.position.distanceTo(
            controls.target
        );


    const scaleFactor =

        THREE.MathUtils.clamp(

            cameraDistance

            /

            3.5,

            0.28,

            1

        );


    craterMarkers.forEach(

        (marker) => {

            const isHovered =

                marker ===
                hoveredMarker;


            const baseWidth =

                isHovered

                    ?

                    0.60

                    :

                    0.52;


            const baseHeight =

                isHovered

                    ?

                    0.175

                    :

                    0.15;


            marker.scale.set(

                baseWidth
                *
                scaleFactor,

                baseHeight
                *
                scaleFactor,

                1

            );

        }

    );

}


// ======================================================
// 22. AY KAMERA ÇARPIŞMA SİSTEMİ
// ======================================================
//
// EN ÖNEMLİ DEĞİŞİKLİK BURASI.
//
// Eski sürümde LRO'ya bakıldığında:
//
// controls.target Ay merkezinden uzaklaşıyor
// → kamera koruması kapanıyordu.
//
// Artık böyle bir istisna YOK.
//
// Kamera ister Ay'ı,
// ister LRO'yu hedeflesin,
// Ay küresinin içine fiziksel olarak giremez.
// ======================================================


// Ay modelini sahnede yarıçap = 1
// olacak şekilde normalize ettik.

const MOON_COLLISION_RADIUS =
    1.0;


// Kameranın yüzeyle tam aynı koordinata
// gelmesini de istemiyoruz.
//
// Bu yüzden 0.025 sahne birimi
// kadar dışarıda bırakıyoruz.

const MOON_CAMERA_CLEARANCE =
    0.025;


const MOON_SAFE_CAMERA_DISTANCE =

    MOON_COLLISION_RADIUS
    +
    MOON_CAMERA_CLEARANCE;


// Her frame yeniden Vector3 oluşturup
// garbage collector yükü yaratmamak için
// geçici vektörleri bir kez oluşturuyoruz.

const moonCollisionCenter =
    new THREE.Vector3();


const moonCollisionDirection =
    new THREE.Vector3();


// ======================================================
// KAMERA AY'IN İÇİNDE Mİ?
// ======================================================

function preventCameraEnteringMoon() {

    // ==================================================
    // DÜNYA KARŞILAŞTIRMASI
    // ==================================================
    //
    // Karşılaştırmada Ay moonRoot ile
    // -2.8 koordinatına taşınıyor.
    //
    // Orada kamera zaten uzakta ve
    // farklı bir kompozisyon kullanıyoruz.
    //
    // Bu yüzden korumayı kapatıyoruz.

    if (
        compareMode
    ) {

        return;

    }


    // ==================================================
    // AY'IN GERÇEK DÜNYA MERKEZİ
    // ==================================================

    moonRoot.getWorldPosition(
        moonCollisionCenter
    );


    // ==================================================
    // AY MERKEZİ → KAMERA VEKTÖRÜ
    // ==================================================

    moonCollisionDirection

        .copy(
            camera.position
        )

        .sub(
            moonCollisionCenter
        );


    const distanceFromMoonCenter =

        moonCollisionDirection.length();


    // ==================================================
    // ZATEN DIŞARIDAYSA BIRAK
    // ==================================================

    if (
        distanceFromMoonCenter
        >=
        MOON_SAFE_CAMERA_DISTANCE
    ) {

        return;

    }


    // ==================================================
    // ÇOK UÇ DURUM:
    // Kamera tam Ay merkezine geldiyse.
    // ==================================================
    //
    // Sıfır uzunluklu vektörü normalize etmek
    // sağlıklı olmadığı için +Z yönüne atıyoruz.

    if (
        distanceFromMoonCenter
        <
        0.000001
    ) {

        moonCollisionDirection.set(
            0,
            0,
            1
        );

    }

    else {

        moonCollisionDirection.normalize();

    }


    // ==================================================
    // KAMERAYI YÜZEYİN HEMEN DIŞINA İT
    // ==================================================

    moonCollisionDirection.multiplyScalar(
        MOON_SAFE_CAMERA_DISTANCE
    );


    camera.position

        .copy(
            moonCollisionCenter
        )

        .add(
            moonCollisionDirection
        );

}


// ======================================================
// 23. LRO MODU DEĞİŞİKLİĞİNDE CURSOR TEMİZLİĞİ
// ======================================================
//
// lroState.inspecting değişkeni lro.js tarafından
// yönetiliyor.
//
// Ayrı event zorunlu değil.
// Ana render loop her frame kontrol ediyor.
//
// Ancak kullanıcı bir kraterin üstündeyken LRO'ya
// tıklarsa eski pointer görünümü kalmasın diye
// basit bir temizlik yapıyoruz.

renderer.domElement.addEventListener(

    "pointerleave",

    () => {

        hoveredMarker =
            null;


        renderer
            .domElement
            .style
            .cursor =
            "grab";

    }

);


// ======================================================
// 24. BAŞLANGIÇ PANELİ
// ======================================================

showMoonOverview();


// ======================================================
// 25. ANA ANİMASYON
// ======================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    // ==================================================
    // ORBIT CONTROLS
    // ==================================================

    controls.update();


    // ==================================================
    // KAMERA ÇARPIŞMASI
    // ==================================================
    //
    // controls.update() SONRASINDA çalışması önemli.
    //
    // Kullanıcı mouse / scroll ile kamerayı hareket
    // ettirdikten sonra son pozisyonu kontrol ediyoruz.
    //
    // Böylece LRO'nun çevresinde dönerken bile
    // kamera Ay'ın içerisine geçemez.

    preventCameraEnteringMoon();


    // ==================================================
    // KRATER MARKERLARI
    // ==================================================

    updateMarkerVisibility();


    updateMarkerScale();


    // ==================================================
    // RENDER
    // ==================================================

    renderer.render(
        scene,
        camera
    );

}


animate();


// ======================================================
// 26. RESPONSIVE
// ======================================================

window.addEventListener(

    "resize",


    () => {

        const width =

            Math.max(

                container.clientWidth,

                1

            );


        const height =

            Math.max(

                container.clientHeight,

                1

            );


        camera.aspect =

            width

            /

            height;


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
// 27. SAYFA GERİ GELDİĞİNDE CONTROLS GÜNCELLE
// ======================================================

document.addEventListener(

    "visibilitychange",


    () => {

        if (
            document.hidden
        ) {

            return;

        }


        controls.update();


        preventCameraEnteringMoon();

    }

);


// ======================================================
// 28. BAŞLANGIÇ CURSOR
// ======================================================

renderer
    .domElement
    .style
    .cursor =
    "grab";


// ======================================================
// 29. DEBUG
// ======================================================

console.log(
    "Ay sahnesi başlatıldı."
);