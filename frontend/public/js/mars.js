import * as THREE from "three";

import {
    OrbitControls
} from "three/addons/controls/OrbitControls.js";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";

import {
    DRACOLoader
} from "three/addons/loaders/DRACOLoader.js";

import {
    initMarsMoons,
    updateMarsMoons,
    setMarsMoonsEnabled
} from "./mars-moons.js";

import {
    initMarsComparison,
    updateMarsComparison
} from "./mars-compare.js";


// ======================================================
// 1. HTML ELEMENTLERİ
// ======================================================

const container =
    document.getElementById(
        "mars-scene"
    );


const infoContent =
    document.getElementById(
        "info-content"
    );


const loadingMessage =
    document.getElementById(
        "loading-message"
    );


if (
    !container
) {

    throw new Error(
        "#mars-scene bulunamadı."
    );

}


// ======================================================
// 2. SAHNE
// ======================================================

const scene =
    new THREE.Scene();


scene.background =
    new THREE.Color(
        0x02040a
    );


// ======================================================
// 3. KAMERA
// ======================================================

const camera =
    new THREE.PerspectiveCamera(

        45,

        container.clientWidth
        /
        container.clientHeight,

        0.01,

        100

    );


camera.position.set(

    0,

    0,

    3.7

);


// ======================================================
// 4. RENDERER
// ======================================================

const renderer =
    new THREE.WebGLRenderer({

        antialias:
            true

    });


renderer.setSize(

    container.clientWidth,

    container.clientHeight

);


renderer.setPixelRatio(

    Math.min(

        window.devicePixelRatio,

        2

    )

);


renderer.outputColorSpace =
    THREE.SRGBColorSpace;


renderer.toneMapping =
    THREE.ACESFilmicToneMapping;


renderer.toneMappingExposure =
    1.1;


renderer.domElement.style.display =
    "block";


container.appendChild(

    renderer.domElement

);


// ======================================================
// 5. ORBIT CONTROLS
// ======================================================

const controls =
    new OrbitControls(

        camera,

        renderer.domElement

    );


controls.enableDamping =
    true;


controls.dampingFactor =
    0.06;


controls.enablePan =
    false;


controls.minDistance =
    1.6;


controls.maxDistance =
    16;


controls.rotateSpeed =
    0.55;


controls.zoomSpeed =
    0.8;


controls.target.set(

    0,

    0,

    0

);


controls.update();


// ======================================================
// 6. IŞIKLAR
// ======================================================

scene.add(

    new THREE.AmbientLight(

        0xffffff,

        0.42

    )

);


const mainLight =
    new THREE.DirectionalLight(

        0xfff4e8,

        2.4

    );


mainLight.position.set(

    4,

    2.5,

    5

);


scene.add(
    mainLight
);


const fillLight =
    new THREE.DirectionalLight(

        0xb9d9ff,

        0.35

    );


fillLight.position.set(

    -5,

    1,

    3

);


scene.add(
    fillLight
);


const hemisphereLight =
    new THREE.HemisphereLight(

        0xffe0c2,

        0x172033,

        0.55

    );


scene.add(
    hemisphereLight
);


// ======================================================
// 7. YILDIZ ALANI
// ======================================================

