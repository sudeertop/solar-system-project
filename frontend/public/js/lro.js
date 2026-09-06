import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";

import {
    DRACOLoader
} from "three/addons/loaders/DRACOLoader.js";


// ======================================================
// 1. LRO GLOBAL STATE
// ======================================================

export const lroState = {

    root:
        null,

    anchor:
        null,

    model:
        null,

    orbit:
        null,

    label:
        null,

    loaded:
        false,

    live:
        true,

    speed:
        1,

    simulationTime:
        Date.now(),

    inspecting:
        false

};


// ======================================================
// 2. REFERANSLAR
// ======================================================
//
// initLRO() çağrıldığında doldurulacak.
//

let parentRef =
    null;


let rendererRef =
    null;


let cameraRef =
    null;


let controlsRef =
    null;


// ======================================================
// 3. AY + LRO FİZİKSEL SABİTLERİ
// ======================================================
//
// Ay yarıçapı:
// 1737.4 km
//
// LRO için kullandığımız yaklaşık yörünge:
// perilune ≈ 20 km
// apolune ≈ 165 km
//
// Bunlar görselleştirme için kullandığımız
// eliptik kutupsal LRO yörüngesini tanımlar.
// ======================================================

const MOON_RADIUS_KM =
    1737.4;


const PERILUNE_ALTITUDE_KM =
    20;


const APOLUNE_ALTITUDE_KM =
    165;


// Ay'ın standart gravitasyon parametresi
// km³ / s²

const MOON_MU =
    4902.800066;


// ======================================================
// 4. YÖRÜNGE YARIÇAPLARI
// ======================================================

const PERILUNE_RADIUS_KM =

    MOON_RADIUS_KM

    +

    PERILUNE_ALTITUDE_KM;


const APOLUNE_RADIUS_KM =

    MOON_RADIUS_KM

    +

    APOLUNE_ALTITUDE_KM;


// ======================================================
// 5. YARI BÜYÜK EKSEN
// ======================================================

const SEMI_MAJOR_AXIS_KM =

    (
        PERILUNE_RADIUS_KM

        +

        APOLUNE_RADIUS_KM
    )

    /

    2;


// ======================================================
// 6. DIŞMERKEZLİK
// ======================================================

const ECCENTRICITY =

    (
        APOLUNE_RADIUS_KM

        -

        PERILUNE_RADIUS_KM
    )

    /

    (
        APOLUNE_RADIUS_KM

        +

        PERILUNE_RADIUS_KM
    );


// ======================================================
// 7. YÖRÜNGE PERİYODU
// ======================================================

const ORBIT_PERIOD_SECONDS =

    2

    *

    Math.PI

    *

    Math.sqrt(

        Math.pow(
            SEMI_MAJOR_AXIS_KM,
            3
        )

        /

        MOON_MU

    );


// ======================================================
// 8. YÖRÜNGE YÖNELİMİ
// ======================================================
//
// LRO kutupsal yörüngede.
//
// Burada 90° eğim kullanıyoruz.
// ======================================================

const ORBIT_INCLINATION =

    THREE.MathUtils.degToRad(
        90
    );


// Perilune yönünü sahnede daha anlaşılır
// göstermek için kullandığımız açı.

const ARGUMENT_OF_PERILUNE =

    THREE.MathUtils.degToRad(
        90
    );


// Yörünge düzlemini ekranda hafif döndürüyoruz.
//
// Bu fiziksel ölçeği değiştirmez;
// yalnızca 3B sahnedeki görsel yönelimdir.

const VISUAL_NODE_ANGLE =

    THREE.MathUtils.degToRad(
        -28
    );


// ======================================================
// 9. SİMÜLASYON REFERANS ANI
// ======================================================

const PHASE_REFERENCE_TIME =

    Date.parse(
        "2026-01-01T00:00:00Z"
    );


// ======================================================
// 10. ZAMAN STATE
// ======================================================

let previousFrameTime =
    performance.now();


// ======================================================
// 11. KAMERA STATE
// ======================================================

let savedView =
    null;


let focusTween =
    null;


// ======================================================
// 12. KAMERA TAKİP VEKTÖRLERİ
// ======================================================

const lastLROWorldPosition =
    new THREE.Vector3();


const currentLROWorldPosition =
    new THREE.Vector3();


const moonWorldCenter =
    new THREE.Vector3();


const safeCameraDirection =
    new THREE.Vector3();


// ======================================================
// 13. KAMERA GEÇİŞ SÜRESİ
// ======================================================

const FOCUS_DURATION =
    950;


// ======================================================
// 14. LRO MODELİ İÇİN GÖRSEL YÜZEY PAYI
// ======================================================
//
// LRO gerçek fiziksel boyutunda gösterilirse
// bu ekranda neredeyse görünmez.
//
// Bu nedenle LRO modeli gerçek boyutundan daha
// büyük gösteriliyor.
//
// Gerçek perilune yalnızca yaklaşık 20 km olduğu
// için büyütülmüş model Ay yüzeyine gömülmüş gibi
// görünebilir.
//
// Yörünge çizgisi fiziksel konumda kalır.
//
// Sadece görünen LRO modeli biraz dışarı taşınır.
// ======================================================

const LRO_VISUAL_CLEARANCE =
    0.005;


// ======================================================
// 15. KAMERA / AY ÇARPIŞMA SINIRI
// ======================================================
//
// Ay sahnede yarıçap = 1.
//
// Kameranın geçiş animasyonu sırasında da
// Ay'ın içine girmemesi için daha geniş bir
// güvenli küre kullanıyoruz.
// ======================================================

const CAMERA_SAFE_MOON_RADIUS =
    1.08;


// Geçiş sırasında kamera Ay'a yapışmasın.
//
// Yolun orta bölümünde bu kadar ek dışarı
// açılmasına izin veriyoruz.

const CAMERA_ARC_CLEARANCE =
    0.32;


// ======================================================
// 16. LRO İNCELEME MESAFELERİ
// ======================================================
//
// Kameranın LRO'nun tam üstüne gitmesini
// istemiyoruz.
//
// LRO'nun Ay merkezinden dışa bakan yönünü,
// yan yönünü ve hafif üst yönü kullanacağız.
// ======================================================

const INSPECTION_OUTWARD_DISTANCE =
    0.25;


const INSPECTION_SIDE_DISTANCE =
    0.18;


const INSPECTION_UP_DISTANCE =
    0.10;


// ======================================================
// 17. SAHNE ÖLÇEĞİ
// ======================================================

