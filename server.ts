import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";

// Hardcoding key here as requested explicitly by the user structure (though .env is preferred)
const NEWS_API_KEY = process.env.NEWS_API_KEY || "09dfeffa1ed14565926fd6c35caa770e";
const API_BASE_URL = "https://newsapi.org/v2";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Proxy API routes for NewsAPI to avoid CORS issues in browser
  app.get("/api/news/top-headlines", async (req, res) => {
    try {
      const qs = new URLSearchParams(req.query as Record<string, string>);
      qs.set('apiKey', NEWS_API_KEY);
      // Default to general if not provided
      if (!qs.has('country') && !qs.has('sources') && !qs.has('category')) {
         qs.set('country', 'us'); // Fallback
      }
      
      const response = await fetch(`${API_BASE_URL}/top-headlines?${qs.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.get("/api/news/everything", async (req, res) => {
    try {
      const qs = new URLSearchParams(req.query as Record<string, string>);
      qs.set('apiKey', NEWS_API_KEY);
      
      if (!qs.has('q')) qs.set('q', 'news');
      
      const response = await fetch(`${API_BASE_URL}/everything?${qs.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
