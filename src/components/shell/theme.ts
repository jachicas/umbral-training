export const THEME_STORAGE_KEY = "umbral-theme";

/** Inline <head> script: applies the saved theme before first paint (no flash).
 *  Dark is the default — the glass shell is designed against a darkened photo. */
export const THEME_INIT_SCRIPT = `(function(){var d=document.documentElement;try{if(localStorage.getItem("${THEME_STORAGE_KEY}")!=="light")d.classList.add("dark")}catch(e){d.classList.add("dark")}})()`;
