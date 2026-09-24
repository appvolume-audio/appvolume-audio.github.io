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
  const gainStatus = row.querySelector("[data-gain-status]");
  const muteButton = row.querySelector(".mute-button");
  const deviceSelect = row.querySelector(".device-select");
  const routeSummary = row.querySelector(".route-summary");
  const outputLabel = row.querySelector("[data-app-output-label]");
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
    if (outputLabel) {
      outputLabel.textContent = translate("ui.app_output", { app: appName });
    }
  };

  const updateAppVolume = ({ announceChange = false } = {}) => {
    setRangeProgress(slider, accent);
    const value = Number(slider.value);
    // A zero gain is distinct from the explicit mute button. Keep the
    // percentage visible so the demo teaches the same semantics as the app.
    const displayValue = `${value}%`;
    output.value = displayValue;
    output.textContent = displayValue;

    if (gainStatus) {
      if (value > 100) {
        const decibels = 20 * Math.log10(value / 100);
        const formattedDecibels = new Intl.NumberFormat(currentLocale, {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }).format(decibels);
        gainStatus.textContent = `${translate("ui.boost")} · +${formattedDecibels} dB · ${translate("ui.peak_protection")}`;
        gainStatus.dataset.state = "boost";
      } else if (value === 100) {
        gainStatus.textContent = translate("ui.unity_gain");
        gainStatus.dataset.state = "unity";
      } else {
        gainStatus.textContent = "";
        gainStatus.dataset.state = "attenuation";
      }
    }

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

const createToast = (message = translate("ui.settings_toast")) => {
  const toast = document.createElement("div");
  toast.className = "demo-toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 180);
  }, 2200);
};

const quickMixTabs = [...document.querySelectorAll(".quick-mix-tab")];
const quickMixTitle = document.querySelector("[data-quick-mix-title]");
const quickMixSummary = document.querySelector("[data-quick-mix-summary]");
const quickMixList = document.querySelector("[data-quick-mix-list]");
const quickMixApply = document.querySelector(".quick-mix-apply");
const quickMixStatus = document.querySelector("[data-quick-mix-status]");
const ratingRequest = document.querySelector("[data-rating-request]");
const modeLabelKeys = {
  meeting: "quick_mix.meeting_label",
  focus: "quick_mix.focus_label",
  gaming: "quick_mix.gaming_label"
};
const modeApplyKeys = {
  meeting: "quick_mix.apply_meeting",
  focus: "quick_mix.apply_focus",
  gaming: "quick_mix.apply_gaming"
};

let activeQuickMixTab = quickMixTabs.find((tab) => tab.classList.contains("is-active")) || quickMixTabs[0];
let appliedQuickMixMode = null;
let ratingPromptShown = false;

const showRatingPrompt = () => {
  if (!ratingRequest || ratingPromptShown) return;
  ratingPromptShown = true;
  ratingRequest.hidden = false;
  ratingRequest.classList.add("is-earned");
};

const updateQuickMixMode = (tab, { preserveStatus = false } = {}) => {
  if (!tab || !quickMixTitle || !quickMixSummary || !quickMixList) return;

  activeQuickMixTab = tab;
  quickMixTabs.forEach((candidate) => {
    const isActive = candidate === tab;
    candidate.classList.toggle("is-active", isActive);
    candidate.setAttribute("aria-selected", String(isActive));
  });

  const mode = tab.dataset.mode || "meeting";
  quickMixTitle.textContent = translate(tab.dataset.titleKey || "quick_mix.meeting_title");
  quickMixSummary.textContent = translate(tab.dataset.summaryKey || "quick_mix.meeting_summary");
  const itemKeys = (tab.dataset.items || "").split("|").filter(Boolean);
  [...quickMixList.children].forEach((item, index) => {
    const key = itemKeys[index];
    if (key) item.textContent = translate(key);
  });

  if (quickMixApply) {
    quickMixApply.textContent = translate(modeApplyKeys[mode] || modeApplyKeys.meeting);
    quickMixApply.dataset.mode = mode;
  }

  if (quickMixStatus && !preserveStatus) {
    quickMixStatus.textContent = appliedQuickMixMode === mode
      ? translate("quick_mix.applied", { mode: translate(modeLabelKeys[mode]) })
      : translate("quick_mix.ready");
  }
};

