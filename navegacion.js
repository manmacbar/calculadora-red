
(function () {
    "use strict";

    const path = window.location.pathname.replace(/\/+$/, "") || "/";

    let active = "";
    if (path === "/camaras" || path.startsWith("/camaras/")) active = "camaras";
    else if (path === "/subredes" || path.startsWith("/subredes/")) active = "subredes";
    else if (path === "/ancho-banda" || path.startsWith("/ancho-banda/")) active = "ancho-banda";

    const nav = document.createElement("nav");
    nav.className = "cr-nav";
    nav.setAttribute("aria-label", "Navegación de calculadoras");

    const items = [
        { key: "home", href: "/", label: "← Todas las calculadoras" },
        { key: "camaras", href: "/camaras/", label: "📹 Calculadora de Cámaras" },
        { key: "ancho-banda", href: "/ancho-banda/", label: "📶 Calculadora de Ancho de Banda" },
        { key: "subredes", href: "/subredes/", label: "🌐 Calculadora de Subredes" }
    ];

    items.forEach(function (item) {
        const a = document.createElement("a");
        a.href = item.href;
        a.textContent = item.label;

        if (item.key === active) {
            a.classList.add("cr-active");
            a.setAttribute("aria-current", "page");
        }

        nav.appendChild(a);
    });

    const wrap = document.querySelector(".wrap");
    if (wrap) {
        const first = wrap.firstElementChild;
        if (first) wrap.insertBefore(nav, first);
        else wrap.appendChild(nav);
    } else {
        document.body.insertBefore(nav, document.body.firstChild);
    }
})();
