// Personal details and the previous year's link for this release.
const CONFIG = {
  HER_NAME: "Abinaya",
  BIRTHDAY_DATE: "09 October",
  PREVIOUS_YEAR_WEBSITE_URL: "../2025/",
  PREVIOUS_YEAR_LOCAL_URL: "http://127.0.0.1:8080/",
  SONG_URL: "assets/song.aac",
  SONG_TITLE: "Pesama Pesura Paarvaiyile",
};
const LYRICS_CONFIG = {
  vocalStartOffset: 20.35,
  shortGapHold: 1.1,
};

const scenes = [...document.querySelectorAll(".scene")];
// The scenes were previously only CSS visibility toggles, so refresh always
// restored the hard-coded opening scene and browser Back/Forward had no route
// state. Continue clicks themselves did not navigate to index.html; replay was
// the only intentional reset. Keep this map as the single journey definition.
const SCENE_FLOW = Object.freeze({
  opening: { next: "birthday-reveal", archive: "chapter-one" },
  "chapter-one": { previous: "opening" },
  "birthday-reveal": { previous: "opening", next: "birthday-message" },
  "birthday-message": { previous: "birthday-reveal", next: "personal-note" },
  "personal-note": { previous: "birthday-message", next: "song-scene" },
  "song-scene": { previous: "personal-note", next: "chapter-three-final" },
  "chapter-three-final": { previous: "song-scene" },
});
const sceneIds = new Set(scenes.map((scene) => scene.id));
const revisitLink = document.querySelector("#revisit-link");
const linkHint = document.querySelector("#link-hint");
const personalName = document.querySelector("[data-personal-name]");
const finalName = document.querySelector("[data-final-name]");
const finalNameWrap = document.querySelector(".final-name-wrap");
const songScene = document.querySelector("#song-scene");
const songAudio = document.querySelector("#song-audio");
const songPlay = document.querySelector("#song-play");
const songProgress = document.querySelector("#song-progress");
const songCurrentTime = document.querySelector("#song-current-time");
const songDuration = document.querySelector("#song-duration");
const songVolume = document.querySelector("#song-volume");
const songError = document.querySelector("#song-error");
const songStatus = document.querySelector("#song-status");
const songStatusText = document.querySelector("#song-status-text");
const songRetry = document.querySelector("#song-retry");
const songLyrics = document.querySelector("#song-lyrics");
const songLyricPrevious = document.querySelector("#song-lyric-previous");
const songLyricCurrent = document.querySelector("#song-lyric-current");
const songLyricNext = document.querySelector("#song-lyric-next");
const songSection = document.querySelector("#song-section");
const songContinue = document.querySelector(".song-continue");
const completionFirst = document.querySelector("#completion-first");
const songCredit = document.querySelector("#song-credit");
const finalScene = document.querySelector("#chapter-three-final");
const finalMain = document.querySelector("#final-main");
const finalRemnant = document.querySelector("#final-remnant");
const finalReplayEarly = document.querySelector(".final-replay-early");
const finalReplay = document.querySelector(".final-replay");
const secretNote = document.querySelector("#secret-note");
const openingToday = document.querySelector("#opening-today");
const birthdayDate = document.querySelector("#birthday-date");
let finaleTimer;
let finalReplayTimer;
let continueRevealTimer;
let secretTimer;
let secretClickTimer;
let secretClickCount = 0;
let completionTimers = [];
let songCompleted = false;
let songHasPlayed = false;
let songPlaybackTrackedThisRun = false;
const lyricEntries = Array.isArray(window.SONG_LYRICS) ? window.SONG_LYRICS : [];
let lyricIndex = -1;
let lyricSection = "";
let lyricSectionIndex = -1;
let sectionTimer;
let currentSceneId = null;

function emitJourneyEvent(type, detail = {}) {
  document.dispatchEvent(new CustomEvent("birthday-journey-event", {
    detail: { type, ...detail },
  }));
}

