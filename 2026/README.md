# Chapter Two — 2026

A small continuation of the previous year's birthday website. The site is built with plain HTML, CSS, and JavaScript so it can be hosted as a static website.

## Technologies

HTML, CSS, and vanilla JavaScript. Google sign-in uses the Firebase Authentication browser SDK from Google's CDN, so sign-in requires an internet connection.

## Files

```text
index.html
style.css
script.js
capture-protection.js
auth-gate.js
song-lyrics.js
assets/song.aac
```

There are no image assets. The song is loaded locally by the browser; it does not autoplay.

## Navigation architecture

The 2026 experience is a single-page scene app. `script.js` owns the scene map and navigation transitions; `#scene-id` in the URL records the current scene so refresh and browser Back/Forward restore the right point. The normal path is the Chapter Two opening → birthday reveal → birthday message → personal note → song → Chapter Three. Chapter One is an optional archive preview from the opening, and its return button goes back to the opening.

Continue and Back buttons use the central scene map. Invalid scene hashes log a developer error and fall back to the opening scene. Firebase Authentication only gates access; signing out intentionally resets the in-session route to the opening. The 2025 app remains a separate React single-page experience; its steps are recorded in the hash and support browser Back/Forward too.

The original 2026 transitions already changed visible scenes in place; they did not link to `index.html`. The reset behavior came from having no URL/history state, which caused every refresh to reinitialize the hard-coded opening scene. A duplicate 2026 intro also forced an unnecessary stop after the opening; the archive is now optional and the main flow proceeds directly to the birthday reveal. Replay is the only intentional full-journey reset. The song lyric timeline remains based on the audio's `currentTime` plus the configured vocal offset. Firestore journey tracking is documented below.

## Capture-aware privacy behavior

Both projects use the Page Visibility API to cover the experience and pause playing media when the page is backgrounded. Returning restores the same scene; media stays paused until the visitor chooses to resume. Ordinary window focus loss is not treated as evidence of a screenshot. Browsers do not reliably expose OS screenshots, external screen recorders, or camera recording, so this is a brief privacy measure rather than screenshot prevention. No focus or visibility events are sent to Firebase or stored.

## Enable Google sign-in

The 2026 experience starts behind a Google sign-in screen. `auth-gate.js` uses the Firebase web app configuration supplied for this project; Analytics is not initialized.

1. In the Firebase console, open **Authentication → Sign-in method** and enable **Google**.
2. Add `localhost` for local testing and the production website's hostname (without a port) under **Authentication → Settings → Authorized domains**. The live hostname `prasanthmpp2.github.io` and `localhost` are already authorized for this project.
3. Serve this folder over HTTP and open the 2026 site. The site uses Google's popup flow on desktop and mobile because GitHub Pages is not hosted on the Firebase auth domain; redirect sign-in can fail in browsers that partition third-party storage. If a popup is blocked, allow pop-ups for the site and try again.

Any Google account that can complete sign-in is currently allowed into the experience. The login screen is a client-side entry gate, not full file protection: this static site's HTML, JavaScript, and song file can still be requested directly. To restrict access to the media itself, move it to Cloud Storage for Firebase and add server-enforced Storage Security Rules.

## Before publishing

The `CONFIG` object in `script.js` is currently set up for Abinaya:

- `HER_NAME`: `Abinaya`.
- `BIRTHDAY_DATE`: `09 October`.
- `PREVIOUS_YEAR_WEBSITE_URL`: `../2025/` when the production 2025 build is available beside this site on the same host. Use the published 2025 URL when deploying the years separately.
- `PREVIOUS_YEAR_LOCAL_URL`: local 2025 Vite site at `http://127.0.0.1:8080/`.
- `SONG_URL`: currently `assets/song.aac`.
- `SONG_TITLE`: change this only if the song title is different.
- `song-lyrics.js`: line start/end cues grouped from the supplied word-level JSON, with the project's existing lyric text and section labels.
- `LYRICS_CONFIG.vocalStartOffset`: currently `20.35` seconds, taken from the first timed word. The player subtracts it from `audio.currentTime` before comparing against the vocal-relative lyric cues.

