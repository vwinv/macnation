export const THEME_STORAGE_KEY = "mac-nation-theme";

export const THEME_SCRIPT = `(function(){
  try {
    var key = "${THEME_STORAGE_KEY}";
    var stored = localStorage.getItem(key);
    var dark = stored === "dark";
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#050505" : "#ffffff");
  } catch (e) {}
})();`;