const configuredName = CONFIG.HER_NAME.trim();
if (configuredName) {
  personalName.textContent = configuredName;
  personalName.hidden = false;
  finalName.textContent = configuredName;
  finalNameWrap.hidden = false;
}

document.querySelector("[data-song-title]").textContent = CONFIG.SONG_TITLE;
if (lyricEntries.length === 0) songLyrics.hidden = true;

function parseBirthdayDate(value) {
  const match = value.trim().match(/^(\d{1,2})\s+([a-z]+)$/i);
  if (!match) return null;
  const day = Number(match[1]);
  const month = new Date(`${match[2]} 1, 2000`).getMonth();
  if (!Number.isFinite(month) || day < 1 || day > new Date(2000, month + 1, 0).getDate()) return null;
  return { day, month };
}

function isBirthdayToday(birthday, date = new Date()) {
  return Boolean(birthday && date.getDate() === birthday.day && date.getMonth() === birthday.month);
}

const parsedBirthday = parseBirthdayDate(CONFIG.BIRTHDAY_DATE);
if (parsedBirthday) {
  if (isBirthdayToday(parsedBirthday)) {
    document.body.classList.add("birthday-mode");
    openingToday.hidden = false;
  }
  birthdayDate.textContent = `${String(parsedBirthday.day).padStart(2, "0")} ${new Date(2000, parsedBirthday.month, 1).toLocaleString("en", { month: "long" }).toUpperCase()} 2026`;
  birthdayDate.hidden = false;
}

function renderScene(sceneId) {
  if (!sceneIds.has(sceneId) || !Object.hasOwn(SCENE_FLOW, sceneId)) {
    console.error("Unknown birthday scene:", sceneId);
    return false;
  }
  if (sceneId === currentSceneId) return true;

  const wasSongSceneActive = songScene.classList.contains("is-active");
  currentSceneId = sceneId;

  for (const scene of scenes) {
    const isActive = scene.id === sceneId;
    scene.classList.toggle("is-active", isActive);
    scene.setAttribute("aria-hidden", String(!isActive));
  }

  if (wasSongSceneActive && sceneId !== "song-scene") {
    songAudio.pause();
    songScene.classList.remove("is-playing");
  }

  if (sceneId === "song-scene" && !wasSongSceneActive) {
    songContinue.hidden = true;
    window.clearTimeout(continueRevealTimer);
    continueRevealTimer = window.setTimeout(() => {
      if (songScene.classList.contains("is-active") && songAudio.paused && !songAudio.ended) songContinue.hidden = false;
    }, 2300);
  }

  if (sceneId === "chapter-three-final") {
    window.clearTimeout(finaleTimer);
    window.clearTimeout(finalReplayTimer);
    finalScene.classList.remove("is-fading");
    finalMain.inert = false;
    finalMain.setAttribute("aria-hidden", "false");
    finalRemnant.hidden = true;
    finalRemnant.classList.remove("is-revealed");
    finalRemnant.setAttribute("aria-hidden", "true");
    finalReplayEarly.hidden = true;
    finalReplay.hidden = true;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion) {
      finalReplayTimer = window.setTimeout(() => {
        if (finalScene.classList.contains("is-active") && !finalScene.classList.contains("is-fading")) {
          finalReplayEarly.hidden = false;
        }
      }, 17600);
      finaleTimer = window.setTimeout(() => {
        finalScene.classList.add("is-fading");
        finalMain.inert = true;
        finalMain.setAttribute("aria-hidden", "true");
        finalReplayEarly.hidden = true;
        finalRemnant.hidden = false;
        finalRemnant.setAttribute("aria-hidden", "false");
        finalReplay.hidden = false;
        finalRemnant.classList.add("is-revealed");
      }, 20800);
    } else {
      finalReplayEarly.hidden = false;
    }
  }
  emitJourneyEvent("page_view", { page: sceneId });
  return true;
}

