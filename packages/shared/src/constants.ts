import type { ColorSettings, UserSettings } from "./types.ts";

export const MCMETA_URL = "https://raw.githubusercontent.com/misode/mcmeta";
export const VANILLA_MCDOC_URL = "https://raw.githubusercontent.com/SpyglassMC/vanilla-mcdoc";

export const DEFAULT_COLOR_SETTINGS: ColorSettings = {
    primary: "#1b1b1b",
    text: "#dadada",
    add: "#487c13",
    remove: "#9b341b",
    selected: "#7f5505",
    warning: "#cca700",
    error: "#f48771",
    predicate: "#306163",
    function: "#5f5f5f",
    pool: "#386330"
};

export const DEFAULT_SETTINGS: UserSettings = {
    uiScale: 1,
    largeFileThreshold: 1000,
    colors: DEFAULT_COLOR_SETTINGS
};
