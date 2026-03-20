import { Router } from "express";
import { getProviderInstance } from "../lib/providers.js";

const router = Router();

/**
 * GET /watch/:episodeId
 * Query params:
 *   provider  — "gogoanime" | "zoro"  (default: "gogoanime")
 *   server    — servidor de video preferido (opcional, varía por proveedor)
 *
 * Devuelve:
 *   {
 *     episodeId,
 *     provider,
 *     sources: [ { url, isM3U8, quality } ],
 *     subtitles: [ { url, lang } ],
 *     headers: { Referer }   ← necesario para reproducir el stream
 *   }
 */
router.get("/:episodeId(*)", async (req, res, next) => {
  // episodeId puede contener slashes, p.ej. "one-piece-episode-1100"
  const { episodeId } = req.params;
  const provider = (req.query.provider || "gogoanime").toLowerCase();
  const server = req.query.server || undefined;

  if (!episodeId) {
    return res.status(400).json({ error: "episodeId es requerido." });
  }

  try {
    const instance = getProviderInstance(provider);

    const data = await instance.fetchEpisodeSources(
      decodeURIComponent(episodeId),
      server
    );

    if (!data?.sources?.length) {
      return res.status(404).json({
        error: "No se encontraron fuentes de video para este episodio.",
        episodeId,
        provider,
      });
    }

    // Filtrar y priorizar fuentes HLS (.m3u8)
    const hlsSources = data.sources.filter((s) => s.isM3U8 || s.url?.includes(".m3u8"));
    const otherSources = data.sources.filter((s) => !s.isM3U8 && !s.url?.includes(".m3u8"));

    return res.json({
      episodeId,
      provider,
      sources: [...hlsSources, ...otherSources], // HLS primero
      subtitles: data.subtitles ?? [],
      headers: data.headers ?? {},
      // intro/outro para saltar opening (Zoro lo provee)
      intro: data.intro ?? null,
      outro: data.outro ?? null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
