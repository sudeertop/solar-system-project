import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";

import {
    DRACOLoader
} from "three/addons/loaders/DRACOLoader.js";


// ======================================================
// 1. STATE
// ======================================================

export const marsMoonsState = {

    root: null,

    bodies: {},

    inspecting: null,

    // Dünya karşılaştırması açıldığında
    // mars.js bunu false yapacak.
    interactionEnabled: true

};


// ======================================================
// 2. FİZİKSEL SABİTLER
// ======================================================

// Mars'ın sahnedeki yarıçapı = 1
const MARS_RADIUS_KM =
    3390;

const MARS_RADIUS_SCENE =
    1;


// J2000 başlangıç zamanı
const J2000_EPOCH_MS =
    Date.parse(
        "2000-01-01T12:00:00Z"
    );


const DAY_SECONDS =
    86400;


// Uyduya yaklaşma animasyonu
const FOCUS_DURATION_MS =
    850;


// ======================================================
// 3. PHOBOS + DEIMOS VERİLERİ
// ======================================================

const BODY_DATA = {

    phobos: {

        key:
            "phobos",

        name:
            "Phobos",

        modelPath:
            "../assets/models/mars/phobos.glb",

        // Gerçek yaklaşık boyut
        dimensionsKm:
            [
                27,
                22,
                18
            ],

        // Mars merkezinden ortalama uzaklık
        aKm:
            9375,

        eccentricity:
            0.015,

        argumentOfPeriapsisDeg:
            216.3,

        meanAnomalyAtEpochDeg:
            189.7,

        inclinationDeg:
            1.1,

        ascendingNodeDeg:
            169.2,

        periodDays:
            0.3187,

        discovery:
            "17 Ağustos 1877",

        discoverer:
            "Asaph Hall",

        description:
            "Phobos, Mars'ın iki doğal uydusunun daha büyük ve daha içte olanıdır.",

        note:
            "Phobos zamanla Mars'a yaklaşmaktadır. Gelecekte parçalanması veya Mars'a çarpması beklenmektedir."

    },


    deimos: {

        key:
            "deimos",

        name:
            "Deimos",

        modelPath:
            "../assets/models/mars/deimos.glb",

        dimensionsKm:
            [
                15,
                12,
                11
            ],
                    // Mars merkezinden ortalama uzaklık
        aKm:
            23457,

        eccentricity:
            0.0,

        argumentOfPeriapsisDeg:
            0.0,

        meanAnomalyAtEpochDeg:
            205.0,

        inclinationDeg:
            1.8,

        ascendingNodeDeg:
            54.3,

        periodDays:
            1.2625,

        discovery:
            "11 Ağustos 1877",

        discoverer:
            "Asaph Hall",

        description:
            "Deimos, Mars'ın daha küçük ve daha dıştaki doğal uydusudur.",

        note:
            "Deimos, Phobos'a göre Mars'tan çok daha uzakta bulunur ve bir turunu yaklaşık 30,3 saatte tamamlar."

    }

};


// ======================================================
// 4. REFERANSLAR
// ======================================================

let rendererRef =
    null;

let cameraRef =
    null;

let controlsRef =
    null;


// Mars görünümüne dönerken kullanılacak
// kamera bilgileri
let savedView =
    null;


// Kamera geçiş animasyonu
let focusTween =
    null;


// İncelenen uydu hareket ederken
// kameranın da onunla birlikte hareket etmesi için
const lastTrackedWorldPosition =
    new THREE.Vector3();

const currentTrackedWorldPosition =
    new THREE.Vector3();


// Yörünge düzlemini oluştururken
// kullanılacak sabit eksenler
const X_AXIS =
    new THREE.Vector3(
        1,
        0,
        0
    );

const Y_AXIS =
    new THREE.Vector3(
        0,
        1,
        0
    );


// ======================================================
// 5. KM → THREE.JS ÖLÇEĞİ
// ======================================================

function kmToScene(
    km
) {

    return (

        km
        /
        MARS_RADIUS_KM

    )

    *

    MARS_RADIUS_SCENE;

}


// ======================================================
// 6. AÇI NORMALİZASYONU
// ======================================================

