# HighVibe — Line-by-Line Guide for Beginners

This guide explains HighVibe in plain language and walks you through the important parts step by step. No programming experience assumed.

---

## Part 1: Words You’ll See a Lot

| Term | What it means in plain English |
|------|--------------------------------|
| **App** | Your HighVibe project: the website (or “app”) people open in a browser or on their phone. |
| **Code / Codebase** | All the text files that describe how HighVibe looks and what it does. |
| **File** | A single document (e.g. `page.tsx`, `layout.tsx`). |
| **Folder / Directory** | A container for files (e.g. `app`, `hooks`, `public`). |
| **Run the app** | Start it on your computer so you can open it in the browser (usually `http://localhost:3000`). |
| **Deploy** | Put your app on the internet (e.g. on Vercel) so others can open it with a link. |
| **Terminal / Command line** | A window where you type instructions (e.g. `npm run dev`, `vercel`) instead of clicking. |
| **Path** | Where a file or folder lives, e.g. `app/page.tsx` means “inside the `app` folder, the file `page.tsx`.” |

---

## Part 2: What’s in Your HighVibe Folder (Big Picture)

When you open the HighVibe project, you see something like:

```
HighVibe/
├── app/              ← “The pages and layout of the site”
├── hooks/            ← “Reusable logic (e.g. audio)”
├── public/           ← “Files served as-is (images, silence.mp3, manifest)”
├── package.json      ← “List of dependencies and scripts”
├── next.config.mjs   ← “Settings for Next.js”
├── tailwind.config.ts← “Colors, spacing, etc. for Tailwind”
├── tsconfig.json     ← “Settings for TypeScript”
└── ... other config files
```

