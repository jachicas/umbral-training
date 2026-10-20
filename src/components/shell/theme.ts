export const THEME_STORAGE_KEY = "umbral-theme";

/** Inline <head> script: applies the saved theme before first paint (no flash).
 *  Dark is the default — the glass shell is designed against a darkened photo. */
export const THEME_INIT_SCRIPT = `(function(){var d=document.documentElement;try{if(localStorage.getItem("${THEME_STORAGE_KEY}")!=="light")d.classList.add("dark")}catch(e){d.classList.add("dark")}})()`;

/** The theme lives as a `dark` class on <html> (set before paint by the root
 *  layout), so the icon is swapped with CSS and no React state is needed. */
export function toggleTheme() {
  const dark = document.documentElement.classList.toggle("dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // Storage unavailable (private mode): theme just won't persist.
  }
}
