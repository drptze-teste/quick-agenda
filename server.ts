import express from "express";
import { createServer as createViteServer } from "vite";
import cors from 'cors';

async function startServer() {
  const app = express();
  
  // CORREÇÃO: Forçamos a conversão para número para evitar o erro de tipo no Google Cloud
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    // Handle SPA routing in production
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  // O "0.0.0.0" permite que o tráfego externo chegue ao container do Google
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
