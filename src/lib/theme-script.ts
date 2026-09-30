export const THEME_KEY = "tablego:theme";

/**
 * Runs in <head> before the first paint so a dark page never flashes light.
 * No saved choice yet: follow the system setting.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}`;
