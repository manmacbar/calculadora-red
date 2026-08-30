// ==========================================
// ELEMENTOS DE LA PÁGINA
// ==========================================

let tipoGrabacion = document.getElementById("tipoGrabacion");
let tipoBitrate = document.getElementById("tipoBitrate");

let bitrateConocido = document.getElementById("bitrateConocido");
let bitrateEstimado = document.getElementById("bitrateEstimado");

let boton = document.getElementById("calcular");
let botonCompartir = document.getElementById("compartir");

let resultado = document.getElementById("resultado");
let mensajeCompartir = document.getElementById("mensajeCompartir");

let horas = document.getElementById("horas");


// ==========================================
// CONFIGURACIÓN INICIAL
// ==========================================

// Grabación continua por defecto:
// 24 horas y campo bloqueado.

horas.value = 24;
horas.disabled = true;


// ==========================================
// CAMBIAR TIPO DE GRABACIÓN
// ==========================================

tipoGrabacion.addEventListener("change", function () {

    if (tipoGrabacion.value === "continua") {

        horas.value = 24;
        horas.disabled = true;

    } else {

        horas.value = "";
        horas.disabled = false;

    }

});


// ==========================================
// CAMBIAR ENTRE BITRATE CONOCIDO / ESTIMADO
// ==========================================

tipoBitrate.addEventListener("change", function () {

    if (tipoBitrate.value === "conocido") {

        bitrateConocido.style.display = "block";
        bitrateEstimado.style.display = "none";

    } else {

        bitrateConocido.style.display = "none";
        bitrateEstimado.style.display = "block";

    }

});


// ==========================================
// CAPACIDADES DE DISCOS
// ==========================================

function obtenerCapacidadRecomendada(terabytes) {

    let capacidades = [
        2,
        4,
        6,
        8,
        10,
        12,
        16,
        20,
        24
    ];

    for (let capacidad of capacidades) {

        if (capacidad >= terabytes) {
            return capacidad;
        }

    }

    return Math.ceil(terabytes);
}


// ==========================================
// BITRATES DE REFERENCIA
// ==========================================
//
// Valores orientativos a 15 FPS.
// No representan el bitrate exacto de una cámara.
//
// El bitrate real depende, entre otras cosas, de:
// - escena
// - compresión
// - GOP
// - WDR
// - calidad
// - fabricante
// - configuración de vídeo
//

let bitratesReferencia = {

    "1080p": {
        h264: 2.0,
        h265: 1.0
    },

    "2mp": {
        h264: 2.0,
        h265: 1.0
    },

    "4mp": {
        h264: 4.0,
        h265: 2.05
    },

    "5mp": {
        h264: 4.6,
        h265: 2.3
    },

    "4k": {
        h264: 8.0,
        h265: 4.10
    }

};


// ==========================================
// GENERAR URL COMPARTIBLE
// ==========================================

function generarURLCompartible() {

    let camaras = document.getElementById("camaras").value;
    let horas = document.getElementById("horas").value;
    let dias = document.getElementById("dias").value;

    let parametros = new URLSearchParams();


    parametros.set(
        "camaras",
        camaras
    );

    parametros.set(
        "grabacion",
        tipoGrabacion.value
    );

    parametros.set(
        "horas",
        horas
    );

    parametros.set(
        "dias",
        dias
    );

    parametros.set(
        "tipoBitrate",
        tipoBitrate.value
    );


    if (tipoBitrate.value === "conocido") {

        parametros.set(
            "bitrate",
            document.getElementById("bitrate").value
        );

    } else {

        parametros.set(
            "resolucion",
            document.getElementById("resolucion").value
        );

        parametros.set(
            "codec",
            document.getElementById("codec").value
        );

        parametros.set(
            "fps",
            document.getElementById("fps").value
        );

    }


    return (
        window.location.origin +
        window.location.pathname +
        "?" +
        parametros.toString()
    );
}


// ==========================================
// BOTÓN CALCULAR
// ==========================================

