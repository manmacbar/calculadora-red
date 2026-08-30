"use strict";

/* =========================================================
   CALCULADORA DE SUBREDES IPv4
   ========================================================= */

const ipInput = document.getElementById("ip");
const cidrInput = document.getElementById("cidr");
const calculateBtn = document.getElementById("calculateBtn");

const errorMessage = document.getElementById("errorMessage");
const resultsSection = document.getElementById("resultsSection");

const networkAddress = document.getElementById("networkAddress");
const subnetMask = document.getElementById("subnetMask");
const wildcard = document.getElementById("wildcard");
const broadcast = document.getElementById("broadcast");
const firstHost = document.getElementById("firstHost");
const lastHost = document.getElementById("lastHost");
const usableHosts = document.getElementById("usableHosts");
const totalAddresses = document.getElementById("totalAddresses");
const resultCidr = document.getElementById("resultCidr");
const networkType = document.getElementById("networkType");

const exampleButtons = document.querySelectorAll(".example-button");


/* =========================================================
   UTILIDADES
   ========================================================= */

/**
 * Convierte una dirección IPv4 a un número entero sin signo.
 *
 * Ejemplo:
 * 192.168.1.1 -> 3232235777
 */
function ipToNumber(ip) {
    const octets = ip.split(".").map(Number);

    return (
        ((octets[0] << 24) >>> 0) +
        ((octets[1] << 16) >>> 0) +
        ((octets[2] << 8) >>> 0) +
        octets[3]
    ) >>> 0;
}


/**
 * Convierte un número entero a IPv4.
 */
function numberToIp(number) {
    return [
        (number >>> 24) & 255,
        (number >>> 16) & 255,
        (number >>> 8) & 255,
        number & 255
    ].join(".");
}


/**
 * Valida una dirección IPv4.
 */
function isValidIPv4(ip) {
    if (typeof ip !== "string") {
        return false;
    }

    const parts = ip.trim().split(".");

    if (parts.length !== 4) {
        return false;
    }

    return parts.every((part) => {
        if (part === "") {
            return false;
        }

        if (!/^\d+$/.test(part)) {
            return false;
        }

        const number = Number(part);

        return number >= 0 && number <= 255;
    });
}


/**
 * Valida el prefijo CIDR.
 */
function isValidCIDR(cidr) {
    if (cidr === "") {
        return false;
    }

    const number = Number(cidr);

    return Number.isInteger(number) && number >= 0 && number <= 32;
}


/**
 * Genera la máscara de subred a partir del CIDR.
 */
function cidrToMask(cidr) {
    if (cidr === 0) {
        return 0;
    }

    return (0xFFFFFFFF << (32 - cidr)) >>> 0;
}


/**
 * Obtiene la wildcard.
 */
function getWildcard(mask) {
    return (~mask) >>> 0;
}


/* =========================================================
   CLASIFICACIÓN DE REDES
   ========================================================= */

/**
 * Determina el tipo de dirección IPv4.
 *
 * Se tienen en cuenta:
 * - Privadas
 * - Loopback
 * - Link-local
 * - CGNAT
 * - Multicast
 * - Reservadas
 * - Pública
 */
function getNetworkType(ipNumber, cidr) {

    /* /0 representa todo el espacio IPv4 y no debe clasificarse
       según la IP introducida. */
    if (cidr === 0) {
        return "Pública";
    }

    const firstOctet = (ipNumber >>> 24) & 255;
    const secondOctet = (ipNumber >>> 16) & 255;


    /* -----------------------------------------------------
       LOOPBACK
       127.0.0.0/8
       ----------------------------------------------------- */

    if (firstOctet === 127) {
        return "Loopback";
    }


    /* -----------------------------------------------------
       LINK-LOCAL
       169.254.0.0/16
       ----------------------------------------------------- */

    if (
        firstOctet === 169 &&
        secondOctet === 254
    ) {
        return "Link-local";
    }


    /* -----------------------------------------------------
       CGNAT
       100.64.0.0/10
       ----------------------------------------------------- */

    if (
        firstOctet === 100 &&
        secondOctet >= 64 &&
        secondOctet <= 127
    ) {
        return "CGNAT";
    }


    /* -----------------------------------------------------
       PRIVADA 10.0.0.0/8
       ----------------------------------------------------- */

    if (firstOctet === 10) {
        return "Privada";
    }


    /* -----------------------------------------------------
       PRIVADA 172.16.0.0/12
       ----------------------------------------------------- */

    if (
        firstOctet === 172 &&
        secondOctet >= 16 &&
        secondOctet <= 31
    ) {
        return "Privada";
    }


    /* -----------------------------------------------------
       PRIVADA 192.168.0.0/16
       ----------------------------------------------------- */

    if (
        firstOctet === 192 &&
        secondOctet === 168
    ) {
        return "Privada";
    }


    /* -----------------------------------------------------
       MULTICAST
       224.0.0.0/4
       ----------------------------------------------------- */

    if (
        firstOctet >= 224 &&
        firstOctet <= 239
    ) {
        return "Multicast";
    }


    /* -----------------------------------------------------
       RESERVADA
       240.0.0.0/4
       ----------------------------------------------------- */

    if (firstOctet >= 240) {
        return "Reservada";
    }


    /* -----------------------------------------------------
       PÚBLICA
       ----------------------------------------------------- */

    return "Pública";
}


