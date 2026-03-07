import express from "express";
import { createServer as createViteServer } from "vite";
import cors from 'cors';

async function startServer() {
  const app = express();
  
  // A MÁGICA ACONTECE AQUI: 
  // Pega a porta que o Google Cloud mandar, ou usa 3000 se estiver no seu computador
  const PORT = process.env.PORT || 3000;

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

  // O "0.0.0.0" já estava correto, ele libera o acesso para a internet!
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