The project contains `assets/song.aac` (ADTS AAC-LC, 48 kHz, stereo); it does not contain the `song.mp3` named in the timing brief. Its AAC frame headers represent about 252.05 seconds of audio. The browser's loaded `audio.duration` is authoritative. If loading fails or duration metadata is invalid, the page shows a retry message and lets the visitor continue.

The supplied word-level JSON was grouped into 78 line cues. Playback, pause, and seeking use `audio.currentTime` as the source timeline; the 20.35-second offset maps it to the cue file's vocal-relative timeline.

GitHub Pages sites are publicly available on the internet. Only add personal details and audio that are intended to be shared with anyone who has the site link.

## Publish both years with GitHub Pages

The repository is designed to keep `2025/` and `2026/` as sibling folders. The workflow at `.github/workflows/deploy-pages.yml` builds the React/Vite 2025 app, copies both sites into one Pages artifact, and deploys it on every push to `main` or `master` (or when started manually).

1. Push this project structure to a GitHub repository, keeping both year folders and `.github/workflows/deploy-pages.yml` at the repository root.
2. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Open **Actions**, select **Build and deploy birthday sites**, and run it if it has not started from a push. Wait for both jobs to succeed.
4. Open the Pages URL from the deployment summary. The root URL redirects to 2026; the 2025 revisit link opens the sibling 2025 build.
5. In Firebase Authentication, add the Pages hostname (for example, `owner.github.io`) under **Settings → Authorized domains**. Google sign-in also needs the Google provider enabled.

The generated URLs are `<Pages URL>/2026/` and `<Pages URL>/2025/`. The 2025 app's Vite assets and React Router base are configured for that repository path; local Vite development still uses `/` on port 8080. Keep `PREVIOUS_YEAR_WEBSITE_URL` as `../2025/` when both sites are published together. The legacy `/2025/index.html` URL redirects to the canonical 2025 home page.

GitHub Pages sites are public. Only publish personal details and audio that are meant to be available to anyone with the link. See GitHub's [custom workflow guide for Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Before sharing

- Confirm the name and birthday date are correct.
- Confirm Google sign-in works on the published domain and the previous-year URL opens the intended 2025 website in a separate tab.
- Confirm the song file is the intended version and plays, pauses, seeks, and reaches its ending message.
- Test the published site at mobile and desktop sizes, including the replay button and reduced-motion setting.
- Check that the generated Pages URL loads directly and after a refresh.

## Firestore journey tracking

The 2026 site uses the existing Firebase project `ai-study-assistant-68a1b` and its default Cloud Firestore database. `auth-gate.js` retains the existing Google Authentication flow and loads the Firestore SDK independently; `journey-tracker.js` uses the authenticated UID as the only user document key. Firestore failures are caught and do not block sign-in, navigation, or audio.

The tracker stores one summary document at `users/{uid}` and one current/previous session document at `users/{uid}/sessions/{sessionId}`. A session is reused after refresh in the same tab; 30 minutes without activity starts a new visit. It stores login/visit timestamps and counts, chapter milestones (Chapter One means only the 2026 archive preview), song started/completed/play/replay counts, last page, and session start/end/duration. It does not store email, IP address, device identifiers, or a raw event history. Song completion requires the audio element to end after at least 95% of its duration was actually played.

The root `firestore.rules` file is the security policy. `firebase.json` points Firebase CLI to that rules file, and `.firebaserc` selects `ai-study-assistant-68a1b`. Publish after signing in to Firebase CLI with an account authorized to manage this project:

```sh
firebase login
firebase deploy --only firestore:rules --project ai-study-assistant-68a1b
```

Rules permit an authenticated user to read and write only their own UID summary and session documents, with a fixed field schema and monotonic counters. This is client-side journey memory, not tamper-proof analytics: a user can alter their own data. No Firestore collections need to be created manually; the first authenticated visit creates the documents. The separate 2025 app and its authentication remain outside this tracking system.