function writeSceneUrl(sceneId, replace = false) {
  const url = new URL(window.location.href);
  url.hash = sceneId;
  const state = {
    ...(window.history.state ?? {}),
    birthdayScene: sceneId,
    previousBirthdayScene: replace ? null : currentSceneId,
  };
  window.history[replace ? "replaceState" : "pushState"](state, "", url);
}

function readSceneFromUrl() {
  let requestedScene = window.location.hash.slice(1);
  try {
    requestedScene = decodeURIComponent(requestedScene);
  } catch {
    requestedScene = "";
  }

  if (!requestedScene) {
    writeSceneUrl("opening", true);
    return "opening";
  }
  if (!sceneIds.has(requestedScene) || !Object.hasOwn(SCENE_FLOW, requestedScene)) {
    console.error("Unknown birthday scene in URL:", requestedScene);
    writeSceneUrl("opening", true);
    return "opening";
  }
  return requestedScene;
}

function navigateToScene(sceneId, { replace = false } = {}) {
  if (!sceneIds.has(sceneId) || !Object.hasOwn(SCENE_FLOW, sceneId)) {
    console.error("Unknown birthday scene:", sceneId);
    return false;
  }
  if (sceneId === currentSceneId) return true;
  writeSceneUrl(sceneId, replace);
  return renderScene(sceneId);
}

function navigateBy(relation) {
  const destination = SCENE_FLOW[currentSceneId]?.[relation];
  if (!destination) {
    console.error(`No ${relation} scene is defined for:`, currentSceneId);
    return;
  }
  if (relation === "previous") {
    if (window.history.state?.previousBirthdayScene === destination) {
      window.history.back();
      return;
    }
    navigateToScene(destination, { replace: true });
    return;
  }
  navigateToScene(destination);
}

function syncSceneFromHistory() {
  renderScene(readSceneFromUrl());
}

renderScene(readSceneFromUrl());
document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => navigateBy("next"));
});
document.querySelectorAll("[data-previous]").forEach((button) => {
  button.addEventListener("click", () => navigateBy("previous"));
});
document.querySelectorAll("[data-archive]").forEach((button) => {
  button.addEventListener("click", () => navigateBy("archive"));
});
window.addEventListener("popstate", syncSceneFromHistory);
window.addEventListener("hashchange", syncSceneFromHistory);
window.addEventListener("birthday-session-reset", () => restartFromBeginning({ replaceHistory: true }));

document.querySelectorAll("[data-secret-trigger]").forEach((button) => {
  button.addEventListener("click", () => {
    window.clearTimeout(secretClickTimer);
    secretClickCount += 1;
    if (secretClickCount < 3) {
      secretClickTimer = window.setTimeout(() => { secretClickCount = 0; }, 1100);
      return;
    }
    secretClickCount = 0;
    window.clearTimeout(secretClickTimer);
    window.clearTimeout(secretTimer);
    secretNote.hidden = false;
    requestAnimationFrame(() => secretNote.classList.add("is-visible"));
    secretTimer = window.setTimeout(() => {
      secretNote.classList.remove("is-visible");
      secretTimer = window.setTimeout(() => { secretNote.hidden = true; }, 400);
    }, 2700);
  });
});

