# Get HighVibe on Your Android Phone

You can use HighVibe on Android in two ways: as an **installable web app** (PWA) or as a **native-style APK**.

---

## Option 1: Add to Home Screen (PWA) — Easiest

HighVibe is set up as a Progressive Web App. Once it’s deployed (e.g. on Vercel), you can install it like an app.

1. **Deploy the app** (if you haven’t yet):
   - Push to GitHub and connect the repo to [Vercel](https://vercel.com), or run `vercel` in the project folder and deploy.
   - Note your live URL (e.g. `https://highvibe-xyz.vercel.app`).

2. **On your Android phone:**
   - Open **Chrome** and go to your HighVibe URL.
   - Tap the **⋮** menu (top right) → **“Add to Home screen”** or **“Install app”**.
   - Confirm the name (“HighVibe”) and tap **Add** or **Install**.

3. **Use it like an app:**
   - An icon appears on your home screen. Open it to use HighVibe in fullscreen, without the browser bar.

**Requirements:**  
- Android device with Chrome.  
- HTTPS (your Vercel URL is already HTTPS).  
- For best experience, use headphones when playing binaural audio.

---

## Option 2: Build an APK (Capacitor)

If you want a real APK you can install or sideload:

1. **Build the Next.js app:**
   ```bash
   npm run build
   ```
   Then export static files (or use a static export). For Capacitor we need the built output (e.g. `out/` or `.next/` plus a static host).

2. **Install Capacitor:**
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "HighVibe" "com.highvibe.app"
   ```

3. **Configure the web dir** in `capacitor.config.ts` to point at your Next.js static output (often `out/` if you use `next export` or the output from your host).

4. **Add Android and build:**
   ```bash
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
   Then build the APK from Android Studio (or run a Release build from the command line).

For a Next.js app, you typically deploy the app to a URL and point Capacitor at that URL (e.g. `server.url` in config), or you use static export and serve the `out/` folder as the web asset root. Details depend on whether you use a custom server or full static export.

---

## Summary

- **Fastest path:** Deploy to Vercel → open the URL in Chrome on Android → “Add to Home screen”. You get an app-like icon and fullscreen without building an APK.
- **APK path:** Use Capacitor, point it at your built/exported app or live URL, then build the Android project and install the APK.