function normalizeAngle(
    angle
) {

    return THREE.MathUtils.euclideanModulo(

        angle,

        Math.PI * 2

    );

}


// ======================================================
// 7. KEPLER DENKLEMİ
// ======================================================

function solveKepler(
    meanAnomaly,
    eccentricity
) {

    let E =
        meanAnomaly;


    for (
        let i = 0;
        i < 10;
        i++
    ) {

        E -=

            (
                E
                -
                eccentricity
                *
                Math.sin(E)
                -
                meanAnomaly
            )

            /

            (
                1
                -
                eccentricity
                *
                Math.cos(E)
            );

    }


    return E;

}
// ======================================================
// 8. TRUE ANOMALY → 3B YÖRÜNGE KONUMU
// ======================================================

function positionFromTrueAnomaly(
    body,
    trueAnomaly
) {

    const e =
        body.eccentricity;


    const aScene =
        kmToScene(
            body.aKm
        );


    // Eliptik yörüngede Mars merkezinden
    // o andaki gerçek uzaklık
    const radius =

        (
            aScene
            *
            (
                1
                -
                e * e
            )
        )

        /

        (
            1
            +
            e
            *
            Math.cos(
                trueAnomaly
            )
        );


    // Periapsis yönünü hesaba kat
    const argument =

        trueAnomaly

        +

        THREE.MathUtils.degToRad(

            body
                .argumentOfPeriapsisDeg

        );


    // Önce yörüngeyi XZ düzleminde kuruyoruz
    const position =
        new THREE.Vector3(

            radius
            *
            Math.cos(
                argument
            ),

            0,

            radius
            *
            Math.sin(
                argument
            )

        );


    // Yörünge eğimi
    position.applyAxisAngle(

        X_AXIS,

        THREE.MathUtils.degToRad(

            body
                .inclinationDeg

        )

    );


    // Yükselen düğüm yönü
    position.applyAxisAngle(

        Y_AXIS,

        THREE.MathUtils.degToRad(

            body
                .ascendingNodeDeg

        )

    );


    return position;

}


// ======================================================
// 9. ZAMANA GÖRE UYDU KONUMU
// ======================================================

function calculateBodyPosition(
    body,
    timestampMs
) {

    const elapsedSeconds =

        (
            timestampMs
            -
            J2000_EPOCH_MS
        )

        /
        1000;


    const periodSeconds =

        body.periodDays
        *
        DAY_SECONDS;


    let meanAnomaly =

        THREE.MathUtils.degToRad(

            body
                .meanAnomalyAtEpochDeg

        )

        +

        (
            elapsedSeconds
            /
            periodSeconds
        )

        *
        Math.PI
        *
        2;


    meanAnomaly =
        normalizeAngle(
            meanAnomaly
        );


    const eccentricAnomaly =

        solveKepler(

            meanAnomaly,

            body.eccentricity

        );


    const trueAnomaly =

        2

        *

        Math.atan2(

            Math.sqrt(
                1
                +
                body.eccentricity
            )

            *
            Math.sin(
                eccentricAnomaly / 2
            ),

            Math.sqrt(
                1
                -
                body.eccentricity
            )

            *
            Math.cos(
                eccentricAnomaly / 2
            )

        );


    return positionFromTrueAnomaly(

        body,

        trueAnomaly

    );

}
// ======================================================
// 10. GERÇEK YÖRÜNGE ÇİZGİSİ
// ======================================================

function createOrbitLine(
    body
) {

    const points =
        [];


    const segments =
        720;


    for (
        let i = 0;
        i < segments;
        i++
    ) {

        const trueAnomaly =

            (
                i
                /
                segments
            )

            *
            Math.PI
            *
            2;


        points.push(

            positionFromTrueAnomaly(

                body,

                trueAnomaly

            )

        );

    }


    const geometry =

        new THREE.BufferGeometry()
            .setFromPoints(
                points
            );


    const material =

        new THREE.LineBasicMaterial({

            color:
                0xffffff,

            transparent:
                true,

            opacity:
                0.24

        });


    const orbit =

        new THREE.LineLoop(

            geometry,

            material

        );


    orbit.name =
        `${body.name.toUpperCase()}_ORBIT`;


    return orbit;

}


