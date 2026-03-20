import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import animeRoutes from "./routes/anime.js";
import watchRoutes from "./routes/watch.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security & Middleware ────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());

// CORS — permite tu app en Lovable / Vercel / localhost
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["*"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite peticiones sin origin (Postman, curl, SSR) y los orígenes configurados
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    methods: ["GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Rate limiting — protege el servidor de abuso
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas peticiones. Intenta más tarde." },
});
app.use(limiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    name: "Nebula API",
    version: "1.0.0",
    status: "online",
    endpoints: {
      episodes: "GET /anime/:id/episodes?provider=gogoanime|zoro",
      watch: "GET /watch/:episodeId?provider=gogoanime|zoro",
      search: "GET /search?q=nombre&provider=gogoanime|zoro",
    },
  });
});

app.use("/anime", animeRoutes);
app.use("/watch", watchRoutes);

// Search endpoint bonus
import searchRoute from "./routes/search.js";
app.use("/search", searchRoute);

// ─── 404 & Error Handler ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint no encontrado." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[Error]", err.message);
  res.status(500).json({ error: err.message || "Error interno del servidor." });
});

app.listen(PORT, () => {
  console.log(`🚀 Nebula API corriendo en http://localhost:${PORT}`);
});
