import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";


// ======================================================
// 1. SABİTLER
// ======================================================

const AU_KM =
    149597870.7;

const DAY_MS =
    86400000;


// Gerçek ephemeris vektörlerinin tamamına
// aynı görsel sıkıştırma uygulanıyor.
//
// Böylece:
// - araçların birbirlerine göre gerçek yönleri korunuyor,
// - yörünge şekilleri uydurulmuyor,
// - ama SOHO 1 AU uzakta olduğu için sahne kullanılmaz
//   hale gelmiyor.
//
// Araçların kendi 3B boyutları ayrıca görsel olarak büyütülür.

const AU_TO_SCENE =
    35;


// ======================================================
// 2. UZAY ARACI AYARLARI
// ======================================================

const SPACECRAFT = {

    parker: {

        id:
            "parker",

        name:
            "Parker Solar Probe",

        shortName:
            "PARKER",

        modelPath:
            "/assets/models/sun/parker.glb",

        color:
            0xffb15c,

        visualDiameter:
            0.24,

        hitRadius:
            0.24,

        focusDistance:
            0.62,

        focusSide:
            0.34,

        focusHeight:
            0.18,

        trailDays:
            110
    },


    solarOrbiter: {

        id:
            "solarOrbiter",

        name:
            "Solar Orbiter",

        shortName:
            "SOLAR ORBITER",

        modelPath:
            "/assets/models/sun/solar-orbiter.glb",

        color:
            0x8bdcff,

        visualDiameter:
            0.28,

        hitRadius:
            0.26,

        focusDistance:
            0.72,

        focusSide:
            0.38,

        focusHeight:
            0.20,

        trailDays:
            220
    },


    soho: {

        id:
            "soho",

        name:
            "SOHO",

        shortName:
            "SOHO",

        modelPath:
            "/assets/models/sun/soho.glb",

        color:
            0xc8b8ff,

        visualDiameter:
            0.34,

        hitRadius:
            0.30,

        focusDistance:
            0.82,

        focusSide:
            0.42,

        focusHeight:
            0.22,

        trailDays:
            260
    }

};


// ======================================================
// 3. DIŞARIDAN OKUNABİLEN STATE
// ======================================================

export const sunSpacecraftState = {

    ready:
        false,

    mode:
        "sun",

    selectedId:
        null,

    interactionsEnabled:
        true
};


// ======================================================
// 4. THREE.JS REFERANSLARI
// ======================================================

let sceneRef =
    null;

let rootRef =
    null;

let cameraRef =
    null;

let rendererRef =
    null;

let controlsRef =
    null;

let infoScrollRef =
    null;

let infoContentRef =
    null;


// ======================================================
// 5. VERİLER
// ======================================================

let originalSunInfoHTML =
    "";

let spacecraftInfo =
    {};

let trajectoryData =
    {};


// ======================================================
// 6. MODEL STATE
// ======================================================

const systems =
    new Map();

const hitboxes =
    [];


// ======================================================
// 7. UI / KAMERA STATE
// ======================================================

let selectorRoot =
    null;

let labelLayer =
    null;

let savedView =
    null;

let cameraTween =
    null;

let pointerDown =
    null;

let lastSelectedScenePosition =
    null;

let lastInfoUpdate =
    0;


// ======================================================
// 8. THREE.JS YARDIMCILARI
// ======================================================

const raycaster =
    new THREE.Raycaster();

const pointer =
    new THREE.Vector2();

const loader =
    new GLTFLoader();

const tmpWorldPosition =
    new THREE.Vector3();

const tmpProjected =
    new THREE.Vector3();

const tmpCameraDirection =
    new THREE.Vector3();

const tmpToObject =
    new THREE.Vector3();


// ======================================================
// 9. VIEW MODE EVENT
// ======================================================

function dispatchModeChange() {

    window.dispatchEvent(

        new CustomEvent(

            "sun-spacecraft-mode-change",

            {

                detail: {

                    mode:
                        sunSpacecraftState.mode,

                    selectedId:
                        sunSpacecraftState.selectedId

                }

            }

        )

    );

}


// ======================================================
// 10. JSON YÜKLE
// ======================================================

async function loadJson(
    path
) {

    const response =
        await fetch(

            path,

            {
                cache:
                    "no-store"
            }

        );


    if (
        !response.ok
    ) {

        throw new Error(
            `${path} yüklenemedi: HTTP ${response.status}`
        );

    }


    return response.json();

}


// ======================================================
// 11. EPHEMERIS VERİSİNİ HAZIRLA
// ======================================================

function prepareSamples(
    rawSamples
) {

    return rawSamples

        .map(

            (sample) => ({

                t:
                    Date.parse(
                        sample.t
                    ),

                p:
                    new THREE.Vector3(
                        sample.x,
                        sample.y,
                        sample.z
                    ),

                v:
                    new THREE.Vector3(
                        sample.vx,
                        sample.vy,
                        sample.vz
                    )

            })

        )

        .filter(

            (sample) =>
                Number.isFinite(
                    sample.t
                )

        )

        .sort(

            (a, b) =>
                a.t - b.t

        );

}


