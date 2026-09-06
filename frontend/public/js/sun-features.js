import {
    sunSpacecraftState,
    setSunSpacecraftInteractionEnabled
} from "./sun-spacecraft.js";


// ======================================================
// 1. GÜNEŞ AKTİVİTE VERİLERİ
// ======================================================

const SUN_FEATURES = {

    sunspots: {

        kicker:
            "GÜNEŞ AKTİVİTESİ · FOTOSFER",

        title:
            "Güneş Lekeleri",

        lead:
            "Güneş lekeleri, Güneş'in görünür yüzeyinde çevrelerine göre daha karanlık görünen ve güçlü manyetik alanlarla ilişkili bölgelerdir.",

        stats: [
            ["Bölge", "Fotosfer"],
            ["Görünüm", "Koyu bölgeler"],
            ["Temel neden", "Güçlü manyetik alan"],
            ["Ömür", "Günler – aylar"]
        ],

        sections: [
            {
                title:
                    "Neden daha karanlık görünürler?",

                text:
                    "Güçlü manyetik alanlar, sıcak plazmanın aşağıdan yukarıya enerji taşımasını kısmen engeller. Bu nedenle güneş lekeleri çevredeki fotosferden daha soğuk kalır ve koyu görünür."
            },

            {
                title:
                    "Neden önemlidir?",

                text:
                    "Güneş lekeleri aktif bölgelerin görünür işaretleridir. Karmaşık manyetik alanlara sahip bu bölgelerde solar flare gibi güçlü olaylar meydana gelebilir."
            }
        ],

        media: [
            {
                src:
                    "/assets/media/sun/activity/sunspots/sunspots.gif",

                alt:
                    "Güneş lekelerinin hareketi",

                caption:
                    "Güneş lekelerinin zaman içindeki hareketi"
            },

            {
                src:
                    "/assets/media/sun/activity/sunspots/sunspots.jpg",

                alt:
                    "Güneş yüzeyindeki güneş lekeleri",

                caption:
                    "Fotosferde görülen güneş lekeleri"
            }
        ]

    },


    solarFlare: {

        kicker:
            "GÜNEŞ AKTİVİTESİ · MANYETİK PATLAMA",

        title:
            "Solar Flare",

        lead:
            "Solar flare, Güneş atmosferinde biriken manyetik enerjinin çok kısa sürede açığa çıkmasıyla meydana gelen güçlü bir elektromanyetik patlamadır.",

        stats: [
            ["Kaynak", "Aktif bölgeler"],
            ["Enerji", "Manyetik"],
            ["Sınıflar", "A · B · C · M · X"],
            ["Gözlem", "X-ışını · UV"]
        ],

        sections: [
            {
                title:
                    "Nasıl oluşur?",

                text:
                    "Karmaşık manyetik alan çizgileri yeniden yapılandığında depolanmış enerji çok hızlı biçimde plazmaya ve elektromanyetik ışınıma aktarılabilir. Bu olay gözlemlerde ani ve güçlü bir parlama olarak görülür."
            },

            {
                title:
                    "Dünya'yı etkileyebilir mi?",

                text:
                    "Güçlü flare olaylarından yayılan X-ışını ve aşırı morötesi ışınım Dünya'nın üst atmosferindeki iyonlaşmayı artırabilir ve bazı radyo haberleşmelerini etkileyebilir."
            }
        ],

        media: [
            {
                src:
                    "/assets/media/sun/activity/solar-flare/solar-flare.gif",

                alt:
                    "Güneş'te solar flare",

                caption:
                    "Solar flare'in gelişimi"
            },

            {
                src:
                    "/assets/media/sun/activity/solar-flare/solar-flare.jpg",

                alt:
                    "Güneş üzerinde solar flare",

                caption:
                    "Aktif bölgede meydana gelen solar flare"
            }
        ]

    },


    prominence: {

        kicker:
            "GÜNEŞ AKTİVİTESİ · KORONA",

        title:
            "Prominens",

        lead:
            "Prominens, Güneş yüzeyinin üzerinde manyetik alanlar tarafından tutulan yoğun ve görece daha soğuk plazmadan oluşan büyük yapılardır.",

        stats: [
            ["Madde", "Plazma"],
            ["Bölge", "Kromosfer / korona"],
            ["Şekil", "Yay · halka · ipliksi"],
            ["Kontrol", "Manyetik alan"]
        ],

        sections: [
            {
                title:
                    "Nasıl yüzeyin üzerinde kalır?",

                text:
                    "Prominens içerisindeki plazma Güneş'in manyetik alan çizgileri boyunca tutulabilir. Bu nedenle yüzeyin çok üzerinde dev yaylar ve ipliksi yapılar biçiminde görülebilir."
            },

            {
                title:
                    "Ne kadar büyük olabilir?",

                text:
                    "Bazı prominensler Dünya'nın çapının birçok katına ulaşabilir. Manyetik yapı kararsız hale geldiğinde prominens parçalanabilir veya Güneş'ten dışarı doğru fırlayabilir."
            }
        ],

        media: [
            {
                src:
                    "/assets/media/sun/activity/prominence/prominence.gif",

                alt:
                    "Güneş prominensi",

                caption:
                    "Prominensin zaman içindeki hareketi"
            },

            {
                src:
                    "/assets/media/sun/activity/prominence/prominence.jpg",

                alt:
                    "Güneş kenarında prominens",

                caption:
                    "Güneş'in kenarında yükselen plazma"
            }
        ]

    }

};


