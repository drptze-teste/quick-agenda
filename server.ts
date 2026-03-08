import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();

  // ✅ Fix #1: Porta via variável de ambiente (obrigatório no Cloud Run)
  const PORT = process.env.PORT || 8080;

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  if (process.env.NODE_ENV !== "production") {
    // Desenvolvimento: Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

  } else {
    // Produção: servir arquivos estáticos do build
    app.use(express.static(path.join(__dirname, "dist")));

    // ✅ Fix #2: Rota wildcard compatível com Express v5
    app.get("/{*path}", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // ✅ Fix #3: Escuta em 0.0.0.0 (obrigatório no Cloud Run)
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
  });
}

startServer();
