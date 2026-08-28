import * as THREE from "three";

import {
    OrbitControls
} from "three/addons/controls/OrbitControls.js";


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


if (
    !container
) {

    throw new Error(
        "#sun-scene bulunamadı."
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

        250

    );


camera.position.set(

    0,

    0.10,

    4.35

);


// ======================================================
// 4. RENDERER
// ======================================================

const renderer =

    new THREE.WebGLRenderer({

        antialias:
            true,

        alpha:
            false

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

    1.10;


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


controls.rotateSpeed =

    0.55;


controls.zoomSpeed =

    0.80;


// Güneş'in içine girmeyi engelle.

controls.minDistance =

    1.22;


controls.maxDistance =

    18;


controls.target.set(

    0,

    0,

    0

);


controls.update();


// ======================================================
// 6. YILDIZ ALANI
// ======================================================

function createStars() {

    const count =

        1900;


    const positions =

        new Float32Array(

            count
            *
            3

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
            34;


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


        positions[
            i * 3
        ] =

            radius

            *

            Math.sin(
                phi
            )

            *

            Math.cos(
                theta
            );


        positions[
            i * 3 + 1
        ] =

            radius

            *

            Math.cos(
                phi
            );


        positions[
            i * 3 + 2
        ] =

            radius

            *

            Math.sin(
                phi
            )

            *

            Math.sin(
                theta
            );

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
                0.62,

            depthWrite:
                false

        });


    const stars =

        new THREE.Points(

            geometry,

            material

        );


    scene.add(

        stars

    );

}


createStars();


// ======================================================
// 7. GÜNEŞ ROOT
// ======================================================

const sunRoot =

    new THREE.Group();


sunRoot.name =

    "SUN_ROOT";


scene.add(

    sunRoot

);


// ======================================================
// 8. PROCEDURAL GÜNEŞ SHADER
// ======================================================

const sunGeometry =

    new THREE.SphereGeometry(

        1,

        160,

        160

    );


// ======================================================
// 9. VERTEX SHADER
// ======================================================

const sunVertexShader = `

    varying vec3 vNormalW;

    varying vec3 vPositionW;

    varying vec3 vLocalPosition;


    void main() {

        vLocalPosition =
            position;


        vec4 worldPosition =

            modelMatrix

            *

            vec4(
                position,
                1.0
            );


        vPositionW =

            worldPosition.xyz;


        vNormalW =

            normalize(

                mat3(
                    modelMatrix
                )

                *

                normal

            );


        gl_Position =

            projectionMatrix

            *

            viewMatrix

            *

            worldPosition;

    }

`;


// ======================================================
// 10. FRAGMENT SHADER
// ======================================================

const sunFragmentShader = `

    uniform float uTime;


    varying vec3 vNormalW;

    varying vec3 vPositionW;

    varying vec3 vLocalPosition;


    float hash31(
        vec3 p
    ) {

        p =

            fract(

                p
                *
                0.1031

            );


        p +=

            dot(

                p,

                p.yzx
                +
                33.33

            );


        return

            fract(

                (
                    p.x
                    +
                    p.y
                )

                *

                p.z

            );

    }


    float noise3D(
        vec3 p
    ) {

        vec3 i =

            floor(
                p
            );


        vec3 f =

            fract(
                p
            );


        f =

            f
            *
            f
            *
            (
                3.0
                -
                2.0
                *
                f
            );


        float n000 =
            hash31(
                i
                +
                vec3(
                    0.0,
                    0.0,
                    0.0
                )
            );


        float n100 =
            hash31(
                i
                +
                vec3(
                    1.0,
                    0.0,
                    0.0
                )
            );


        float n010 =
            hash31(
                i
                +
                vec3(
                    0.0,
                    1.0,
                    0.0
                )
            );


        float n110 =
            hash31(
                i
                +
                vec3(
                    1.0,
                    1.0,
                    0.0
                )
            );


        float n001 =
            hash31(
                i
                +
                vec3(
                    0.0,
                    0.0,
                    1.0
                )
            );


        float n101 =
            hash31(
                i
                +
                vec3(
                    1.0,
                    0.0,
                    1.0
                )
            );


        float n011 =
            hash31(
                i
                +
                vec3(
                    0.0,
                    1.0,
                    1.0
                )
            );


        float n111 =
            hash31(
                i
                +
                vec3(
                    1.0,
                    1.0,
                    1.0
                )
            );


        float nx00 =

            mix(
                n000,
                n100,
                f.x
            );


        float nx10 =

            mix(
                n010,
                n110,
                f.x
            );


        float nx01 =

            mix(
                n001,
                n101,
                f.x
            );


        float nx11 =

            mix(
                n011,
                n111,
                f.x
            );


        float nxy0 =

            mix(
                nx00,
                nx10,
                f.y
            );


        float nxy1 =

            mix(
                nx01,
                nx11,
                f.y
            );


        return

            mix(
                nxy0,
                nxy1,
                f.z
            );

    }


    float fbm(
        vec3 p
    ) {

        float value =
            0.0;


        float amplitude =
            0.50;


        for (

            int i = 0;

            i < 5;

            i++

        ) {

            value +=

                noise3D(
                    p
                )

                *

                amplitude;


            p *=
                2.05;


            amplitude *=
                0.50;

        }


        return value;

    }


    void main() {

        vec3 n =

            normalize(
                vNormalW
            );


        vec3 viewDirection =

            normalize(

                cameraPosition

                -

                vPositionW

            );


        float facing =

            max(

                dot(
                    n,
                    viewDirection
                ),

                0.0

            );


        // ==============================================
        // YÜZEY HAREKETİ
        // ==============================================

        vec3 surfacePosition =

            normalize(
                vLocalPosition
            );


        vec3 flowA =

            surfacePosition
            *
            8.0

            +

            vec3(

                uTime
                *
                0.020,

                uTime
                *
                -0.014,

                uTime
                *
                0.012

            );


        vec3 flowB =

            surfacePosition
            *
            18.0

            +

            vec3(

                -uTime
                *
                0.030,

                uTime
                *
                0.018,

                uTime
                *
                0.015

            );


        float broad =

            fbm(
                flowA
            );


        float granulation =

            fbm(
                flowB
            );


        float activity =

            broad
            *
            0.65

            +

            granulation
            *
            0.35;


        // ==============================================
        // RENK
        // ==============================================

        vec3 darkOrange =

            vec3(
                1.0,
                0.19,
                0.015
            );


        vec3 orange =

            vec3(
                1.0,
                0.43,
                0.035
            );


        vec3 yellow =

            vec3(
                1.0,
                0.82,
                0.22
            );


        vec3 hot =

            vec3(
                1.0,
                0.96,
                0.63
            );


        vec3 color =

            mix(

                darkOrange,

                orange,

                smoothstep(
                    0.22,
                    0.58,
                    activity
                )

            );


        color =

            mix(

                color,

                yellow,

                smoothstep(
                    0.45,
                    0.75,
                    activity
                )

            );


        color =

            mix(

                color,

                hot,

                smoothstep(
                    0.72,
                    0.95,
                    activity
                )

            );


        // ==============================================
        // LIMB DARKENING
        // ==============================================

        float limb =

            pow(
                facing,
                0.24
            );


        color *=

            mix(

                0.56,

                1.10,

                limb

            );


        // Hafif emissive güç.

        color *=
            1.18;


        gl_FragColor =

            vec4(
                color,
                1.0
            );

    }

`;


// ======================================================
// 11. GÜNEŞ MATERYALİ
// ======================================================

const sunMaterial =

    new THREE.ShaderMaterial({

        vertexShader:
            sunVertexShader,

        fragmentShader:
            sunFragmentShader,

        uniforms: {

            uTime: {
                value:
                    0
            }

        }

    });


// ======================================================
// 12. ANA GÜNEŞ
// ======================================================

const sunMesh =

    new THREE.Mesh(

        sunGeometry,

        sunMaterial

    );


sunMesh.name =

    "SUN_SURFACE";


sunRoot.add(

    sunMesh

);


// ======================================================
// 13. İÇ GLOW
// ======================================================

const innerGlowGeometry =

    new THREE.SphereGeometry(

        1.055,

        96,

        96

    );


const innerGlowMaterial =

    new THREE.MeshBasicMaterial({

        color:
            0xff8a20,

        transparent:
            true,

        opacity:
            0.12,

        blending:
            THREE.AdditiveBlending,

        side:
            THREE.BackSide,

        depthWrite:
            false

    });


const innerGlow =

    new THREE.Mesh(

        innerGlowGeometry,

        innerGlowMaterial

    );


sunRoot.add(

    innerGlow

);


// ======================================================
// 14. DIŞ GLOW SHADER
// ======================================================

const glowGeometry =

    new THREE.SphereGeometry(

        1.19,

        96,

        96

    );


const glowMaterial =

    new THREE.ShaderMaterial({

        transparent:
            true,

        blending:
            THREE.AdditiveBlending,

        depthWrite:
            false,

        side:
            THREE.BackSide,


        vertexShader: `

            varying vec3 vNormalW;

            varying vec3 vPositionW;


            void main() {

                vec4 worldPosition =

                    modelMatrix

                    *

                    vec4(
                        position,
                        1.0
                    );


                vPositionW =

                    worldPosition.xyz;


                vNormalW =

                    normalize(

                        mat3(
                            modelMatrix
                        )

                        *

                        normal

                    );


                gl_Position =

                    projectionMatrix

                    *

                    viewMatrix

                    *

                    worldPosition;

            }

        `,


        fragmentShader: `

            varying vec3 vNormalW;

            varying vec3 vPositionW;


            void main() {

                vec3 viewDirection =

                    normalize(

                        cameraPosition

                        -

                        vPositionW

                    );


                float fresnel =

                    1.0

                    -

                    abs(

                        dot(

                            normalize(
                                vNormalW
                            ),

                            viewDirection

                        )

                    );


                fresnel =

                    pow(
                        fresnel,
                        2.4
                    );


                vec3 glowColor =

                    vec3(
                        1.0,
                        0.33,
                        0.035
                    );


                gl_FragColor =

                    vec4(

                        glowColor,

                        fresnel
                        *
                        0.30

                    );

            }

        `

    });


const glowMesh =

    new THREE.Mesh(

        glowGeometry,

        glowMaterial

    );


sunRoot.add(

    glowMesh

);


// ======================================================
// 15. KORONA
// ======================================================

const coronaGeometry =

    new THREE.SphereGeometry(

        1.34,

        80,

        80

    );


const coronaMaterial =

    new THREE.MeshBasicMaterial({

        color:
            0xffa43a,

        transparent:
            true,

        opacity:
            0.025,

        blending:
            THREE.AdditiveBlending,

        side:
            THREE.BackSide,

        depthWrite:
            false

    });


const coronaMesh =

    new THREE.Mesh(

        coronaGeometry,

        coronaMaterial

    );


sunRoot.add(

    coronaMesh

);


// ======================================================
// 16. GÜNEŞ EKSEN EĞİMİ
//
// Güneş'in dönme ekseni ekliptik düzleme
// yaklaşık 7,25° eğiktir.
// ======================================================

sunRoot.rotation.z =

    THREE.MathUtils.degToRad(
        -7.25
    );


// ======================================================
// 17. KAMERA GÜNEŞ'İN İÇİNE GİRMESİN
// ======================================================

function preventCameraEnteringSun() {

    const sunCenter =

        new THREE.Vector3();


    sunRoot.getWorldPosition(

        sunCenter

    );


    const offset =

        camera
            .position
            .clone()
            .sub(

                sunCenter

            );


    const safeDistance =

        1.18;


    if (

        offset.length()
        <
        safeDistance

    ) {

        if (

            offset.lengthSq()
            <
            0.000001

        ) {

            offset.set(

                0,

                0,

                safeDistance

            );

        }

        else {

            offset.setLength(

                safeDistance

            );

        }


        camera.position.copy(

            sunCenter
                .clone()
                .add(

                    offset

                )

        );

    }


    controls.minDistance =

        safeDistance;

}


// ======================================================
// 18. DÜNYA KARŞILAŞTIRMA BUTONU
//
// Şimdilik yalnızca buton görünümü korunuyor.
// Sonraki aşamada gerçek Earth compare moduna
// bağlayacağız.
// ======================================================

if (
    compareEarthButton
) {

    compareEarthButton
        .addEventListener(

            "click",

            () => {

                console.log(
                    "Güneş × Dünya karşılaştırma sistemi sonraki aşamada eklenecek."
                );

            }

        );

}


// ======================================================
// 19. PANELİ AÇINCA ÜSTTEN BAŞLASIN
// ======================================================

if (
    infoScroll
) {

    infoScroll.scrollTop =
        0;

}


// ======================================================
// 20. ANİMASYON
// ======================================================

let previousTime =

    performance.now();


// Güneş gerçek hayatta yaklaşık 25-35 gün civarında
// diferansiyel dönüş gösterir.
//
// Buradaki dönüş görsel olarak yavaş tutuluyor.

function animateSun(
    now
) {

    requestAnimationFrame(

        animateSun

    );


    const delta =

        Math.min(

            (
                now
                -
                previousTime
            )

            /

            1000,

            0.1

        );


    previousTime =
        now;


    // ==============================================
    // SHADER ZAMANI
    // ==============================================

    sunMaterial
        .uniforms
        .uTime
        .value =

        now
        /
        1000;


    // ==============================================
    // YAVAŞ DÖNÜŞ
    // ==============================================

    sunMesh.rotation.y +=

        delta
        *
        0.035;


    innerGlow.rotation.y -=

        delta
        *
        0.012;


    glowMesh.rotation.y +=

        delta
        *
        0.008;


    // ==============================================
    // ÇOK HAFİF KORONA NABZI
    // ==============================================

    const coronaPulse =

        1

        +

        Math.sin(

            now
            *
            0.0012

        )

        *
        0.006;


    coronaMesh.scale.setScalar(

        coronaPulse

    );


    // ==============================================
    // KONTROLLER
    // ==============================================

    controls.update();


    preventCameraEnteringSun();


    // ==============================================
    // RENDER
    // ==============================================

    renderer.render(

        scene,

        camera

    );

}


// ======================================================
// 21. BAŞLAT
// ======================================================

requestAnimationFrame(

    animateSun

);


// ======================================================
// 22. RESIZE
// ======================================================

window.addEventListener(

    "resize",

    () => {

        const width =

            container.clientWidth;


        const height =

            container.clientHeight;


        if (
            width <= 0
            ||
            height <= 0
        ) {

            return;

        }


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
// 23. HAZIR
// ======================================================

console.log(

    "Güneş sahnesi hazır."

);