function restartFromBeginning({ replaceHistory = false } = {}) {
  window.clearTimeout(continueRevealTimer);
  window.clearTimeout(finaleTimer);
  window.clearTimeout(finalReplayTimer);
  window.clearTimeout(secretTimer);
  window.clearTimeout(secretClickTimer);
  secretClickCount = 0;
  secretNote.classList.remove("is-visible");
  secretNote.hidden = true;
  completionTimers.forEach((timer) => window.clearTimeout(timer));
  completionTimers = [];
  window.clearTimeout(sectionTimer);

  songAudio.pause();
  songAudio.currentTime = 0;
  songAudio.removeAttribute("src");
  songAudio.load();
  songScene.classList.remove("is-playing", "is-complete");
  songPlay.hidden = false;
  songError.hidden = true;
  document.querySelector("#audio-controls").hidden = false;
  songProgress.value = "0";
  songProgress.disabled = true;
  songCurrentTime.textContent = "00:00";
  songDuration.textContent = "00:00";
  songContinue.hidden = true;
  songCompleted = false;
  songHasPlayed = false;
  songPlaybackTrackedThisRun = false;
  lyricIndex = -1;
  lyricSection = "";
  lyricSectionIndex = -1;
  songScene.classList.remove("is-ending");
  songLyrics.hidden = true;
  songLyrics.classList.remove("is-changing");
  songLyricPrevious.textContent = "";
  songLyricCurrent.textContent = "";
  songLyricNext.textContent = "";
  songSection.hidden = true;
  songSection.textContent = "";
  songCredit.hidden = true;
  songStatus.hidden = true;
  songStatusText.textContent = "";
  completionFirst.hidden = true;
  navigateToScene("opening", { replace: replaceHistory });

  const openingPieces = document.querySelectorAll(".opening-title, .opening-year, .opening-note, .opening-today, .opening-enter");
  openingPieces.forEach((element) => { element.style.animation = "none"; });
  void document.querySelector("#opening").offsetWidth;
  openingPieces.forEach((element) => { element.style.removeProperty("animation"); });
}

document.querySelectorAll("[data-restart]").forEach((button) => {
  button.addEventListener("click", restartFromBeginning);
});

const localHosts = ["localhost", "127.0.0.1", "[::1]"];
const previousYearUrl = localHosts.includes(window.location.hostname.toLowerCase()) && CONFIG.PREVIOUS_YEAR_LOCAL_URL.trim()
  ? CONFIG.PREVIOUS_YEAR_LOCAL_URL.trim()
  : CONFIG.PREVIOUS_YEAR_WEBSITE_URL.trim();

if (previousYearUrl) {
  revisitLink.href = previousYearUrl;
} else {
  revisitLink.addEventListener("click", (event) => {
    event.preventDefault();
    linkHint.textContent = "The 2025 website isn't available right now.";
  });
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function getLyricTimelineTime() {
  return Math.max(0, songAudio.currentTime - LYRICS_CONFIG.vocalStartOffset);
}

function findActiveLyricIndex() {
  if (songAudio.currentTime < LYRICS_CONFIG.vocalStartOffset || lyricEntries.length === 0) {
    return { index: -1, resting: false };
  }
  const lyricTime = getLyricTimelineTime();
  let low = 0;
  let high = lyricEntries.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (lyricEntries[middle].start <= lyricTime) low = middle + 1;
    else high = middle;
  }

  const candidateIndex = low - 1;
  if (candidateIndex < 0) return { index: -1, resting: false };
  const active = lyricEntries[candidateIndex];
  if (lyricTime < active.end) return { index: candidateIndex, resting: false };

  // Keep the current line steady across the short rests between adjacent cues.
  const next = lyricEntries[candidateIndex + 1];
  const resting = !next || next.start - lyricTime > LYRICS_CONFIG.shortGapHold;
  return { index: candidateIndex, resting };
}