quickMixTabs.forEach((tab) => {
  tab.addEventListener("click", () => updateQuickMixMode(tab));
});

quickMixApply?.addEventListener("click", () => {
  const mode = quickMixApply.dataset.mode || activeQuickMixTab?.dataset.mode || "meeting";
  const modeLabel = translate(modeLabelKeys[mode]);
  appliedQuickMixMode = mode;
  if (quickMixStatus) quickMixStatus.textContent = translate("quick_mix.applied", { mode: modeLabel });
  createToast(translate("quick_mix.success_toast", { mode: modeLabel }));
  showRatingPrompt();
});

const renderPinnedApp = (row) => {
  const button = row.querySelector(".pin-toggle");
  const state = row.querySelector(".pinned-app-state");
  if (!button) return;
  const isPinned = button.getAttribute("aria-pressed") === "true";
  const app = button.dataset.app || row.dataset.pinnedApp || "App";
  row.classList.toggle("is-pinned", isPinned);
  button.setAttribute("aria-label", translate(isPinned ? "quick_mix.unpin_app" : "quick_mix.pin_app", { app }));
  if (state) state.textContent = translate(isPinned ? "quick_mix.pinned" : "quick_mix.unpinned");
};

document.querySelectorAll(".pinned-app-row").forEach((row) => {
  const button = row.querySelector(".pin-toggle");
  button?.addEventListener("click", () => {
    const isPinned = button.getAttribute("aria-pressed") === "true";
    button.setAttribute("aria-pressed", String(!isPinned));
    renderPinnedApp(row);
    showRatingPrompt();
  });
  renderPinnedApp(row);
});

const temporaryMuteButtons = [...document.querySelectorAll("[data-temp-mute]")];
const temporaryMuteStatus = document.querySelector("[data-temp-mute-status]");
let temporaryMuteRemaining = 0;
let temporaryMuteWasRestored = false;
let temporaryMuteTimer = null;

const renderTemporaryMute = () => {
  temporaryMuteButtons.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.tempMute) > 0 && Number(button.dataset.tempMute) === temporaryMuteRemaining);
  });

  if (!temporaryMuteStatus) return;
  if (temporaryMuteRemaining > 0) {
    temporaryMuteStatus.textContent = translate("quick_mix.temp_running", { seconds: temporaryMuteRemaining });
  } else if (temporaryMuteWasRestored) {
    temporaryMuteStatus.textContent = translate("quick_mix.temp_restored");
  } else {
    temporaryMuteStatus.textContent = translate("quick_mix.temp_ready");
  }
};

const startTemporaryMute = (seconds) => {
  if (temporaryMuteTimer) window.clearInterval(temporaryMuteTimer);
  temporaryMuteTimer = null;
  temporaryMuteRemaining = Number(seconds) || 0;
  temporaryMuteWasRestored = temporaryMuteRemaining === 0;
  renderTemporaryMute();

  if (temporaryMuteRemaining <= 0) {
    showRatingPrompt();
    return;
  }

  showRatingPrompt();
  temporaryMuteTimer = window.setInterval(() => {
    temporaryMuteRemaining -= 1;
    if (temporaryMuteRemaining <= 0) {
      temporaryMuteRemaining = 0;
      temporaryMuteWasRestored = true;
      window.clearInterval(temporaryMuteTimer);
      temporaryMuteTimer = null;
    }
    renderTemporaryMute();
  }, 1000);
};

temporaryMuteButtons.forEach((button) => {
  button.addEventListener("click", () => startTemporaryMute(button.dataset.tempMute));
});

document.querySelectorAll(".app-slider, .mute-button, .device-select").forEach((control) => {
  control.addEventListener("input", showRatingPrompt);
  control.addEventListener("change", showRatingPrompt);
  control.addEventListener("click", showRatingPrompt);
});

document.addEventListener("appvolume:languagechange", () => {
  updateQuickMixMode(activeQuickMixTab, { preserveStatus: true });
  if (quickMixStatus && appliedQuickMixMode) {
    quickMixStatus.textContent = translate("quick_mix.applied", {
      mode: translate(modeLabelKeys[appliedQuickMixMode])
    });
  }
  document.querySelectorAll(".pinned-app-row").forEach(renderPinnedApp);
  renderTemporaryMute();
});

updateQuickMixMode(activeQuickMixTab);

document.querySelector(".settings-button")?.addEventListener("click", createToast);

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});