function kmToSceneRadius(
    radiusKm
) {

    return (

        radiusKm

        /

        MOON_RADIUS_KM

    );

}


// ======================================================
// 18. KEPLER DENKLEMİ
// ======================================================

function solveKepler(
    meanAnomaly,
    eccentricity
) {

    let E =
        meanAnomaly;


    for (
        let i = 0;
        i < 8;
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
// 19. GERÇEK YÖRÜNGE KONUMU
// ======================================================

function calculateOrbitPosition(
    timestamp
) {

    const elapsedSeconds =

        (
            timestamp

            -

            PHASE_REFERENCE_TIME
        )

        /

        1000;


    let meanAnomaly =

        (
            elapsedSeconds

            /

            ORBIT_PERIOD_SECONDS
        )

        *

        Math.PI

        *

        2;


    meanAnomaly =

        THREE.MathUtils.euclideanModulo(

            meanAnomaly,

            Math.PI * 2

        );


    const eccentricAnomaly =

        solveKepler(

            meanAnomaly,

            ECCENTRICITY

        );


    const trueAnomaly =

        Math.atan2(

            Math.sqrt(

                1

                -

                ECCENTRICITY
                *
                ECCENTRICITY

            )

            *

            Math.sin(
                eccentricAnomaly
            ),


            Math.cos(
                eccentricAnomaly
            )

            -

            ECCENTRICITY

        );


    const radiusKm =

        SEMI_MAJOR_AXIS_KM

        *

        (
            1

            -

            ECCENTRICITY

            *

            Math.cos(
                eccentricAnomaly
            )

        );


    const radius =

        kmToSceneRadius(
            radiusKm
        );


    const argument =

        trueAnomaly

        +

        ARGUMENT_OF_PERILUNE;


    const x =

        radius

        *

        Math.cos(
            argument
        );


    const equatorialZ =

        radius

        *

        Math.sin(
            argument
        );


    const y =

        -

        equatorialZ

        *

        Math.sin(
            ORBIT_INCLINATION
        );


    const z =

        equatorialZ

        *

        Math.cos(
            ORBIT_INCLINATION
        );


    const position =

        new THREE.Vector3(

            x,

            y,

            z

        );


    position.applyAxisAngle(

        new THREE.Vector3(
            0,
            1,
            0
        ),

        VISUAL_NODE_ANGLE

    );


    return position;

}


// ======================================================
// 20. GÖRSEL LRO KONUMU
// ======================================================
//
// Fiziksel yörüngeyi değiştirmiyoruz.
//
// Yalnızca büyütülmüş 3B LRO modelinin
// Ay yüzeyine gömülmesini önlemek için
// anchor biraz dışarı alınıyor.
// ======================================================

function calculateLRODisplayPosition(
    timestamp
) {

    const physicalPosition =

        calculateOrbitPosition(
            timestamp
        );


    const outwardDirection =

        physicalPosition
            .clone()
            .normalize();


    return physicalPosition

        .clone()

        .add(

            outwardDirection
                .multiplyScalar(
                    LRO_VISUAL_CLEARANCE
                )

        );

}


// ======================================================
// 21. YÖRÜNGE ÇİZGİSİ
// ======================================================

function createOrbitLine() {

    const points =
        [];


    const segments =
        500;


    for (
        let i = 0;
        i <= segments;
        i++
    ) {

        const timestamp =

            PHASE_REFERENCE_TIME

            +

            (
                i

                /

                segments
            )

            *

            ORBIT_PERIOD_SECONDS

            *

            1000;


        points.push(

            calculateOrbitPosition(
                timestamp
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
                0x8bdcff,

            transparent:
                true,

            opacity:
                0.52

        });


    const line =

        new THREE.LineLoop(

            geometry,

            material

        );


    line.name =
        "LRO_ORBIT";


    return line;

}


// ======================================================
// 22. LRO ETİKETİ
// ======================================================
//
// Kullanıcının istediği:
// LRO modelinin üzerinde sürekli "LRO" yazacak.
//
// CanvasTexture + Sprite kullanıyoruz.
//
// Sprite olduğu için kamera hangi yönden bakarsa
// baksın yazı kameraya dönük kalır.
// ======================================================

function createLROLabel() {

    const canvas =

        document.createElement(
            "canvas"
        );


    canvas.width =
        512;


    canvas.height =
        160;


    const context =

        canvas.getContext(
            "2d"
        );


    // ==================================================
    // ALT NOKTA
    // ==================================================

    context.strokeStyle =
        "rgba(139,220,255,0.95)";


    context.lineWidth =
        4;


    context.beginPath();


    context.arc(

        75,

        93,

        10,

        0,

        Math.PI * 2

    );


    context.stroke();


    context.fillStyle =
        "#8bdcff";


    context.shadowColor =
        "#8bdcff";


    context.shadowBlur =
        16;


    context.beginPath();


    context.arc(

        75,

        93,

        4,

        0,

        Math.PI * 2

    );


    context.fill();


    context.shadowBlur =
        0;


    // ==================================================
    // NOKTADAN YAZIYA ÇİZGİ
    // ==================================================

    context.strokeStyle =
        "rgba(139,220,255,0.6)";


    context.lineWidth =
        2;


    context.beginPath();


    context.moveTo(
        75,
        80
    );


    context.lineTo(
        108,
        50
    );


    context.stroke();


    // ==================================================
    // LRO YAZISI
    // ==================================================

    context.font =
        "700 38px Arial";


    context.textAlign =
        "left";


    context.textBaseline =
        "middle";


    // Dış kontur

    context.strokeStyle =
        "rgba(2,4,10,0.96)";


    context.lineWidth =
        9;


    context.strokeText(

        "LRO",

        118,

        46

    );


    // İç yazı

    context.fillStyle =
        "#ffffff";


    context.fillText(

        "LRO",

        118,

        46

    );


    // ==================================================
    // ALT AÇIKLAMA
    // ==================================================

    context.font =
        "600 17px Arial";


    context.fillStyle =
        "rgba(255,255,255,0.60)";


    context.fillText(

        "LUNAR RECONNAISSANCE ORBITER",

        118,

        80

    );


    // ==================================================
    // TEXTURE
    // ==================================================

    const texture =

        new THREE.CanvasTexture(
            canvas
        );


    texture.colorSpace =
        THREE.SRGBColorSpace;


    texture.needsUpdate =
        true;


    // ==================================================
    // MATERIAL
    // ==================================================

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


    // ==================================================
    // SPRITE
    // ==================================================

    const sprite =

        new THREE.Sprite(
            material
        );


    sprite.name =
        "LRO_LABEL";


    // LRO anchor merkezinin hafif üstünde.

    sprite.position.set(

        0,

        0.020,

        0

    );


    sprite.scale.set(

        0.22,

        0.068,

        1

    );


    sprite.center.set(

        0.15,

        0.15

    );


    sprite.renderOrder =
        50;


    sprite.userData.isLROLabel =
        true;


    return sprite;

}


// ======================================================
// 23. LRO ETİKET GÖRÜNÜRLÜĞÜ
// ======================================================
//
// LRO Ay'ın arkasındaysa yazının Ay'ın içinden
// görünmesini istemiyoruz.
//
// Bu yüzden anchor'ın Ay'ın kameraya bakan
// yarımküresinde olup olmadığını kontrol ediyoruz.
//
// LRO inceleme modunda kullanıcı zaten LRO'nun
// yakınında olduğu için etiket açık kalacak.
// ======================================================

const labelLROWorldPosition =
    new THREE.Vector3();


const labelMoonCenter =
    new THREE.Vector3();


const labelSurfaceDirection =
    new THREE.Vector3();


const labelCameraDirection =
    new THREE.Vector3();


function updateLROLabelVisibility() {

    if (
        !lroState.label
        ||
        !lroState.anchor
        ||
        !parentRef
        ||
        !cameraRef
    ) {

        return;

    }


    // Root komple gizliyse
    // label da görünmez.

    if (
        !lroState.root
        ||
        !lroState.root.visible
    ) {

        lroState.label.visible =
            false;


        return;

    }


    // İnceleme sırasında etiket açık kalsın.

    if (
        lroState.inspecting
    ) {

        lroState.label.visible =
            true;


        return;

    }


    parentRef.getWorldPosition(
        labelMoonCenter
    );


    lroState.anchor.getWorldPosition(
        labelLROWorldPosition
    );


    labelSurfaceDirection

        .copy(
            labelLROWorldPosition
        )

        .sub(
            labelMoonCenter
        )

        .normalize();


    labelCameraDirection

        .copy(
            cameraRef.position
        )

        .sub(
            labelMoonCenter
        )

        .normalize();


    const facing =

        labelSurfaceDirection.dot(
            labelCameraDirection
        );


    lroState.label.visible =

        facing > -0.02;

}


// ======================================================
// 24. LRO BİLGİ PANELİ
// ======================================================

function showLROInfo(
    onBack
) {

    const infoContent =

        document.getElementById(
            "info-content"
        );


    if (
        !infoContent
    ) {

        return;

    }


    infoContent.innerHTML = `

        <p class="info-kicker">
            AY YÖRÜNGESİ · NASA
        </p>

        <h1 class="info-title">
            LRO
        </h1>

        <p class="info-lead">

            Lunar Reconnaissance Orbiter,
            Ay yüzeyini yüksek çözünürlükte
            haritalamak ve Ay'ın jeolojisi,
            yüzey yapısı ve gelecekteki
            keşif görevleri için bilimsel
            veri toplamak amacıyla görev yapan
            bir NASA yörünge aracıdır.

        </p>

        <div class="quick-stats">

            <div class="quick-stat">
                <span>Fırlatma</span>
                <strong>18 Haziran 2009</strong>
            </div>

            <div class="quick-stat">
                <span>Durum</span>
                <strong>Aktif</strong>
            </div>

            <div class="quick-stat">
                <span>Yörünge tipi</span>
                <strong>Kutupsal</strong>
            </div>

            <div class="quick-stat">
                <span>En yakın</span>
                <strong>≈ 20 km</strong>
            </div>

            <div class="quick-stat">
                <span>En uzak</span>
                <strong>≈ 165 km</strong>
            </div>

            <div class="quick-stat">

                <span>
                    Simülasyon periyodu
                </span>

                <strong>

                    ≈ ${
                        (
                            ORBIT_PERIOD_SECONDS
                            /
                            60
                        ).toFixed(0)
                    } dk

                </strong>

            </div>

        </div>

        <section class="info-section">

            <h2 class="info-section-title">
                Neyi inceliyor?
            </h2>

            <p>

                LRO üzerindeki bilimsel araçlar
                Ay'ın yüzeyini görüntüler,
                sıcaklık değişimlerini ölçer,
                topoğrafyayı haritalar ve özellikle
                kutup bölgelerindeki su buzu
                açısından önemli alanların
                incelenmesine katkı sağlar.

            </p>

        </section>

        <section class="info-section">

            <h2 class="info-section-title">
                Ay'da su buzu neden önemli?
            </h2>

            <p>

                Ay'ın kutuplarındaki bazı kraterlerin
        tabanları Güneş ışığını neredeyse hiç
        almaz ve milyarlarca yıl boyunca
        son derece soğuk kalabilir.

        Bu kalıcı gölgeli bölgelerde su buzu
        bulunması, gelecekteki insanlı Ay
        görevleri için büyük önem taşır.
        Su; içme suyu sağlamanın yanında
        oksijen ve roket yakıtı üretiminde de
        kullanılabilir.

        LRO'nun sıcaklık ve yüzey haritaları,
        bu bölgelerin nerede bulunduğunu
        anlamamıza yardımcı olur.

            </p>

        </section>

        <div class="info-actions">

            <button
                id="back-from-lro"
                class="secondary-action"
                type="button"
            >

                ← AY'A DÖN

            </button>

        </div>

    `;


    document
        .getElementById(
            "back-from-lro"
        )
        ?.addEventListener(

            "click",

            onBack

        );

}


// ======================================================
// 25. HIZ KONTROL GÖRÜNÜMÜ
// ======================================================

function updateControlAppearance() {

    const liveButton =

        document.getElementById(
            "lro-live-button"
        );


    if (
        liveButton
    ) {

        liveButton.style.background =

            lroState.live

                ?

                "#ffffff"

                :

                "transparent";


        liveButton.style.color =

            lroState.live

                ?

                "#05070c"

                :

                "rgba(255,255,255,0.65)";

    }


    document
        .querySelectorAll(
            "#lro-time-controls button[data-speed]"
        )
        .forEach(

            (button) => {

                const speed =

                    Number(
                        button.dataset.speed
                    );


                const active =

                    !lroState.live

                    &&

                    speed ===
                    lroState.speed;


                button.style.background =

                    active

                        ?

                        "rgba(255,255,255,0.14)"

                        :

                        "transparent";


                button.style.color =

                    active

                        ?

                        "#ffffff"

                        :

                        "rgba(255,255,255,0.65)";

            }

        );

}


// ======================================================
// 26. HIZ KONTROL PANELİ
// ======================================================

function createTimeControls() {

    document
        .getElementById(
            "lro-time-controls"
        )
        ?.remove();


    const panel =

        document.createElement(
            "div"
        );


    panel.id =
        "lro-time-controls";


    Object.assign(

        panel.style,

        {

            position:
                "absolute",

            left:
                "50%",

            bottom:
                "28px",

            transform:
                "translateX(-50%)",

            display:
                "flex",

            alignItems:
                "center",

            gap:
                "7px",

            padding:
                "7px 9px",

            border:
                "1px solid rgba(255,255,255,0.16)",

            borderRadius:
                "999px",

            background:
                "rgba(3,7,18,0.78)",

            backdropFilter:
                "blur(12px)",

            zIndex:
                "40",

            fontFamily:
                "Arial, sans-serif"

        }

    );


    const clock =

        document.createElement(
            "span"
        );


    clock.id =
        "lro-clock";


    Object.assign(

        clock.style,

        {

            padding:
                "0 10px",

            color:
                "rgba(255,255,255,0.55)",

            fontSize:
                "9px",

            letterSpacing:
                "0.08em",

            whiteSpace:
                "nowrap"

        }

    );


    panel.appendChild(
        clock
    );


    [
        0.25,
        1,
        10,
        100

    ].forEach(

        (speed) => {

            const button =

                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.textContent =
                `${speed}×`;


            button.dataset.speed =
                String(speed);


            Object.assign(

                button.style,

                {

                    height:
                        "32px",

                    minWidth:
                        "42px",

                    padding:
                        "0 10px",

                    border:
                        "1px solid rgba(255,255,255,0.14)",

                    borderRadius:
                        "999px",

                    background:
                        "transparent",

                    color:
                        "rgba(255,255,255,0.72)",

                    fontSize:
                        "9px",

                    fontWeight:
                        "700",

                    cursor:
                        "pointer"

                }

            );


            button.addEventListener(

                "click",

                () => {

                    lroState.live =
                        false;


                    lroState.speed =
                        speed;


                    updateControlAppearance();

                }

            );


            panel.appendChild(
                button
            );

        }

    );


    const liveButton =

        document.createElement(
            "button"
        );


    liveButton.type =
        "button";


    liveButton.id =
        "lro-live-button";


    liveButton.textContent =
        "● LIVE";


    Object.assign(

        liveButton.style,

        {

            height:
                "32px",

            padding:
                "0 13px",

            border:
                "1px solid rgba(255,255,255,0.25)",

            borderRadius:
                "999px",

            fontSize:
                "9px",

            fontWeight:
                "800",

            letterSpacing:
                "0.05em",

            cursor:
                "pointer"

        }

    );


    liveButton.addEventListener(

        "click",

        () => {

            lroState.live =
                true;


            lroState.speed =
                1;


            lroState.simulationTime =
                Date.now();


            updateControlAppearance();

        }

    );


    panel.appendChild(
        liveButton
    );


    document
        .querySelector(
            ".moon-page"
        )
        ?.appendChild(
            panel
        );


    updateControlAppearance();

}


// ======================================================
// 27. HIZ KONTROLLERİNİ GİZLE / GÖSTER
// ======================================================
//
// Dünya karşılaştırmasında lroState.root.visible = false
// yapılıyor.
//
// Aynı durumda alttaki LRO zaman panelini de gizliyoruz.
// ======================================================

function updateTimeControlsVisibility() {

    const panel =

        document.getElementById(
            "lro-time-controls"
        );


    if (
        !panel
    ) {

        return;

    }


    const shouldShow =

        Boolean(
            lroState.root
        )

        &&

        lroState.root.visible;


    panel.style.display =

        shouldShow

            ?

            "flex"

            :

            "none";

}


// ======================================================
// 28. SAAT METNİ
// ======================================================

function updateClockText() {

    const clock =

        document.getElementById(
            "lro-clock"
        );


    if (
        !clock
    ) {

        return;

    }


    const date =

        new Date(
            lroState.simulationTime
        );


    const dateText =

        date.toLocaleString(
            "tr-TR",
            {
                day:
                    "2-digit",

                month:
                    "2-digit",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit"
            }
        );


    clock.textContent =

        lroState.live

            ?

            `GERÇEK ZAMAN · ${dateText}`

            :

            `SİMÜLASYON · ${dateText}`;

}


// ======================================================
// 29. AY MERKEZİNİ BUL
// ======================================================

function getMoonWorldCenter() {

    if (
        !parentRef
    ) {

        return moonWorldCenter.set(
            0,
            0,
            0
        );

    }


    parentRef.getWorldPosition(
        moonWorldCenter
    );


    return moonWorldCenter;

}


// ======================================================
// 30. NOKTAYI AY'IN DIŞINA ZORLA
// ======================================================
//
// Bir kamera hedef konumu yanlışlıkla Ay'ın
// güvenlik küresinin içinde hesaplanırsa
// dışarı taşıyoruz.
// ======================================================

function forcePointOutsideMoon(
    point,
    minimumRadius = CAMERA_SAFE_MOON_RADIUS
) {

    const center =
        getMoonWorldCenter();


    safeCameraDirection

        .copy(
            point
        )

        .sub(
            center
        );


    const distance =
        safeCameraDirection.length();


    if (
        distance >=
        minimumRadius
    ) {

        return point;

    }


    if (
        distance <
        0.000001
    ) {

        safeCameraDirection.set(
            0,
            0,
            1
        );

    }

    else {

        safeCameraDirection.normalize();

    }


    point.copy(
        center
    );


    point.add(

        safeCameraDirection
            .multiplyScalar(
                minimumRadius
            )

    );


    return point;

}


// ======================================================
// 31. GÜVENLİ İNCELEME KAMERA KONUMU
// ======================================================
//
// Eski sistem:
//
// LRO world position
// +
// sabit bir (x,y,z) offset
//
// kullanıyordu.
//
// LRO Ay'ın arkasına geçtiğinde bu sabit offset
// bazen kamerayı Ay'ın içine doğru yöneltebiliyordu.
//
// Yeni sistem:
//
// 1. Ay merkezinden LRO'ya dış yön
// 2. Bu dış yöne dik bir yan yön
// 3. Bir miktar üst yön
//
// kullanıyor.
//
// Böylece kamera daima LRO'nun Ay'dan dışarı
// bakan tarafında kalıyor.
// ======================================================

function calculateInspectionCameraPosition() {

    const center =
        getMoonWorldCenter()
            .clone();


    lroState.anchor.getWorldPosition(
        currentLROWorldPosition
    );


    const outward =

        currentLROWorldPosition
            .clone()
            .sub(
                center
            )
            .normalize();


    let tangent =

        new THREE.Vector3(
            0,
            1,
            0
        )

            .cross(
                outward
            );


    if (
        tangent.lengthSq() <
        0.0001
    ) {

        tangent =

            new THREE.Vector3(
                1,
                0,
                0
            )

                .cross(
                    outward
                );

    }


    tangent.normalize();


    const upAroundOrbit =

        outward
            .clone()
            .cross(
                tangent
            )
            .normalize();


    const desiredCamera =

        currentLROWorldPosition
            .clone()


            // Ay'dan dışarı

            .add(

                outward
                    .clone()
                    .multiplyScalar(
                        INSPECTION_OUTWARD_DISTANCE
                    )

            )


            // LRO'yu hafif yandan görelim

            .add(

                tangent
                    .clone()
                    .multiplyScalar(
                        INSPECTION_SIDE_DISTANCE
                    )

            )


            // Biraz üst açı

            .add(

                upAroundOrbit
                    .clone()
                    .multiplyScalar(
                        INSPECTION_UP_DISTANCE
                    )

            );


    forcePointOutsideMoon(

        desiredCamera,

        CAMERA_SAFE_MOON_RADIUS
        +
        0.04

    );


    return desiredCamera;

}


// ======================================================
// 32. İKİ YÖN ARASINDA KÜRESEL GEÇİŞ
// ======================================================
//
// Vector3 için kendi slerp benzeri hesabımız.
//
// Kamera Ay'ın bir tarafından diğer tarafına
// giderken düz çizgi yerine Ay'ın çevresinden
// yay çizerek dolaşacak.
// ======================================================

function slerpDirection(
    fromDirection,
    toDirection,
    t
) {

    const from =
        fromDirection
            .clone()
            .normalize();


    const to =
        toDirection
            .clone()
            .normalize();


    let dot =

        THREE.MathUtils.clamp(

            from.dot(to),

            -1,

            1

        );


    // Yönler neredeyse aynıysa
    // normal lerp yeterli.

    if (
        dot >
        0.9995
    ) {

        return from

            .lerp(
                to,
                t
            )

            .normalize();

    }


    // Tam ters yöndelerse
    // cross product kararsız olabilir.
    //
    // Geçici dik eksen oluşturuyoruz.

    if (
        dot <
        -0.9995
    ) {

        let axis =

            new THREE.Vector3(
                0,
                1,
                0
            )

                .cross(
                    from
                );


        if (
            axis.lengthSq() <
            0.0001
        ) {

            axis =

                new THREE.Vector3(
                    1,
                    0,
                    0
                )

                    .cross(
                        from
                    );

        }


        axis.normalize();


        return from
            .clone()
            .applyAxisAngle(
                axis,
                Math.PI * t
            )
            .normalize();

    }


    const angle =
        Math.acos(dot);


    const sinAngle =
        Math.sin(angle);


    const weightFrom =

        Math.sin(
            (1 - t) * angle
        )

        /

        sinAngle;


    const weightTo =

        Math.sin(
            t * angle
        )

        /

        sinAngle;


    return from

        .multiplyScalar(
            weightFrom
        )

        .add(

            to
                .multiplyScalar(
                    weightTo
                )

        )

        .normalize();

}


// ======================================================
// 33. GÜVENLİ YAY KAMERA ROTASI
// ======================================================
//
// Kamera:
//
// başlangıç
// ↓
// Ay'ın dışından yay
// ↓
// LRO
//
// şeklinde hareket edecek.
//
// Düz camera.position.lerpVectors artık
// LRO'ya girişte kullanılmayacak.
// ======================================================

function calculateSafeArcCameraPosition(
    fromCamera,
    toCamera,
    t
) {

    const center =
        getMoonWorldCenter()
            .clone();


    const startVector =

        fromCamera
            .clone()
            .sub(
                center
            );


    const endVector =

        toCamera
            .clone()
            .sub(
                center
            );


    const startRadius =

        Math.max(

            startVector.length(),

            CAMERA_SAFE_MOON_RADIUS

        );


    const endRadius =

        Math.max(

            endVector.length(),

            CAMERA_SAFE_MOON_RADIUS

        );


    const direction =

        slerpDirection(

            startVector,

            endVector,

            t

        );


    // Başlangıçtan sona temel yarıçap.

    const baseRadius =

        THREE.MathUtils.lerp(

            startRadius,

            endRadius,

            t

        );


    // Geçişin orta noktasında kamerayı
    // biraz daha dışarı açıyoruz.
    //
    // sin(0) = 0
    // sin(pi/2) = 1
    // sin(pi) = 0

    const arcBoost =

        Math.sin(
            Math.PI * t
        )

        *

        CAMERA_ARC_CLEARANCE;


    const radius =

        Math.max(

            CAMERA_SAFE_MOON_RADIUS,

            baseRadius
            +
            arcBoost

        );


    const result =

        center

            .clone()

            .add(

                direction
                    .multiplyScalar(
                        radius
                    )

            );


    forcePointOutsideMoon(
        result
    );


    return result;

}


// ======================================================
// 34. LRO'YA YAKLAŞ
// ======================================================

function enterLROInspection(
    camera,
    controls
) {

    if (
        !lroState.anchor
        ||
        !lroState.loaded
        ||
        lroState.inspecting
    ) {

        return;

    }


    // ==================================================
    // MEVCUT AY GÖRÜNÜMÜNÜ KAYDET
    // ==================================================

    savedView = {

        cameraPosition:
            camera.position.clone(),

        target:
            controls.target.clone(),

        minDistance:
            controls.minDistance,

        maxDistance:
            controls.maxDistance

    };


    // ==================================================
    // İNCELEME MODUNU AÇ
    // ==================================================

    lroState.inspecting =
        true;


    // ==================================================
    // LRO KONUMUNU AL
    // ==================================================

    lroState.anchor.getWorldPosition(
        currentLROWorldPosition
    );


    lastLROWorldPosition.copy(
        currentLROWorldPosition
    );


    // ==================================================
    // TWEEN
    // ==================================================

    focusTween = {

        type:
            "in",

        start:
            performance.now(),

        fromCamera:
            camera.position.clone(),

        fromTarget:
            controls.target.clone()

    };


    // Animasyon sırasında kullanıcı müdahale etmesin.

    controls.enabled =
        false;


    // LRO küçük olduğu için yakınlaşmaya izin veriyoruz.
    //
    // Ancak Ay çarpışması moon.js tarafından
    // her frame ayrıca kontrol ediliyor.

    controls.minDistance =
        0.055;


    controls.maxDistance =
        1.2;


    // Yakın plan model clipping sorunlarını azalt.

    camera.near =
        0.001;


    camera.updateProjectionMatrix();


    // ==================================================
    // PANEL
    // ==================================================

    showLROInfo(

        () => {

            exitLROInspection(
                camera,
                controls
            );

        }

    );

}


// ======================================================
// 35. AY'A GERİ DÖN
// ======================================================

function exitLROInspection(
    camera,
    controls
) {

    if (
        !savedView
        ||
        !lroState.inspecting
    ) {

        return;

    }


    focusTween = {

        type:
            "out",

        start:
            performance.now(),

        fromCamera:
            camera.position.clone(),

        fromTarget:
            controls.target.clone()

    };


    controls.enabled =
        false;

}


// ======================================================
// 36. KAMERA TAKİP / GEÇİŞ SİSTEMİ
// ======================================================

function updateCameraInspection(
    camera,
    controls
) {

    if (
        !lroState.anchor
    ) {

        return;

    }


    // ==================================================
    // GEÇİŞ ANİMASYONU VARSA
    // ==================================================

    if (
        focusTween
    ) {

        const elapsed =

            performance.now()

            -

            focusTween.start;


        const rawT =

            THREE.MathUtils.clamp(

                elapsed

                /

                FOCUS_DURATION,

                0,

                1

            );


        // Smoothstep

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
        // LRO'YA GİRİŞ
        // ==============================================

        if (
            focusTween.type ===
            "in"
        ) {

            // LRO hareket ettiği için
            // her frame güncel konumu al.

            lroState.anchor.getWorldPosition(
                currentLROWorldPosition
            );


            const desiredCamera =

                calculateInspectionCameraPosition();


            // ==========================================
            // ESKİ:
            //
            // camera.position.lerpVectors(...)
            //
            // YENİ:
            //
            // Ay'ın DIŞINDAN yay çizerek gider.
            // ==========================================

            const safeCameraPosition =

                calculateSafeArcCameraPosition(

                    focusTween.fromCamera,

                    desiredCamera,

                    t

                );


            camera.position.copy(
                safeCameraPosition
            );


            controls.target.lerpVectors(

                focusTween.fromTarget,

                currentLROWorldPosition,

                t

            );


            if (
                rawT >= 1
            ) {

                focusTween =
                    null;


                camera.position.copy(
                    desiredCamera
                );


                controls.target.copy(
                    currentLROWorldPosition
                );


                controls.enabled =
                    true;


                lastLROWorldPosition.copy(
                    currentLROWorldPosition
                );


                controls.update();

            }


            return;

        }


        // ==============================================
        // AY'A GERİ DÖNÜŞ
        // ==============================================

        if (
            focusTween.type ===
            "out"
        ) {

            // Dönüşte de düz çizgi kullanmıyoruz.
            //
            // LRO → Ay genel görünümü
            // yine Ay'ın dışından dolaşacak.

            const safeCameraPosition =

                calculateSafeArcCameraPosition(

                    focusTween.fromCamera,

                    savedView.cameraPosition,

                    t

                );


            camera.position.copy(
                safeCameraPosition
            );


            controls.target.lerpVectors(

                focusTween.fromTarget,

                savedView.target,

                t

            );


            if (
                rawT >= 1
            ) {

                camera.position.copy(
                    savedView.cameraPosition
                );


                controls.target.copy(
                    savedView.target
                );


                controls.minDistance =
                    savedView.minDistance;


                controls.maxDistance =
                    savedView.maxDistance;


                controls.enabled =
                    true;


                camera.near =
                    0.01;


                camera.updateProjectionMatrix();


                lroState.inspecting =
                    false;


                savedView =
                    null;


                focusTween =
                    null;


                controls.update();


                window.dispatchEvent(

                    new CustomEvent(
                        "moon-overview-requested"
                    )

                );

            }


            return;

        }

    }


    // ==================================================
    // LRO İNCELEME MODUNDA DEĞİLSE ÇIK
    // ==================================================

    if (
        !lroState.inspecting
    ) {

        return;

    }


    // ==================================================
    // LRO HAREKET EDERKEN KAMERA DA TAKİP ETSİN
    // ==================================================

    lroState.anchor.getWorldPosition(
        currentLROWorldPosition
    );


    const movement =

        currentLROWorldPosition

            .clone()

            .sub(
                lastLROWorldPosition
            );


    // Kamera LRO ile aynı miktarda ilerler.

    camera.position.add(
        movement
    );


    // OrbitControls merkezi LRO olur.

    controls.target.copy(
        currentLROWorldPosition
    );


    // moon.js ayrıca kameranın Ay'ın içine
    // girip girmediğini kontrol ediyor.

    lastLROWorldPosition.copy(
        currentLROWorldPosition
    );

}


// ======================================================
// PART 1 SONU
// ======================================================
//
// BURADAN SONRA:
//
// initLRO()
// LRO root
// orbit
// anchor
// hitbox
// LRO etiketi
// GLB yükleme
// raycaster
// LRO hareket animasyonu
//
// gelecek.
// ======================================================
// ======================================================
// 37. LRO ETİKET BOYUTU
// ======================================================
//
// LRO etiketi normal Ay görünümünde okunabilir
// kalacak.
//
// LRO'ya çok yaklaştığımızda ise devasa
// görünmemesi için otomatik küçülecek.
// ======================================================

const lroLabelWorldPosition =
    new THREE.Vector3();


function updateLROLabelScale() {

    if (
        !lroState.label
        ||
        !cameraRef
    ) {

        return;

    }


    lroState.label.getWorldPosition(
        lroLabelWorldPosition
    );


    const distance =

        cameraRef.position.distanceTo(
            lroLabelWorldPosition
        );


    const scaleFactor =

        THREE.MathUtils.clamp(

            distance

            /

            3.5,

            0.32,

            1

        );


    lroState.label.scale.set(

        0.22
        *
        scaleFactor,

        0.068
        *
        scaleFactor,

        1

    );

}


// ======================================================
// 38. EK KAMERA GÜVENLİĞİ
// ======================================================
//
// moon.js zaten kamerayı Ay'ın içine girmekten
// koruyor.
//
// Ancak lro.js kendi requestAnimationFrame döngüsünde
// kamerayı LRO ile beraber hareket ettirdiği için
// burada da ikinci bir güvenlik kontrolü bırakıyoruz.
//
// Böylece iki animasyon döngüsünün sırası ne olursa
// olsun kamera Ay'ın içinde render edilmez.
// ======================================================

function keepInspectionCameraOutsideMoon() {

    if (
        !cameraRef
        ||
        !parentRef
    ) {

        return;

    }


    forcePointOutsideMoon(

        cameraRef.position,

        1.025

    );

}


// ======================================================
// 39. LRO MODEL MATERYALLERİ
// ======================================================

function improveLROMaterials(
    model
) {

    if (
        !rendererRef
    ) {

        return;

    }


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


            // Raycaster için de işaretliyoruz.

            object.userData.isLRO =
                true;


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
// 40. LRO MODELİNİ NORMALIZE ET
// ======================================================

function normalizeLROModel(
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


    wrapper.name =
        "LRO_MODEL_WRAPPER";


    wrapper.add(
        model
    );


    // ==================================================
    // GÖRSEL BOYUT
    // ==================================================
    //
    // Gerçek boyutta LRO görünmeyeceği için
    // eğitim görselleştirmesinde büyütülmüş halde.
    //
    // En büyük boyut sahnede yaklaşık 0.03 olacak.
    // ==================================================

    wrapper.scale.setScalar(

        0.030

        /

        largestSide

    );


    // Modeli ekranda daha anlaşılır açıya getir.

    wrapper.rotation.set(

        THREE.MathUtils.degToRad(
            -8
        ),

        THREE.MathUtils.degToRad(
            25
        ),

        THREE.MathUtils.degToRad(
            -10
        )

    );


    return wrapper;

}


// ======================================================
// 41. LRO SİSTEMİNİ BAŞLAT
// ======================================================

export function initLRO(
    parent,
    renderer,
    camera,
    controls
) {

    // ==================================================
    // REFERANSLAR
    // ==================================================

    parentRef =
        parent;


    rendererRef =
        renderer;


    cameraRef =
        camera;


    controlsRef =
        controls;


    // ==================================================
    // GÜVENLİK
    // ==================================================

    if (
        !parentRef
        ||
        !rendererRef
        ||
        !cameraRef
        ||
        !controlsRef
    ) {

        console.error(
            "LRO sistemi başlatılamadı: gerekli referans eksik."
        );


        return lroState;

    }


    // ==================================================
    // AYNI SİSTEMİ İKİ KEZ OLUŞTURMA
    // ==================================================

    if (
        lroState.root
    ) {

        console.warn(
            "LRO sistemi zaten başlatılmış."
        );


        return lroState;

    }


    // ==================================================
    // ROOT
    // ==================================================

    const lroRoot =

        new THREE.Group();


    lroRoot.name =
        "LRO_SYSTEM";


    parentRef.add(
        lroRoot
    );


    lroState.root =
        lroRoot;


    // ==================================================
    // YÖRÜNGE ÇİZGİSİ
    // ==================================================

    const orbitLine =

        createOrbitLine();


    lroRoot.add(
        orbitLine
    );


    lroState.orbit =
        orbitLine;


    // ==================================================
    // LRO ANCHOR
    // ==================================================
    //
    // Model, label ve hitbox bu anchor'ın çocukları.
    //
    // Dolayısıyla anchor yörüngede hareket ettiğinde
    // hepsi birlikte hareket ediyor.
    // ==================================================

    const anchor =

        new THREE.Group();


    anchor.name =
        "LRO_ANCHOR";


    lroRoot.add(
        anchor
    );


    lroState.anchor =
        anchor;


    // ==================================================
    // BAŞLANGIÇ KONUMU
    // ==================================================

    anchor.position.copy(

        calculateLRODisplayPosition(
            lroState.simulationTime
        )

    );


    // ==================================================
    // 42. GÖRÜNMEYEN TIKLAMA ALANI
    // ======================================================
    //
    // Gerçek model küçük olduğu için modelin kendisini
    // tıklamak zor olabilir.
    //
    // Bu görünmez küre yalnızca seçim alanıdır.
    // ==================================================

    const hitTarget =

        new THREE.Mesh(

            new THREE.SphereGeometry(

                0.12,

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

                depthTest:
                    false

            })

        );


    hitTarget.name =
        "LRO_CLICK_TARGET";


    hitTarget.userData.isLROHitTarget =
        true;


    anchor.add(
        hitTarget
    );


    // ==================================================
    // 43. LRO ETİKETİ
    // ======================================================

    const label =

        createLROLabel();


    // Model yüklenene kadar yazı göstermeyelim.

    label.visible =
        false;


    anchor.add(
        label
    );


    lroState.label =
        label;


    // ==================================================
    // 44. DRACO LOADER
    // ======================================================

    const dracoLoader =

        new DRACOLoader();


    dracoLoader.setDecoderPath(

        "https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/libs/draco/"

    );


    // ==================================================
    // 45. GLTF LOADER
    // ======================================================

    const loader =

        new GLTFLoader();


    loader.setDRACOLoader(
        dracoLoader
    );


    // ==================================================
    // 46. LRO GLB MODELİ
    // ======================================================

    loader.load(

        "../assets/models/lro/lro.glb",


        // ==============================================
        // MODEL YÜKLENDİ
        // ==============================================

        (gltf) => {

            const model =
                gltf.scene;


            improveLROMaterials(
                model
            );


            const wrapper =

                normalizeLROModel(
                    model
                );


            anchor.add(
                wrapper
            );


            lroState.model =
                wrapper;


            lroState.loaded =
                true;


            // Güncel yörünge konumuna taşı.

            anchor.position.copy(

                calculateLRODisplayPosition(
                    lroState.simulationTime
                )

            );


            // Artık label gösterilebilir.

            if (
                lroState.label
            ) {

                lroState.label.visible =
                    true;

            }


            console.log(
                "LRO hazır: model + yörünge + etiket + güvenli kamera."
            );

        },


        // ==============================================
        // PROGRESS
        // ==============================================

        undefined,


        // ==============================================
        // HATA
        // ==============================================

        (error) => {

            console.error(
                "LRO modeli yüklenemedi:",
                error
            );

        }

    );


    // ==================================================
    // 47. LRO RAYCASTER
    // ======================================================

    const lroRaycaster =

        new THREE.Raycaster();


    const lroPointer =

        new THREE.Vector2();


    function updateLROPointer(
        event
    ) {

        const rect =

            rendererRef
                .domElement
                .getBoundingClientRect();


        lroPointer.x =

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


        lroPointer.y =

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


    // ==================================================
    // 48. LRO CLICK
    // ======================================================

    rendererRef
        .domElement
        .addEventListener(

            "click",


            (event) => {

                // ======================================
                // MODEL YÜKLENMEDİYSE
                // ======================================

                if (
                    !lroState.loaded
                ) {

                    return;

                }


                // ======================================
                // DÜNYA KARŞILAŞTIRMASI GİBİ DURUMLAR
                // ROOT'U GİZLEDİYSE
                // ======================================

                if (
                    !lroState.root
                    ||
                    !lroState.root.visible
                ) {

                    return;

                }


                // ======================================
                // ZATEN LRO İNCELİYORSA
                // ======================================

                if (
                    lroState.inspecting
                ) {

                    return;

                }


                // ======================================
                // LRO AY'IN ARKASINDAYSA
                // TIKLANMASIN
                // ======================================
                //
                // Etiket görünürlüğü ön/arka yüz
                // kontrolümüzle aynı mantığı kullanıyor.
                // ======================================

                if (
                    lroState.label
                    &&
                    !lroState.label.visible
                ) {

                    return;

                }


                updateLROPointer(
                    event
                );


                lroRaycaster.setFromCamera(

                    lroPointer,

                    cameraRef

                );


                const hits =

                    lroRaycaster.intersectObject(

                        hitTarget,

                        false

                    );


                if (
                    hits.length === 0
                ) {

                    return;

                }


                // ==================================================
                // KRATER CLICK LISTENER'INA GİTMESİN
                // ==================================================

                event.stopImmediatePropagation();


                enterLROInspection(

                    cameraRef,

                    controlsRef

                );

            },


            // Capture phase.
            //
            // Böylece moon.js krater click sisteminden
            // önce LRO tıklamasını yakalıyoruz.

            true

        );


    // ==================================================
    // 49. LRO HOVER CURSOR
    // ======================================================

    rendererRef
        .domElement
        .addEventListener(

            "pointermove",


            (event) => {

                if (
                    !lroState.loaded
                    ||
                    !lroState.root?.visible
                    ||
                    lroState.inspecting
                ) {

                    return;

                }


                if (
                    lroState.label
                    &&
                    !lroState.label.visible
                ) {

                    return;

                }


                updateLROPointer(
                    event
                );


                lroRaycaster.setFromCamera(

                    lroPointer,

                    cameraRef

                );


                const hits =

                    lroRaycaster.intersectObject(

                        hitTarget,

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
    // 50. ZAMAN KONTROLLERİ
    // ======================================================

    createTimeControls();


    // ==================================================
    // 51. ANİMASYON
    // ======================================================

    let lastClockRefresh =
        0;


    function animateLRO(
        now
    ) {

        requestAnimationFrame(
            animateLRO
        );


        // ==================================================
        // DELTA TIME
        // ==================================================

        const deltaSeconds =

            Math.min(

                (
                    now

                    -

                    previousFrameTime
                )

                /

                1000,

                0.1

            );


        previousFrameTime =
            now;


        // ==================================================
        // GERÇEK ZAMAN
        // ==================================================

        if (
            lroState.live
        ) {

            lroState.simulationTime =
                Date.now();

        }


        // ==================================================
        // HIZLANDIRILMIŞ SİMÜLASYON
        // ==================================================

        else {

            lroState.simulationTime +=

                deltaSeconds

                *

                1000

                *

                lroState.speed;

        }


        // ==================================================
        // LRO YÖRÜNGE KONUMU
        // ==================================================

        if (
            lroState.loaded
            &&
            lroState.anchor
        ) {

            lroState.anchor.position.copy(

                calculateLRODisplayPosition(
                    lroState.simulationTime
                )

            );


            // ==================================================
            // LRO MODELİNİN AY'A DOĞRU YÖNELİMİ
            // ==================================================
            //
            // Uzay aracının konumu değişirken anchor'ı
            // Ay merkezine doğru yöneltiyoruz.
            //
            // Sprite label bundan etkilenmez; sprite zaten
            // kameraya dönük render edilir.
            // ==================================================

            lroState.anchor.lookAt(
                0,
                0,
                0
            );

        }


        // ==================================================
        // KAMERA LRO TAKİBİ / TRANSITION
        // ==================================================

        if (
            lroState.loaded
        ) {

            updateCameraInspection(

                cameraRef,

                controlsRef

            );

        }


        // ==================================================
        // İKİNCİ KAMERA ÇARPIŞMA KORUMASI
        // ==================================================

        if (
            lroState.inspecting
            ||
            focusTween
        ) {

            keepInspectionCameraOutsideMoon();

        }


        // ==================================================
        // ETİKET GÖRÜNÜRLÜĞÜ
        // ==================================================

        updateLROLabelVisibility();


        // ==================================================
        // ETİKET BOYUTU
        // ==================================================

        updateLROLabelScale();


        // ==================================================
        // TIME CONTROLS GÖRÜNÜRLÜĞÜ
        // ==================================================

        updateTimeControlsVisibility();


        // ==================================================
        // SAAT
        // ==================================================
        //
        // toLocaleString her frame çağrılmasın.
        // Yaklaşık 4 kez/saniye yeterli.
        // ==================================================

        if (
            now
            -
            lastClockRefresh
            >
            250
        ) {

            updateClockText();


            lastClockRefresh =
                now;

        }

    }


    requestAnimationFrame(
        animateLRO
    );


    // ==================================================
    // 52. BAŞLANGIÇ SAATİ
    // ==================================================

    updateClockText();


    // ==================================================
    // 53. BAŞLANGIÇ PANEL GÖRÜNÜRLÜĞÜ
    // ==================================================

    updateTimeControlsVisibility();


    // ==================================================
    // 54. STATE DÖNDÜR
    // ==================================================

    return lroState;

}


// ======================================================
// 55. DEBUG YARDIMCILARI
// ======================================================
//
// Bunlar dışarıdan zorunlu değil;
// geliştirme sırasında faydalı olabilir.
// ======================================================

export function getLROOrbitPeriodSeconds() {

    return ORBIT_PERIOD_SECONDS;

}


export function getLROPhysicalOrbitData() {

    return {

        moonRadiusKm:
            MOON_RADIUS_KM,

        periluneAltitudeKm:
            PERILUNE_ALTITUDE_KM,

        apoluneAltitudeKm:
            APOLUNE_ALTITUDE_KM,

        semiMajorAxisKm:
            SEMI_MAJOR_AXIS_KM,

        eccentricity:
            ECCENTRICITY,

        periodSeconds:
            ORBIT_PERIOD_SECONDS

    };

}


// ======================================================
// 56. DOSYA SONU
// ======================================================

console.log(
    "LRO modülü yüklendi."
);