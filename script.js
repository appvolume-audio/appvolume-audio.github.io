document.documentElement.classList.add("js");

const i18nConfig = window.AppVolumeI18n;
const languageStorageKey = "appvolume-website-language";
const languageSelect = document.querySelector("[data-language-select]");

const readLanguagePreference = () => {
  try {
    return localStorage.getItem(languageStorageKey) || "auto";
  } catch {
    return "auto";
  }
};

const saveLanguagePreference = (preference) => {
  try {
    localStorage.setItem(languageStorageKey, preference);
  } catch {
    return;
  }
};

const matchSupportedLocale = (locale) => {
  if (!locale) return null;
  const normalized = locale.toLowerCase();
  if (normalized.startsWith("zh")) return "zh-CN";
  if (normalized.startsWith("en")) return "en";
  return null;
};

const detectSystemLocale = () => {
  const browserLanguages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const language of browserLanguages) {
    const matchedLocale = matchSupportedLocale(language);
    if (matchedLocale) return matchedLocale;
  }

  return i18nConfig?.defaultLocale || "en";
};

let languagePreference = readLanguagePreference();
let currentLocale = languagePreference === "auto"
  ? detectSystemLocale()
  : matchSupportedLocale(languagePreference) || i18nConfig?.defaultLocale || "en";

const translate = (key, variables = {}) => {
  const localeMessages = i18nConfig?.messages?.[currentLocale] || {};
  const fallbackMessages = i18nConfig?.messages?.[i18nConfig.defaultLocale] || {};
  const template = localeMessages[key] ?? fallbackMessages[key] ?? key;

  return Object.entries(variables).reduce(
    (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
    template
  );
};

const applyTranslations = (locale) => {
  currentLocale = locale;
  document.documentElement.lang = locale;
  document.documentElement.dataset.locale = locale;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = translate(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    element.innerHTML = translate(element.dataset.i18nHtml);
  });

  document.querySelectorAll("[data-i18n-content]").forEach((element) => {
    element.setAttribute("content", translate(element.dataset.i18nContent));
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", translate(element.dataset.i18nAriaLabel));
  });

  document.querySelectorAll("[data-i18n-href]").forEach((element) => {
    element.setAttribute("href", translate(element.dataset.i18nHref));
  });

  document.dispatchEvent(
    new CustomEvent("appvolume:languagechange", { detail: { locale } })
  );
};

if (languageSelect) {
  languageSelect.value = languagePreference;
  languageSelect.addEventListener("change", () => {
    languagePreference = languageSelect.value;
    saveLanguagePreference(languagePreference);
    const nextLocale = languagePreference === "auto"
      ? detectSystemLocale()
      : matchSupportedLocale(languagePreference) || i18nConfig.defaultLocale;
    applyTranslations(nextLocale);
  });
}

window.addEventListener("languagechange", () => {
  if (languagePreference === "auto") applyTranslations(detectSystemLocale());
});

window.AppVolumeLanguage = {
  get locale() {
    return currentLocale;
  },
  translate
};

applyTranslations(currentLocale);

const siteHeader = document.querySelector("[data-site-header]");
const revealElements = document.querySelectorAll("[data-reveal]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const updateHeader = () => {
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 18);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

revealElements.forEach((element) => {
  const delay = Number(element.dataset.delay || 0);
  element.style.setProperty("--reveal-delay", `${delay}ms`);
});

if (reducedMotion.matches || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.1 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

const setRangeProgress = (slider, accent) => {
  const minimum = Number(slider.min || 0);
  const maximum = Number(slider.max || 100);
  const current = Number(slider.value);
  const progress = ((current - minimum) / (maximum - minimum)) * 100;
  slider.style.setProperty("--range-progress", `${progress}%`);
  if (accent) slider.style.setProperty("--accent", accent);
};

const masterSlider = document.querySelector("#master-volume");
const masterOutput = document.querySelector(".master-value");

if (masterSlider && masterOutput) {
  const updateMasterVolume = () => {
    setRangeProgress(masterSlider, "#f15a37");
    masterOutput.value = `${masterSlider.value}%`;
    masterOutput.textContent = `${masterSlider.value}%`;
  };

  masterSlider.addEventListener("input", updateMasterVolume);
  updateMasterVolume();
}

document.querySelectorAll("[data-app-row]").forEach((row) => {
  const slider = row.querySelector(".app-slider");
  const output = row.querySelector(".app-volume-value");
  const muteButton = row.querySelector(".mute-button");
  const deviceSelect = row.querySelector(".device-select");
  const routeSummary = row.querySelector(".route-summary");
  const appName = row.querySelector("h3")?.textContent?.trim() || "App";
  const accent = row.dataset.accent || "#f15a37";

  if (!slider || !output || !muteButton || !deviceSelect || !routeSummary) return;

  row.style.setProperty("--accent", accent);
  muteButton.style.setProperty("--signal", accent);

  const updateAccessibility = () => {
    const isMuted = muteButton.getAttribute("aria-pressed") === "true";
    muteButton.setAttribute(
      "aria-label",
      translate(isMuted ? "ui.unmute" : "ui.mute", { app: appName })
    );
    slider.setAttribute("aria-label", translate("ui.app_volume", { app: appName }));
    deviceSelect.setAttribute("aria-label", translate("ui.app_output", { app: appName }));
  };

  const updateAppVolume = ({ announceChange = false } = {}) => {
    setRangeProgress(slider, accent);
    const value = Number(slider.value);
    const displayValue = value === 0 ? translate("ui.muted") : `${value}%`;
    output.value = displayValue;
    output.textContent = displayValue;

    if (value > 0 && muteButton.getAttribute("aria-pressed") === "true") {
      muteButton.setAttribute("aria-pressed", "false");
    }

    updateAccessibility();
    if (announceChange) output.setAttribute("aria-live", "polite");
  };

  const updateDeviceRoute = ({ announceChange = false } = {}) => {
    const deviceName = deviceSelect.selectedOptions[0]?.textContent?.trim() || "";
    routeSummary.dataset.routeDevice = deviceSelect.value;
    routeSummary.textContent = deviceSelect.value === "system"
      ? translate("route.to_system")
      : translate("route.to_device", { device: deviceName });
    if (announceChange) routeSummary.setAttribute("aria-live", "polite");
  };

  slider.addEventListener("input", () => updateAppVolume({ announceChange: true }));

  muteButton.addEventListener("click", () => {
    const isMuted = muteButton.getAttribute("aria-pressed") === "true";

    if (isMuted) {
      slider.value = muteButton.dataset.previousVolume || "50";
      muteButton.setAttribute("aria-pressed", "false");
    } else {
      if (Number(slider.value) > 0) muteButton.dataset.previousVolume = slider.value;
      slider.value = "0";
      muteButton.setAttribute("aria-pressed", "true");
    }

    updateAppVolume({ announceChange: true });
  });

  deviceSelect.addEventListener("change", () => {
    updateDeviceRoute({ announceChange: true });
  });

  document.addEventListener("appvolume:languagechange", () => {
    updateAccessibility();
    updateAppVolume();
    updateDeviceRoute();
  });

  updateAccessibility();
  updateAppVolume();
  updateDeviceRoute();
});

const createToast = () => {
  const toast = document.createElement("div");
  toast.className = "demo-toast";
  toast.setAttribute("role", "status");
  toast.textContent = translate("ui.settings_toast");
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 180);
  }, 2200);
};

document.querySelector(".settings-button")?.addEventListener("click", createToast);

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});