// ======================================================
// 12. İKİ EPHEMERIS ÖRNEĞİNİ BUL
// ======================================================

function findSampleBracket(
    samples,
    timeMs
) {

    if (
        !samples.length
    ) {

        return null;

    }


    if (
        timeMs
        <=
        samples[0].t
    ) {

        return {

            a:
                samples[0],

            b:
                samples[0],

            u:
                0

        };

    }


    const last =
        samples[
            samples.length - 1
        ];


    if (
        timeMs
        >=
        last.t
    ) {

        return {

            a:
                last,

            b:
                last,

            u:
                0

        };

    }


    let low =
        0;

    let high =
        samples.length - 1;


    while (
        high - low
        >
        1
    ) {

        const mid =
            Math.floor(
                (
                    low
                    +
                    high
                )
                /
                2
            );


        if (
            samples[mid].t
            <=
            timeMs
        ) {

            low =
                mid;

        }

        else {

            high =
                mid;

        }

    }


    const a =
        samples[low];

    const b =
        samples[high];

    const span =
        Math.max(
            b.t - a.t,
            1
        );


    return {

        a,

        b,

        u:
            THREE.MathUtils.clamp(

                (
                    timeMs
                    -
                    a.t
                )
                /
                span,

                0,
                1

            )

    };

}


// ======================================================
// 13. GERÇEK KONUM INTERPOLASYONU
//
// Cubic Hermite kullanıyoruz.
//
// Sadece XYZ değil,
// JPL'nin VX/VY/VZ hızları da hesaba katılır.
//
// Veri:
// pozisyon = AU
// hız     = AU / gün
// ======================================================

function interpolateHeliocentricPosition(
    samples,
    timeMs
) {

    const bracket =
        findSampleBracket(
            samples,
            timeMs
        );


    if (
        !bracket
    ) {

        return null;

    }


    const {
        a,
        b,
        u
    } =
        bracket;


    if (
        a === b
    ) {

        return a.p.clone();

    }


    const hDays =
        (
            b.t
            -
            a.t
        )
        /
        DAY_MS;


    const u2 =
        u * u;

    const u3 =
        u2 * u;


    const h00 =
        2 * u3
        -
        3 * u2
        +
        1;

    const h10 =
        u3
        -
        2 * u2
        +
        u;

    const h01 =
        -2 * u3
        +
        3 * u2;

    const h11 =
        u3
        -
        u2;


    return new THREE.Vector3()

        .addScaledVector(
            a.p,
            h00
        )

        .addScaledVector(
            a.v,
            h10 * hDays
        )

        .addScaledVector(
            b.p,
            h01
        )

        .addScaledVector(
            b.v,
            h11 * hDays
        );

}


// ======================================================
// 14. HORIZONS XYZ → THREE.JS XYZ
//
// Horizons:
// ekliptik XYZ
//
// Three.js:
// Y yukarı
// ======================================================

function heliocentricAuToScene(
    positionAu
) {

    return new THREE.Vector3(

        positionAu.x,

        positionAu.z,

        -positionAu.y

    ).multiplyScalar(
        AU_TO_SCENE
    );

}


// ======================================================
// 15. GLB MATERYAL KALİTESİ
// ======================================================

function improveModelMaterials(
    model
) {

    const anisotropy =
        rendererRef
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


                    if (
                        material.normalMap
                    ) {

                        material.normalMap.anisotropy =
                            anisotropy;

                        material.normalMap.needsUpdate =
                            true;

                    }


                    if (
                        material.roughnessMap
                    ) {

                        material.roughnessMap.anisotropy =
                            anisotropy;

                        material.roughnessMap.needsUpdate =
                            true;

                    }


                    if (
                        material.metalnessMap
                    ) {

                        material.metalnessMap.anisotropy =
                            anisotropy;

                        material.metalnessMap.needsUpdate =
                            true;

                    }


                    material.needsUpdate =
                        true;

                }

            );


            object.userData.spacecraftMesh =
                true;

        }

    );

}


// ======================================================
// 16. MODELİ GÖRSEL BOYUTA GETİR
// ======================================================

function normalizeModel(
    model,
    visualDiameter
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


    const largestSide =
        Math.max(
            size.x,
            size.y,
            size.z
        )
        ||
        1;


    model.position.sub(
        center
    );


    const wrapper =
        new THREE.Group();


    wrapper.add(
        model
    );


    wrapper.scale.setScalar(

        visualDiameter
        /
        largestSide

    );


    return wrapper;

}


// ======================================================
// 17. MODELİN ÜSTÜNDEKİ İSİM
// ======================================================