/**
 * Determina si una red tiene un uso especial y no debe
 * mostrar hosts utilizables como una red convencional.
 */
function isSpecialNetwork(type) {
    return [
        "Loopback",
        "Link-local",
        "CGNAT",
        "Multicast",
        "Reservada"
    ].includes(type);
}


/**
 * Devuelve una explicación para redes especiales.
 */
function getSpecialNetworkMessage(type) {

    switch (type) {

        case "Loopback":
            return "Red Loopback: se utiliza para la comunicación interna del propio dispositivo. No se aplica el concepto convencional de hosts utilizables.";

        case "Link-local":
            return "Red Link-local: se utiliza para configuración y comunicación local automática. No se aplica el concepto convencional de hosts utilizables.";

        case "CGNAT":
            return "Red CGNAT: rango compartido por operadores para traducir múltiples clientes mediante NAT. No es una red privada RFC 1918.";

        case "Multicast":
            return "Red Multicast: las direcciones representan grupos multicast y no hosts IPv4 convencionales.";

        case "Reservada":
            return "Red reservada: este rango está reservado para usos especiales y no debe tratarse como una red IPv4 convencional.";

        default:
            return "";
    }
}


/* =========================================================
   MENSAJE PARA REDES ESPECIALES
   ========================================================= */

function showSpecialNetworkMessage(type) {

    let notice = document.getElementById(
        "specialNetworkNotice"
    );


    /* -----------------------------------------------------
       Crear aviso si todavía no existe
       ----------------------------------------------------- */

    if (!notice) {

        notice = document.createElement("div");

        notice.id = "specialNetworkNotice";

        notice.style.marginTop = "16px";
        notice.style.padding = "14px 16px";
        notice.style.borderRadius = "8px";
        notice.style.background = "#f1f5f9";
        notice.style.border = "1px solid #dbe3ec";
        notice.style.color = "#17324d";
        notice.style.fontSize = "14px";
        notice.style.lineHeight = "1.5";

        resultsSection.appendChild(notice);
    }


    notice.textContent =
        getSpecialNetworkMessage(type);

    notice.hidden = false;
}


/**
 * Oculta el aviso de red especial.
 */
function hideSpecialNetworkMessage() {

    const notice = document.getElementById(
        "specialNetworkNotice"
    );

    if (notice) {
        notice.hidden = true;
    }
}


/* =========================================================
   ERRORES
   ========================================================= */

/**
 * Muestra un mensaje de error.
 */
function showError(message) {

    errorMessage.textContent = message;

    errorMessage.hidden = false;

    resultsSection.hidden = true;

    hideSpecialNetworkMessage();
}


/**
 * Oculta el mensaje de error.
 */
function hideError() {

    errorMessage.textContent = "";

    errorMessage.hidden = true;
}


/* =========================================================
   CÁLCULO PRINCIPAL
   ========================================================= */

