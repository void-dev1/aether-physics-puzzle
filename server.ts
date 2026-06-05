import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Setup Gemini instance lazily
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  };

  // API endpoint for AI Physics Analyst
  app.post("/api/ai/hint", async (req, res) => {
    try {
      const { level, playerPos, activeSkin } = req.body;
      if (!level) {
        return res.status(400).json({ error: "Level config is required" });
      }

      const ai = getGeminiClient();

      const prompt = `
You are the "Core Aether Consultant," a clever, witty, and master AI physics gravity simulation advisor guiding an astronaut sphere through orbital pathways.
Analyze the following level configuration and player position, then provide a highly tactical, physics-accurate, or portal-routing clue (max 2-3 sentences) for conquering this level. Write in an encouraging, high-tech, cyberpunk gaming tone.

== LEVEL CONFIGURATION ==
Level ID: #${level.id}
Level Name: "${level.name}"
Theme Era: "${level.theme}"
Gravity Vector: X: ${level.gravity.x}, Y: ${level.gravity.y}
Gold Star Target Time: ${level.goldTime} seconds
Silver Star Target Time: ${level.silverTime} seconds

Goal/Portal Exit Position: X: ${level.goal.position.x}, Y: ${level.goal.position.y} (Radius: ${level.goal.radius})
Player Projectile Position: X: ${playerPos?.x ?? level.startPosition.x}, Y: ${playerPos?.y ?? level.startPosition.y}
Sphere Skin Active: "${activeSkin ?? 'default'}"

Obstacles: ${level.obstacles.map((o: any) => `Shape ${o.shape} at (${o.position.x}, ${o.position.y})`).join("; ") || "None"}
Gravity Attractors/Repellers: ${level.gravityFields.map((f: any) => `Type ${f.type} at (${f.position.x}, ${f.position.y}) with strength ${f.strength}`).join("; ") || "None"}
Water/Fluid Pools: ${level.fluids.map((fl: any) => `Pool at (${fl.x}, ${fl.y}) with density ${fl.density}`).join("; ") || "None"}
Force Zones/Wind Turbines: ${level.forceZones.map((z: any) => `Wind Zone at (${z.x}, ${z.y}) with force Vector (${z.force.x}, ${z.force.y})`).join("; ") || "None"}
Interactive Switches/Spikes/Lasers: ${level.interactives.map((i: any) => `Type ${i.type} at (${i.position.x}, ${i.position.y})`).join("; ") || "None"}
Portals (Teleporters): ${level.portals.map((p: any) => `Swirl portal from A(${p.posA.x}, ${p.posA.y}) to B(${p.posB.x}, ${p.posB.y})`).join("; ") || "None"}

Give a specific tip on launching:
- What angle or speed should they pull the slingshot (remember slingshot operates by pulling in the OPPOSITE direction of target velocity)?
- How to avoid the spikes, lasers, or repellers?
- If there are fluids or water, what path adjustments are needed?
- Keep it short, captivating, and direct! Don't write fluff.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.8,
        }
      });

      res.json({ reply: response.text });
    } catch (e: any) {
      console.error("Gemini AI API failure:", e);
      res.status(500).json({ error: e.message || "Failed to generate AI advice. Check that GEMINI_API_KEY is configured in Secrets." });
    }
  });

  // Serve static files in production or use Vite middleware in dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets compiled inside 'dist'
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