function createLabel(
    config
) {

    const label =
        document.createElement(
            "button"
        );


    label.type =
        "button";


    label.className =
        "sun-spacecraft-label";


    label.dataset.spacecraft =
        config.id;


    label.textContent =
        config.shortName;


    label.setAttribute(

        "aria-label",

        `${config.name} aracını incele`

    );


    label.addEventListener(

        "click",

        () => {

            focusSpacecraft(
                config.id
            );

        }

    );


    labelLayer.appendChild(
        label
    );


    return label;

}


// ======================================================
// 18. SAĞ ALT SEÇİCİ
// ======================================================

function setSelectorStatus(
    id,
    text
) {

    const button =
        selectorRoot
            ?.querySelector(

                `[data-spacecraft-selector="${id}"]`

            );


    const status =
        button
            ?.querySelector(
                "small"
            );


    if (
        status
    ) {

        status.textContent =
            text;

    }

}


function createSelector() {

    selectorRoot =
        document.createElement(
            "div"
        );


    selectorRoot.id =
        "sun-spacecraft-selector";


    selectorRoot.className =
        "sun-spacecraft-selector";


    selectorRoot.setAttribute(

        "aria-label",

        "Güneş görevleri"

    );


    Object
        .values(
            SPACECRAFT
        )
        .forEach(

            (config) => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.dataset.spacecraftSelector =
                    config.id;


                button.className =
                    "sun-spacecraft-selector-button";


                button.innerHTML = `

                    <span>
                        ${config.shortName}
                    </span>

                    <small>
                        Yükleniyor…
                    </small>

                `;


                button.addEventListener(

                    "click",

                    () => {

                        focusSpacecraft(
                            config.id
                        );

                    }

                );


                selectorRoot.appendChild(
                    button
                );

            }

        );


    document.body.appendChild(
        selectorRoot
    );

}


// ======================================================
// 19. HTML LABEL KATMANI
// ======================================================

function createLabelLayer() {

    labelLayer =
        document.createElement(
            "div"
        );


    labelLayer.id =
        "sun-spacecraft-label-layer";


    labelLayer.className =
        "sun-spacecraft-label-layer";


    document.body.appendChild(
        labelLayer
    );

}


// ======================================================
// 20. SEÇİCİ AKTİF / PASİF
// ======================================================

function updateSelectorState() {

    if (
        !selectorRoot
    ) {

        return;

    }


    selectorRoot
        .querySelectorAll(
            ".sun-spacecraft-selector-button"
        )
        .forEach(

            (button) => {

                const id =
                    button
                        .dataset
                        .spacecraftSelector;


                const system =
                    systems.get(
                        id
                    );


                const isSelected =
                    sunSpacecraftState
                        .selectedId
                    ===
                    id;


                const lockedByMode =

                    sunSpacecraftState.mode
                    ===
                    "spacecraft"

                    &&

                    !isSelected;


                button.disabled =

                    !system?.modelLoaded

                    ||

                    !sunSpacecraftState
                        .interactionsEnabled

                    ||

                    lockedByMode;


                button.dataset.active =

                    isSelected
                        ?
                        "true"
                        :
                        "false";

            }

        );

}


// ======================================================
// 21. GERÇEK EPHEMERIS İZİ
// ======================================================

function buildTrajectoryLine(
    config,
    samples,
    currentTimeMs
) {

    const halfWindowMs =

        config.trailDays
        *
        DAY_MS
        *
        0.5;


    let visibleSamples =

        samples.filter(

            (sample) =>

                Math.abs(
                    sample.t
                    -
                    currentTimeMs
                )
                <=
                halfWindowMs

        );


    if (
        visibleSamples.length
        <
        12
    ) {

        visibleSamples =
            samples;

    }


    const points =

        visibleSamples.map(

            (sample) =>

                heliocentricAuToScene(
                    sample.p
                )

        );


    const geometry =

        new THREE.BufferGeometry()
            .setFromPoints(
                points
            );


    const material =

        new THREE.LineBasicMaterial({

            color:
                config.color,

            transparent:
                true,

            opacity:
                0.34,

            depthWrite:
                false

        });


    const line =
        new THREE.Line(
            geometry,
            material
        );


    line.name =
        `${config.id.toUpperCase()}_REAL_EPHEMERIS_TRAIL`;


    rootRef.add(
        line
    );


    return line;

}


// ======================================================
// 22. GLB YÜKLE
// ======================================================