function calculateSubnet() {

    hideError();


    /* -----------------------------------------------------
       OBTENER DATOS
       ----------------------------------------------------- */

    const ip = ipInput.value.trim();

    const cidrValue =
        cidrInput.value.trim();


    /* -----------------------------------------------------
       VALIDAR IP
       ----------------------------------------------------- */

    if (!isValidIPv4(ip)) {

        showError(
            "Introduce una dirección IPv4 válida. Ejemplo: 192.168.1.50"
        );

        return;
    }


    /* -----------------------------------------------------
       VALIDAR CIDR
       ----------------------------------------------------- */

    if (!isValidCIDR(cidrValue)) {

        showError(
            "Introduce un prefijo CIDR válido entre 0 y 32."
        );

        return;
    }


    const cidr =
        Number(cidrValue);


    /* -----------------------------------------------------
       CONVERSIÓN
       ----------------------------------------------------- */

    const ipNumber =
        ipToNumber(ip);

    const mask =
        cidrToMask(cidr);

    const wildcardNumber =
        getWildcard(mask);


    /* -----------------------------------------------------
       DIRECCIÓN DE RED
       ----------------------------------------------------- */

    const networkNumber =
        (ipNumber & mask) >>> 0;


    /* -----------------------------------------------------
       BROADCAST
       ----------------------------------------------------- */

    const broadcastNumber =
        (networkNumber | wildcardNumber) >>> 0;


    /* -----------------------------------------------------
       TOTAL DE DIRECCIONES
       ----------------------------------------------------- */

    const total =
        Math.pow(2, 32 - cidr);


    /* -----------------------------------------------------
       TIPO DE RED
       ----------------------------------------------------- */

    const type =
        getNetworkType(ipNumber, cidr);


    const special =
        isSpecialNetwork(type);


    /* -----------------------------------------------------
       HOSTS UTILIZABLES
       ----------------------------------------------------- */

    let usable = 0;

    let firstHostNumber =
        networkNumber;

    let lastHostNumber =
        broadcastNumber;


    /*
     * Para redes especiales no mostramos hosts
     * convencionales.
     */

    if (special) {

        usable = null;

        firstHostNumber = null;

        lastHostNumber = null;

    } else {

        /*
         * Redes normales /0 hasta /30
         */

        if (cidr <= 30) {

            usable =
                Math.max(total - 2, 0);

            firstHostNumber =
                networkNumber + 1;

            lastHostNumber =
                broadcastNumber - 1;
        }


        /*
         * RFC 3021:
         * /31 puede utilizar las dos direcciones
         * en enlaces punto a punto.
         */

        else if (cidr === 31) {

            usable = 2;

            firstHostNumber =
                networkNumber;

            lastHostNumber =
                broadcastNumber;
        }


        /*
         * /32 representa una única dirección.
         */

        else if (cidr === 32) {

            usable = 1;

            firstHostNumber =
                networkNumber;

            lastHostNumber =
                networkNumber;
        }
    }


    /* =====================================================
       MOSTRAR RESULTADOS
       ===================================================== */


    /* -----------------------------------------------------
       Dirección de red
       ----------------------------------------------------- */

    networkAddress.textContent =
        numberToIp(networkNumber);


    /* -----------------------------------------------------
       Máscara
       ----------------------------------------------------- */

    subnetMask.textContent =
        numberToIp(mask);


    /* -----------------------------------------------------
       Wildcard
       ----------------------------------------------------- */

    wildcard.textContent =
        numberToIp(wildcardNumber);


    /* -----------------------------------------------------
       Broadcast
       ----------------------------------------------------- */

    broadcast.textContent =
        numberToIp(broadcastNumber);


    /* -----------------------------------------------------
       Primer host
       ----------------------------------------------------- */

    if (special) {

        firstHost.textContent =
            "No aplica";

    } else {

        firstHost.textContent =
            numberToIp(firstHostNumber);
    }


    /* -----------------------------------------------------
       Último host
       ----------------------------------------------------- */

    if (special) {

        lastHost.textContent =
            "No aplica";

    } else {

        lastHost.textContent =
            numberToIp(lastHostNumber);
    }


    /* -----------------------------------------------------
       Hosts utilizables
       ----------------------------------------------------- */

    if (special) {

        usableHosts.textContent =
            "No aplica";

    } else {

        usableHosts.textContent =
            usable.toLocaleString("es-ES");
    }


    /* -----------------------------------------------------
       Total de direcciones
       ----------------------------------------------------- */

    totalAddresses.textContent =
        total.toLocaleString("es-ES");


    /* -----------------------------------------------------
       CIDR
       ----------------------------------------------------- */

    resultCidr.textContent =
        `/${cidr}`;


    /* -----------------------------------------------------
       Tipo de red
       ----------------------------------------------------- */

    networkType.textContent =
        type;


    /* -----------------------------------------------------
       Aviso de red especial
       ----------------------------------------------------- */

    if (special) {

        showSpecialNetworkMessage(type);

    } else {

        hideSpecialNetworkMessage();
    }


    /* -----------------------------------------------------
       MOSTRAR RESULTADOS
       ----------------------------------------------------- */

    resultsSection.hidden = false;


    /*
     * Desplazamos hacia los resultados.
     */

    resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   EVENTOS
   ========================================================= */

/**
 * Botón CALCULAR.
 */
calculateBtn.addEventListener(
    "click",
    calculateSubnet
);


/**
 * Enter en dirección IP.
 */
ipInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            calculateSubnet();
        }
    }
);


/**
 * Enter en CIDR.
 */
cidrInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            calculateSubnet();
        }
    }
);


/* =========================================================
   EJEMPLOS RÁPIDOS
   ========================================================= */

exampleButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const ip =
            button.dataset.ip;

        const cidr =
            button.dataset.cidr;


        ipInput.value =
            ip;

        cidrInput.value =
            cidr;


        calculateSubnet();
    });
});


/* =========================================================
   LIMPIAR ERROR AL ESCRIBIR
   ========================================================= */

ipInput.addEventListener(
    "input",
    () => {

        hideError();
    }
);


cidrInput.addEventListener(
    "input",
    () => {

        hideError();
    }
);