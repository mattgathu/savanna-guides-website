(async function () {
  const isFR = location.pathname === "/fr/" || location.pathname.startsWith("/fr/");
  if (!isFR) return;

  const res = await fetch("/assets/i18n/fr.json", { cache: "force-cache" });
  if (!res.ok) return;

  const dict = await res.json();

  function parseCount(raw) {
    if (raw == null) return null;
    const direct = Number(raw);
    if (!Number.isNaN(direct)) return direct;
    const match = String(raw).match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  function resolvePlural(el) {
    const singularKey = el.getAttribute("data-i18n-singular");
    const pluralKey = el.getAttribute("data-i18n-plural");
    if (!singularKey || !pluralKey) return null;

    const zeroKey = el.getAttribute("data-i18n-zero");
    const countAttr = el.getAttribute("data-i18n-count");
    const count = parseCount(countAttr) ?? parseCount(el.textContent);
    if (count == null) return null;

    let key = pluralKey;
    if (count === 0 && zeroKey) key = zeroKey;
    else if (count === 1) key = singularKey;

    let value = dict[key];
    if (!value) return null;

    value = value.replace(/\{count\}/g, String(count));
    if (value.includes("%")) {
      value = value.replace(/%/g, String(count));
    }

    return value;
  }

  function setTextPreserve(el, value) {
    const explicit = el.querySelector("[data-i18n-text]");
    if (explicit) {
      explicit.textContent = value;
      return;
    }

    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.textContent.trim() !== "") {
        node.textContent = value;
        return;
      }
    }

    if (el.hasAttribute("aria-label")) el.setAttribute("aria-label", value);
    if (el.hasAttribute("title")) el.setAttribute("title", value);
  }

  document
    .querySelectorAll("[data-i18n], [data-i18n-singular], [data-i18n-plural]")
    .forEach((el) => {
      let value = resolvePlural(el);
      if (!value) {
        const key = el.getAttribute("data-i18n");
        value = key ? dict[key] : null;
      }
      if (!value) return;

      setTextPreserve(el, value);

      const attrs = el.getAttribute("data-i18n-attr");
      if (!attrs) return;
      attrs
        .split(",")
        .map((attr) => attr.trim())
        .filter(Boolean)
        .forEach((attr) => {
          el.setAttribute(attr, value);
        });
    });
})();
