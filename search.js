import { Router } from "express";
import { getProviderInstance } from "../lib/providers.js";

const router = Router();

/**
 * GET /search?q=nombre&provider=gogoanime|zoro&page=1
 */
router.get("/", async (req, res, next) => {
  const { q, provider = "gogoanime", page = 1 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'El parámetro "q" debe tener al menos 2 caracteres.' });
  }

  try {
    const instance = getProviderInstance(provider.toLowerCase());
    const results = await instance.search(q.trim(), Number(page));

    return res.json({
      query: q.trim(),
      provider,
      page: Number(page),
      ...results,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
