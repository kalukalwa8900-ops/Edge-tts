import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Optional API keys for future integrations (loaded from env)
const OPTIONAL_API_KEY = process.env.OPTIONAL_API_KEY || null;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Temp dir for generated audio
const TMP_DIR = process.env.TMP_DIR || path.join("/tmp", "hindi-tts");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Cleanup files older than 30 minutes every 10 minutes
const MAX_AGE_MS = 30 * 60 * 1000;
setInterval(() => {
  try {
    const now = Date.now();
    for (const f of fs.readdirSync(TMP_DIR)) {
      const fp = path.join(TMP_DIR, f);
      try {
        const st = fs.statSync(fp);
        if (now - st.mtimeMs > MAX_AGE_MS) fs.unlinkSync(fp);
      } catch {}
    }
  } catch (e) {
    console.error("Cleanup error:", e);
  }
}, 10 * 60 * 1000);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Generate TTS
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice, rate, pitch } = req.body || {};
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }
    if (text.length > 5000) {
      return res.status(400).json({ error: "Text too long (max 5000 chars)" });
    }

    const allowedVoices = ["hi-IN-MadhurNeural", "hi-IN-SwaraNeural"];
    const selectedVoice = allowedVoices.includes(voice) ? voice : "hi-IN-MadhurNeural";

    // Rate / pitch must be like "+10%" / "-5%" / "+2Hz"
    const ratePct = clampNum(rate, -50, 50, 0);
    const pitchHz = clampNum(pitch, -50, 50, 0);
    const rateStr = `${ratePct >= 0 ? "+" : ""}${ratePct}%`;
    const pitchStr = `${pitchHz >= 0 ? "+" : ""}${pitchHz}Hz`;

    const tts = new MsEdgeTTS();
    await tts.setMetadata(selectedVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const id = crypto.randomBytes(8).toString("hex");
    const filePath = path.join(TMP_DIR, `${id}.mp3`);

    // toFile returns { audioFilePath }
    await tts.toFile(filePath.replace(/\.mp3$/, ""), text, {
      rate: rateStr,
      pitch: pitchStr,
    });

    if (!fs.existsSync(filePath)) {
      return res.status(500).json({ error: "Audio generation failed" });
    }

    res.json({
      success: true,
      id,
      url: `/api/audio/${id}.mp3`,
      voice: selectedVoice,
      rate: rateStr,
      pitch: pitchStr,
    });
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({
      error: "Failed to generate speech. Edge TTS may be temporarily unavailable.",
      detail: String(err?.message || err),
    });
  }
});

// Serve generated audio
app.get("/api/audio/:file", (req, res) => {
  const safe = path.basename(req.params.file);
  const fp = path.join(TMP_DIR, safe);
  if (!fp.endsWith(".mp3") || !fs.existsSync(fp)) {
    return res.status(404).json({ error: "Not found" });
  }
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Content-Disposition", `inline; filename="${safe}"`);
  fs.createReadStream(fp).pipe(res);
});

// Serve built frontend in production
const distDir = path.join(__dirname, "..", "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

function clampNum(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

app.listen(PORT, () => {
  console.log(`Hindi TTS server running on port ${PORT}`);
  if (OPTIONAL_API_KEY) console.log("Optional API key loaded.");
});