function createStars() {

    const count =
        1700;


    const positions =
        new Float32Array(

            count * 3

        );


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const radius =

            8
            +
            Math.random()
            *
            28;


        const theta =

            Math.random()
            *
            Math.PI
            *
            2;


        const phi =

            Math.acos(

                2
                *
                Math.random()
                -
                1

            );


        positions[i * 3] =

            radius
            *
            Math.sin(phi)
            *
            Math.cos(theta);


        positions[i * 3 + 1] =

            radius
            *
            Math.cos(phi);


        positions[i * 3 + 2] =

            radius
            *
            Math.sin(phi)
            *
            Math.sin(theta);

    }


    const geometry =
        new THREE.BufferGeometry();


    geometry.setAttribute(

        "position",

        new THREE.BufferAttribute(

            positions,

            3

        )

    );


    const material =
        new THREE.PointsMaterial({

            color:
                0xffffff,

            size:
                0.024,

            transparent:
                true,

            opacity:
                0.65

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
// 8. MARS ROOT
// ======================================================

const marsRoot =
    new THREE.Group();


scene.add(
    marsRoot
);


// ======================================================
// 9. PHOBOS + DEIMOS
// ======================================================

initMarsMoons({

    parent:
        marsRoot,

    renderer,

    camera,

    controls

});


// ======================================================
// 10. DÜNYA KARŞILAŞTIRMASI
// ======================================================

initMarsComparison({

    scene,

    marsRoot,

    renderer,

    camera,

    controls

});


// ======================================================
// 11. STATE
// ======================================================

let marsLoaded =
    false;


let satelliteInspectMode =
    false;


let compareMode =
    false;


// ======================================================
// 12. KARŞILAŞTIRMA EVENTİ
// ======================================================

window.addEventListener(

    "mars-compare-change",

    (event) => {

        compareMode =
            Boolean(
                event.detail.active
            );


        // ==================================================
        // KARŞILAŞTIRMADA UYDULAR TAMAMEN KAPANIR
        // ==================================================
        //
        // Phobos
        // Deimos
        // yörünge çizgileri
        // isimler
        // hitbox'lar
        // sağ alt kartlar
        //

        setMarsMoonsEnabled(
            !compareMode
        );

    }

);


// ======================================================
// 13. UYDU İNCELEME EVENTİ
// ======================================================

window.addEventListener(

    "mars-satellite-inspection-change",

    (event) => {

        satelliteInspectMode =
            Boolean(
                event.detail.active
            );

    }

);


// ======================================================
// 14. MARS PANELİNE DÖN
// ======================================================

window.addEventListener(

    "mars-overview-requested",

    () => {

        showMarsOverview();

    }

);


// ======================================================
// 15. MARKER KALİBRASYONU
// ======================================================
//
// Yeni Blender Mars texture'ı ile koordinat sisteminin
// yönünü eşleştiren boylam offset'i.
//
// Şu an senin modelinde 90° kullanıyoruz.
//

const MARS_LONGITUDE_OFFSET_DEG =
    90;


// ======================================================
// 16. MARS GENEL BİLGİ PANELİ
// ======================================================

function showMarsOverview() {

    if (
        !infoContent
    ) {
        return;
    }


    infoContent.innerHTML = `

        <p class="info-kicker">

            GÜNEŞ SİSTEMİ · 4. GEZEGEN

        </p>


        <h1 class="info-title">

            Mars

        </h1>


        <p class="info-lead">

            Mars, yüzeyindeki demir minerallerinin
            oksitlenmesi nedeniyle kızıl görünür.

            Dev volkanları, kilometrelerce uzanan
            kanyonları ve geçmişte sıvı suyun
            bulunduğuna dair güçlü kanıtlarıyla
            Güneş Sistemi'nin en çok araştırılan
            gezegenlerinden biridir.

        </p>


        <div class="quick-stats">


            <div class="quick-stat">

                <span>
                    Çap
                </span>

                <strong>
                    6.779 km
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Güneş'e uzaklık
                </span>

                <strong>
                    ≈ 228 milyon km
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Yerçekimi
                </span>

                <strong>
                    3,71 m/s²
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Bir Mars günü
                </span>

                <strong>
                    ≈ 24 sa 39 dk
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Bir Mars yılı
                </span>

                <strong>
                    687 Dünya günü
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Doğal uydu
                </span>

                <strong>
                    2
                </strong>

            </div>

        </div>


        <section class="info-section">

            <h2 class="info-section-title">

                Neden kızıl?

            </h2>


            <p>

                Mars toprağında bulunan demir içeren
                mineraller zamanla oksitlenmiştir.

                Dünya'daki pas oluşumuna benzeyen
                bu süreç, yüzeye karakteristik
                kırmızı-turuncu rengini verir.

            </p>

        </section>


        <section class="info-section">

            <h2 class="info-section-title">

                Mars'ta su var mı?

            </h2>


            <p>

                Bugün Mars yüzeyinde uzun süre
                sıvı halde kalabilen büyük su
                kütleleri bulunmaz.

                Ancak kutuplarda ve yer altında
                önemli miktarda su buzu vardır.

                Eski nehir yatakları ve göl
                tortulları ise geçmişte Mars'ın
                çok daha ıslak olduğunu gösterir.

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

}


showMarsOverview();


// ======================================================
// 17. MODEL NORMALİZE
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

        2
        /
        largestSide

    );


    return wrapper;

}


// ======================================================
// 18. MODEL MATERYALLERİ
// ======================================================

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
// 19. MARS YÜZEY NOKTALARI
// ======================================================

const marsMarkers =
    [];


let hoveredMarker =
    null;


// ======================================================
// 20. ENLEM / BOYLAM → 3B
// ======================================================

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

            +

            MARS_LONGITUDE_OFFSET_DEG

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
// 21. KOORDİNAT FORMAT
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


// ======================================================
// 22. KONUM METNİ
// ======================================================

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


// ======================================================
// 23. MARS MARKER OLUŞTUR
// ======================================================

function createMarsMarker(
    point
) {

    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        640;


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
        "rgba(255,255,255,0.84)";


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
    // İSİM
    // ==================================================

    context.font =
        "600 32px Arial";


    context.textAlign =
        "left";


    context.textBaseline =
        "middle";


    context.strokeStyle =
        "rgba(2,4,10,0.96)";


    context.lineWidth =
        8;


    context.strokeText(

        point.name,

        115,

        42

    );


    context.fillStyle =
        "#ffffff";


    context.fillText(

        point.name,

        115,

        42

    );


    // ==================================================
    // SPRITE
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

            point.latitude,

            point.longitude

        )

    );


    sprite.scale.set(

        0.58,

        0.135,

        1

    );


    sprite.center.set(

        0.14,

        0.72

    );


    sprite.userData.point =
        point;


    sprite.visible =
        false;


    sprite.renderOrder =
        20;


    marsRoot.add(
        sprite
    );


    marsMarkers.push(
        sprite
    );

}


// ======================================================
// 24. JSON'DAN MARS NOKTALARINI YÜKLE
// ======================================================

async function loadMarsPoints() {

    try {

        const response =

            await fetch(

                "../assets/data/mars-points.json"

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


        const points =

            Array.isArray(data)

                ?

                data

                :

                data.points;


        if (
            !Array.isArray(points)
        ) {

            throw new Error(

                "Mars yüzey noktaları bulunamadı."

            );

        }


        points.forEach(
            createMarsMarker
        );


        console.log(

            `${points.length} Mars yüzey noktası yüklendi.`

        );

    }

    catch (
        error
    ) {

        console.error(

            "Mars yüzey noktaları yüklenemedi:",

            error

        );

    }

}


loadMarsPoints();


// ======================================================
// 25. YÜZEY NOKTASI BİLGİ PANELİ
// ======================================================

function showMarsPointInfo(
    point
) {

    if (
        !infoContent
    ) {
        return;
    }


    infoContent.innerHTML = `

        <p class="info-kicker">

            MARS YÜZEYİ · ${point.type.toUpperCase()}

        </p>


        <h1 class="info-title">

            ${point.name}

        </h1>


        <p class="crater-coordinate">

            ${createLocationText(
                point.latitude,
                point.longitude
            )}

        </p>


        <div class="quick-stats">


            <div class="quick-stat">

                <span>
                    Tür
                </span>

                <strong>
                    ${point.type}
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Boyut
                </span>

                <strong>
                    ${point.size}
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Enlem
                </span>

                <strong>

                    ${formatCoordinate(
                        point.latitude,
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
                        point.longitude,
                        "E",
                        "W"
                    )}

                </strong>

            </div>

        </div>


        <section class="info-section">

            <h2 class="info-section-title">

                Bu bölgeyi keşfet

            </h2>


            <p>

                ${point.description}

            </p>

        </section>


        <div class="info-actions">

            <button
                id="back-to-mars"
                class="secondary-action"
                type="button"
            >

                ← MARS BİLGİLERİNE DÖN

            </button>

        </div>

    `;


    document
        .getElementById(
            "back-to-mars"
        )
        ?.addEventListener(

            "click",

            showMarsOverview

        );

}
// ======================================================
// 26. MARS MODELİ
// ======================================================

const dracoLoader =
    new DRACOLoader();


dracoLoader.setDecoderPath(

    "https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/libs/draco/"

);


const loader =
    new GLTFLoader();


loader.setDRACOLoader(
    dracoLoader
);


// ======================================================
// 27. MARS GLB YÜKLE
// ======================================================

loader.load(

    "../assets/models/mars/mars.glb",


    // ==================================================
    // BAŞARILI YÜKLEME
    // ==================================================

    (gltf) => {

        const marsModel =
            gltf.scene;


        improveModelMaterials(
            marsModel
        );


        const normalizedMars =
            normalizeModel(
                marsModel
            );


        // Yeni Blender modelimizin yönü.
        //
        // Marker konumlarını
        // MARS_LONGITUDE_OFFSET_DEG
        // ile kalibre ediyoruz.
        normalizedMars.rotation.set(

            0,

            0,

            0

        );


        marsRoot.add(
            normalizedMars
        );


        marsLoaded =
            true;


        loadingMessage?.remove();


        console.log(

            "Mars modeli başarıyla yüklendi."

        );

    },


    // ==================================================
    // LOADING
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

            `Mars modeli yükleniyor · %${percent}`;

    },


    // ==================================================
    // HATA
    // ==================================================

    (error) => {

        console.error(

            "Mars modeli yüklenemedi:",

            error

        );


        if (
            loadingMessage
        ) {

            loadingMessage.textContent =

                "Mars modeli yüklenemedi.";

        }

    }

);


// ======================================================
// 28. MARS MARKER RAYCASTER
// ======================================================

const raycaster =
    new THREE.Raycaster();


const pointer =
    new THREE.Vector2();


// ======================================================
// 29. POINTER KONUMU
// ======================================================

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
// 30. MARKER HOVER
// ======================================================

renderer
    .domElement
    .addEventListener(

        "pointermove",

        (event) => {

            // Dünya karşılaştırmasında
            // Mars yüzey markerları etkileşime girmez.
            if (
                compareMode
            ) {

                hoveredMarker =
                    null;


                return;

            }


            // Uydu inceleme modunda da
            // yüzey markerları etkileşime girmez.
            if (
                satelliteInspectMode
            ) {

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

                marsMarkers.filter(

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


            if (
                hoveredMarker
            ) {

                renderer
                    .domElement
                    .style
                    .cursor =
                    "pointer";

            }

        }

    );


// ======================================================
// 31. MARKER CLICK
// ======================================================

renderer
    .domElement
    .addEventListener(

        "click",

        (event) => {

            if (
                compareMode
                ||
                satelliteInspectMode
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

                marsMarkers.filter(

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


            const point =

                hits[0]
                    .object
                    .userData
                    .point;


            if (
                point
            ) {

                showMarsPointInfo(
                    point
                );

            }

        }

    );


// ======================================================
// 32. MARKER ÖN / ARKA YÜZ KONTROLÜ
// ======================================================
//
// Mars'ın kameraya dönük olmayan tarafındaki
// yüzey etiketlerini gizler.
//

const markerWorld =
    new THREE.Vector3();


const marsWorld =
    new THREE.Vector3();


const surfaceDirection =
    new THREE.Vector3();


const cameraDirection =
    new THREE.Vector3();


function updateMarkerVisibility() {

    // ==================================================
    // MARKERLARIN TAMAMEN KAPALI OLDUĞU MODLAR
    // ==================================================

    if (
        !marsLoaded
        ||
        satelliteInspectMode
        ||
        compareMode
    ) {

        marsMarkers.forEach(

            (marker) => {

                marker.visible =
                    false;

            }

        );


        return;

    }


    // ==================================================
    // MARS MERKEZİ
    // ==================================================

    marsRoot.getWorldPosition(
        marsWorld
    );


    // ==================================================
    // MARS'TAN KAMERAYA BAKAN VEKTÖR
    // ==================================================

    cameraDirection

        .copy(
            camera.position
        )

        .sub(
            marsWorld
        )

        .normalize();


    // ==================================================
    // HER MARKER İÇİN ÖN / ARKA KONTROL
    // ==================================================

    marsMarkers.forEach(

        (marker) => {

            marker.getWorldPosition(
                markerWorld
            );


            surfaceDirection

                .copy(
                    markerWorld
                )

                .sub(
                    marsWorld
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
// 33. MARKER BOYUTUNU ZOOMA GÖRE AYARLA
// ======================================================

function updateMarkerScale() {

    if (
        compareMode
        ||
        satelliteInspectMode
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
            3.7,

            0.28,

            1

        );


    marsMarkers.forEach(

        (marker) => {

            const isHovered =

                marker ===
                hoveredMarker;


            const baseWidth =

                isHovered

                    ?

                    0.66

                    :

                    0.58;


            const baseHeight =

                isHovered

                    ?

                    0.152

                    :

                    0.135;


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
// 34. MARS MODELİ YÜKLENDİ Mİ?
// ======================================================
//
// Gerekirse diğer modüllerin kullanabilmesi için
// küçük bir yardımcı event gönderiyoruz.
//

function notifyMarsReady() {

    if (
        !marsLoaded
    ) {

        return;

    }


    window.dispatchEvent(

        new CustomEvent(

            "mars-model-ready",

            {

                detail: {

                    ready:
                        true

                }

            }

        )

    );

}


// ======================================================
// 35. KAMERA CURSOR DAVRANIŞI
// ======================================================
//
// OrbitControls kullanırken:
//
// normal durumda grab
// sürüklerken grabbing
//
// Marker / uydu hover sistemi gerektiğinde
// bunu pointer'a çevirebilir.
//

renderer
    .domElement
    .addEventListener(

        "pointerdown",

        () => {

            if (
                compareMode
            ) {

                renderer
                    .domElement
                    .style
                    .cursor =
                    "grabbing";


                return;

            }


            if (
                !hoveredMarker
            ) {

                renderer
                    .domElement
                    .style
                    .cursor =
                    "grabbing";

            }

        }

    );


window.addEventListener(

    "pointerup",

    () => {

        if (
            !hoveredMarker
        ) {

            renderer
                .domElement
                .style
                .cursor =
                "grab";

        }

    }

);


// ======================================================
// 36. KARŞILAŞTIRMA MODU EK KONTROLLERİ
// ======================================================

window.addEventListener(

    "mars-compare-change",

    (event) => {

        const active =
            Boolean(
                event.detail.active
            );


        if (
            active
        ) {

            hoveredMarker =
                null;


            renderer
                .domElement
                .style
                .cursor =
                "grab";


            // Karşılaştırmada Mars yüzey etiketlerini
            // anında kapat.
            marsMarkers.forEach(

                (marker) => {

                    marker.visible =
                        false;

                }

            );

        }

    }

);


// ======================================================
// 37. UYDU İNCELEME MODU EK KONTROLLERİ
// ======================================================

window.addEventListener(

    "mars-satellite-inspection-change",

    (event) => {

        const active =
            Boolean(
                event.detail.active
            );


        if (
            active
        ) {

            hoveredMarker =
                null;


            marsMarkers.forEach(

                (marker) => {

                    marker.visible =
                        false;

                }

            );

        }

    }

);

// ======================================================
// MARS - KAMERANIN GEZEGENİN İÇİNE GİRMESİNİ ENGELLE
// ======================================================

const MARS_SAFE_CAMERA_DISTANCE =
    1.08;


const marsSafeCenter =
    new THREE.Vector3();


const marsSafeDirection =
    new THREE.Vector3();


function preventCameraEnteringMars() {

    // Phobos veya Deimos inceleniyorsa
    // bu sınırlamayı kullanma.
    if (
        satelliteInspectMode
        ||
        compareMode
    ) {
        return;
    }


    // Mars'ın sahnedeki gerçek merkezini bul.
    marsRoot.getWorldPosition(
        marsSafeCenter
    );


    // Kameranın Mars merkezinden yönü.
    marsSafeDirection

        .copy(
            camera.position
        )

        .sub(
            marsSafeCenter
        );


    const distance =
        marsSafeDirection.length();


    // Kamera zaten güvenli bölgedeyse dokunma.
    if (
        distance >=
        MARS_SAFE_CAMERA_DISTANCE
    ) {
        return;
    }


    // Kamera Mars'ın içine girdiyse
    // yüzeyin hemen dışına geri taşı.
    marsSafeDirection

        .normalize()

        .multiplyScalar(
            MARS_SAFE_CAMERA_DISTANCE
        );


    camera.position.copy(
        marsSafeCenter
            .clone()
            .add(
                marsSafeDirection
            )
    );

}
// ======================================================
// 38. ANA ANİMASYON
// ======================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    // ==================================================
    // PHOBOS + DEIMOS
    // ==================================================
    //
    // Date.now() kullanıldığı için
    // simülasyon gerçek zaman hızında ilerler.
    //

    updateMarsMoons(
        Date.now()
    );


    // ==================================================
    // MARS ↔ DÜNYA KARŞILAŞTIRMASI
    // ==================================================

    updateMarsComparison();


    // ==================================================
    // ORBIT CONTROLS
    // ==================================================

    controls.update();

    preventCameraEnteringMars();
    // ==================================================
    // MARS YÜZEY ETİKETLERİ
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
// 39. MARS READY KONTROLÜ
// ======================================================
//
// Mars modeli async yüklendiği için
// belirli aralıklarla kontrol ediyoruz.
// Model yüklenince tek sefer event gönderiyoruz.
//

let marsReadyNotified =
    false;


function checkMarsReady() {

    if (
        marsReadyNotified
    ) {

        return;

    }


    if (
        marsLoaded
    ) {

        marsReadyNotified =
            true;


        notifyMarsReady();


        return;

    }


    requestAnimationFrame(
        checkMarsReady
    );

}


checkMarsReady();


// ======================================================
// 40. RESPONSIVE
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
// 41. SAYFA GÖRÜNÜRLÜĞÜ
// ======================================================
//
// Sekmeden çıkılıp tekrar dönüldüğünde
// OrbitControls'un garip bir delta bırakmasını önler.
//

document.addEventListener(

    "visibilitychange",

    () => {

        if (
            document.hidden
        ) {

            return;

        }


        controls.update();

    }

);


// ======================================================
// 42. BAŞLANGIÇ CURSOR
// ======================================================

renderer
    .domElement
    .style
    .cursor =
    "grab";


// ======================================================
// 43. DEBUG
// ======================================================

console.log(

    "Mars sahnesi başlatıldı."

);