// ======================================================
// 11. UYDU İSİM ETİKETİ
// ======================================================

function createLabel(
    text
) {

    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        512;


    canvas.height =
        128;


    const ctx =
        canvas.getContext(
            "2d"
        );


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.font =
        "700 34px Arial";


    ctx.textAlign =
        "center";


    ctx.textBaseline =
        "middle";


    ctx.strokeStyle =
        "rgba(0,0,0,0.9)";


    ctx.lineWidth =
        8;


    ctx.strokeText(

        text,

        256,

        64

    );


    ctx.fillStyle =
        "#ffffff";


    ctx.fillText(

        text,

        256,

        64

    );


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
                true,

            depthWrite:
                false

        });


    const sprite =
        new THREE.Sprite(
            material
        );


    sprite.scale.set(

        0.58,

        0.145,

        1

    );


    sprite.position.set(

        0,

        0.11,

        0

    );


    sprite.renderOrder =
        10;


    return sprite;

}
// ======================================================
// 12. MODEL MATERYALLERİNİ İYİLEŞTİR
// ======================================================

function improveMaterials(
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


                    material.needsUpdate =
                        true;

                }

            );

        }

    );

}


// ======================================================
// 13. GLB MODELİNİ GERÇEK BOYUTA ÖLÇEKLE
// ======================================================

function loadBodyModel(
    system,
    loader
) {

    const body =
        system.data;


    loader.load(

        body.modelPath,


        (gltf) => {

            const model =
                gltf.scene;


            improveMaterials(
                model
            );


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


            const largestModelSide =

                Math.max(

                    size.x,

                    size.y,

                    size.z

                );


            const realLargestSideScene =

                kmToScene(

                    Math.max(
                        ...body.dimensionsKm
                    )

                );


            const wrapper =
                new THREE.Group();


            wrapper.add(
                model
            );


            wrapper.scale.setScalar(

                realLargestSideScene
                /
                largestModelSide

            );


            system.anchor.add(
                wrapper
            );


            system.model =
                wrapper;


            system.loaded =
                true;


            console.log(

                `${body.name} yüklendi. Gerçek boyut ölçeği:`,

                realLargestSideScene
                    .toFixed(6)

            );

        },


        undefined,


        (error) => {

            console.error(

                `${body.name} modeli yüklenemedi:`,

                error

            );

        }

    );

}
// ======================================================
// 14. UYDU BİLGİ PANELİ
// ======================================================

function showBodyInfo(
    system
) {

    const body =
        system.data;


    const infoContent =
        document.getElementById(
            "info-content"
        );


    if (
        !infoContent
    ) {
        return;
    }


    const periodHours =
        body.periodDays
        *
        24;


    const altitudeKm =
        body.aKm
        -
        MARS_RADIUS_KM;


    infoContent.innerHTML = `

        <p class="info-kicker">
            MARS'IN DOĞAL UYDUSU
        </p>


        <h1 class="info-title">
            ${body.name}
        </h1>


        <p class="info-lead">
            ${body.description}
        </p>


        <div class="quick-stats">

            <div class="quick-stat">

                <span>
                    Boyut
                </span>

                <strong>
                    ${body.dimensionsKm.join(" × ")} km
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Mars merkezinden uzaklık
                </span>

                <strong>
                    ≈ ${body.aKm.toLocaleString("tr-TR")} km
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Mars yüzeyinden uzaklık
                </span>

                <strong>
                    ≈ ${Math.round(altitudeKm).toLocaleString("tr-TR")} km
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Yörünge süresi
                </span>

                <strong>
                    ≈ ${periodHours.toFixed(2).replace(".", ",")} saat
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Yörünge eğimi
                </span>

                <strong>
                    ${body.inclinationDeg.toFixed(1).replace(".", ",")}°
                </strong>

            </div>


            <div class="quick-stat">

                <span>
                    Keşif
                </span>

                <strong>
                    ${body.discovery}
                </strong>

            </div>

        </div>


        <section class="info-section">

            <h2 class="info-section-title">
                Yörünge
            </h2>

            <p>
                ${body.name}, Mars çevresinde gerçek boyut ve
                yörünge oranları korunarak gösteriliyor.
                Yörünge uzaklığı, eğimi, eksantrikliği ve
                dolanım süresi simülasyonda hesaba katılıyor.
            </p>

        </section>


        <section class="info-section">

            <h2 class="info-section-title">
                Bilgi
            </h2>

            <p>
                ${body.note}
            </p>

        </section>


        <section class="info-section">

            <h2 class="info-section-title">
                3B inceleme
            </h2>

            <p>
                Mouse ile sürükleyerek ${body.name}'un çevresinde
                dönebilir, scroll ile yaklaşıp uzaklaşabilirsin.
            </p>

        </section>


        <div class="info-actions">

            <button
                id="back-from-mars-moon"
                class="secondary-action"
                type="button"
            >
                ← MARS'A DÖN
            </button>

        </div>

    `;


    document
        .getElementById(
            "back-from-mars-moon"
        )
        ?.addEventListener(

            "click",

            exitInspection

        );

}
// ======================================================
// 15. UYDU İNCELEME MODUNU BAŞLAT
// ======================================================

