import { ANIME } from "@consumet/extensions";

/**
 * Mapa de proveedores disponibles.
 * Instanciamos una sola vez para reutilizar la conexión.
 */
const providerMap = {
  gogoanime: () => new ANIME.Gogoanime(),
  zoro: () => new ANIME.Zoro(),
  animepahe: () => new ANIME.AnimePahe(),
  animefox: () => new ANIME.AnimeFox(),
};

const instanceCache = {};

/**
 * Retorna una instancia cacheada del proveedor solicitado.
 * @param {string} name - nombre del proveedor (lowercase)
 */
export function getProviderInstance(name) {
  const key = name.toLowerCase();

  if (!providerMap[key]) {
    const available = Object.keys(providerMap).join(", ");
    throw Object.assign(
      new Error(`Proveedor "${name}" no soportado. Disponibles: ${available}`),
      { statusCode: 400 }
    );
  }

  if (!instanceCache[key]) {
    instanceCache[key] = providerMap[key]();
    console.log(`[Provider] Instancia creada: ${key}`);
  }

  return instanceCache[key];
}

export const SUPPORTED_PROVIDERS = Object.keys(providerMap);
