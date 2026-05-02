const express = require("express");
const cors = require("cors");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ───────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "Edge TTS API",
    version: "2.0.0",
    endpoints: ["/tts", "/tts-base64", "/voices", "/health"],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// ── /voices ────────────────────────────────────────────────────────────────
app.get("/voices", async (req, res) => {
  try {
    const tts = new MsEdgeTTS();
    const voices = await tts.getVoices();
    res.json({ success: true, count: voices.length, voices });
  } catch (err) {
    console.error("Voices Error:", err.message);
    res.json({
      success: true,
      fallback: true,
      voices: [
        { Name: "hi-IN-SwaraNeural",    FriendlyName: "Hindi - Swara (Female)",    Locale: "hi-IN", Gender: "Female" },
        { Name: "hi-IN-MadhurNeural",   FriendlyName: "Hindi - Madhur (Male)",     Locale: "hi-IN", Gender: "Male"   },
        { Name: "en-US-AriaNeural",     FriendlyName: "English US - Aria",          Locale: "en-US", Gender: "Female" },
        { Name: "en-US-GuyNeural",      FriendlyName: "English US - Guy",           Locale: "en-US", Gender: "Male"   },
        { Name: "en-IN-NeerjaNeural",   FriendlyName: "English India - Neerja",     Locale: "en-IN", Gender: "Female" },
        { Name: "en-GB-SoniaNeural",    FriendlyName: "English UK - Sonia",         Locale: "en-GB", Gender: "Female" },
        { Name: "ta-IN-PallaviNeural",  FriendlyName: "Tamil - Pallavi (Female)",   Locale: "ta-IN", Gender: "Female" },
        { Name: "te-IN-ShrutiNeural",   FriendlyName: "Telugu - Shruti (Female)",   Locale: "te-IN", Gender: "Female" },
        { Name: "mr-IN-AarohiNeural",   FriendlyName: "Marathi - Aarohi (Female)",  Locale: "mr-IN", Gender: "Female" },
        { Name: "bn-IN-TanishaaNeural", FriendlyName: "Bengali - Tanishaa (Female)", Locale: "bn-IN", Gender: "Female" },
      ],
    });
  }
});

// ── /tts (streaming) ───────────────────────────────────────────────────────
app.post("/tts", async (req, res) => {
  const {
    text  = "Hello test",
    voice = "hi-IN-SwaraNeural",
    rate  = "+0%",
    pitch = "+0Hz",
  } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "text is required" });
  }
  if (text.length > 5000) {
    return res.status(400).json({ error: "text too long (max 5000 chars)" });
  }

  console.log("TTS request:", { voice, rate, pitch, textLength: text.length });

  try {
    const tts = new MsEdgeTTS();

    await tts.setMetadata(
      voice,
      OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
    );

    const { audioStream } = await tts.toStream(text);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    audioStream.on("error", (err) => {
      console.error("Stream error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: "Audio stream failed" });
      } else {
        res.end();
      }
    });

    audioStream.on("end", () => console.log("TTS stream complete"));
    audioStream.pipe(res);

  } catch (err) {
    console.error("TTS Fatal Error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "TTS failed", detail: err.message });
    }
  }
});

// ── /tts-base64 ────────────────────────────────────────────────────────────
app.post("/tts-base64", async (req, res) => {
  const {
    text  = "Hello test",
    voice = "hi-IN-SwaraNeural",
    rate  = "+0%",
    pitch = "+0Hz",
  } = req.body;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "text is required" });
  }

  console.log("TTS-base64 request:", { voice, textLength: text.length });

  try {
    const tts = new MsEdgeTTS();

    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = await tts.toStream(text);

    const chunks = [];
    audioStream.on("data", (chunk) => chunks.push(chunk));
    audioStream.on("end", () => {
      const buffer = Buffer.concat(chunks);
      res.json({
        success: true,
        audio: buffer.toString("base64"),
        mimeType: "audio/mpeg",
        size: buffer.length,
      });
    });
    audioStream.on("error", (err) => {
      console.error("Base64 stream error:", err.message);
      res.status(500).json({ error: err.message });
    });

  } catch (err) {
    console.error("TTS-base64 fatal:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Edge TTS server running on port ${PORT}`);
  console.log(`Node version: ${process.version}`);
});