function startInspection(
    system
) {

    if (
        !system
        ||
        !system.loaded
    ) {
        return;
    }


    // Dünya karşılaştırması sırasında
    // uydulara girilemez.
    if (
        !marsMoonsState.interactionEnabled
    ) {
        return;
    }


    // Aynı uydu zaten inceleniyorsa
    // tekrar başlatma.
    if (
        marsMoonsState.inspecting === system
        &&
        !focusTween
    ) {
        return;
    }


    const switchingSatellite =
        marsMoonsState.inspecting !== null;


    // ==================================================
    // SADECE İLK UYDUYA GİRERKEN
    // MARS KAMERA KONUMUNU KAYDET
    // ==================================================

    if (
        !switchingSatellite
    ) {

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

    }


    // ==================================================
    // YENİ HEDEF UYDU
    // ==================================================

    marsMoonsState.inspecting =
        system;


    system.anchor.getWorldPosition(

        currentTrackedWorldPosition

    );


    lastTrackedWorldPosition.copy(

        currentTrackedWorldPosition

    );


    const maxDimensionScene =

        kmToScene(

            Math.max(
                ...system.data.dimensionsKm
            )

        );


    // Uydu modelinin birkaç çap uzağından izle.
    const inspectDistance =

        Math.max(

            maxDimensionScene
            *
            4.5,

            0.018

        );


    // Kamera geliş yönü.
    const direction =

        new THREE.Vector3(

            1.2,

            0.7,

            1.8

        )
        .normalize();


    // ==================================================
    // SMOOTH KAMERA GEÇİŞİ
    // ==================================================

    focusTween = {

        type:
            "in",

        start:
            performance.now(),

        fromCamera:
            cameraRef
                .position
                .clone(),

        fromTarget:
            controlsRef
                .target
                .clone(),

        inspectDistance,

        direction

    };


    controlsRef.enabled =
        false;


    // Küçük uydulara çok yaklaşabilmek için.
    cameraRef.near =
        0.0001;


    cameraRef.updateProjectionMatrix();
    // ======================================================
// 15 DEVAMI — İNCELEME AYARLARI
// ======================================================

    controlsRef.minDistance =

        Math.max(

            maxDimensionScene
            *
            0.7,

            0.002

        );


    controlsRef.maxDistance =

        Math.max(

            maxDimensionScene
            *
            25,

            0.12

        );


    // ==================================================
    // SADECE İNCELENEN UYDUNUN ETİKETİNİ GİZLE
    // ==================================================
    //
    // Phobos inceleniyorsa Deimos etiketi görünür.
    // Deimos inceleniyorsa Phobos etiketi görünür.
    //

    Object
        .values(
            marsMoonsState.bodies
        )
        .forEach(

            (moonSystem) => {

                if (
                    !moonSystem.label
                ) {
                    return;
                }


                moonSystem.label.visible =

                    moonSystem !== system;

            }

        );


    // ==================================================
    // SOL PANELİ GÜNCELLE
    // ==================================================

    showBodyInfo(
        system
    );


    // ==================================================
    // MARS.JS'E İNCELEME MODUNU BİLDİR
    // ==================================================

    window.dispatchEvent(

        new CustomEvent(

            "mars-satellite-inspection-change",

            {

                detail: {

                    active:
                        true,

                    name:
                        system.data.name

                }

            }

        )

    );

}


