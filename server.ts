import express from "express";
import cors from 'cors';
import path from 'path';

console.log("Starting server script...");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});

async function init() {
  console.log(`Initializing in ${process.env.NODE_ENV} mode...`);
  
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware loaded.");
  } else {
    const distPath = path.resolve("dist");
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is listening on 0.0.0.0:${PORT}`);
  });
}

init().catch(err => {
  console.error("Initialization failed:", err);
  process.exit(1);
});
