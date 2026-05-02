import os
import asyncio
import tempfile
import base64
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import edge_tts

app = FastAPI(title="Edge TTS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PORT = int(os.environ.get("PORT", 3000))

# ── Request model ──────────────────────────────────────────────────────────
class TTSRequest(BaseModel):
    text: str = "Hello test"
    voice: str = "hi-IN-SwaraNeural"
    rate: str = "+0%"
    pitch: str = "+0Hz"

# ── Health check ───────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "status": "ok",
        "service": "Edge TTS API (Python)",
        "version": "1.0.0",
        "endpoints": ["/tts", "/tts-base64", "/voices", "/health"]
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

# ── /voices ────────────────────────────────────────────────────────────────
@app.get("/voices")
async def get_voices():
    try:
        voices = await edge_tts.list_voices()
        return {"success": True, "count": len(voices), "voices": voices}
    except Exception as e:
        print(f"Voices error: {e}")
        # Fallback voices
        return {
            "success": True,
            "fallback": True,
            "voices": [
                {"Name": "hi-IN-SwaraNeural",    "FriendlyName": "Hindi - Swara (Female)",     "Locale": "hi-IN", "Gender": "Female"},
                {"Name": "hi-IN-MadhurNeural",   "FriendlyName": "Hindi - Madhur (Male)",      "Locale": "hi-IN", "Gender": "Male"},
                {"Name": "en-US-AriaNeural",      "FriendlyName": "English US - Aria",           "Locale": "en-US", "Gender": "Female"},
                {"Name": "en-US-GuyNeural",       "FriendlyName": "English US - Guy",            "Locale": "en-US", "Gender": "Male"},
                {"Name": "en-IN-NeerjaNeural",    "FriendlyName": "English India - Neerja",      "Locale": "en-IN", "Gender": "Female"},
                {"Name": "en-GB-SoniaNeural",     "FriendlyName": "English UK - Sonia",          "Locale": "en-GB", "Gender": "Female"},
                {"Name": "ta-IN-PallaviNeural",   "FriendlyName": "Tamil - Pallavi (Female)",    "Locale": "ta-IN", "Gender": "Female"},
                {"Name": "te-IN-ShrutiNeural",    "FriendlyName": "Telugu - Shruti (Female)",    "Locale": "te-IN", "Gender": "Female"},
                {"Name": "mr-IN-AarohiNeural",    "FriendlyName": "Marathi - Aarohi (Female)",   "Locale": "mr-IN", "Gender": "Female"},
                {"Name": "bn-IN-TanishaaNeural",  "FriendlyName": "Bengali - Tanishaa (Female)", "Locale": "bn-IN", "Gender": "Female"},
            ]
        }

# ── /tts (returns mp3 file) ────────────────────────────────────────────────
@app.post("/tts")
async def tts(req: TTSRequest):
    if not req.text or req.text.strip() == "":
        raise HTTPException(status_code=400, detail="text is required")
    if len(req.text) > 5000:
        raise HTTPException(status_code=400, detail="text too long (max 5000 chars)")

    print(f"TTS request: voice={req.voice}, textLength={len(req.text)}")

    try:
        communicate = edge_tts.Communicate(
            text=req.text,
            voice=req.voice,
            rate=req.rate,
            pitch=req.pitch
        )

        # Save to temp file
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        await communicate.save(tmp.name)

        return FileResponse(
            tmp.name,
            media_type="audio/mpeg",
            filename="tts_output.mp3"
        )
    except Exception as e:
        print(f"TTS Fatal Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── /tts-base64 (returns base64 JSON) ─────────────────────────────────────
@app.post("/tts-base64")
async def tts_base64(req: TTSRequest):
    if not req.text or req.text.strip() == "":
        raise HTTPException(status_code=400, detail="text is required")

    print(f"TTS-base64 request: voice={req.voice}, textLength={len(req.text)}")

    try:
        communicate = edge_tts.Communicate(
            text=req.text,
            voice=req.voice,
            rate=req.rate,
            pitch=req.pitch
        )

        # Collect all audio chunks
        audio_chunks = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_chunks.append(chunk["data"])

        audio_data = b"".join(audio_chunks)
        audio_base64 = base64.b64encode(audio_data).decode("utf-8")

        return {
            "success": True,
            "audio": audio_base64,
            "mimeType": "audio/mpeg",
            "size": len(audio_data)
        }
    except Exception as e:
        print(f"TTS-base64 Fatal Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── Run ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=PORT)
