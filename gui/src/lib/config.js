import configuracion from "../../../config.json";

const config = configuracion ?? {};
const servidor = config.server ?? {};

export const host = servidor.host ?? "127.0.0.1";
export const port = Number(servidor.port) || 7070;

export const appName = config.gui?.appName ?? "App";
export const appVersion = config.gui?.appVersion ?? "1.0.0";

function resolverBaseApi() {
  const configurada = String(config.gui?.apiBaseUrl ?? "").trim().replace(/\/+$/, "");
  if (configurada) return configurada;

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  const hostLocal = host === "0.0.0.0" ? "127.0.0.1" : host;
  return `http://${hostLocal}:${port}`;
}

export function apiUrl(ruta = "") {
  const base = resolverBaseApi();
  const limpia = ruta.startsWith("/") ? ruta : `/${ruta}`;
  return `${base}${limpia}`;
}