- **app/** — Contains the main UI: the one screen (page), the layout (header, fonts, background), and global styles.
- **hooks/** — Contains `useHighVibe.ts`: all the logic for binaural audio, presets, timer, breath, background sounds.
- **public/** — Things the browser loads directly: `silence.mp3`, `manifest.json` (for “Add to Home screen”), etc.

---

## Part 3: The Two Files You’ll Touch Most

### 1) `app/page.tsx` — “The one screen users see”

- **What it is:** The main screen of HighVibe (presets, play button, sliders, Daily Resonance, breath text, etc.).
- **Line by line (in words):**
  - Top: imports (bringing in Framer Motion, Lucide icons, and your audio hook).
  - Next: the list of “Daily Resonance” sentences and a tiny function that picks one by day.
  - Then: the main component `Home`:
    - It asks the audio hook for everything it needs: `isPlaying`, `volume`, `presetId`, `togglePlay`, etc.
    - It keeps extra state in React: breath phase, timer, “Truth” modal open/closed.
    - It decides colors for presets (e.g. “Focus” = amber, “Deep Sleep” = blue).
    - The `return` is the actual UI: the glowing background, the card, header, presets, sliders, Daily Resonance, “Inhale … Exhale …”, “Created by Ojoma Abamu”, and the Truth modal.
  - So: **to change how the screen looks or what’s on it, you usually edit `app/page.tsx`.**

### 2) `hooks/useHighVibe.ts` — “The brain: audio and behavior”

- **What it is:** A single “hook” that manages all HighVibe behavior: Tone.js, binaural math, presets, timer, breath pacer, pink noise, background sounds, MediaSession, etc.
- **Line by line (in words):**
  - Top: it defines “presets” (Focus, Relax, Meditate, …) and “ambient” options (Wind, Rain, Ocean, …).
  - Then a **class** `HighVibeEngine`: it creates and connects oscillators, panners, volume, pink noise, ambients, and handles start/stop/soft landing.
  - Then the **function** `useHighVibe()`: it uses React state (e.g. `isPlaying`, `volume`, `presetId`, `timerMinutes`) and calls the engine when you play, change preset, or change timer.
  - So: **to change how audio works, what presets exist, or how the timer/breath behaves, you usually edit `hooks/useHighVibe.ts`.**

---

## Part 4: Running and Deploying — Step by Step

### Run HighVibe on your computer

1. Open a **terminal** (PowerShell or Command Prompt).
2. Go into the project folder:
   ```text
   cd c:\Users\OjomaAbamu\Documents\HighVibe
   ```
3. Install dependencies (only needed once, or when `package.json` changes):
   ```text
   npm install
   ```
4. Start the app:
   ```text
   npm run dev
   ```
5. In your browser, open: **http://localhost:3000**  
   That’s your app running locally.

### Deploy to the internet (e.g. Vercel)

1. In the same folder, run:
   ```text
   vercel
   ```
2. If it asks to log in, do the browser login it shows.
3. When it finishes, it prints a URL. That’s your live app.  
   Anyone with that link can open HighVibe.

### Use it on your phone (“mobile app”)

- On your phone, open **Chrome** and go to that same URL.
- Use the menu → **“Add to Home screen”** (or “Install app”).
- After that, the icon on your home screen **loads that same URL**.
- So: **any change you deploy (e.g. new colors, new text) will show on the “mobile app” the next time you open that icon** (or after a refresh). It’s the same app, just opened from the home screen.

---

## Part 5: Tiny Changes You Can Try (To See How It Works)

### Change the “Created by” text

- **File:** `app/page.tsx`
- **Search for:** `Created by Ojoma Abamu`
- **Replace with:** e.g. `Made by Ojoma Abamu` or any short line you like.
- **Save** → if `npm run dev` is running, the browser will update. On the live site, the change appears after you deploy again.

### Change one Daily Resonance sentence

- **File:** `app/page.tsx`
- **Search for:** `DAILY_RES_ONANCES` (or “Your awareness is already whole”).
- You’ll see an array of strings. Change one of the sentences between the quotes.
- **Save** → you’ll see it in the “Daily Resonance” section when that day’s index picks that line.

### Change a preset name or description

- **File:** `hooks/useHighVibe.ts`
- **Search for:** e.g. `Focus · 14 Hz Beta` or `Crisp, awake`.
- Edit the `label` or `description` of that preset.
- **Save** → the preset buttons and any place that shows that preset will show the new text.

---

## Part 6: If Something Breaks or Looks Wrong

1. **Check the terminal** where you ran `npm run dev`: errors often show there in red.
2. **Check the browser console:** F12 → “Console” tab. Red lines are errors; they often say which file and line.
3. **Undo recent edits** (e.g. with Ctrl+Z) and save again, then see if the problem goes away.
4. When you’re stuck, it helps to say: “I changed [file X] around [thing Y], and now [what you see or the exact error message].”

---

## Part 7: Quick Reference — “I want to…”

| I want to… | Where to look |
|------------|----------------|
| Change how the main screen looks | `app/page.tsx` |
| Change colors (background, accent, glow) | `tailwind.config.ts`, `app/globals.css`, and sometimes `app/page.tsx` |
| Change or add presets (Focus, Relax, …) | `hooks/useHighVibe.ts` → `PRESETS` |
| Change or add background sounds | `hooks/useHighVibe.ts` → `AMBIENTS` / `AMBIENT_CONFIG` |
| Change “Daily Resonance” sentences | `app/page.tsx` → `DAILY_RES_ONANCES` |
| Change “Created by” or footer text | `app/page.tsx` → search for “Created by” |
| Change app name / PWA name | `app/layout.tsx` (title), `public/manifest.json` (name/short_name) |
| Run the app on my computer | Terminal: `cd` to project → `npm run dev` → open http://localhost:3000 |
| Put it on the internet | Terminal: `vercel` (and follow login if needed) |
| Use it on my phone | Open the Vercel URL in Chrome on the phone → Add to Home screen |

---

You don’t have to understand every line. Start by making one small change (e.g. one sentence or one color), save, and see what happens. If you tell me exactly what you want to do next (“I want to change the color of X” or “I want to add a new sentence to Y”), I can point you to the file and the exact place, line by line.
