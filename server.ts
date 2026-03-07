import express from "express";
import { createServer as createViteServer } from "vite";
import cors from 'cors';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

async function setupServer() {
  // Configuração do Vite ou Arquivos Estáticos
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }
}

// 🚀 A MÁGICA: Iniciamos o servidor IMEDIATAMENTE para o Google Cloud ver que estamos vivos
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is live on port ${PORT}`);
  
  // Só depois que o servidor já "atendeu", carregamos o resto das configurações
  setupServer().catch(err => {
    console.error("Erro ao carregar configurações do servidor:", err);
  });
});