// ======================================================
// 2. STATE
// ======================================================

let infoContent =
    null;

let infoScroll =
    null;

let spacecraftRoot =
    null;

let originalSunHTML =
    "";

let activeFeature =
    null;

let panelObserver =
    null;


// ======================================================
// 3. BUTON METNİNİ NORMALLEŞTİR
// ======================================================

function normalizeText(
    value
) {

    return (
        value
            ?.trim()
            .toLocaleUpperCase(
                "tr-TR"
            )
            .replace(
                /\s+/g,
                " "
            )
        ||
        ""
    );

}


// ======================================================
// 4. SADECE TAM EŞLEŞME
//
// includes() YOK.
// Parent div metni YOK.
// Bu yüzden Güneş Lekeleri asla Solar Flare'e düşmez.
// ======================================================

function getFeatureId(
    element
) {

    if (
        !element
    ) {

        return null;

    }


    if (
        element.dataset?.sunFeature
        &&
        SUN_FEATURES[
            element.dataset.sunFeature
        ]
    ) {

        return element.dataset.sunFeature;

    }


    const text =
        normalizeText(
            element.textContent
        );


    if (
        text === "SUNSPOTS"
        ||
        text === "GÜNEŞ LEKELERİ"
        ||
        text === "GÜNEŞ LEKESİ"
    ) {

        return "sunspots";

    }


    if (
        text === "SOLAR FLARE"
    ) {

        return "solarFlare";

    }


    if (
        text === "PROMİNENS"
        ||
        text === "PROMINENS"
        ||
        text === "PROMINENCE"
    ) {

        return "prominence";

    }


    return null;

}


// ======================================================
// 5. UZAY ARAÇLARINI GÖSTER / GİZLE
// ======================================================

function setSpacecraftVisible(
    visible
) {

    if (
        spacecraftRoot
    ) {

        spacecraftRoot.visible =
            visible;

    }


    setSunSpacecraftInteractionEnabled(
        visible
    );


    document.body.classList.toggle(
        "sun-feature-mode",
        !visible
    );


    const selector =
        document.getElementById(
            "sun-spacecraft-selector"
        );


    const labels =
        document.getElementById(
            "sun-spacecraft-label-layer"
        );


    if (
        selector
    ) {

        selector.style.display =
            visible
                ?
                ""
                :
                "none";

    }


    if (
        labels
    ) {

        labels.style.display =
            visible
                ?
                ""
                :
                "none";

    }

}


// ======================================================
// 6. FOTO / GIF
// ======================================================

function renderMedia(
    media
) {

    return `

        <section class="info-section">

            <h2 class="info-section-title">
                Gözlem
            </h2>

            <div class="sun-feature-media-grid">

                ${media.map(

                    (item) => `

                        <figure class="sun-feature-media-card">

                            <img
                                src="${item.src}"
                                alt="${item.alt}"
                                loading="lazy"
                            >

                            <figcaption>
                                ${item.caption}
                            </figcaption>

                        </figure>

                    `

                ).join("")}

            </div>

        </section>

    `;

}


// ======================================================
// 7. FEATURE PANELİ
// ======================================================

function showFeature(
    featureId
) {

    const feature =
        SUN_FEATURES[
            featureId
        ];


    if (
        !feature
        ||
        !infoContent
    ) {

        return;

    }


    // Bir spacecraft yakın planındayken
    // aktivite modu açılmasın.
    if (
        sunSpacecraftState.mode
        !==
        "sun"
    ) {

        return;

    }


    activeFeature =
        featureId;


    setSpacecraftVisible(
        false
    );


    infoContent.innerHTML = `

        <p class="info-kicker">
            ${feature.kicker}
        </p>

        <h1 class="info-title">
            ${feature.title}
        </h1>

        <p class="info-lead">
            ${feature.lead}
        </p>


        <div class="quick-stats">

            ${feature.stats.map(

                ([label, value]) => `

                    <div class="quick-stat">

                        <span>
                            ${label}
                        </span>

                        <strong>
                            ${value}
                        </strong>

                    </div>

                `

            ).join("")}

        </div>


        ${feature.sections.map(

            (section) => `

                <section class="info-section">

                    <h2 class="info-section-title">
                        ${section.title}
                    </h2>

                    <p>
                        ${section.text}
                    </p>

                </section>

            `

        ).join("")}


        ${renderMedia(
            feature.media
        )}


        <div class="info-actions">

            <button
                id="back-to-sun-overview"
                class="secondary-action"
                type="button"
            >
                ← GÜNEŞ'E DÖN
            </button>

        </div>

    `;


    // Eksik medya varsa kırık ikon gösterme.
    infoContent
        .querySelectorAll(
            ".sun-feature-media-card img"
        )
        .forEach(

            (image) => {

                image.addEventListener(
                    "error",
                    () => {

                        image
                            .closest(
                                ".sun-feature-media-card"
                            )
                            ?.remove();

                    }
                );

            }

        );


    const backButton =
        document.getElementById(
            "back-to-sun-overview"
        );


    if (
        backButton
    ) {

        // onclick doğrudan bu gerçek butona bağlı.
        // Global capture listener YOK.
        backButton.onclick =
            restoreSunOverview;

    }


    if (
        infoScroll
    ) {

        infoScroll.scrollTop =
            0;

    }

}


