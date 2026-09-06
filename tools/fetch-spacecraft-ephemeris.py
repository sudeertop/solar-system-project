from __future__ import annotations

import csv
import io
import json
import time

from datetime import datetime, timezone
from pathlib import Path

from urllib.parse import urlencode
from urllib.request import Request, urlopen


# ======================================================
# AYARLAR
# ======================================================

ENDPOINT = (
    "https://ssd.jpl.nasa.gov/api/horizons.api"
)

OUTPUT = Path(
    "assets/data/sun/spacecraft-trajectories.json"
)


# 3 yıllık gerçek ephemeris.
#
# 12 saatlik JPL örnekleri alıyoruz.
# Browser tarafında hem konum hem hız kullanılarak
# Hermite interpolation yapılıyor.

START_TIME = (
    "2025-01-01 00:00"
)

STOP_TIME = (
    "2028-01-01 00:00"
)

STEP_SIZE = (
    "12 h"
)


TARGETS = {

    "parker": {

        "name":
            "Parker Solar Probe",

        "horizonsId":
            "-96",

        "stopTime":
            STOP_TIME

    },


    "solarOrbiter": {

        "name":
            "Solar Orbiter",

        "horizonsId":
            "-144",

        "stopTime":
            STOP_TIME

    },


    "soho": {

        "name":
            "SOHO",

        "horizonsId":
            "-21",

        # JPL Horizons'taki mevcut
        # SOHO trajectory solution
        # 2026-11-02 23:50 UTC civarında bitiyor.
        #
        # Güvenli tarafta kalmak için
        # 23:00 kullanıyoruz.

        "stopTime":
            "2026-11-02 23:00"

    }

}


# ======================================================
# HORIZONS PARAMETRESİNİ TIRNAKLA
# ======================================================

def q(
    value: str
) -> str:

    return f"'{value}'"


# ======================================================
# HORIZONS ZAMANINI ISO UTC'YE ÇEVİR
# ======================================================

def parse_horizons_calendar(
    value: str
) -> str:

    text = (
        value
        .strip()
    )


    if (
        text.startswith(
            "A.D."
        )
    ):

        text = (
            text[4:]
            .strip()
        )


    formats = (

        "%Y-%b-%d %H:%M:%S.%f",

        "%Y-%b-%d %H:%M:%S",

        "%Y-%b-%d %H:%M"

    )


    for fmt in formats:

        try:

            dt = (

                datetime

                .strptime(
                    text,
                    fmt
                )

                .replace(
                    tzinfo=timezone.utc
                )

            )


            return (

                dt
                .isoformat()
                .replace(
                    "+00:00",
                    "Z"
                )

            )

        except ValueError:

            pass


    raise ValueError(

        f"Horizons zamanı çözülemedi: {value!r}"

    )


# ======================================================
# $$SOE / $$EOE ARASINI PARSE ET
# ======================================================

def parse_vector_block(
    result_text: str
) -> list[dict]:

    try:

        start = (

            result_text.index(
                "$$SOE"
            )

            +

            len(
                "$$SOE"
            )

        )


        end = (

            result_text.index(
                "$$EOE"
            )

        )


    except ValueError as exc:

        raise RuntimeError(

            "Horizons cevabında "
            "$$SOE/$$EOE veri bloğu bulunamadı.\n"

            +

            result_text[
                -2000:
            ]

        ) from exc


    block = (

        result_text[
            start:end
        ]
        .strip()

    )


    reader = csv.reader(

        io.StringIO(
            block
        )

    )


    samples: list[dict] = []


    for row in reader:

        row = [

            cell.strip()

            for cell in row

        ]


        # CSV satırının sonunda boş sütun olabilir.

        while (
            row
            and
            row[-1] == ""
        ):

            row.pop()


        if (
            len(row)
            <
            8
        ):

            continue


        try:

            sample = {

                "t":

                    parse_horizons_calendar(
                        row[1]
                    ),


                "x":

                    float(
                        row[2]
                    ),


                "y":

                    float(
                        row[3]
                    ),


                "z":

                    float(
                        row[4]
                    ),


                "vx":

                    float(
                        row[5]
                    ),


                "vy":

                    float(
                        row[6]
                    ),


                "vz":

                    float(
                        row[7]
                    )

            }


        except (
            ValueError,
            IndexError
        ):

            continue


        samples.append(
            sample
        )


    if (
        not samples
    ):

        raise RuntimeError(

            "Horizons cevabı geldi ancak "
            "durum vektörü satırı okunamadı.\n"

            +

            block[
                :2000
            ]

        )


    return samples