// ======================================================
// 16. İNCELEMEDEN ÇIK
// ======================================================

function exitInspection() {

    if (
        !marsMoonsState.inspecting
        ||
        !savedView
    ) {
        return;
    }


    focusTween = {

        type:
            "out",

        start:
            performance.now(),

        fromCamera:
            cameraRef
                .position
                .clone(),

        fromTarget:
            controlsRef
                .target
                .clone()

    };


    controlsRef.enabled =
        false;

}


// ======================================================
// 17. KARŞILAŞTIRMA İÇİN ANLIK RESET
// ======================================================
//
// Dünya karşılaştırmasına geçerken
// uydu inceleme modunu animasyonsuz kapatır.
//

export function resetMarsMoonInspectionToOverview() {

    if (
        !marsMoonsState.inspecting
    ) {
        return;
    }


    const system =
        marsMoonsState.inspecting;


    focusTween =
        null;


    if (
        savedView
    ) {

        cameraRef.position.copy(

            savedView.cameraPosition

        );


        controlsRef.target.copy(

            savedView.target

        );


        controlsRef.minDistance =
            savedView.minDistance;


        controlsRef.maxDistance =
            savedView.maxDistance;

    }


    cameraRef.near =
        0.01;


    cameraRef.updateProjectionMatrix();


    controlsRef.enabled =
        true;


    controlsRef.update();


    Object
        .values(
            marsMoonsState.bodies
        )
        .forEach(

            (moonSystem) => {

                if (
                    moonSystem.label
                ) {

                    moonSystem.label.visible =
                        true;

                }

            }

        );


    marsMoonsState.inspecting =
        null;


    savedView =
        null;


    window.dispatchEvent(

        new CustomEvent(

            "mars-satellite-inspection-change",

            {

                detail: {

                    active:
                        false

                }

            }

        )

    );

}
// ======================================================
// 18. KAMERA TAKİP SİSTEMİ
// ======================================================

function updateInspectionCamera() {

    const system =
        marsMoonsState.inspecting;


    if (
        !system
    ) {
        return;
    }


    // ==================================================
    // SMOOTH YAKLAŞMA / GERİ DÖNÜŞ
    // ==================================================

    if (
        focusTween
    ) {

        const rawT =

            THREE.MathUtils.clamp(

                (
                    performance.now()
                    -
                    focusTween.start
                )

                /

                FOCUS_DURATION_MS,

                0,

                1

            );


        const t =

            rawT
            *
            rawT
            *
            (
                3
                -
                2 * rawT
            );


        // ==============================================
        // UYDUYA GİRİŞ
        // ==============================================

        if (
            focusTween.type ===
            "in"
        ) {

            system.anchor.getWorldPosition(

                currentTrackedWorldPosition

            );


            const desiredCamera =

                currentTrackedWorldPosition
                    .clone()
                    .add(

                        focusTween
                            .direction
                            .clone()
                            .multiplyScalar(

                                focusTween
                                    .inspectDistance

                            )

                    );


            cameraRef.position.lerpVectors(

                focusTween.fromCamera,

                desiredCamera,

                t

            );


            controlsRef.target.lerpVectors(

                focusTween.fromTarget,

                currentTrackedWorldPosition,

                t

            );


            if (
                rawT >= 1
            ) {

                focusTween =
                    null;


                controlsRef.enabled =
                    true;


                lastTrackedWorldPosition.copy(

                    currentTrackedWorldPosition

                );

            }


            return;

        }


        // ==============================================
        // MARS'A GERİ DÖNÜŞ
        // ==============================================

        if (
            focusTween.type ===
            "out"
        ) {

            cameraRef.position.lerpVectors(

                focusTween.fromCamera,

                savedView.cameraPosition,

                t

            );


            controlsRef.target.lerpVectors(

                focusTween.fromTarget,

                savedView.target,

                t

            );


            if (
                rawT >= 1
            ) {

                cameraRef.position.copy(

                    savedView.cameraPosition

                );


                controlsRef.target.copy(

                    savedView.target

                );


                controlsRef.minDistance =
                    savedView.minDistance;


                controlsRef.maxDistance =
                    savedView.maxDistance;


                controlsRef.enabled =
                    true;


                cameraRef.near =
                    0.01;


                cameraRef.updateProjectionMatrix();


                Object
                    .values(
                        marsMoonsState.bodies
                    )
                    .forEach(

                        (moonSystem) => {

                            if (
                                moonSystem.label
                            ) {

                                moonSystem.label.visible =
                                    true;

                            }

                        }

                    );


                marsMoonsState.inspecting =
                    null;


                savedView =
                    null;


                focusTween =
                    null;


                controlsRef.update();


                window.dispatchEvent(

                    new CustomEvent(

                        "mars-satellite-inspection-change",

                        {

                            detail: {

                                active:
                                    false

                            }

                        }

                    )

                );


                window.dispatchEvent(

                    new CustomEvent(
                        "mars-overview-requested"
                    )

                );

            }


            return;

        }

    }
        // ==================================================
    // UYDU HAREKET EDERKEN KAMERA TAKİP ETSİN
    // ==================================================

    system.anchor.getWorldPosition(

        currentTrackedWorldPosition

    );


    const movement =

        currentTrackedWorldPosition
            .clone()
            .sub(

                lastTrackedWorldPosition

            );


    cameraRef.position.add(
        movement
    );


    controlsRef.target.copy(

        currentTrackedWorldPosition

    );


    lastTrackedWorldPosition.copy(

        currentTrackedWorldPosition

    );

}


