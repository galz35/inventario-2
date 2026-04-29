/**
 * Centralizador de Rutas y Configuración de Entorno (Inventario)
 */

export const APP_BASE = import.meta.env.VITE_BASE_PATH || "/";

// URL base de la API de Inventario
export const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "") + "/api/v1";

// URL del portal central (para redirecciones de salida)
export const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || "https://www.rhclaroni.com/portal/";

export function appPath(path) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${APP_BASE}${cleanPath}`.replace(/\/+/g, '/');
}