# ======================================================
# TEK BİR UZAY ARACI
# ======================================================

def fetch_target(
    horizons_id: str,
    stop_time: str
) -> list[dict]:

    params = {

        "format":
            "json",

        "COMMAND":
            q(
                horizons_id
            ),

        "OBJ_DATA":
            q(
                "NO"
            ),

        "MAKE_EPHEM":
            q(
                "YES"
            ),

        "EPHEM_TYPE":
            q(
                "VECTORS"
            ),

        # SUN CENTER
        "CENTER":
            q(
                "500@10"
            ),

        "START_TIME":
            q(
                START_TIME
            ),

        "STOP_TIME":
             q(
                  stop_time
           ),

        "STEP_SIZE":
            q(
                STEP_SIZE
            ),

        "REF_PLANE":
            q(
                "ECLIPTIC"
            ),

        "REF_SYSTEM":
            q(
                "ICRF"
            ),

        "OUT_UNITS":
            q(
                "AU-D"
            ),

        # XYZ + VX VY VZ
        "VEC_TABLE":
            q(
                "2"
            ),

        # GEOMETRIC
        "VEC_CORR":
            q(
                "NONE"
            ),

        "CSV_FORMAT":
            q(
                "YES"
            ),

        "VEC_LABELS":
            q(
                "NO"
            ),

        "TIME_TYPE":
            q(
                "UT"
            ),

        "TIME_DIGITS":
            q(
                "SECONDS"
            )

    }


    url = (

        ENDPOINT

        +

        "?"

        +

        urlencode(
            params
        )

    )


    request = Request(

        url,

        headers={

            "User-Agent":

                "Gunes-Sistemini-Kesfet/1.0 educational project"

        }

    )


    with urlopen(
        request,
        timeout=120
    ) as response:

        payload = json.loads(

            response
                .read()
                .decode(
                    "utf-8"
                )

        )


    if (
        "error"
        in
        payload
    ):

        raise RuntimeError(
            payload["error"]
        )


    return parse_vector_block(

        payload[
            "result"
        ]

    )


# ======================================================
# MAIN
# ======================================================

def main() -> None:

    output = {

        "source":
            "NASA/JPL Horizons",

        "generatedAt":

            datetime
            .now(
                timezone.utc
            )
            .isoformat()
            .replace(
                "+00:00",
                "Z"
            ),

        "center":
            "Sun center (500@10)",

        "referencePlane":
            "Ecliptic J2000",

        "units": {

            "position":
                "AU",

            "velocity":
                "AU/day",

            "time":
                "UTC"

        },

        "start":
            START_TIME
            +
            " UTC",

        "stop":
            STOP_TIME
            +
            " UTC",

        "step":
            STEP_SIZE,

        "spacecraft":
            {}

    }


    for index, (
        key,
        target
    ) in enumerate(
        TARGETS.items(),
        start=1
    ):

        print(

            f"[{index}/{len(TARGETS)}] "
            f"{target['name']} "
            f"({target['horizonsId']}) alınıyor..."

        )


        samples = fetch_target(

    target[
        "horizonsId"
    ],

    target[
        "stopTime"
    ]

)


        output[
    "spacecraft"
][
    key
] = {

    "name":
        target[
            "name"
        ],

    "horizonsId":
        target[
            "horizonsId"
        ],

    "start":
        START_TIME
        +
        " UTC",

    "stop":
        target[
            "stopTime"
        ]
        +
        " UTC",

    "samples":
        samples

}


        print(

            f"    {len(samples)} örnek: "
            f"{samples[0]['t']} "
            f"→ "
            f"{samples[-1]['t']}"

        )


        # JPL fair-use:
        # üç sorguyu aynı anda göndermiyoruz.

        if (
            index
            <
            len(TARGETS)
        ):

            time.sleep(
                2.0
            )


    OUTPUT.parent.mkdir(

        parents=True,

        exist_ok=True

    )


    OUTPUT.write_text(

        json.dumps(

            output,

            ensure_ascii=False,

            separators=(
                ",",
                ":"
            )

        ),

        encoding=
            "utf-8"

    )


    print(

        f"\nTamamlandı: {OUTPUT}"

    )


    print(

        f"Boyut: "
        f"{OUTPUT.stat().st_size / 1024 / 1024:.2f} MB"

    )


if __name__ == "__main__":

    main()