// ======================================================
// 19. POINTER HESABI
// ======================================================

function getPointerFromEvent(
    event
) {

    const rect =

        rendererRef
            .domElement
            .getBoundingClientRect();


    return new THREE.Vector2(

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
        1,


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
        1

    );

}


// ======================================================
// 20. TIKLAMA + HOVER SİSTEMİ
// ======================================================

function setupPicking() {

    const raycaster =
        new THREE.Raycaster();


    // ==================================================
    // HOVER
    // ==================================================

    rendererRef
        .domElement
        .addEventListener(

            "pointermove",

            (event) => {

                // Dünya karşılaştırmasında
                // uydu etkileşimi tamamen kapalı.
                if (
                    !marsMoonsState.interactionEnabled
                ) {

                    rendererRef
                        .domElement
                        .style
                        .cursor =
                        "grab";

                    return;

                }


                // Uydu incelerken
                // normal hover raycast çalışmasın.
                if (
                    marsMoonsState.inspecting
                ) {
                    return;
                }


                const pointer =
                    getPointerFromEvent(
                        event
                    );


                raycaster.setFromCamera(

                    pointer,

                    cameraRef

                );


                const targets =

                    Object
                        .values(
                            marsMoonsState.bodies
                        )
                        .map(

                            (system) =>
                                system.hitTarget

                        )
                        .filter(
                            Boolean
                        );


                const hits =

                    raycaster.intersectObjects(

                        targets,

                        false

                    );


                if (
                    hits.length > 0
                ) {

                    rendererRef
                        .domElement
                        .style
                        .cursor =
                        "pointer";

                }

            },

            true

        );


    // ==================================================
    // CLICK
    // ==================================================

    rendererRef
        .domElement
        .addEventListener(

            "click",

            (event) => {

                // Dünya karşılaştırmasında
                // Phobos / Deimos tıklanamaz.
                if (
                    !marsMoonsState.interactionEnabled
                ) {
                    return;
                }


                if (
                    marsMoonsState.inspecting
                ) {
                    return;
                }


                const pointer =
                    getPointerFromEvent(
                        event
                    );


                raycaster.setFromCamera(

                    pointer,

                    cameraRef

                );


                const targets =

                    Object
                        .values(
                            marsMoonsState.bodies
                        )
                        .map(

                            (system) =>
                                system.hitTarget

                        )
                        .filter(
                            Boolean
                        );


                const hits =

                    raycaster.intersectObjects(

                        targets,

                        false

                    );


                if (
                    hits.length === 0
                ) {
                    return;
                }


                const key =

                    hits[0]
                        .object
                        .userData
                        .marsMoonKey;


                const system =

                    marsMoonsState
                        .bodies[
                            key
                        ];


                if (
                    !system
                ) {
                    return;
                }


                event.stopImmediatePropagation();


                startInspection(
                    system
                );

            },

            true

        );

}
// ======================================================
// 21. UYDU SEÇİM KARTLARI
// ======================================================

