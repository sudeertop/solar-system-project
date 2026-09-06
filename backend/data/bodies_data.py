"""Canonical Solar System content (Turkish). Values are standard published figures.

Visual `radius` / `orbit_radius` are compressed scene units, NOT true scale.
"""

from models.bodies import Body, BodySection, BodyStat, Overview

OVERVIEW = Overview(
    kicker="GENEL BAKIŞ",
    title="Güneş Sistemi",
    lead=(
        "Güneş'in kütleçekimine bağlı sekiz gezegen, uydular, cüce gezegenler ve "
        "sayısız küçük cisimden oluşan bir sistem."
    ),
    sections=[
        BodySection(
            heading="Yapı",
            body=(
                "İç bölgede kayaç gezegenler yer alır: Merkür, Venüs, Dünya, Mars. "
                "Asteroit kuşağının ötesinde iki gaz devi (Jüpiter, Satürn) ve iki buz "
                "devi (Uranüs, Neptün) bulunur."
            ),
        ),
        BodySection(
            heading="Ölçek uyarısı",
            body=(
                "Bu görselleştirmede yarıçaplar ve yörünge yarıçapları okunabilirlik için "
                "sıkıştırılmıştır. Sıralama ve büyüklük ilişkileri korunur; mesafeler "
                "gerçek oranlarda değildir."
            ),
        ),
    ],
    hint="Bir gök cismi seçin. Güneş, Ay, Mars ve Satürn ayrı keşif modüllerine açılır.",
)


