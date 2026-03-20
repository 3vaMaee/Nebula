const ANILIST_API = "https://graphql.anilist.co";

const QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title {
      romaji
      english
      native
    }
    episodes
    status
    format
    season
    seasonYear
    coverImage { large }
    description(asHtml: false)
  }
}
`;

/**
 * Consulta AniList y retorna el título más adecuado para buscar en scrapers.
 * Prioridad: english → romaji → native
 *
 * @param {string|number} anilistId
 * @returns {{ title: string, totalEpisodes: number|null, raw: object }}
 */
export async function anilistToProviderSearch(anilistId) {
  const response = await fetch(ANILIST_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { id: Number(anilistId) } }),
  });

  if (!response.ok) {
    throw new Error(`AniList devolvió status ${response.status}`);
  }

  const { data, errors } = await response.json();

  if (errors?.length) {
    throw new Error(`AniList error: ${errors[0].message}`);
  }

  if (!data?.Media) {
    throw Object.assign(new Error(`Anime con ID ${anilistId} no encontrado en AniList.`), {
      statusCode: 404,
    });
  }

  const media = data.Media;
  const title = media.title.english || media.title.romaji || media.title.native;

  return {
    title,
    totalEpisodes: media.episodes ?? null,
    raw: media,
  };
}