function createMoonSelector() {

    document
        .getElementById(
            "mars-moon-selector"
        )
        ?.remove();


    const panel =
        document.createElement(
            "div"
        );


    panel.id =
        "mars-moon-selector";


    Object.assign(

        panel.style,

        {

            position:
                "absolute",

            right:
                "32px",

            bottom:
                "30px",

            display:
                "flex",

            alignItems:
                "center",

            gap:
                "8px",

            padding:
                "8px",

            border:
                "1px solid rgba(255,255,255,0.14)",

            borderRadius:
                "999px",

            background:
                "rgba(3,7,18,0.76)",

            backdropFilter:
                "blur(12px)",

            zIndex:
                "45"

        }

    );


    const title =
        document.createElement(
            "span"
        );


    title.textContent =
        "UYDULAR";


    Object.assign(

        title.style,

        {

            margin:
                "0 7px",

            fontSize:
                "9px",

            fontWeight:
                "700",

            letterSpacing:
                "0.12em",

            color:
                "rgba(255,255,255,0.45)"

        }

    );


    panel.appendChild(
        title
    );


    const moonButtons = [

        {
            key:
                "phobos",

            name:
                "PHOBOS"
        },

        {
            key:
                "deimos",

            name:
                "DEIMOS"
        }

    ];


    moonButtons.forEach(

        (item) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.textContent =
                item.name;


            Object.assign(

                button.style,

                {

                    height:
                        "34px",

                    padding:
                        "0 14px",

                    border:
                        "1px solid rgba(255,255,255,0.18)",

                    borderRadius:
                        "999px",

                    background:
                        "transparent",

                    color:
                        "#ffffff",

                    fontSize:
                        "9px",

                    fontWeight:
                        "800",

                    letterSpacing:
                        "0.08em",

                    cursor:
                        "pointer"

                }

            );


            button.addEventListener(

                "mouseenter",

                () => {

                    button.style.background =
                        "rgba(255,255,255,0.10)";

                }

            );


            button.addEventListener(

                "mouseleave",

                () => {

                    button.style.background =
                        "transparent";

                }

            );


            button.addEventListener(

                "click",

                () => {

                    if (
                        !marsMoonsState.interactionEnabled
                    ) {
                        return;
                    }


                    const system =
                        marsMoonsState
                            .bodies[
                                item.key
                            ];


                    if (
                        !system
                        ||
                        !system.loaded
                    ) {
                        return;
                    }


                    startInspection(
                        system
                    );

                }

            );


            panel.appendChild(
                button
            );

        }

    );


    const marsPage =
        document.querySelector(
            ".mars-page"
        );


    if (
        marsPage
    ) {

        marsPage.appendChild(
            panel
        );

    }

}
// ======================================================
// 22. PHOBOS + DEIMOS SİSTEMİNİ BAŞLAT
// ======================================================

