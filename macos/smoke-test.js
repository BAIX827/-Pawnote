// Executed by the native host with an isolated, nonpersistent WebKit data store.
window.pawnoteSmoke = async () => {
  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const waitFor = async (check, label) => {
    for (let i = 0; i < 80; i++) {
      if (check()) return;
      await pause(150);
    }
    throw new Error(`Timed out: ${label}; ${window.location.pathname}; buttons: ${buttons().map((e) => e.innerText || e.getAttribute("aria-label")).join(" | ")}`);
  };
  const buttons = () => [...document.querySelectorAll('[role="button"],button,a')];
  const find = (expression) => buttons().find((element) => expression.test((element.innerText || element.getAttribute("aria-label") || "").trim()));
  const state = () => JSON.parse(localStorage.getItem("paw-life:v1") || "null");
  await waitFor(() => find(/体验橘总的生活|Try.*life|Explore.*life/i), "onboarding render");
  const key = "pawnote-mac-smoke-storage";
  localStorage.setItem(key, "ok");
  if (localStorage.getItem(key) !== "ok") throw new Error("WebKit storage unavailable");
  localStorage.removeItem(key);
  find(/体验橘总的生活|Try.*life|Explore.*life/i).click();
  await waitFor(() => state()?.pet, "demo saved");
  const initial = state().events.length;
  history.pushState({}, "", "/record");
  window.dispatchEvent(new Event("popstate"));
  await waitFor(() => document.querySelector("textarea"), "record route");
  const field = document.querySelector("textarea");
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(field, "今天橘总在窗边晒太阳。");
  field.dispatchEvent(new Event("input", { bubbles: true }));
  await waitFor(() => find(/保存日记|Save entry/)?.getAttribute("aria-disabled") !== "true" && state()?.draft?.description, "draft saved");
  find(/保存日记|Save entry/).click();
  await waitFor(() => state()?.events.length === initial + 1, "entry saved");
  await waitFor(() => find(/制作爪报卡|Make a Paw Post card/), "entry detail ready");
  find(/制作爪报卡|Make a Paw Post card/).click();
  await waitFor(() => find(/保存 PNG 图片|Save PNG picture/)?.getAttribute("aria-disabled") !== "true" && find(/保存 PNG 图片|Save PNG picture/), "news image prepared");
  // Wait for the native-stack transition before pressing the first export control.
  await pause(500);
  for (const layout of [/日报|^Daily$/, /号外|^Extra$/, /通缉令|^Wanted$/, /封面|^Cover$/]) {
    await waitFor(() => find(layout), `layout visible: ${layout}`);
    find(layout).click();
    await pause(50);
    await waitFor(() => find(/保存 PNG 图片|Save PNG picture/) && find(/保存 PNG 图片|Save PNG picture/).getAttribute("aria-disabled") !== "true", "layout PNG prepared");
    window.pawnotePNGDownloaded = false;
    find(/保存 PNG 图片|Save PNG picture/).click();
    await waitFor(() => window.pawnotePNGDownloaded, "native PNG download");
  }
  try {
    await window.webkit.messageHandlers.pawnoteImageShare.postMessage({ png: "invalid" });
    throw new Error("Invalid share image accepted");
  } catch (error) {
    if (error.message === "Invalid share image accepted") throw error;
  }
  find(/分享新闻图片|Share news image/).click();
  await waitFor(() => window.pawnoteImageShareReady, "native image share bridge");
  for (const route of ["life", "circle", "profile", "timemachine", "settings"]) {
    const response = await fetch(`/${route}`);
    if (!response.ok || !(await response.text()).includes("<html")) throw new Error(`SPA fallback failed: ${route}`);
  }
  const missing = await fetch("/missing-asset.js");
  if (missing.status !== 404) throw new Error("Missing assets must return 404");
  const forbidden = await fetch("/%2e%2e%2fInfo.plist");
  if (forbidden.status !== 403) throw new Error("Parent path must be blocked");
  history.pushState({}, "", "/settings");
  window.dispatchEvent(new Event("popstate"));
  await waitFor(() => find(/导出全部数据|Export all data/), "settings route");
  find(/导出全部数据|Export all data/).click();
  await waitFor(() => window.pawnoteDownloadFinished, "native backup download");
  return { onboarding: true, routing: true, entrySaved: true, localStorage: true, spaFallback: true, pathGuard: true, backupDownload: true, pngLayouts: 4, imageShare: true, invalidShareRejected: true };
};