boton.addEventListener("click", function () {

    let camaras = Number(
        document.getElementById("camaras").value
    );

    let horasValor =
        document.getElementById("horas").value;

    let dias = Number(
        document.getElementById("dias").value
    );

    let bitrate;
    let bitrateEsDeReferencia = false;


    // ======================================
    // COMPROBAR HORAS
    // ======================================

    if (horasValor === "") {

        resultado.textContent =
            "Introduce las horas de grabación al día.";

        return;

    }

    let horasNumero = Number(horasValor);


    // ======================================
    // OBTENER BITRATE
    // ======================================

    if (tipoBitrate.value === "conocido") {

        let bitrateValor =
            document.getElementById("bitrate").value;


        if (bitrateValor === "") {

            resultado.textContent =
                "Introduce el bitrate de la cámara.";

            return;

        }


        bitrate = Number(bitrateValor);

    } else {

        let resolucion =
            document.getElementById("resolucion").value;

        let codec =
            document.getElementById("codec").value;

        let fps = Number(
            document.getElementById("fps").value
        );


        if (!bitratesReferencia[resolucion]) {

            resultado.textContent =
                "No tenemos una referencia para esa resolución.";

            return;

        }


        let bitrateBase =
            bitratesReferencia[resolucion][codec];


        bitrate =
            bitrateBase * (fps / 15);


        bitrateEsDeReferencia = true;

    }


    // ======================================
    // VALIDACIÓN
    // ======================================

    if (
        camaras < 1 ||
        horasNumero < 1 ||
        horasNumero > 24 ||
        dias < 1 ||
        bitrate <= 0
    ) {

        resultado.textContent =
            "Por favor, introduce valores válidos.";

        return;

    }


    // ======================================
    // CALCULAR ALMACENAMIENTO
    // ======================================

    let almacenamiento =
        (bitrate / 8) *
        60 *
        60 *
        horasNumero *
        dias *
        camaras;


    // ======================================
    // CONVERTIR A GB
    // ======================================

    let almacenamientoGB =
        almacenamiento / 1000;


    // ======================================
    // CONVERTIR A TB
    // ======================================

    let almacenamientoTB =
        almacenamientoGB / 1000;


    // ======================================
    // MARGEN DEL 20 %
    // ======================================

    let almacenamientoConMargen =
        almacenamientoTB * 1.20;


    // ======================================
    // CAPACIDAD RECOMENDADA
    // ======================================

    let almacenamientoRecomendado =
        obtenerCapacidadRecomendada(
            almacenamientoConMargen
        );


    // ======================================
    // TEXTO DEL TIPO DE GRABACIÓN
    // ======================================

    let textoGrabacion;


    if (tipoGrabacion.value === "continua") {

        textoGrabacion =
            "Grabación continua: 24 horas al día.";

    } else {

        textoGrabacion =
            "Estimación basada en " +
            horasNumero +
            " horas equivalentes de grabación al día.";

    }


    // ======================================
    // INFORMACIÓN ADICIONAL
    // ======================================

    let informacionExtra = "";


    if (bitrateEsDeReferencia) {

        informacionExtra = `

            <p class="info-bitrate">

                Bitrate de referencia:
                <strong>
                    ~${bitrate.toFixed(2)} Mbps
                </strong>

            </p>

            <p class="aviso">

                El bitrate real puede variar según la cámara,
                escena, compresión, FPS y configuración de vídeo.

            </p>

        `;

    }


    // ======================================
    // MOSTRAR RESULTADO
    // ======================================

    resultado.innerHTML = `

        <div class="resultado-card">

            <span>
                Almacenamiento calculado
            </span>

            <strong>
                ${almacenamientoTB.toFixed(2)} TB
            </strong>

        </div>


        <div class="resultado-card">

            <span>
                Con margen del 20 %
            </span>

            <strong>
                ${almacenamientoConMargen.toFixed(2)} TB
            </strong>

        </div>


        <div class="resultado-card recomendado">

            <span>
                Capacidad recomendada
            </span>

            <strong>
                ${almacenamientoRecomendado} TB
            </strong>

        </div>


        <p class="info-grabacion">
            ${textoGrabacion}
        </p>


        ${informacionExtra}

    `;


    // ======================================
    // ACTUALIZAR URL
    // ======================================

    let url = generarURLCompartible();

    history.replaceState(
        null,
        "",
        url
    );

});