export function initMarsMoons({

    parent,

    renderer,

    camera,

    controls

}) {

    rendererRef =
        renderer;


    cameraRef =
        camera;


    controlsRef =
        controls;


    const root =
        new THREE.Group();


    root.name =
        "MARS_MOONS_SYSTEM";


    parent.add(
        root
    );


    marsMoonsState.root =
        root;


    // ==================================================
    // DRACO + GLTF LOADER
    // ==================================================

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


    // ==================================================
    // PHOBOS + DEIMOS
    // ==================================================

    Object
        .values(
            BODY_DATA
        )
        .forEach(

            (body) => {

                // --------------------------------------
                // UYDUNUN HAREKET EDECEĞİ ANCHOR
                // --------------------------------------

                const anchor =
                    new THREE.Group();


                anchor.name =
                    `${body.name.toUpperCase()}_ANCHOR`;


                // --------------------------------------
                // GERÇEK YÖRÜNGE ÇİZGİSİ
                // --------------------------------------

                const orbit =
                    createOrbitLine(
                        body
                    );


                root.add(
                    orbit
                );


                root.add(
                    anchor
                );


                // --------------------------------------
                // GÖRÜNMEYEN TIKLAMA ALANI
                // --------------------------------------
                //
                // Model gerçek boyutta kalıyor.
                // Sadece tıklama alanı büyük.
                //

                const hitRadius =

                    body.key ===
                    "phobos"

                        ?

                        0.10

                        :

                        0.14;


                const hitTarget =

                    new THREE.Mesh(

                        new THREE.SphereGeometry(

                            hitRadius,

                            16,

                            16

                        ),

                        new THREE.MeshBasicMaterial({

                            transparent:
                                true,

                            opacity:
                                0,

                            depthWrite:
                                false

                        })

                    );


                hitTarget.userData.marsMoonKey =
                    body.key;


                anchor.add(
                    hitTarget
                );


                // --------------------------------------
                // UYDU İSMİ
                // --------------------------------------

                const label =
                    createLabel(
                        body.name
                    );


                anchor.add(
                    label
                );


                // --------------------------------------
                // SYSTEM OBJECT
                // --------------------------------------

                const system = {

                    data:
                        body,

                    anchor,

                    orbit,

                    hitTarget,

                    label,

                    model:
                        null,

                    loaded:
                        false

                };


                marsMoonsState.bodies[
                    body.key
                ] =
                    system;


                // --------------------------------------
                // İLK GERÇEK YÖRÜNGE KONUMU
                // --------------------------------------

                anchor.position.copy(

                    calculateBodyPosition(

                        body,

                        Date.now()

                    )

                );


                // Mars'a gelgitsel kilit hissi.
                anchor.lookAt(
                    0,
                    0,
                    0
                );


                // --------------------------------------
                // GLB MODELİNİ YÜKLE
                // --------------------------------------

                loadBodyModel(

                    system,

                    loader

                );

            }

        );


    setupPicking();


    createMoonSelector();


    console.log(

        "Phobos + Deimos sistemi JPL ortalama yörünge elemanlarıyla hazır."

    );


    return marsMoonsState;

}
// ======================================================
// 23. HER FRAME'DE UYDULARI GÜNCELLE
// ======================================================

export function updateMarsMoons(
    timestampMs = Date.now()
) {

    Object
        .values(
            marsMoonsState.bodies
        )
        .forEach(

            (system) => {

                system.anchor.position.copy(

                    calculateBodyPosition(

                        system.data,

                        timestampMs

                    )

                );


                // Mars'a aynı yüzünü dönük tut.
                system.anchor.lookAt(
                    0,
                    0,
                    0
                );

            }

        );


    updateInspectionCamera();

}


// ======================================================
// 24. UYDU SİSTEMİNİ AÇ / KAPAT
// ======================================================
//
// Dünya karşılaştırmasında:
//
// - Phobos görünmez
// - Deimos görünmez
// - yörüngeler görünmez
// - label'lar görünmez
// - hitbox'lar tıklanamaz
// - kartlar gizlenir
//
// Mars'a dönünce tekrar açılır.
//

export function setMarsMoonsEnabled(
    enabled
) {

    marsMoonsState.interactionEnabled =
        enabled;


    if (
        marsMoonsState.root
    ) {

        marsMoonsState.root.visible =
            enabled;

    }


    const selector =
        document.getElementById(
            "mars-moon-selector"
        );


    if (
        selector
    ) {

        selector.style.display =

            enabled
                ?
                "flex"
                :
                "none";

    }


    if (
        !enabled
    ) {

        // Eğer karşılaştırmaya geçerken
        // uydu inceleme modu açıksa kapat.
        resetMarsMoonInspectionToOverview();

    }

}


// ======================================================
// 25. DEBUG / KONTROL
// ======================================================

export function getMarsMoonSystem(
    key
) {

    return marsMoonsState
        .bodies[
            key
        ]
        ??
        null;

}