// ======================================================
// 8. ANA GÜNEŞ PANELİNİ GERİ GETİR
// ======================================================

export function restoreSunOverview() {

    if (
        !infoContent
    ) {

        return;

    }


    activeFeature =
        null;


    // İlk açılıştaki Güneş bilgi panelini geri getir.
    infoContent.innerHTML =
        originalSunHTML;


    // Parker / Solar Orbiter / SOHO tekrar görünsün.
    setSpacecraftVisible(
        true
    );


    // Sol panel en üste dönsün.
    if (
        infoScroll
    ) {

        infoScroll.scrollTop =
            0;

    }


    // innerHTML değiştiği için yeni oluşan
    // feature butonlarını tekrar hazırla.
    bindFeatureButtons();


    // sun-compare.js bu eventi dinleyip
    // DÜNYA İLE KARŞILAŞTIR butonunu
    // tekrar bağlayacak.
    window.dispatchEvent(
        new CustomEvent(
            "sun-overview-restored"
        )
    );

}


// ======================================================
// 9. ÜÇ GERÇEK BUTONU BAĞLA
// ======================================================

function bindFeatureButtons() {

    if (
        !infoContent
        ||
        activeFeature
    ) {

        return;

    }


    const buttons =
        infoContent.querySelectorAll(
            "button"
        );


    buttons.forEach(
        (button) => {

            const featureId =
                getFeatureId(
                    button
                );


            if (
                !featureId
            ) {

                return;

            }


            button.dataset.sunFeature =
                featureId;


            button.disabled =
                false;


            button.style.pointerEvents =
                "auto";


            button.style.cursor =
                "pointer";

        }
    );

}

// ======================================================
// BİLGİ PANELİ CLICK YÖNETİMİ
//
// Listener doğrudan #info-content üzerinde.
// innerHTML değişse bile parent element değişmediği
// için listener kaybolmaz.
//
// Global document listener YOK.
// Capture YOK.
// stopImmediatePropagation YOK.
// ======================================================

function handleSunInfoClick(
    event
) {

    const button =
        event.target.closest(
            "button"
        );


    if (
        !button
        ||
        !infoContent
        ||
        !infoContent.contains(
            button
        )
    ) {

        return;

    }


    // ==================================================
    // FEATURE'DAN GÜNEŞ'E DÖN
    // ==================================================

    if (
        button.id
        ===
        "back-to-sun-overview"
    ) {

        event.preventDefault();

        event.stopPropagation();


        restoreSunOverview();


        return;

    }


    // ==================================================
    // FEATURE BUTONLARI
    // ==================================================

    const featureId =
        getFeatureId(
            button
        );


    if (
        !featureId
    ) {

        // DÜNYA İLE KARŞILAŞTIR gibi başka bir
        // butonsa burası hiçbir şey yapmaz.
        return;

    }


    event.preventDefault();

    event.stopPropagation();


    showFeature(
        featureId
    );

}
// ======================================================
// 10. INIT
// ======================================================

export function initSunFeatures({

    spacecraftRoot:
        incomingSpacecraftRoot,

    infoScroll:
        incomingInfoScroll

}) {

    infoContent =
        document.getElementById(
            "info-content"
        );


    infoScroll =
        incomingInfoScroll
        ||
        null;


    spacecraftRoot =
        incomingSpacecraftRoot
        ||
        null;


    if (
        !infoContent
    ) {

        throw new Error(
            "Sun features: #info-content bulunamadı."
        );

    }


    originalSunHTML =
        infoContent.innerHTML;
infoContent.addEventListener(
    "click",
    handleSunInfoClick
);

    bindFeatureButtons();


    // Dünya karşılaştırmasından dönünce
    // normal Güneş panelini geri kur.
    window.addEventListener(
        "sun-overview-requested",
        restoreSunOverview
    );


    console.log(
        "Güneş aktivite sistemi hazır: Güneş Lekeleri / Solar Flare / Prominens."
    );

}