import express from "express";
import cors from "cors";
import { MsEdgeTTS, OUTPUT_FORMAT } from "edge-tts-node";
import { Readable } from "stream";

const app = express();
const PORT = process.env.PORT || 3000;

// Allow requests from any frontend
app.use(cors());
app.use(express.json());

// Health check route
app.get("/", (req, res) => {
  res.send("✅ Edge TTS Server is running!");
});

// TTS route
app.post("/tts", async (req, res) => {
  try {
    const {
      text = "Hello, this is a test.",
      voice = "hi-IN-SwaraNeural",
      rate = "+0%",
      pitch = "+0Hz"
    } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "text is required" });
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const readable = tts.toStream(text, { rate, pitch });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", "inline; filename=output.mp3");

    readable.pipe(res);

    readable.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).end();
    });

  } catch (err) {
    console.error("TTS Error:", err);
    res.status(500).json({ error: "Failed to generate TTS audio." });
  }
});

// List available voices route
app.get("/voices", async (req, res) => {
  try {
    const tts = new MsEdgeTTS();
    const voices = await tts.getVoices();
    res.json(voices);
  } catch (err) {
    console.error("Voices Error:", err);
    res.status(500).json({ error: "Failed to fetch voices." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
