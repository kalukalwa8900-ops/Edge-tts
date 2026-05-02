# 🎙️ Edge TTS Railway Backend

A simple Node.js Express server that converts text to speech using Microsoft Edge TTS.

---

## 📁 Files
```
my-tts-app/
├── index.js         ← Main backend server
├── package.json     ← Dependencies + start script
├── .gitignore       ← Ignore node_modules
└── README.md        ← This file
```

---

## 🚀 Deploy to Railway

### Step 1 — Push to GitHub
1. Create a new GitHub repo (e.g. `edge-tts-backend`)
2. Upload all these files to it

### Step 2 — Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Click **New Project → Deploy from GitHub Repo**
3. Select your repo
4. Railway will auto-detect Node.js and run `npm start`

### Step 3 — Get your URL
After deploy, Railway gives you a URL like:
```
https://your-app.up.railway.app
```

---

## 📡 API Usage

### POST /tts — Generate Audio
```js
const res = await fetch("https://your-app.up.railway.app/tts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "आज हम एक कहानी सुनेंगे",
    voice: "hi-IN-SwaraNeural",   // optional
    rate: "+0%",                   // optional: speed e.g. "+20%"
    pitch: "+0Hz"                  // optional: pitch e.g. "+5Hz"
  })
});

const blob = await res.blob();
const audio = new Audio(URL.createObjectURL(blob));
audio.play();
```

### GET /voices — List All Voices
```
GET https://your-app.up.railway.app/voices
```

### GET / — Health Check
```
GET https://your-app.up.railway.app/
```

---

## 🎤 Popular Voices

| Language | Voice Name |
|----------|-----------|
| Hindi (Female) | `hi-IN-SwaraNeural` |
| Hindi (Male) | `hi-IN-MadhurNeural` |
| English (US Female) | `en-US-JennyNeural` |
| English (US Male) | `en-US-GuyNeural` |
| English (UK) | `en-GB-SoniaNeural` |

---

## ⚠️ Common Mistakes

- ❌ Forgetting `"type": "module"` in package.json
- ❌ Not using `process.env.PORT` (Railway sets this automatically)
- ❌ Sending very long text — split into chunks if needed