BODIES: list[Body] = [
    Body(
        id="sun",
        name="Güneş",
        kicker="YILDIZ",
        body_type="G tipi anakol yıldızı",
        mode="page",
        href="/pages/sun.html",
        lead="Sistemin toplam kütlesinin yaklaşık %99,86'sını taşıyan yıldız.",
        stats=[
            BodyStat(label="Çap", value="1.392.700 km"),
            BodyStat(label="Yüzey sıcaklığı", value="~5.500 °C"),
            BodyStat(label="Çekirdek sıcaklığı", value="~15 milyon °C"),
            BodyStat(label="Yaş", value="~4,6 milyar yıl"),
        ],
        color="#f0a24a",
        radius=6.0,
        orbit_radius=0.0,
    ),
    Body(
        id="mercury",
        name="Merkür",
        kicker="I. GEZEGEN",
        body_type="Kayaç gezegen",
        mode="panel",
        lead="Güneş'e en yakın ve en küçük gezegen; kayda değer bir atmosferi yoktur.",
        stats=[
            BodyStat(label="Çap", value="4.879 km"),
            BodyStat(label="Güneş'e uzaklık", value="0,39 AB (~58 milyon km)"),
            BodyStat(label="Yörünge süresi", value="88 gün"),
            BodyStat(label="Dönme süresi", value="58,6 gün"),
            BodyStat(label="Sıcaklık", value="−173 °C … 427 °C"),
            BodyStat(label="Uydu", value="Yok"),
            BodyStat(label="Tür", value="Kayaç gezegen"),
        ],
        sections=[
            BodySection(
                heading="Uç sıcaklık farkı",
                body=(
                    "Atmosfer ısıyı tutamadığı için gündüz ve gece yüzeyi arasında "
                    "600 °C'yi aşan bir fark oluşur. Sistemdeki en büyük yüzey sıcaklık "
                    "aralığı Merkür'e aittir."
                ),
            ),
            BodySection(
                heading="Yörünge ve dönme kilidi",
                body=(
                    "Merkür Güneş çevresinde her iki turda kendi ekseninde üç kez döner "
                    "(3:2 spin–yörünge rezonansı). Bir güneş günü, iki Merkür yılına yakındır."
                ),
            ),
            BodySection(
                heading="Yüzey",
                body=(
                    "Ay'a benzeyen, yoğun kraterli bir yüzeye sahiptir. Caloris Havzası "
                    "yaklaşık 1.550 km çapıyla sistemin en büyük çarpma havzalarından biridir."
                ),
            ),
        ],
        color="#8f8a84",
        radius=0.55,
        orbit_radius=12.0,
        orbit_period_days=88.0,
    ),
    Body(
        id="venus",
        name="Venüs",
        kicker="II. GEZEGEN",
        body_type="Kayaç gezegen",
        mode="panel",
        lead="Yoğun karbondioksit atmosferi nedeniyle sistemin en sıcak gezegeni.",
        stats=[
            BodyStat(label="Çap", value="12.104 km"),
            BodyStat(label="Güneş'e uzaklık", value="0,72 AB (~108 milyon km)"),
            BodyStat(label="Yörünge süresi", value="225 gün"),
            BodyStat(label="Dönme süresi", value="243 gün (ters yönde)"),
            BodyStat(label="Sıcaklık", value="~464 °C"),
            BodyStat(label="Uydu", value="Yok"),
            BodyStat(label="Tür", value="Kayaç gezegen"),
        ],
        sections=[
            BodySection(
                heading="Kaçak sera etkisi",
                body=(
                    "Atmosferin %96'sı karbondioksittir ve yüzey basıncı Dünya'nın "
                    "yaklaşık 92 katıdır. Isı kaçamadığı için yüzey, Merkür'den daha "
                    "yakın olmadığı hâlde daha sıcaktır."
                ),
            ),
            BodySection(
                heading="Ters dönme",
                body=(
                    "Venüs kendi ekseninde diğer gezegenlerin tersine döner; Güneş "
                    "batıdan doğar. Bir dönüşü, bir yörünge turundan uzundur."
                ),
            ),
            BodySection(
                heading="Bulut örtüsü",
                body=(
                    "Sülfürik asit bulutları yüzeyi görünür ışıkta tamamen gizler. "
                    "Yüzey haritaları radarla çıkarılmıştır."
                ),
            ),
        ],
        color="#d8b68a",
        radius=1.05,
        orbit_radius=16.5,
        orbit_period_days=225.0,
    ),
    Body(
        id="earth",
        name="Dünya",
        kicker="III. GEZEGEN",
        body_type="Kayaç gezegen",
        mode="panel",
        lead="Yüzeyinde kararlı sıvı su bulunan, bilinen tek yaşam barındıran gezegen.",
        stats=[
            BodyStat(label="Çap", value="12.742 km"),
            BodyStat(label="Güneş'e uzaklık", value="1 AB (~150 milyon km)"),
            BodyStat(label="Yörünge süresi", value="365,25 gün"),
            BodyStat(label="Dönme süresi", value="23 sa 56 dk"),
            BodyStat(label="Ortalama sıcaklık", value="~15 °C"),
            BodyStat(label="Uydu", value="1 (Ay)"),
            BodyStat(label="Tür", value="Kayaç gezegen"),
        ],
        sections=[
            BodySection(
                heading="Sıvı su",
                body=(
                    "Güneş'e uzaklığı ve atmosfer basıncı, suyun yüzeyde sıvı hâlde "
                    "kalmasına izin verir. Yüzeyin yaklaşık %71'i suyla kaplıdır."
                ),
            ),
            BodySection(
                heading="Atmosfer ve manyetik alan",
                body=(
                    "Azot–oksijen atmosferi zararlı morötesini süzer; sıvı demir "
                    "çekirdeğin ürettiği manyetik alan güneş rüzgârını saptırır."
                ),
            ),
            BodySection(
                heading="Eksen eğikliği",
                body=(
                    "23,4°'lik eksen eğikliği mevsimleri oluşturur. Ay'ın kütleçekimi "
                    "bu eğikliği uzun dönemde kararlı tutar."
                ),
            ),
        ],
        color="#4a7fa8",
        radius=1.1,
        orbit_radius=21.5,
        orbit_period_days=365.25,
    ),
    Body(
        id="moon",
        name="Ay",
        kicker="DÜNYA'NIN UYDUSU",
        body_type="Doğal uydu",
        mode="page",
        href="/pages/moon.html",
        lead="Dünya'nın tek doğal uydusu; eşzamanlı dönme nedeniyle hep aynı yüzünü gösterir.",
        stats=[
            BodyStat(label="Çap", value="3.475 km"),
            BodyStat(label="Dünya'ya uzaklık", value="~384.400 km"),
            BodyStat(label="Yörünge süresi", value="27,3 gün"),
        ],
        color="#9a978f",
        radius=0.3,
        orbit_radius=2.6,
        orbit_period_days=27.3,
    ),
    Body(
        id="mars",
        name="Mars",
        kicker="IV. GEZEGEN",
        body_type="Kayaç gezegen",
        mode="page",
        href="/pages/mars.html",
        lead="İnce atmosferli, demir oksitçe zengin yüzeyiyle kızıl görünen gezegen.",
        stats=[
            BodyStat(label="Çap", value="6.779 km"),
            BodyStat(label="Güneş'e uzaklık", value="1,52 AB"),
            BodyStat(label="Yörünge süresi", value="687 gün"),
            BodyStat(label="Uydu", value="2 (Phobos, Deimos)"),
        ],
        color="#b45a3c",
        radius=0.75,
        orbit_radius=27.0,
        orbit_period_days=687.0,
    ),
    Body(
        id="jupiter",
        name="Jüpiter",
        kicker="V. GEZEGEN",
        body_type="Gaz devi",
        mode="panel",
        lead="Diğer tüm gezegenlerin toplamından daha kütleli, sistemin en büyük gezegeni.",
        stats=[
            BodyStat(label="Çap", value="139.820 km"),
            BodyStat(label="Güneş'e uzaklık", value="5,2 AB (~778 milyon km)"),
            BodyStat(label="Yörünge süresi", value="11,9 yıl"),
            BodyStat(label="Dönme süresi", value="9 sa 56 dk"),
            BodyStat(label="Bulut tepesi sıcaklığı", value="~−145 °C"),
            BodyStat(label="Uydu", value="95 doğrulanmış"),
            BodyStat(label="Tür", value="Gaz devi"),
        ],
        sections=[
            BodySection(
                heading="Büyük Kırmızı Leke",
                body=(
                    "Dünya'dan geniş, yüzyıllardır süren dev bir fırtına sistemi. Son "
                    "gözlemlerde alanı yavaşça küçülmektedir."
                ),
            ),
            BodySection(
                heading="Hızlı dönme",
                body=(
                    "Sistemin en hızlı dönen gezegenidir; bir günü 10 saatten kısadır. "
                    "Bu hız gezegeni kutuplardan gözle görülür biçimde basıklaştırır."
                ),
            ),
            BodySection(
                heading="Uydu sistemi",
                body=(
                    "Galileo uyduları — Io, Europa, Ganymede, Callisto — küçük birer "
                    "dünya sayılır. Europa'nın buzul kabuğu altında sıvı su okyanusu "
                    "bulunduğu düşünülür."
                ),
            ),
        ],
        color="#c9a37a",
        radius=3.2,
        orbit_radius=36.0,
        orbit_period_days=4333.0,
    ),
    Body(
        id="saturn",
        name="Satürn",
        kicker="VI. GEZEGEN",
        body_type="Gaz devi",
        mode="page",
        href="/pages/saturn.html",
        lead="Buz ve kaya parçacıklarından oluşan geniş halka sistemiyle tanınan gaz devi.",
        stats=[
            BodyStat(label="Çap", value="116.460 km"),
            BodyStat(label="Güneş'e uzaklık", value="9,5 AB"),
            BodyStat(label="Yörünge süresi", value="29,4 yıl"),
            BodyStat(label="Uydu", value="146 doğrulanmış"),
        ],
        color="#d8c8a0",
        radius=2.8,
        orbit_radius=46.0,
        orbit_period_days=10759.0,
    ),
    Body(
        id="uranus",
        name="Uranüs",
        kicker="VII. GEZEGEN",
        body_type="Buz devi",
        mode="panel",
        lead="Neredeyse yan yatmış eksende dönen, soluk mavi-yeşil buz devi.",
        stats=[
            BodyStat(label="Çap", value="50.724 km"),
            BodyStat(label="Güneş'e uzaklık", value="19,8 AB (~2,9 milyar km)"),
            BodyStat(label="Yörünge süresi", value="84 yıl"),
            BodyStat(label="Dönme süresi", value="17 sa 14 dk (ters yönde)"),
            BodyStat(label="Sıcaklık", value="~−195 °C"),
            BodyStat(label="Uydu", value="28 doğrulanmış"),
            BodyStat(label="Tür", value="Buz devi"),
        ],
        sections=[
            BodySection(
                heading="Yan yatmış eksen",
                body=(
                    "Eksen eğikliği yaklaşık 98°'dir; gezegen yörüngesi boyunca âdeta "
                    "yuvarlanır. Kutuplarda 21 yıl süren gündüz ve gece yaşanır."
                ),
            ),
            BodySection(
                heading="Metan rengi",
                body=(
                    "Atmosferdeki metan kırmızı ışığı soğurur; geriye kalan saçılmış "
                    "ışık gezegene soluk mavi-yeşil tonunu verir."
                ),
            ),
            BodySection(
                heading="Buz devi yapısı",
                body=(
                    "Gaz devlerinden farklı olarak kütlesinin büyük kısmı su, amonyak "
                    "ve metan buzlarından oluşan sıcak ve yoğun bir akışkan katmandır."
                ),
            ),
        ],
        color="#8fb8bd",
        radius=1.8,
        orbit_radius=56.0,
        orbit_period_days=30687.0,
    ),
    Body(
        id="neptune",
        name="Neptün",
        kicker="VIII. GEZEGEN",
        body_type="Buz devi",
        mode="panel",
        lead="Güneş'e en uzak gezegen; sistemin en hızlı rüzgârlarına sahiptir.",
        stats=[
            BodyStat(label="Çap", value="49.244 km"),
            BodyStat(label="Güneş'e uzaklık", value="30,1 AB (~4,5 milyar km)"),
            BodyStat(label="Yörünge süresi", value="164,8 yıl"),
            BodyStat(label="Dönme süresi", value="16 sa 6 dk"),
            BodyStat(label="Sıcaklık", value="~−200 °C"),
            BodyStat(label="Uydu", value="16 doğrulanmış"),
            BodyStat(label="Tür", value="Buz devi"),
        ],
        sections=[
            BodySection(
                heading="Aşırı rüzgârlar",
                body=(
                    "Atmosferinde saatte 2.000 km'yi aşan rüzgârlar ölçülmüştür. "
                    "Güneş'ten aldığı enerji çok azdır; bu enerjinin kaynağı hâlâ "
                    "tartışılmaktadır."
                ),
            ),
            BodySection(
                heading="Derin mavi",
                body=(
                    "Metan soğurması rengin bir kısmını açıklar, ancak Neptün "
                    "Uranüs'ten belirgin biçimde daha koyu mavidir; nedeni tam olarak "
                    "bilinmemektedir."
                ),
            ),
            BodySection(
                heading="Hesapla bulundu",
                body=(
                    "Neptün, Uranüs'ün yörüngesindeki sapmalardan yola çıkılarak "
                    "matematiksel olarak öngörülmüş ve 1846'da tahmin edilen konumda "
                    "gözlenmiştir."
                ),
            ),
        ],
        color="#4a6fa8",
        radius=1.75,
        orbit_radius=65.0,
        orbit_period_days=60190.0,
    ),
]