function updateSongLyric(animate = true) {
  if (lyricEntries.length === 0 || !songHasPlayed || songCompleted) return;

  const { index: nextIndex, resting } = findActiveLyricIndex();
  songLyrics.classList.toggle("is-resting", resting);
  if (resting) songLyrics.classList.remove("is-changing");
  if (nextIndex === lyricIndex) return;
  lyricIndex = nextIndex;
  const current = nextIndex >= 0 ? lyricEntries[nextIndex] : null;
  songLyrics.classList.remove("is-changing");
  if (!animate) void songLyrics.offsetWidth;
  songLyrics.hidden = !current;
  songLyricPrevious.textContent = nextIndex > 0 ? lyricEntries[nextIndex - 1].text : "";
  songLyricCurrent.textContent = current?.text ?? "";
  songLyricNext.textContent = nextIndex >= 0 ? lyricEntries[nextIndex + 1]?.text ?? "" : "";

  if (current) {
    if (animate && !resting) {
      void songLyrics.offsetWidth;
      songLyrics.classList.add("is-changing");
    }
    let sectionStartIndex = nextIndex;
    while (sectionStartIndex > 0 && lyricEntries[sectionStartIndex - 1].section === current.section) sectionStartIndex -= 1;
    if (sectionStartIndex !== lyricSectionIndex) {
      lyricSection = current.section;
      lyricSectionIndex = sectionStartIndex;
      window.clearTimeout(sectionTimer);
      songSection.textContent = current.section;
      songSection.hidden = false;
      songSection.classList.remove("is-visible");
      void songSection.offsetWidth;
      songSection.classList.add("is-visible");
      sectionTimer = window.setTimeout(() => {
        songSection.classList.remove("is-visible");
        sectionTimer = window.setTimeout(() => { songSection.hidden = true; }, 650);
      }, 2600);
    }
  } else if (!current) {
    window.clearTimeout(sectionTimer);
    songSection.classList.remove("is-visible");
    songSection.hidden = true;
  }
}

function updatePlayButton() {
  const isPlaying = !songAudio.paused && !songAudio.ended;
  songPlay.setAttribute("aria-label", isPlaying ? "Pause song" : "Play song");
  songPlay.setAttribute("aria-pressed", String(isPlaying));
  songStatus.hidden = !songHasPlayed;
  songStatusText.textContent = songAudio.ended ? "FINISHED" : isPlaying ? "LISTENING" : songHasPlayed ? "PAUSED" : "";
  songPlay.innerHTML = `<span aria-hidden="true">${isPlaying ? "\u2161" : "\u25B6"}</span><span>${isPlaying ? "PAUSE" : "PLAY"}</span>`;
}

function showSongError() {
  songAudio.pause();
  songScene.classList.remove("is-playing");
  songPlay.hidden = true;
  document.querySelector("#audio-controls").hidden = true;
  songError.hidden = false;
  songContinue.hidden = false;
  songLyrics.hidden = true;
  songSection.hidden = true;
  songProgress.disabled = true;
  updatePlayButton();
}

songAudio.volume = Number(songVolume.value);

songPlay.addEventListener("click", async () => {
  songError.hidden = true;

  if (!songAudio.paused) {
    songAudio.pause();
    return;
  }

  if (!songAudio.src) songAudio.src = CONFIG.SONG_URL;
  songAudio.volume = Number(songVolume.value);

  try {
    await songAudio.play();
  } catch {
    showSongError();
  }
});

songRetry.addEventListener("click", () => {
  completionTimers.forEach((timer) => window.clearTimeout(timer));
  completionTimers = [];
  window.clearTimeout(sectionTimer);
  songAudio.pause();
  songAudio.removeAttribute("src");
  songAudio.load();
  songScene.classList.remove("is-playing", "is-ending", "is-complete");
  songHasPlayed = false;
  songPlaybackTrackedThisRun = false;
  songCompleted = false;
  lyricIndex = -1;
  lyricSection = "";
  lyricSectionIndex = -1;
  songLyrics.hidden = true;
  songLyricPrevious.textContent = "";
  songLyricCurrent.textContent = "";
  songLyricNext.textContent = "";
  songSection.hidden = true;
  songCredit.hidden = true;
  completionFirst.hidden = true;
  songError.hidden = true;
  songContinue.hidden = true;
  songPlay.hidden = false;
  document.querySelector("#audio-controls").hidden = false;
  songProgress.disabled = true;
  songProgress.value = "0";
  songCurrentTime.textContent = "00:00";
  songDuration.textContent = "00:00";
});