// ==========================================
// BOTÓN COMPARTIR
// ==========================================

botonCompartir.addEventListener("click", async function () {

    let camaras =
        document.getElementById("camaras").value;

    let horasValor =
        document.getElementById("horas").value;

    let dias =
        document.getElementById("dias").value;


    // ======================================
    // COMPROBAR DATOS BÁSICOS
    // ======================================

    if (
        camaras === "" ||
        horasValor === "" ||
        dias === ""
    ) {

        mensajeCompartir.textContent =
            "Completa los datos antes de compartir.";

        return;

    }


    // ======================================
    // COMPROBAR BITRATE CONOCIDO
    // ======================================

    if (
        tipoBitrate.value === "conocido" &&
        document.getElementById("bitrate").value === ""
    ) {

        mensajeCompartir.textContent =
            "Introduce el bitrate antes de compartir.";

        return;

    }


    // ======================================
    // GENERAR URL
    // ======================================

    let url =
        generarURLCompartible();


    // ======================================
    // COPIAR AL PORTAPAPELES
    // ======================================

    try {

        await navigator.clipboard.writeText(url);

        mensajeCompartir.textContent =
            "✓ Enlace copiado al portapapeles.";

    } catch (error) {

        mensajeCompartir.textContent =
            "No se pudo copiar automáticamente. " +
            "Copia la URL del navegador.";

    }

});


// ==========================================
// RECUPERAR CONFIGURACIÓN DESDE LA URL
// ==========================================

let parametrosURL =
    new URLSearchParams(
        window.location.search
    );


if (parametrosURL.has("camaras")) {


    // ======================================
    // CÁMARAS
    // ======================================

    document.getElementById("camaras").value =
        parametrosURL.get("camaras");


    // ======================================
    // TIPO DE GRABACIÓN
    // ======================================

    if (parametrosURL.has("grabacion")) {

        tipoGrabacion.value =
            parametrosURL.get("grabacion");

    }


    // ======================================
    // DÍAS
    // ======================================

    if (parametrosURL.has("dias")) {

        document.getElementById("dias").value =
            parametrosURL.get("dias");

    }


    // ======================================
    // HORAS
    // ======================================

    if (tipoGrabacion.value === "continua") {

        horas.value = 24;
        horas.disabled = true;

    } else {

        horas.value =
            parametrosURL.get("horas") || "";

        horas.disabled = false;

    }


    // ======================================
    // TIPO DE BITRATE
    // ======================================

    if (parametrosURL.has("tipoBitrate")) {

        tipoBitrate.value =
            parametrosURL.get("tipoBitrate");

    }


    // ======================================
    // MOSTRAR BLOQUE CORRECTO
    // ======================================

    if (tipoBitrate.value === "conocido") {

        bitrateConocido.style.display = "block";
        bitrateEstimado.style.display = "none";


        if (parametrosURL.has("bitrate")) {

            document.getElementById("bitrate").value =
                parametrosURL.get("bitrate");

        }

    } else {

        bitrateConocido.style.display = "none";
        bitrateEstimado.style.display = "block";


        if (parametrosURL.has("resolucion")) {

            document.getElementById("resolucion").value =
                parametrosURL.get("resolucion");

        }


        if (parametrosURL.has("codec")) {

            document.getElementById("codec").value =
                parametrosURL.get("codec");

        }


        if (parametrosURL.has("fps")) {

            document.getElementById("fps").value =
                parametrosURL.get("fps");

        }

    }


    // ======================================
    // CALCULAR AUTOMÁTICAMENTE
    // ======================================

    boton.click();

}