function loadModel(
    config
) {

    return new Promise(

        (
            resolve,
            reject
        ) => {

            loader.load(

                config.modelPath,


                // ==========================================
                // MODEL GELDİ
                // ==========================================

                (gltf) => {

                    const rawModel =
                        gltf.scene;


                    rawModel.name =
                        `${config.id.toUpperCase()}_RAW_MODEL`;


                    improveModelMaterials(
                        rawModel
                    );


                    const visualModel =

                        normalizeModel(

                            rawModel,

                            config.visualDiameter

                        );


                    visualModel.name =
                        `${config.id.toUpperCase()}_VISUAL_MODEL`;


                    const group =
                        new THREE.Group();


                    group.name =
                        `${config.id.toUpperCase()}_EPHEMERIS_ROOT`;


                    group.add(
                        visualModel
                    );


                    // --------------------------------------
                    // TIKLAMAYI KOLAYLAŞTIRAN GÖRÜNMEZ HITBOX
                    // --------------------------------------

                    const hitbox =

                        new THREE.Mesh(

                            new THREE.SphereGeometry(
                                config.hitRadius,
                                20,
                                20
                            ),

                            new THREE.MeshBasicMaterial({

                                transparent:
                                    true,

                                opacity:
                                    0,

                                depthWrite:
                                    false,

                                colorWrite:
                                    false

                            })

                        );


                    hitbox.name =
                        `${config.id.toUpperCase()}_HITBOX`;


                    hitbox.userData.spacecraftId =
                        config.id;


                    group.add(
                        hitbox
                    );


                    rootRef.add(
                        group
                    );


                    hitboxes.push(
                        hitbox
                    );


                    const label =
                        createLabel(
                            config
                        );


                    const samples =

                        trajectoryData[
                            config.id
                        ]
                            ?.samples
                        ||
                        [];


                    const orbitLine =

                        buildTrajectoryLine(

                            config,

                            samples,

                            Date.now()

                        );


                    systems.set(

                        config.id,

                        {

                            config,

                            group,

                            visualModel,

                            hitbox,

                            label,

                            orbitLine,

                            samples,

                            positionAu:
                                new THREE.Vector3(),

                            modelLoaded:
                                true

                        }

                    );


                    setSelectorStatus(

                        config.id,

                        "Gerçek ephemeris"

                    );


                    updateSelectorState();


                    resolve();

                },


                // ==========================================
                // PROGRESS
                // ==========================================

                (progress) => {

                    if (
                        !progress.total
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


                    setSelectorStatus(

                        config.id,

                        `%${percent}`

                    );

                },


                // ==========================================
                // ERROR
                // ==========================================

                (error) => {

                    setSelectorStatus(

                        config.id,

                        "Model yüklenemedi"

                    );


                    console.error(

                        `${config.name} GLB yüklenemedi:`,

                        error

                    );


                    reject(
                        error
                    );

                }

            );

        }

    );

}


// ======================================================
// 23. GÜNEŞ'E UZAKLIK
// ======================================================

function formatDistance(
    positionAu
) {

    const au =
        positionAu.length();


    const km =
        au
        *
        AU_KM;


    if (
        km
        <
        10000000
    ) {

        return (

            `${(
                km / 1000000
            )
                .toFixed(2)
                .replace(".", ",")
            } milyon km · `
            +
            `${au.toFixed(4)} AU`

        );

    }


    return (

        `${Math
            .round(
                km / 1000000
            )
            .toLocaleString(
                "tr-TR"
            )
        } milyon km · `
        +
        `${au.toFixed(3)} AU`

    );

}


// ======================================================
// 24. GÖREV SÜRESİ
// ======================================================

function formatMissionDuration(
    launchIso
) {

    const launch =
        Date.parse(
            launchIso
        );


    if (
        !Number.isFinite(
            launch
        )
    ) {

        return "—";

    }


    const years =

        (
            Date.now()
            -
            launch
        )

        /

        (
            365.2425
            *
            DAY_MS
        );


    return (

        `${years
            .toFixed(1)
            .replace(".", ",")
        } yıl`

    );

}


// ======================================================
// 25. GÖRSEL GALERİ
// ======================================================

function renderMedia(
    media = []
) {

    if (
        !media.length
    ) {

        return "";

    }


    return `

        <section class="info-section">

            <h2 class="info-section-title">
                Görüntüler ve gözlemler
            </h2>

            <div class="sun-spacecraft-media-grid">

                ${media

                    .map(

                        (item) => `

                            <figure
                                class="sun-spacecraft-media-card"
                            >

                                <img
                                    src="${item.src}"
                                    alt="${item.alt || "Uzay aracı gözlemi"}"
                                    loading="lazy"
                                >

                                <figcaption>
                                    ${item.caption || ""}
                                </figcaption>

                            </figure>

                        `

                    )

                    .join("")
                }

            </div>

        </section>

    `;

}


// ======================================================
// 26. UZAY ARACI BİLGİ PANELİ
// ======================================================

function showSpacecraftInfo(
    id
) {

    const info =
        spacecraftInfo[
            id
        ];


    if (
        !infoContentRef
        ||
        !info
    ) {

        return;

    }


    infoContentRef.innerHTML = `

        <p class="info-kicker">

            ${info.kicker}

        </p>


        <h1 class="info-title">

            ${info.name}

        </h1>


        <p class="info-lead">

            ${info.description}

        </p>


        <div class="quick-stats">


            <div class="quick-stat">

                <span>
                    Fırlatma
                </span>

                <strong>
                    ${info.launchDisplay}
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Durum
                </span>

                <strong>
                    ${info.status}
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Güneş'e uzaklık
                </span>

                <strong
                    id="spacecraft-live-distance"
                >
                    Hesaplanıyor…
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Görev süresi
                </span>

                <strong>

                    ${formatMissionDuration(
                        info.launchIso
                    )}

                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Yörünge
                </span>

                <strong>
                    ${info.orbit}
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Operasyon
                </span>

                <strong>
                    ${info.operator}
                </strong>

            </div>


        </div>


        <section class="info-section">

            <h2 class="info-section-title">
                Görev
            </h2>

            <p>
                ${info.mission}
            </p>

        </section>


        <section class="info-section">

            <h2 class="info-section-title">
                Bilim araçları
            </h2>

            <div class="sun-spacecraft-instruments">

                ${info.instruments

                    .map(

                        (instrument) =>
                            `<span>${instrument}</span>`

                    )

                    .join("")
                }

            </div>


            ${

                info.instrumentNote

                    ?

                    `<p>${info.instrumentNote}</p>`

                    :

                    ""

            }

        </section>


        <section class="info-section">

            <h2 class="info-section-title">
                Canlı konum
            </h2>

            <p>

                Konum, JPL Horizons'tan önceden alınmış
                gerçek heliosentrik durum vektörleri
                arasında hız bilgisi de kullanılarak
                interpolasyonla hesaplanır.

                Simülasyon zamanı varsayılan olarak
                gerçek UTC zamanıdır:

                <strong
                    id="spacecraft-live-time"
                >
                    —
                </strong>

            </p>

        </section>


        ${renderMedia(
            info.media
        )}


        <section class="info-section">

            <h2 class="info-section-title">
                Resmî görev sayfası
            </h2>

            <p>

                <a
                    class="sun-official-link"
                    href="${info.officialUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                >

                    ${info.officialLabel} ↗

                </a>

            </p>

        </section>


        <div class="info-actions">

            <button
                id="back-to-sun-spacecraft"
                class="secondary-action"
                type="button"
            >

                ← GÜNEŞ KEŞİF MODUNA DÖN

            </button>

        </div>

    `;


    // Yerel medya dosyası henüz eklenmemişse
    // kırık görsel göstermeyelim.

    infoContentRef

        .querySelectorAll(
            ".sun-spacecraft-media-card img"
        )

        .forEach(

            (image) => {

                image.addEventListener(

                    "error",

                    () => {

                        image
                            .closest(
                                ".sun-spacecraft-media-card"
                            )
                            ?.remove();

                    }

                );

            }

        );


    document

        .getElementById(
            "back-to-sun-spacecraft"
        )

        ?.addEventListener(

            "click",

            exitSpacecraftMode

        );


    if (
        infoScrollRef
    ) {

        infoScrollRef.scrollTop =
            0;

    }


    updateLiveInfo(
        Date.now(),
        true
    );

}


// ======================================================
// 27. ANA GÜNEŞ PANELİNİ GERİ GETİR
// ======================================================

function restoreSunInfo() {

    if (
        !infoContentRef
    ) {

        return;

    }


    infoContentRef.innerHTML =
        originalSunInfoHTML;


    if (
        infoScrollRef
    ) {

        infoScrollRef.scrollTop =
            0;

    }

}


// ======================================================
// 28. CAMERA EASING
// ======================================================

function easeInOutCubic(
    t
) {

    return (

        t < 0.5

            ?

            4
            *
            t
            *
            t
            *
            t

            :

            1
            -
            Math.pow(
                -2 * t + 2,
                3
            )
            /
            2

    );

}


// ======================================================
// 29. SEÇİLEN ARACA KAMERA KONUMU
// ======================================================

function getFocusCameraPosition(
    system
) {

    const target =
        system
            .group
            .position
            .clone();


    const outward =
        target.clone();


    if (
        outward.lengthSq()
        <
        0.000001
    ) {

        outward.set(
            0,
            0,
            1
        );

    }

    else {

        outward.normalize();

    }


    const side =

        new THREE.Vector3()

            .crossVectors(

                new THREE.Vector3(
                    0,
                    1,
                    0
                ),

                outward

            );


    if (
        side.lengthSq()
        <
        0.000001
    ) {

        side.set(
            1,
            0,
            0
        );

    }

    else {

        side.normalize();

    }


    return target

        .clone()

        .addScaledVector(
            outward,
            system.config.focusDistance
        )

        .addScaledVector(
            side,
            system.config.focusSide
        )

        .add(

            new THREE.Vector3(
                0,
                system.config.focusHeight,
                0
            )

        );

}


// ======================================================
// 30. CAMERA TWEEN BAŞLAT
// ======================================================

function startCameraTween(
    type,
    cameraEnd,
    targetEnd,
    duration = 1200
) {

    cameraTween = {

        type,

        startTime:
            performance.now(),

        duration,

        cameraStart:
            cameraRef
                .position
                .clone(),

        cameraEnd:
            cameraEnd.clone(),

        targetStart:
            controlsRef
                .target
                .clone(),

        targetEnd:
            targetEnd.clone()

    };


    controlsRef.enabled =
        false;

}


// ======================================================
// 31. UZAY ARACINA GİR
// ======================================================

function focusSpacecraft(
    id
) {

    if (

        !sunSpacecraftState
            .interactionsEnabled

        ||

        sunSpacecraftState.mode
        !==
        "sun"

        ||

        cameraTween

    ) {

        return;

    }


    const system =
        systems.get(
            id
        );


    if (
        !system?.modelLoaded
    ) {

        return;

    }


    savedView = {

        cameraPosition:
            cameraRef
                .position
                .clone(),

        target:
            controlsRef
                .target
                .clone(),

        minDistance:
            controlsRef
                .minDistance,

        maxDistance:
            controlsRef
                .maxDistance

    };


    sunSpacecraftState.mode =
        "spacecraft";


    sunSpacecraftState.selectedId =
        id;


    // Artık OrbitControls Güneş'in değil,
    // küçük uzay aracının çevresinde dönüyor.

    controlsRef.minDistance =
        0.10;


    controlsRef.maxDistance =
        4.5;


    const target =
        system
            .group
            .position
            .clone();


    const destination =
        getFocusCameraPosition(
            system
        );


    startCameraTween(

        "focus",

        destination,

        target,

        1250

    );


    showSpacecraftInfo(
        id
    );


    updateSelectorState();


    dispatchModeChange();

}


// ======================================================
// 32. GÜNEŞ'E DÖN
// ======================================================

function exitSpacecraftMode() {

    if (

        sunSpacecraftState.mode
        !==
        "spacecraft"

        ||

        !savedView

        ||

        cameraTween

    ) {

        return;

    }


    startCameraTween(

        "return",

        savedView.cameraPosition,

        savedView.target,

        1100

    );

}


// ======================================================
// 33. CAMERA TWEEN BİTİŞİ
// ======================================================

function finishCameraTween(
    type
) {

    cameraTween =
        null;


    if (
        type
        ===
        "focus"
    ) {

        controlsRef.enabled =
            true;


        const selected =
            systems.get(
                sunSpacecraftState
                    .selectedId
            );


        if (
            selected
        ) {

            lastSelectedScenePosition =

                selected
                    .group
                    .position
                    .clone();


            controlsRef.target.copy(

                selected
                    .group
                    .position

            );

        }


        controlsRef.update();


        return;

    }


    if (
        type
        ===
        "return"
    ) {

        controlsRef.minDistance =
            savedView.minDistance;


        controlsRef.maxDistance =
            savedView.maxDistance;


        controlsRef.enabled =
            true;


        controlsRef.update();


        sunSpacecraftState.mode =
            "sun";


        sunSpacecraftState.selectedId =
            null;


        lastSelectedScenePosition =
            null;


        savedView =
            null;


        restoreSunInfo();


        updateSelectorState();


        dispatchModeChange();

    }

}


// ======================================================
// 34. CAMERA TWEEN UPDATE
// ======================================================

function updateCameraTween(
    now
) {

    if (
        !cameraTween
    ) {

        return;

    }


    const rawT =

        THREE.MathUtils.clamp(

            (
                now
                -
                cameraTween.startTime
            )

            /

            cameraTween.duration,

            0,

            1

        );


    const t =
        easeInOutCubic(
            rawT
        );


    cameraRef.position.lerpVectors(

        cameraTween.cameraStart,

        cameraTween.cameraEnd,

        t

    );


    controlsRef.target.lerpVectors(

        cameraTween.targetStart,

        cameraTween.targetEnd,

        t

    );


    controlsRef.update();


    if (
        rawT
        >=
        1
    ) {

        const type =
            cameraTween.type;


        finishCameraTween(
            type
        );

    }

}


// ======================================================
// 35. SEÇİLİ ARACI KAMERA TAKİP ETSİN
//
// Araç gerçek zamanda hareket etmeye devam ederken
// kullanıcı araç etrafında OrbitControls kullanabilir.
// ======================================================

function followSelectedSpacecraft() {

    if (

        sunSpacecraftState.mode
        !==
        "spacecraft"

        ||

        cameraTween

    ) {

        return;

    }


    const selected =
        systems.get(
            sunSpacecraftState
                .selectedId
        );


    if (
        !selected
    ) {

        return;

    }


    const current =
        selected
            .group
            .position;


    if (
        lastSelectedScenePosition
    ) {

        const delta =

            current

                .clone()

                .sub(
                    lastSelectedScenePosition
                );


        cameraRef.position.add(
            delta
        );


        controlsRef.target.add(
            delta
        );

    }


    controlsRef.target.copy(
        current
    );


    lastSelectedScenePosition =
        current.clone();

}


// ======================================================
// 36. ÜÇ ARACIN GERÇEK ZAMANLI KONUMU
// ======================================================

function updatePositions(
    timeMs
) {

    systems.forEach(

        (system) => {

            const positionAu =

                interpolateHeliocentricPosition(

                    system.samples,

                    timeMs

                );


            if (
                !positionAu
            ) {

                return;

            }


            system.positionAu.copy(
                positionAu
            );


            system.group.position.copy(

                heliocentricAuToScene(
                    positionAu
                )

            );

        }

    );

}


// ======================================================
// 37. HTML İSİMLERİ 3B MODELİ TAKİP ETSİN
// ======================================================

function updateLabelPositions() {

    if (

        !labelLayer

        ||

        !rendererRef

        ||

        !cameraRef

    ) {

        return;

    }


    const rect =

        rendererRef
            .domElement
            .getBoundingClientRect();


    cameraRef.getWorldDirection(
        tmpCameraDirection
    );


    systems.forEach(

        (
            system,
            id
        ) => {

            const label =
                system.label;


            const selected =

                sunSpacecraftState
                    .selectedId
                ===
                id;


            const modeAllowsLabel =

                sunSpacecraftState.mode
                ===
                "sun"

                ||

                selected;


            if (
                !modeAllowsLabel
            ) {

                label.hidden =
                    true;

                return;

            }


            system.group.getWorldPosition(
                tmpWorldPosition
            );


            tmpToObject

                .copy(
                    tmpWorldPosition
                )

                .sub(
                    cameraRef.position
                );


            // Kameranın arkasındaysa gösterme.

            if (

                tmpCameraDirection.dot(
                    tmpToObject
                )
                <=
                0

            ) {

                label.hidden =
                    true;

                return;

            }


            tmpProjected

                .copy(
                    tmpWorldPosition
                )

                .project(
                    cameraRef
                );


            const inViewport =

                Math.abs(
                    tmpProjected.x
                )
                <=
                1.08

                &&

                Math.abs(
                    tmpProjected.y
                )
                <=
                1.08

                &&

                tmpProjected.z
                >=
                -1

                &&

                tmpProjected.z
                <=
                1;


            if (
                !inViewport
            ) {

                label.hidden =
                    true;

                return;

            }


            label.hidden =
                false;


            label.style.left =

                `${
                    rect.left
                    +
                    (
                        tmpProjected.x
                        *
                        0.5
                        +
                        0.5
                    )
                    *
                    rect.width
                }px`;


            label.style.top =

                `${
                    rect.top
                    +
                    (
                        -tmpProjected.y
                        *
                        0.5
                        +
                        0.5
                    )
                    *
                    rect.height
                }px`;


            label.disabled =

                !sunSpacecraftState
                    .interactionsEnabled

                ||

                (
                    sunSpacecraftState.mode
                    ===
                    "spacecraft"

                    &&

                    !selected
                );


            label.dataset.active =

                selected
                    ?
                    "true"
                    :
                    "false";

        }

    );

}


// ======================================================
// 38. BİLGİ PANELİNDE CANLI MESAFE
// ======================================================

function updateLiveInfo(
    timeMs,
    force = false
) {

    if (

        sunSpacecraftState.mode
        !==
        "spacecraft"

        ||

        !sunSpacecraftState.selectedId

    ) {

        return;

    }


    if (

        !force

        &&

        timeMs
        -
        lastInfoUpdate
        <
        500

    ) {

        return;

    }


    lastInfoUpdate =
        timeMs;


    const system =
        systems.get(
            sunSpacecraftState
                .selectedId
        );


    const distanceElement =

        document.getElementById(
            "spacecraft-live-distance"
        );


    const timeElement =

        document.getElementById(
            "spacecraft-live-time"
        );


    if (

        distanceElement

        &&

        system

    ) {

        distanceElement.textContent =

            formatDistance(
                system.positionAu
            );

    }


    if (
        timeElement
    ) {

        timeElement.textContent =

            new Date(
                timeMs
            )
                .toISOString()
                .replace(
                    "T",
                    " "
                )
                .replace(
                    ".000Z",
                    " UTC"
                );

    }

}


// ======================================================
// 39. MODELİ MOUSE İLE TIKLAMA
// ======================================================

function handleCanvasPointerDown(
    event
) {

    pointerDown = {

        x:
            event.clientX,

        y:
            event.clientY

    };

}


function handleCanvasPointerUp(
    event
) {

    if (

        !pointerDown

        ||

        !sunSpacecraftState
            .interactionsEnabled

        ||

        sunSpacecraftState.mode
        !==
        "sun"

        ||

        cameraTween

    ) {

        pointerDown =
            null;

        return;

    }


    const dx =
        event.clientX
        -
        pointerDown.x;


    const dy =
        event.clientY
        -
        pointerDown.y;


    pointerDown =
        null;


    // OrbitControls ile döndürmeyi
    // yanlışlıkla click sayma.

    if (
        Math.hypot(
            dx,
            dy
        )
        >
        6
    ) {

        return;

    }


    const rect =

        rendererRef
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


    raycaster.setFromCamera(

        pointer,

        cameraRef

    );


    const hits =

        raycaster.intersectObjects(

            hitboxes,

            false

        );


    if (
        !hits.length
    ) {

        return;

    }


    const id =

        hits[0]
            .object
            .userData
            .spacecraftId;


    if (
        id
    ) {

        focusSpacecraft(
            id
        );

    }

}


// ======================================================
// 40. FEATURE / COMPARE MODLARI İÇİN KİLİT
//
// Daha sonra:
// setSunSpacecraftInteractionEnabled(false)
//
// tekrar Güneş'e dönünce:
// setSunSpacecraftInteractionEnabled(true)
// ======================================================

export function setSunSpacecraftInteractionEnabled(
    enabled
) {

    sunSpacecraftState.interactionsEnabled =
        Boolean(
            enabled
        );


    updateSelectorState();


    updateLabelPositions();

}


// ======================================================
// 41. DIŞARIDAN GÜNEŞ'E DÖN
// ======================================================

export function exitSunSpacecraftMode() {

    exitSpacecraftMode();

}


// ======================================================
// 42. INIT
// ======================================================

export async function initSunSpacecraft({

    scene,

    root,

    camera,

    renderer,

    controls,

    infoScroll

}) {

    sceneRef =
        scene;

    rootRef =
        root;

    cameraRef =
        camera;

    rendererRef =
        renderer;

    controlsRef =
        controls;

    infoScrollRef =
        infoScroll
        ||
        null;


    infoContentRef =

        document.getElementById(
            "info-content"
        );


    if (

        !sceneRef

        ||

        !rootRef

        ||

        !cameraRef

        ||

        !rendererRef

        ||

        !controlsRef

    ) {

        throw new Error(

            "Güneş uzay aracı sistemi için gerekli Three.js referansları eksik."

        );

    }


    if (
        !infoContentRef
    ) {

        throw new Error(
            "#info-content bulunamadı."
        );

    }


    originalSunInfoHTML =
        infoContentRef.innerHTML;


    createLabelLayer();


    createSelector();


    // Güneş'e çok uzaktaki SOHO gibi PBR modeller de
    // okunabilsin. Sun modeli MeshBasic olduğu için
    // bu ışık Güneş görünümünü bozmaz.

    const spacecraftFillLight =

        new THREE.HemisphereLight(

            0xffffff,

            0x101827,

            0.58

        );


    spacecraftFillLight.name =
        "SUN_SPACECRAFT_FILL_LIGHT";


    sceneRef.add(
        spacecraftFillLight
    );


    const [

        infoJson,

        trajectoryJson

    ] =

        await Promise.all([

            loadJson(
                "/assets/data/sun/spacecraft-info.json"
            ),

            loadJson(
                "/assets/data/sun/spacecraft-trajectories.json"
            )

        ]);


    spacecraftInfo =
        infoJson.spacecraft
        ||
        infoJson;


    Object
        .entries(
            trajectoryJson.spacecraft
            ||
            {}
        )
        .forEach(

            (
                [
                    id,
                    entry
                ]
            ) => {

                trajectoryData[id] = {

                    ...entry,

                    samples:
                        prepareSamples(
                            entry.samples
                            ||
                            []
                        )

                };

            }

        );


    // Büyük GLB'leri aynı anda değil,
    // sırayla yüklüyoruz.

    for (
        const config
        of
        Object.values(
            SPACECRAFT
        )
    ) {

        if (

            !trajectoryData[
                config.id
            ]
                ?.samples
                ?.length

        ) {

            setSelectorStatus(

                config.id,

                "Ephemeris yok"

            );


            console.error(

                `${config.name}: ephemeris verisi bulunamadı.`

            );


            continue;

        }


        try {

            await loadModel(
                config
            );

        }

        catch {

            // Bir model bozuksa diğer ikisini
            // yüklemeye devam et.

        }

    }


    rendererRef
        .domElement
        .addEventListener(

            "pointerdown",

            handleCanvasPointerDown

        );


    rendererRef
        .domElement
        .addEventListener(

            "pointerup",

            handleCanvasPointerUp

        );


    updatePositions(
        Date.now()
    );


    updateLabelPositions();


    updateSelectorState();


    sunSpacecraftState.ready =
        true;


    console.log(

        "Parker Solar Probe + Solar Orbiter + SOHO sistemi hazır."

    );

}


// ======================================================
// 43. HER FRAME UPDATE
// ======================================================

export function updateSunSpacecraft(
    now
) {

    if (
        !sunSpacecraftState.ready
    ) {

        return;

    }


    // ==================================================
    // GERÇEK ZAMAN
    //
    // 1 gerçek saniye
    // =
    // 1 simülasyon saniyesi
    // ==================================================

    const simulationTime =
        Date.now();


    updatePositions(
        simulationTime
    );


    updateCameraTween(
        now
    );


    followSelectedSpacecraft();


    updateLabelPositions();


    updateLiveInfo(
        simulationTime
    );

}