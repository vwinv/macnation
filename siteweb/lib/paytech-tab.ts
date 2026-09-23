export function openPaytechWindow() {
  return typeof window === "undefined" ? null : window.open("about:blank", "_blank");
}

export function goToPaytech(url: string, tab?: Window | null) {
  if (tab && !tab.closed) {
    tab.location.replace(url);
    return true;
  }
  return Boolean(window.open(url, "_blank", "noopener,noreferrer"));
}
