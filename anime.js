import { Router } from "express";
import { getProviderInstance } from "../lib/providers.js";
import { anilistToProviderSearch } from "../lib/anilist.js";

const router = Router();

/**
 * GET /anime/:id/episodes
 * Query params:
 *   provider  — "gogoanime" | "zoro"  (default: "gogoanime")
 *   dubbed    — "true" | "false"      (default: "false")
 *
 * Flujo:
 *   1. Consulta AniList para obtener título en inglés/romaji del anime.
 *   2. Busca ese título en el proveedor elegido.
 *   3. Devuelve la lista de episodios del primer resultado.
 */
router.get("/:id/episodes", async (req, res, next) => {
  const { id } = req.params;
  const provider = (req.query.provider || "gogoanime").toLowerCase();
  const dubbed = req.query.dubbed === "true";

  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: "El ID de AniList debe ser numérico." });
  }

  try {
    const instance = getProviderInstance(provider);

    // 1. Resolver título desde AniList
    const { title, totalEpisodes } = await anilistToProviderSearch(id);

    // 2. Buscar en el proveedor
    const searchQuery = dubbed ? `${title} (Dub)` : title;
    const searchResults = await instance.search(searchQuery);

    if (!searchResults?.results?.length) {
      return res.status(404).json({
        error: `No se encontraron resultados en ${provider} para: "${searchQuery}"`,
        anilistTitle: title,
      });
    }

    // Tomar el primer resultado (mejor coincidencia)
    const animeEntry = searchResults.results[0];

    // 3. Obtener info + episodios
    const animeInfo = await instance.fetchAnimeInfo(animeEntry.id);

    return res.json({
      anilistId: id,
      providerId: animeEntry.id,
      provider,
      title: animeInfo.title,
      totalEpisodes: animeInfo.totalEpisodes ?? totalEpisodes,
      episodes: animeInfo.episodes ?? [],
    });
  } catch (err) {
    next(err);
  }
});

export default router; 
