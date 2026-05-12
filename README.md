# Hindi TTS Backend (Edge TTS)

Standalone Node.js + Express backend that converts Hindi text to MP3 using Microsoft Edge TTS. No API key required.

## Endpoints

- `GET  /health` → `{ "status": "ok" }`
- `POST /api/tts` → body: `{ text, voice, rate, pitch }` → returns `{ url: "/api/audio/<id>.mp3" }`
- `GET  /api/audio/:file` → streams the generated MP3

Voices: `hi-IN-MadhurNeural` (male), `hi-IN-SwaraNeural` (female).
`rate` and `pitch` are integers in range -50..50.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev    # or: npm start
```

Server: http://localhost:3001 — health: http://localhost:3001/health

## Deploy on Railway

1. Push this folder to a GitHub repo.
2. Go to https://railway.app → **New Project → Deploy from GitHub repo** → select the repo.
3. Railway uses Nixpacks: `npm install` then `npm start`.
4. (Optional) In **Variables**, add anything from `.env.example`. Railway sets `PORT` automatically.
5. Verify: open `<your-url>/health` → `{ "status": "ok" }`.

## CORS

CORS is enabled for all origins so your separately-hosted frontend can call it directly.

## Notes

- Generated MP3s are stored in `/tmp/hindi-tts` and auto-deleted after 30 minutes.
- Max input: 5000 characters.