songAudio.addEventListener("play", () => {
  window.clearTimeout(continueRevealTimer);
  songContinue.hidden = true;
  songHasPlayed = true;
  if (songCompleted) {
    songCompleted = false;
    completionTimers.forEach((timer) => window.clearTimeout(timer));
    completionTimers = [];
    window.clearTimeout(sectionTimer);
    completionFirst.hidden = true;
    songCredit.hidden = true;
    songSection.hidden = true;
    songSection.classList.remove("is-visible");
    songLyrics.hidden = true;
    songScene.classList.remove("is-ending");
    lyricIndex = -1;
    lyricSection = "";
    lyricSectionIndex = -1;
    songScene.classList.remove("is-complete");
  }
  songScene.classList.add("is-playing");
  updatePlayButton();
  updateSongLyric();
});

songAudio.addEventListener("playing", () => {
  if (songPlaybackTrackedThisRun) return;
  songPlaybackTrackedThisRun = true;
  emitJourneyEvent("song_playthrough_started");
});

songAudio.addEventListener("pause", () => {
  songScene.classList.remove("is-playing");
  if (songScene.classList.contains("is-active") && !songAudio.ended) songContinue.hidden = false;
  updatePlayButton();
});
songAudio.addEventListener("loadedmetadata", () => {
  if (!Number.isFinite(songAudio.duration) || songAudio.duration <= 0) {
    showSongError();
    return;
  }
  songDuration.textContent = formatTime(songAudio.duration);
  songProgress.disabled = false;
});
songAudio.addEventListener("durationchange", () => {
  songDuration.textContent = formatTime(songAudio.duration);
});
songAudio.addEventListener("timeupdate", () => {
  songCurrentTime.textContent = formatTime(songAudio.currentTime);
  updateSongLyric();
  if (Number.isFinite(songAudio.duration) && songAudio.duration > 0) {
    songProgress.value = String(Math.round((songAudio.currentTime / songAudio.duration) * 1000));
  }
});
songAudio.addEventListener("seeking", () => updateSongLyric(false));
songAudio.addEventListener("seeked", () => updateSongLyric(false));
songAudio.addEventListener("error", showSongError);

songProgress.addEventListener("input", () => {
  if (Number.isFinite(songAudio.duration) && songAudio.duration > 0) {
    songAudio.currentTime = (Number(songProgress.value) / 1000) * songAudio.duration;
    updateSongLyric(false);
  }
});

songVolume.addEventListener("input", () => {
  songAudio.volume = Number(songVolume.value);
});

function finishSong() {
  if (songCompleted) return;
  let playedSeconds = 0;
  for (let index = 0; index < songAudio.played.length; index += 1) {
    playedSeconds += songAudio.played.end(index) - songAudio.played.start(index);
  }
  const reachedCompletionThreshold = Number.isFinite(songAudio.duration)
    && songAudio.duration > 0
    && playedSeconds / songAudio.duration >= 0.95;
  if (reachedCompletionThreshold) {
    emitJourneyEvent("song_completed");
    songPlaybackTrackedThisRun = false;
  }
  songCompleted = true;
  window.clearTimeout(sectionTimer);
  songSection.classList.remove("is-visible");
  songSection.hidden = true;
  songScene.classList.remove("is-playing");
  songScene.classList.add("is-complete", "is-ending");
  songCurrentTime.textContent = formatTime(songAudio.duration);
  songProgress.value = "1000";
  updatePlayButton();
  completionTimers = [
    window.setTimeout(() => { songScene.classList.remove("is-ending"); }, 1800),
    window.setTimeout(() => {
      songLyrics.hidden = true;
      songLyricPrevious.textContent = "";
      songLyricCurrent.textContent = "";
      songLyricNext.textContent = "";
      completionFirst.hidden = false;
    }, 1800),
    window.setTimeout(() => { songCredit.hidden = false; }, 3500),
    window.setTimeout(() => { songContinue.hidden = false; }, 6200),
  ];
}

songAudio.addEventListener("ended", finishSong);

document.documentElement.dataset.birthdayAppReady = "true";
document.dispatchEvent(new Event("birthday-app-ready"));
