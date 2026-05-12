# Hindi Text-to-Speech (Edge TTS)

A production-ready full-stack web app to convert Hindi text into natural-sounding speech using **Microsoft Edge TTS** — no API key required.

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **TTS**: `msedge-tts` (free, no key needed)
- **Deployment**: Railway-ready

## Features

- Paste Hindi text and generate MP3 narration
- Two Hindi neural voices: `hi-IN-MadhurNeural` (male), `hi-IN-SwaraNeural` (female)
- Speed (rate) and pitch controls
- In-browser audio preview + MP3 download
- Loading state, error handling, mobile responsive
- Auto-cleanup of temp audio files (>30 min old)
- Health check endpoint at `/health`
- CORS enabled
- Optional `.env` API key slot for future integrations

## Project Structure

```
hindi-tts/
├── backend/
│   └── index.js        # Express server + TTS API
├── frontend/
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
├── .env.example
├── package.json
├── railway.json
└── vite.config.js
```

## Run Locally

```bash
cd hindi-tts
npm install
cp .env.example .env
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:3001
- Health:   http://localhost:3001/health

## API

### `POST /api/tts`
Body:
```json
{
  "text": "नमस्ते दुनिया",
  "voice": "hi-IN-MadhurNeural",
  "rate": 0,
  "pitch": 0
}
```
Returns:
```json
{ "success": true, "id": "...", "url": "/api/audio/<id>.mp3" }
```

### `GET /api/audio/:file`
Streams the generated MP3.

### `GET /health`
Returns `{ "status": "ok" }`.

## Deploy on Railway

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Hindi TTS"
   git branch -M main
   git remote add origin https://github.com/<you>/hindi-tts.git
   git push -u origin main
   ```

2. **Create Railway project**
   - Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
   - Pick your `hindi-tts` repo.

3. **Environment variables (optional)**
   In Railway → **Variables**, add anything from `.env.example` you need. Edge TTS itself requires nothing.
   - `OPTIONAL_API_KEY` — reserved slot for future use

4. **Deploy**
   Railway uses Nixpacks. It will run `npm install && npm run build`, then `npm start`. The Express server serves both API and the built frontend on `process.env.PORT`.

5. **Verify**
   - Open your Railway URL → use the app.
   - Visit `/health` → should return `{ "status": "ok" }`.

## Notes

- Temp MP3s are written to `/tmp/hindi-tts` (configurable via `TMP_DIR`) and auto-deleted after 30 minutes.
- Max input length: 5000 characters.
- If Edge TTS rate-limits or fails, the API returns a clear error message.
