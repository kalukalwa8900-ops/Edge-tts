# Edge TTS Server — Railway Deployment

Microsoft Edge TTS API using `edge-tts-node` + Express, ready for Railway.

---

## 📁 Files

| File | Purpose |
|------|---------|
| `server.js` | Main Express server |
| `package.json` | Dependencies + Node 18 engine |
| `railway.json` | Railway deployment config |
| `Procfile` | Process start command |

---

## 🚀 Deploy to Railway

1. Push all files to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo → Railway auto-detects and deploys
4. Wait ~2 min → get your live URL

---

## 📡 API Endpoints

### GET /health
Check server is running.
```
curl https://your-app.up.railway.app/health
```

### GET /voices
Get all available TTS voices (with fallback if Microsoft unreachable).
```
curl https://your-app.up.railway.app/voices
```

### POST /tts
Stream MP3 audio directly.
```bash
curl -X POST https://your-app.up.railway.app/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"नमस्ते दुनिया","voice":"hi-IN-SwaraNeural"}' \
  --output audio.mp3
```

**Body params:**
| Param | Default | Description |
|-------|---------|-------------|
| text | "Hello test" | Text to convert (max 5000 chars) |
| voice | "hi-IN-SwaraNeural" | Voice name |
| rate | "+0%" | Speed e.g. "+20%" faster, "-10%" slower |
| pitch | "+0Hz" | Pitch e.g. "+10Hz" higher |

### POST /tts-base64
Returns audio as base64 JSON (use if streaming causes issues on frontend).
```bash
curl -X POST https://your-app.up.railway.app/tts-base64 \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voice":"en-US-AriaNeural"}'
```
Response:
```json
{
  "success": true,
  "audio": "SUQzBAAAAAAAI...",
  "mimeType": "audio/mpeg",
  "size": 12480
}
```

---

## 🎤 Popular Voices

| Voice | Language | Gender |
|-------|----------|--------|
| hi-IN-SwaraNeural | Hindi | Female |
| hi-IN-MadhurNeural | Hindi | Male |
| en-US-AriaNeural | English US | Female |
| en-US-GuyNeural | English US | Male |
| en-IN-NeerjaNeural | English India | Female |
| ta-IN-PallaviNeural | Tamil | Female |
| te-IN-ShrutiNeural | Telugu | Female |

---

## 🔧 Local Development

```bash
npm install
npm run dev   # uses nodemon for auto-restart
# or
npm start
```

---

## ❗ If Still Getting 500

Railway may block Microsoft TTS endpoints. Use `/tts-base64` instead of `/tts` — it buffers the full audio before sending, which avoids stream piping issues.

If completely blocked, switch to `gTTS` (Google TTS) or browser's built-in `speechSynthesis` API as fallback.
